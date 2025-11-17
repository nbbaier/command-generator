# PLAN Addendum: CommandSpec Architecture

## CommandSpec Schema & Interpreter

This section provides the complete technical specification for the CommandSpec system that enables runtime command execution.

### CommandSpec Type Definition

```typescript
interface CommandSpec {
  id: string;                    // Unique identifier (UUID v4)
  title: string;                 // Display name in runner
  description: string;           // What the command does
  mode: "list" | "form" | "detail" | "view";
  icon?: string;                 // Emoji or image path
  inputs?: FormInput[];          // For form mode
  steps: Operation[];            // Operations to execute sequentially
  ui: UIBinding;                 // How to render results
  actions?: ActionDef[];         // Actions available on items
  metadata: {
    created: string;             // ISO timestamp
    modified: string;
    tags: string[];
    author?: string;
  };
}

interface FormInput {
  id: string;
  type: "textfield" | "textarea" | "dropdown" | "checkbox" | "datepicker";
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];            // For dropdown
}

interface Operation {
  type: "httpRequest" | "shell" | "transform" | "fileRead" | "fileWrite" | 
        "clipboard" | "open" | "showToast" | "showHUD";
  config: Record<string, any>;
  outputVar?: string;            // Store result in this variable name
}

interface UIBinding {
  mode: "list" | "form" | "detail";
  dataSource: string;            // Variable name from operation output
  itemProps?: {                  // For list mode
    title: string;               // Template: "{{name}}"
    subtitle?: string;           // Template: "{{description}}"
    accessories?: string[];      // Templates for accessories
  };
  content?: string;              // For detail mode (markdown template)
}

interface ActionDef {
  title: string;
  icon?: string;
  shortcut?: { modifiers: string[]; key: string };
  operation: Operation;          // Operation to run when action triggered
}
```

### Supported Operations (MVP Scope)

#### 1. HTTP Request
Fetch data from REST APIs with authentication support.

```json
{
  "type": "httpRequest",
  "config": {
    "url": "https://api.github.com/user/starred",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer {{env.GITHUB_TOKEN}}",
      "Accept": "application/json"
    },
    "body": null
  },
  "outputVar": "repos"
}
```

**Supported template variables**: `{{env.VAR}}`, `{{input.fieldName}}`

#### 2. Shell Execution
Run shell commands (requires user opt-in and confirmation).

```json
{
  "type": "shell",
  "config": {
    "command": "df -h | grep /dev/disk",
    "shell": "/bin/bash",
    "timeout": 5000
  },
  "outputVar": "diskSpace"
}
```

**Security**: User must enable shell execution in preferences and confirm each run.

#### 3. Transform
Transform data using Handlebars templates.

```json
{
  "type": "transform",
  "config": {
    "template": "{{#each repos}}* {{name}} ({{stargazers_count}} stars)\n{{/each}}",
    "data": "{{repos}}",
    "engine": "handlebars"
  },
  "outputVar": "formatted"
}
```

**Available helpers**: `each`, `if`, `unless`, `with`, `lookup`, `eq`, `gt`, `lt`

#### 4. File Read/Write
Read or write files to extension's support directory.

```json
{
  "type": "fileRead",
  "config": {
    "path": "{{supportPath}}/cache/data.json",
    "encoding": "utf8"
  },
  "outputVar": "cachedData"
}
```

```json
{
  "type": "fileWrite",
  "config": {
    "path": "{{supportPath}}/cache/data.json",
    "content": "{{repos}}",
    "encoding": "utf8"
  }
}
```

**Security**: Limited to `environment.supportPath` directory only.

#### 5. Clipboard
Copy text to clipboard or read from clipboard.

```json
{
  "type": "clipboard",
  "config": {
    "action": "copy",
    "text": "{{formatted}}"
  }
}
```

#### 6. Open URL/App
Open URLs in browser or launch applications.

```json
{
  "type": "open",
  "config": {
    "target": "https://github.com/{{item.full_name}}"
  }
}
```

#### 7. Show Toast/HUD
Display feedback to user.

```json
{
  "type": "showToast",
  "config": {
    "style": "success",
    "title": "Command executed",
    "message": "Found {{repos.length}} repositories"
  }
}
```

```json
{
  "type": "showHUD",
  "config": {
    "title": "✓ Copied to clipboard"
  }
}
```

### Interpreter Implementation

#### Core Execution Flow

```typescript
// lib/runtime/interpreter.ts
import { environment } from "@raycast/api";
import Handlebars from "handlebars";

export async function executeCommandSpec(
  spec: CommandSpec, 
  formValues?: Record<string, any>
): Promise<ExecutionResult> {
  // Initialize execution context
  const context: Record<string, any> = {
    env: process.env,
    input: formValues || {},
    supportPath: environment.supportPath,
    assetsPath: environment.assetsPath
  };

  // Execute operations sequentially
  for (const step of spec.steps) {
    try {
      const result = await executeOperation(step, context);
      if (step.outputVar) {
        context[step.outputVar] = result;
      }
    } catch (error) {
      throw new Error(`Operation ${step.type} failed: ${error.message}`);
    }
  }

  // Return execution result with context for UI rendering
  return {
    data: context,
    uiBinding: spec.ui,
    actions: spec.actions
  };
}

async function executeOperation(
  op: Operation, 
  context: Record<string, any>
): Promise<any> {
  // Interpolate templates in config
  const config = interpolateConfig(op.config, context);
  
  switch (op.type) {
    case "httpRequest":
      return await executeHttpRequest(config);
    case "shell":
      return await executeShell(config);
    case "transform":
      return await executeTransform(config);
    case "fileRead":
      return await executeFileRead(config);
    case "fileWrite":
      return await executeFileWrite(config);
    case "clipboard":
      return await executeClipboard(config);
    case "open":
      return await executeOpen(config);
    case "showToast":
      return await executeShowToast(config);
    case "showHUD":
      return await executeShowHUD(config);
    default:
      throw new Error(`Unknown operation type: ${op.type}`);
  }
}

function interpolateConfig(
  config: Record<string, any>, 
  context: Record<string, any>
): Record<string, any> {
  const configStr = JSON.stringify(config);
  const template = Handlebars.compile(configStr);
  const interpolated = template(context);
  return JSON.parse(interpolated);
}
```

#### Operation Implementations

```typescript
// lib/runtime/ops/http.ts
import fetch from "node-fetch";

export async function executeHttpRequest(config: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<any> {
  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

// lib/runtime/ops/shell.ts
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function executeShell(config: {
  command: string;
  shell?: string;
  timeout?: number;
}): Promise<{ stdout: string; stderr: string }> {
  // Check if shell execution is enabled in preferences
  if (!isShellExecutionEnabled()) {
    throw new Error("Shell execution is disabled in preferences");
  }

  const result = await execAsync(config.command, {
    shell: config.shell || "/bin/bash",
    timeout: config.timeout || 5000,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

// lib/runtime/ops/transform.ts
import Handlebars from "handlebars";

export async function executeTransform(config: {
  template: string;
  data: any;
}): Promise<any> {
  const template = Handlebars.compile(config.template);
  return template(config.data);
}
```

### Security & Sandboxing

#### MVP Security Model

1. **Allowlisted Operations**
   - Only predefined operation types are executable
   - No dynamic `eval()`, `Function()`, or `require()`
   - Template engine (Handlebars) with restricted helpers

2. **Shell Execution Controls**
   - Opt-in via extension preferences
   - User confirmation before each execution
   - Timeout limits (default 5s, max 30s)
   - No access to sensitive directories

3. **File System Restrictions**
   - Read/write limited to `environment.supportPath`
   - No access to user's home directory or system files
   - Path traversal prevention

4. **HTTP Request Safeguards**
   - No automatic credential handling (user must provide)
   - Timeout limits
   - Optional SSL certificate validation

5. **Variable Interpolation**
   - Only specific context variables accessible
   - No arbitrary code execution via templates
   - Environment variables explicitly allowed

#### Future Security Enhancements

- **VM Sandboxing**: Use Node's `vm` module for JavaScript execution
- **Rate Limiting**: Prevent DoS via rapid operation execution
- **Secret Redaction**: Automatic redaction in logs and error messages
- **Operation Quotas**: Limit number of HTTP requests per execution
- **Content Security**: Validate and sanitize external data before rendering

### Example: Complete GitHub Stars CommandSpec

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "GitHub Stars",
  "description": "View your starred GitHub repositories",
  "mode": "list",
  "icon": "⭐",
  "steps": [
    {
      "type": "httpRequest",
      "config": {
        "url": "https://api.github.com/user/starred",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{env.GITHUB_TOKEN}}",
          "Accept": "application/vnd.github.v3+json"
        }
      },
      "outputVar": "repos"
    }
  ],
  "ui": {
    "mode": "list",
    "dataSource": "repos",
    "itemProps": {
      "title": "{{name}}",
      "subtitle": "{{description}}",
      "accessories": ["⭐ {{stargazers_count}}"]
    }
  },
  "actions": [
    {
      "title": "Open in Browser",
      "icon": "🌐",
      "operation": {
        "type": "open",
        "config": {
          "target": "{{item.html_url}}"
        }
      }
    },
    {
      "title": "Copy Clone URL",
      "icon": "📋",
      "operation": {
        "type": "clipboard",
        "config": {
          "action": "copy",
          "text": "{{item.clone_url}}"
        }
      }
    }
  ],
  "metadata": {
    "created": "2025-11-16T10:30:00Z",
    "modified": "2025-11-16T10:30:00Z",
    "tags": ["github", "api", "development"],
    "author": "ai-generator"
  }
}
```

This spec would be saved to:
`environment.supportPath/commands/550e8400-e29b-41d4-a716-446655440000.json`

And executed by the "Run Generated Commands" command when the user selects "GitHub Stars" from the list.
