# Raycast AI Command Generator - Extension Plan

## Executive Summary

This document outlines the plan for building a Raycast extension that leverages Raycast AI to help users generate and execute custom commands. The extension provides AI-powered tools that generate **executable command specifications** that run within a dynamic command runner, plus optionally export standalone Raycast extensions or script commands for manual installation.

**Key Architectural Insight**: Raycast extensions cannot add or modify commands at runtime (package.json is read only at build/install time). Therefore, this extension uses a **single dynamic "runner" command** that executes generated command specifications stored in the extension's support directory.

---

## 1. Project Overview

### Vision
Create an intelligent Raycast extension that democratizes command creation by allowing users to describe functionality in natural language and receive immediately executable commands through a dynamic runner, with optional export to standalone extensions.

### Core Value Proposition
- **Lower barrier to entry**: Non-developers can create and run custom commands instantly
- **Accelerate development**: Experienced developers can rapidly prototype and test command ideas
- **No rebuild required**: Generated commands run immediately through the command runner
- **Export when ready**: Convert successful prototypes to standalone extensions or script commands
- **Learn by doing**: Users can study generated code to understand Raycast API patterns
- **Consistency**: AI-generated commands follow best practices and current API standards

### Target Users
1. **Beginners**: Users new to Raycast development who want custom functionality
2. **Power Users**: Users familiar with Raycast who want to automate command creation
3. **Developers**: Developers building personal Raycast extensions who want scaffolding assistance

---

## 2. Technical Architecture

### 2.1 Extension Type
**AI Extension** with the following components:
- **AI Tools**: Functions that Raycast AI can invoke to generate command specifications
- **Command Runner**: A single dynamic command that loads and executes generated specs
- **Regular Commands**: UI-based commands for managing and running generated commands
- **Storage**: Command specifications stored in `environment.supportPath/commands/`
- **Export**: Generate standalone extension or script command files for manual installation

### 2.2 Technology Stack
- **Language**: TypeScript
- **Framework**: React (Raycast API)
- **Runtime**: Node.js 22.14+
- **Package Manager**: npm (for Raycast compatibility) or Bun (for development speed)
- **Required Dependencies**:
  - `@raycast/api` - Core Raycast API
  - `@raycast/utils` - Utility hooks and components
  - Template engine (e.g., `handlebars` or `liquidjs`)
  - Code formatting (e.g., `prettier`)

### 2.3 Extension Structure

```
raycast-ai-command-generator/
├── package.json                 # Extension manifest with AI tools defined
├── tsconfig.json               # TypeScript configuration
├── assets/                     # Icons and images
│   ├── command-icon.png
│   └── extension-icon.png
├── src/
│   ├── tools/                 # AI Tool implementations
│   │   ├── generate-command-spec.ts
│   │   ├── generate-script-command.ts
│   │   └── analyze-command.ts
│   ├── commands/              # Regular user-facing commands
│   │   ├── run-generated-commands.tsx  # PRIMARY: Dynamic runner + manager
│   │   └── view-templates.tsx
│   ├── lib/                   # Shared utilities
│   │   ├── specs/             # Command specification system
│   │   │   ├── schema.ts      # CommandSpec TypeScript types
│   │   │   ├── validator.ts   # Runtime validation
│   │   │   └── loader.ts      # Load specs from supportPath
│   │   ├── runtime/           # Command execution engine
│   │   │   ├── interpreter.ts # Execute CommandSpecs
│   │   │   └── ops/           # Allowed operations
│   │   │       ├── http.ts
│   │   │       ├── shell.ts
│   │   │       ├── transform.ts
│   │   │       ├── file.ts
│   │   │       └── ui.ts
│   │   ├── export/            # Export to standalone extensions/scripts
│   │   │   ├── extension-exporter.ts
│   │   │   └── script-exporter.ts
│   │   ├── templates/         # Templates for export
│   │   │   ├── specs/         # Example CommandSpec templates
│   │   │   └── extensions/    # Standalone extension scaffolds
│   │   │       ├── view-command.hbs
│   │   │       ├── form-command.hbs
│   │   │       ├── list-command.hbs
│   │   │       └── package.json.hbs
│   │   └── storage/           # Local storage utilities
│   │       └── command-storage.ts
│   └── types/                 # TypeScript type definitions
│       ├── command-spec.ts    # CommandSpec interface
│       └── operation.ts       # Operation types
└── README.md
```

---

## 3. Core Features

### 3.1 AI Tools (Invoked via @mention in Raycast AI)

#### Tool 1: Generate Command Specification
**Name**: `generate-command-spec`

**Description**: Generates an executable CommandSpec JSON that runs immediately in the command runner, with optional export to a standalone TypeScript extension

**Inputs**:
- `commandDescription` (string): Natural language description of what the command should do
- `commandType` (enum): `view` | `form` | `list` | `detail`
- `requiresAPI` (boolean): Whether the command needs to make API calls
- `apiDetails` (optional object):
  - `endpoint` (string): API endpoint URL
  - `authType` (enum): `none` | `bearer` | `apiKey` | `basic`
  - `method` (enum): `GET` | `POST` | `PUT` | `DELETE`
- `export` (optional boolean): Whether to generate a standalone extension export

**Outputs**:
- CommandSpec JSON saved to `environment.supportPath/commands/{id}.json`
- Immediately available in "Run Generated Commands" command
- (If export=true) Standalone extension folder with package.json, src/, and README
- Usage instructions

**CommandSpec Structure**:
```typescript
interface CommandSpec {
  id: string;
  title: string;
  description: string;
  mode: "view" | "form" | "list" | "detail";
  inputs?: FormInput[];
  steps: Operation[];
  ui: UIBinding;
  actions?: Action[];
  metadata: {
    created: string;
    tags: string[];
  };
}
```

**Example Interaction**:
```
User: @generate-command-spec create a command that shows my GitHub stars
AI: I'll generate a list command spec that fetches and displays your GitHub starred repositories.
[Creates environment.supportPath/commands/github-stars.json with HTTP operation, list UI binding]
Result: Command "GitHub Stars" is now available in your runner. Open "Run Generated Commands" to execute it.
```

#### Tool 2: Generate Script Command
**Name**: `generate-script-command`

**Description**: Generates a shell/node script that can be executed via CommandSpec or exported as a Raycast Script Command

**Inputs**:
- `commandDescription` (string): What the script should do
- `scriptType` (enum): `bash` | `javascript` | `node`
- `mode` (enum): `silent` | `inline` | `compact` | `fullOutput`
- `requiresArguments` (boolean): Whether script needs user input
- `argumentConfig` (optional array):
  - `name` (string)
  - `placeholder` (string)
  - `type` (enum): `text` | `password`
- `exportAsScriptCommand` (boolean): Export with Raycast Script Command metadata

**Outputs**:
- Script file saved to `environment.supportPath/commands/scripts/{name}.{sh|js}`
- CommandSpec that executes the script (shell operation)
- (If exportAsScriptCommand=true) Script with metadata headers + installation instructions
- The script is immediately runnable via "Run Generated Commands"

**Example Interaction**:
```
User: @generate-script-command I need a script to restart my PostgreSQL database
AI: I'll create a shell script that restarts PostgreSQL and a spec to run it.
[Creates restart-postgres.sh in supportPath/commands/scripts/]
[Creates restart-postgres.json spec with shell operation]
Result: Command "Restart PostgreSQL" is ready. To install as a native Script Command, check the export folder for manual installation instructions.
```

#### Tool 3: Analyze Existing Command
**Name**: `analyze-command`

**Description**: Analyzes an existing command/script and suggests improvements, converts to CommandSpec, or exports as standalone extension

**Inputs**:
- `commandCode` (string): The full code of an existing command
- `analysisType` (enum): `explain` | `improve` | `convert-to-spec` | `export-extension`

**Outputs**:
- Detailed explanation or improvement suggestions
- (If `convert-to-spec`) CommandSpec JSON that replicates the functionality
- (If `export-extension`) Standalone extension folder with improved TypeScript code
- Refactoring recommendations

**Example Interaction**:
```
User: @analyze-command [pastes script command code]
AI: This script command follows HN posts. I can convert it to a CommandSpec with:
- HTTP request operation to fetch HN data
- List UI to display results
- Action to open in browser
Or I can export it as a full TypeScript extension with error handling and LocalStorage.
Which would you prefer?

User: Convert to spec
AI: [Creates hn-follow.json spec with HTTP + list UI operations]
Result: Command "HN Follow" is now runnable via the command runner.
```

### 3.2 Regular Commands (User-Facing UI)

#### Command 1: Run & Manage Generated Commands (PRIMARY)
**Purpose**: Execute generated CommandSpecs and manage the library

**Features**:
- **List view** of all generated CommandSpecs from `supportPath/commands/`
- **Run immediately**: Select a spec to execute it with the interpreter
- **Dynamic UI rendering**: Based on spec mode (list/form/detail)
- **Quick actions**:
  - ▶️ Run command
  - ✏️ Edit spec (opens JSON in default editor)
  - 📋 Duplicate spec
  - 📤 Export to standalone extension
  - 📜 Export as Script Command
  - 🗑️ Delete spec
- **Search and filtering** by title, tags, type
- **Detail view**: Shows spec metadata, operations, last run
- **Execution history**: Track successful runs and errors

**How it works**:
1. Load all `.json` files from `supportPath/commands/`
2. Validate against CommandSpec schema
3. Display in list with metadata
4. On selection/run: Pass spec to interpreter
5. Interpreter executes operations sequentially
6. Render UI based on mode and results

#### Command 2: View Templates & Examples
**Purpose**: Browse curated CommandSpec templates for common use cases

**Features**:
- Gallery of pre-built CommandSpec templates:
  - **API integrations**: GitHub repos, weather, news feeds
  - **System commands**: Disk space, process list, network info
  - **Utilities**: Clipboard transformers, URL shorteners
  - **Development tools**: Package search, documentation lookup
- Preview template spec JSON
- One-click instantiation (saves to `supportPath/commands/`)
- Customization prompts before saving
- Tags and categories for browsing

---

## 4. AI Tool Implementation Details

### 4.1 Tool Configuration in package.json

```json
{
  "name": "raycast-ai-command-generator",
  "title": "AI Command Generator",
  "description": "Generate and run custom Raycast commands using AI",
  "$schema": "https://www.raycast.com/schemas/extension.json",
  "version": "1.0.0",
  "author": "nbbaier",
  "license": "MIT",
  "commands": [
    {
      "name": "run-generated-commands",
      "title": "Run Generated Commands",
      "description": "Execute and manage AI-generated command specifications",
      "mode": "view"
    },
    {
      "name": "view-templates",
      "title": "Command Templates",
      "description": "Browse and instantiate pre-built command templates",
      "mode": "view"
    }
  ],
  "tools": [
    {
      "name": "generate-command-spec",
      "title": "Generate Command Spec",
      "description": "Generates an executable command specification (JSON) that runs immediately in the command runner. Supports list, form, detail, and view modes with HTTP requests, shell execution, and data transforms. Optionally exports a standalone TypeScript extension."
    },
    {
      "name": "generate-script-command",
      "title": "Generate Script Command",
      "description": "Generates a shell or Node.js script with a CommandSpec to execute it. Can export as a Raycast Script Command with metadata headers for manual installation."
    },
    {
      "name": "analyze-command",
      "title": "Analyze Command",
      "description": "Analyzes existing Raycast command or script code, provides explanations, converts to CommandSpec, or exports as standalone extension with improvements."
    }
  ],
  "ai": {
    "instructions": "You are an expert Raycast extension developer. Help users create high-quality Raycast commands by:\n1. Understanding their requirements through natural language\n2. Selecting appropriate command types (script vs TypeScript, view types)\n3. Generating clean, well-documented code following Raycast best practices\n4. Providing clear setup instructions\n\nWhen generating commands:\n- Use TypeScript for complex UI interactions\n- Use script commands for simple automation\n- Include proper error handling\n- Add helpful comments\n- Follow Raycast's design guidelines\n- Consider performance and user experience",
    "creativity": "medium"
  },
  "dependencies": {
    "@raycast/api": "^1.93.0",
    "@raycast/utils": "^1.20.0",
    "handlebars": "^4.7.8",
    "prettier": "^3.4.2"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^1.0.11",
    "@types/node": "^22.14.0",
    "@types/react": "^18.3.18",
    "eslint": "^8.57.0",
    "typescript": "^5.7.0"
  }
}
```

### 4.2 CommandSpec Schema & Operations

See Section 4.2 in the updated plan for complete CommandSpec schema, supported operations, and interpreter pattern.

**Key Design Decisions**:
1. **No runtime package.json modification** - Commands are stored as JSON specs, not added to manifest
2. **Interpreter-based execution** - Specs are executed by a runtime interpreter, not compiled
3. **Allowlisted operations** - Security through limited, safe operation set
4. **Template-based transforms** - Use Handlebars instead of arbitrary JavaScript eval
5. **Export for production** - Manual export path to standalone extensions when ready

### 4.3 Tool Implementation Example

**File**: `src/tools/generate-command-spec.ts`

```typescript
import { AI } from "@raycast/api";
import { generateCommandCode } from "../lib/generators/command-generator";
import { updatePackageJson } from "../lib/generators/package-json-updater";
import { saveCommand } from "../lib/storage/command-storage";

interface GenerateCommandInput {
  commandDescription: string;
  commandType: "view" | "form" | "list" | "no-view";
  requiresAPI: boolean;
  apiDetails?: {
    endpoint: string;
    authType: "none" | "bearer" | "apiKey" | "oauth";
    method: "GET" | "POST" | "PUT" | "DELETE";
  };
}

export default async function generateTypescriptCommand(
  input: GenerateCommandInput
): Promise<string> {
  try {
    // Use Raycast AI to generate command based on description
    const aiPrompt = `Generate a Raycast ${input.commandType} command that: ${input.commandDescription}

Requirements:
- Command type: ${input.commandType}
- Requires API: ${input.requiresAPI}
${input.apiDetails ? `- API endpoint: ${input.apiDetails.endpoint}
- Auth type: ${input.apiDetails.authType}
- HTTP method: ${input.apiDetails.method}` : ""}

Generate production-ready TypeScript code following Raycast best practices.
Include proper error handling, loading states, and user feedback.`;

    const generatedCode = await AI.ask(aiPrompt, {
      model: "anthropic-claude-sonnet",
    });

    // Process and format the generated code
    const processedCode = await generateCommandCode({
      rawCode: generatedCode,
      type: input.commandType,
      apiConfig: input.apiDetails,
    });

    // Generate command name from description
    const commandName = generateCommandName(input.commandDescription);
    const fileName = `${commandName}.tsx`;

    // Save the command
    await saveCommand({
      name: commandName,
      fileName: fileName,
      code: processedCode,
      metadata: {
        type: input.commandType,
        description: input.commandDescription,
        createdAt: new Date().toISOString(),
      },
    });

    // Update package.json with new command entry
    await updatePackageJson({
      commandName,
      fileName,
      description: input.commandDescription,
    });

    return `✅ Successfully generated "${commandName}" command!

📁 File: src/${fileName}
📦 Package.json updated

Next steps:
1. Run 'npm install' if new dependencies were added
2. Run 'npm run dev' to test the command
3. Find your new command in Raycast

The command has been saved to your extension directory.`;
  } catch (error) {
    throw new Error(`Failed to generate command: ${error.message}`);
  }
}

function generateCommandName(description: string): string {
  // Convert description to kebab-case command name
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);
}
```

---

## 5. User Workflows

### Workflow 1: Generate a New TypeScript Command

```
1. User opens Raycast AI (⌘ Space + "AI")
2. User types: "I want to create a command that shows my OpenAI API usage"
3. User mentions: @generate-typescript-command
4. AI asks clarifying questions:
   - "Should this display as a list or detail view?"
   - "Do you have an API endpoint for this data?"
   - "What authentication is required?"
5. User provides details
6. AI generates the command code
7. AI provides next steps and file location
8. User runs 'npm run dev' to test
9. Command appears in Raycast for immediate use
```

### Workflow 2: Convert Script Command to Extension

```
1. User has existing script command (e.g., follow-hn.js)
2. User opens Raycast AI
3. User types: "Convert this script to a TypeScript extension" + pastes code
4. User mentions: @analyze-command
5. AI analyzes the script and creates improved TypeScript version with:
   - Proper React components
   - Better error handling
   - LocalStorage integration
   - Action panel with multiple options
6. AI saves the new command
7. User tests and adopts the new version
```

### Workflow 3: Quick Script Generation

```
1. User wants simple automation: "restart nginx server"
2. User opens Raycast AI: "Create a script command to restart nginx"
3. User mentions: @generate-script-command
4. AI generates bash script with:
   - Proper Raycast headers
   - Silent mode (no UI output)
   - Error handling
   - sudo handling explanation
5. Script is ready to use immediately
```

---

## 6. Command Templates

### 6.1 Template Categories

#### API Integration Templates
- REST API List View
- GraphQL Query
- Webhook Trigger
- API with Pagination

#### System Automation Templates
- File System Operations
- Process Management
- Environment Control
- Clipboard Manipulation

#### Browser Automation Templates
- Get Current Tab URL
- Search Browser History
- Bookmark Manager
- Multi-tab Operations

#### Data Transformation Templates
- JSON/YAML/XML Parser
- Text Formatter
- Image Processor
- CSV to JSON Converter

### 6.2 Example Template Structure

**Template**: `view-command.hbs`

```typescript
import { List } from "@raycast/api";
import { useState, useEffect } from "react";

export default function Command() {
  const [items, setItems] = useState<{{itemType}}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        {{#if requiresAPI}}
        const response = await fetch("{{apiEndpoint}}", {
          {{#if authToken}}
          headers: {
            "Authorization": "Bearer {{authToken}}"
          }
          {{/if}}
        });
        const data = await response.json();
        setItems(data);
        {{else}}
        // Your data fetching logic here
        setItems([]);
        {{/if}}
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <List isLoading={isLoading}>
      {items.map((item, index) => (
        <List.Item
          key={index}
          title={item.{{titleField}}}
          subtitle={item.{{subtitleField}}}
          {{#if hasActions}}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={item.url} />
              <Action.CopyToClipboard content={item.{{copyField}}} />
            </ActionPanel>
          }
          {{/if}}
        />
      ))}
    </List>
  );
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Set up extension skeleton and core infrastructure

**Tasks**:
- [ ] Initialize Raycast extension with `npm create raycast-extension`
- [ ] Set up project structure (directories, TypeScript config)
- [ ] Create package.json with AI tools configuration
- [ ] Implement basic template engine integration
- [ ] Create initial command templates (view, form, list, no-view)
- [ ] Set up local storage for generated commands

**Deliverables**:
- Working extension structure
- Template rendering system
- Basic storage layer

### Phase 2: AI Tool - Script Command Generator (Week 3)
**Goal**: Implement script command generation

**Tasks**:
- [ ] Create `generate-script-command` AI tool
- [ ] Implement Bash script template
- [ ] Implement JavaScript/TypeScript script templates
- [ ] Add Raycast metadata header generation
- [ ] Create script validation logic
- [ ] Test with various script types (system, API, automation)

**Deliverables**:
- Working script command generator
- 3-5 tested script templates
- Documentation for script generation

### Phase 3: AI Tool - TypeScript Command Generator (Weeks 4-5)
**Goal**: Implement full TypeScript command generation

**Tasks**:
- [ ] Create `generate-typescript-command` AI tool
- [ ] Implement view command templates (List, Detail, Form)
- [ ] Add API integration logic
- [ ] Implement package.json updater
- [ ] Create command validator
- [ ] Add authentication handling (Bearer, API Key, OAuth)
- [ ] Test with complex use cases

**Deliverables**:
- Working TypeScript command generator
- Support for all command types
- API integration templates

### Phase 4: AI Tool - Command Analyzer (Week 6)
**Goal**: Build command analysis and improvement tool

**Tasks**:
- [ ] Create `analyze-command` AI tool
- [ ] Implement code parsing and analysis
- [ ] Build improvement suggestion engine
- [ ] Create script-to-extension converter
- [ ] Add refactoring capabilities
- [ ] Test with existing script commands in repository

**Deliverables**:
- Command analysis tool
- Migration utilities
- Improvement suggestions

### Phase 5: Management UI (Week 7)
**Goal**: Create user-facing management commands

**Tasks**:
- [ ] Build "Manage Generated Commands" list view
- [ ] Add command editing capabilities
- [ ] Implement command deletion with confirmation
- [ ] Create command library browser
- [ ] Add search and filtering
- [ ] Implement command regeneration

**Deliverables**:
- Complete management UI
- Command library interface
- Full CRUD operations

### Phase 6: Polish & Documentation (Week 8)
**Goal**: Finalize extension and prepare for release

**Tasks**:
- [ ] Add comprehensive error handling
- [ ] Implement loading states and progress indicators
- [ ] Create user documentation (README, tutorials)
- [ ] Add example gallery
- [ ] Write AI instructions optimization
- [ ] Perform extensive testing
- [ ] Create demo video
- [ ] Prepare for Raycast Store submission

**Deliverables**:
- Production-ready extension
- Complete documentation
- Example showcase
- Store submission package

---

## 8. AI Instructions Strategy

### Global AI Instructions (in package.json)

```
You are an expert Raycast extension developer with deep knowledge of:
- Raycast API and component library
- React hooks and TypeScript best practices
- Common integration patterns (APIs, CLIs, system commands)
- User experience design for command-line interfaces

When helping users create commands:

1. **Understand Intent**:
   - Ask clarifying questions about the desired functionality
   - Determine the appropriate command type (script vs TypeScript)
   - Identify required integrations (APIs, system commands, browsers)

2. **Generate Quality Code**:
   - Follow Raycast's official guidelines and patterns
   - Include proper TypeScript types
   - Add comprehensive error handling
   - Implement loading states for async operations
   - Use appropriate UI components (List, Detail, Form)

3. **Best Practices**:
   - Keep commands focused on a single task
   - Use environment variables for secrets
   - Cache data when appropriate
   - Provide helpful user feedback
   - Include keyboard shortcuts in action panels

4. **Security**:
   - Never hardcode API keys or secrets
   - Validate user input
   - Sanitize data before display
   - Use HTTPS for API calls

5. **Performance**:
   - Minimize API calls
   - Implement proper loading states
   - Use debouncing for search
   - Lazy load data when possible

Creativity Level: Medium
- Balance between following established patterns and innovative solutions
- Prefer Raycast conventions unless user specifically requests customization
```

### Tool-Specific Instructions

Each AI tool should have additional context:

**Generate TypeScript Command**:
```
Focus on creating React-based commands with excellent UX.
Default to List view unless another type is more appropriate.
Always include an ActionPanel with relevant actions.
Use @raycast/utils hooks when possible (useFetch, usePromise, etc.).
```

**Generate Script Command**:
```
Create standalone executable scripts.
Include detailed Raycast metadata headers.
Keep scripts simple and focused.
Default to 'silent' mode unless output is needed.
Explain any required environment variables.
```

**Analyze Command**:
```
Provide constructive, actionable feedback.
Identify security concerns or anti-patterns.
Suggest Raycast-specific improvements.
When converting scripts to TypeScript, preserve functionality while improving UX.
```

---

## 9. Storage & State Management

### 9.1 Generated Commands Storage

**Location**: Use Raycast's LocalStorage API

```typescript
import { LocalStorage } from "@raycast/api";

interface GeneratedCommand {
  id: string;
  name: string;
  fileName: string;
  code: string;
  type: "typescript" | "script";
  commandType?: "view" | "form" | "list" | "no-view";
  description: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: {
    hasAPI: boolean;
    dependencies: string[];
    envVars: string[];
  };
}

// Storage operations
async function saveGeneratedCommand(command: GeneratedCommand) {
  await LocalStorage.setItem(
    `generated-command-${command.id}`,
    JSON.stringify(command)
  );
}

async function getGeneratedCommands(): Promise<GeneratedCommand[]> {
  const items = await LocalStorage.allItems();
  return Object.entries(items)
    .filter(([key]) => key.startsWith("generated-command-"))
    .map(([_, value]) => JSON.parse(value as string));
}
```

### 9.2 Template Library

**Location**: Bundled with extension in `src/lib/templates/`

Templates are loaded at runtime and can be extended by users through preferences.

---

## 10. Integration with Existing Scripts

### 10.1 Migration Path

The extension can help migrate the existing 10 script commands:

1. **Analyze Current Scripts**: Use `@analyze-command` to understand each script
2. **Generate TypeScript Versions**: Convert to full extension commands
3. **Preserve Functionality**: Ensure all features are maintained
4. **Enhance UX**: Add visual feedback, better error handling
5. **Consolidate**: Move all commands into single extension

### 10.2 Example Migration: HN Follow Command

**Current**: `raycast-hn/follow-hn.js` (silent script)

**Migration with AI**:
```
User: @analyze-command [pastes follow-hn.js code]
AI: This script follows HN posts. I'll create an improved TypeScript version with:
  - Form input with URL validation
  - Loading indicator during API call
  - Success/error toast notifications
  - Recent follows list
  - Ability to add notes when following

[Generates enhanced TypeScript command]
```

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Template rendering
- Command name generation
- Input validation
- Code formatting

### 11.2 Integration Tests
- AI tool invocation and CommandSpec generation
- CommandSpec validation and storage to supportPath
- Interpreter execution with various operation types
- File system operations (read/write to supportPath)
- Export functionality (standalone extension generation)

### 11.3 Manual Testing Scenarios

**Test Case 1**: Generate Simple Script CommandSpec
- Description: "Create a command to show disk space"
- Expected: CommandSpec with shell operation, detail UI
- Validation: 
  - Spec saved to supportPath/commands/{id}.json
  - Appears in "Run Generated Commands" list
  - Executes and displays disk usage

**Test Case 2**: Generate API Integration CommandSpec
- Description: "Show my GitHub starred repos"
- Expected: CommandSpec with HTTP request, list UI, open/copy actions
- Validation: 
  - Spec generated with proper GitHub API endpoint
  - Requires GITHUB_TOKEN environment variable
  - Displays list with repo names and star counts
  - Actions work (open in browser, copy URL)

**Test Case 3**: Export to Standalone Extension
- Input: Existing GitHub stars CommandSpec
- Action: Use "Export to Extension" action
- Expected: 
  - Folder created with package.json, src/github-stars.tsx, README
  - Includes instructions to run `npm install && npm run dev`
  - TypeScript command uses @raycast/api properly
- Validation: Exported extension runs independently

**Test Case 4**: Convert Existing Script to Spec
- Input: Existing bash script (e.g., restart-postgres.sh)
- Action: Use analyze-command tool
- Expected:
  - CommandSpec with shell operation
  - Proper confirmation prompt
  - Toast notification on success
- Validation: Converted spec executes original functionality

---

## 12. Future Enhancements

### Phase 2 Features (Post-Launch)

1. **AI Command Composer**
   - Chain multiple commands together
   - Create workflows with conditional logic
   - Visual workflow builder

2. **Command Marketplace Integration**
   - Share generated commands with community
   - Browse and install user-created commands
   - Rating and review system

3. **Advanced Templates**
   - Database integrations (PostgreSQL, MongoDB)
   - Cloud service integrations (AWS, GCP, Azure)
   - Development tool integrations (Docker, Kubernetes)

4. **Code Improvement Suggestions**
   - Automatic optimization recommendations
   - Performance analysis
   - Security vulnerability scanning

5. **Multi-Language Support**
   - Python script commands
   - Swift extensions
   - Go-based tools

6. **AI Model Selection**
   - Allow users to choose AI model (Sonnet, GPT-4, etc.)
   - Custom prompt engineering
   - Fine-tuned models for specific domains

---

## 13. Success Metrics

### Key Performance Indicators

1. **Adoption Metrics**
   - Number of commands generated
   - Active users per week
   - Average commands per user

2. **Quality Metrics**
   - Command success rate (runs without errors)
   - User satisfaction ratings
   - Code quality scores (linting, type safety)

3. **Engagement Metrics**
   - Commands kept vs deleted
   - Command modifications after generation
   - Time saved vs manual development

### Target Goals (3 Months Post-Launch)

- 500+ generated commands
- 100+ active users
- 4.5+ star rating
- 80%+ command success rate

---

## 14. Dependencies & Prerequisites

### Required Tools
- Node.js 22.14+
- npm or Bun
- Raycast 1.93.0+
- TypeScript 5.7+
- Git

### Required Raycast Subscriptions
- Raycast AI subscription (for AI tools functionality)

### Development Dependencies
```json
{
  "@raycast/api": "^1.93.0",
  "@raycast/utils": "^1.20.0",
  "@raycast/eslint-config": "^1.0.11",
  "handlebars": "^4.7.8",
  "prettier": "^3.4.2",
  "typescript": "^5.7.0",
  "eslint": "^8.57.0",
  "@types/node": "^22.14.0",
  "@types/react": "^18.3.18"
}
```

---

## 15. Risks & Mitigation

### Risk 1: AI-Generated Code Quality
**Concern**: AI might generate buggy or insecure code

**Mitigation**:
- Implement code validation and linting before saving
- Add security scanning for common vulnerabilities
- Include comprehensive error handling in templates
- Allow users to review and edit before finalizing

### Risk 2: Raycast API Changes
**Concern**: Extension might break with Raycast updates

**Mitigation**:
- Pin to stable API versions
- Monitor Raycast changelog
- Implement version compatibility checks
- Maintain backwards compatibility layer

### Risk 3: Complex User Requirements
**Concern**: AI might not understand complex/vague requests

**Mitigation**:
- Implement multi-turn conversation in AI tools
- Provide example prompts and use cases
- Create fallback to template selection
- Allow iterative refinement

### Risk 4: CommandSpec Storage Conflicts
**Concern**: Overwriting existing specs or ID collisions

**Mitigation**:
- Use UUID v4 for guaranteed unique IDs
- Check for existing specs before writing
- Implement confirmation prompts for overwrites
- Backup specs before modification
- Version tracking in metadata

### Risk 5: Security of Shell/Code Execution
**Concern**: Malicious CommandSpecs could execute harmful operations

**Mitigation**:
- Shell execution opt-in with explicit user consent
- Allowlisted operation types only
- No arbitrary eval() or code execution in MVP
- File system access limited to supportPath
- Environment variable access explicit only
- Future: Implement VM sandboxing for advanced features

---

## 16. Documentation Plan

### User Documentation

1. **Quick Start Guide**
   - Installation instructions
   - First command generation walkthrough
   - Video tutorial (3-5 minutes)

2. **AI Tool Reference**
   - Each tool's capabilities
   - Input parameters explained
   - Example prompts for common tasks

3. **Template Library Guide**
   - Available templates catalog
   - Customization options
   - Creating custom templates

4. **Best Practices**
   - Command design principles
   - Performance optimization
   - Security guidelines
   - Testing generated commands

### Developer Documentation

1. **Architecture Overview**
   - System design
   - Component relationships
   - Data flow diagrams

2. **API Reference**
   - Internal APIs
   - Storage layer
   - Template engine
   - Code generators

3. **Extension Guide**
   - Adding new templates
   - Creating custom AI tools
   - Contributing guidelines

---

## 17. Conclusion

This Raycast AI Command Generator extension will significantly lower the barrier to creating custom Raycast commands by leveraging AI to handle the complexity of code generation. By providing intelligent tools that understand user intent and generate production-ready code, we enable both developers and non-developers to extend Raycast's functionality to meet their specific needs.

The extension follows Raycast's design principles, leverages modern AI capabilities, and provides a seamless user experience. With a phased implementation approach, we can deliver value incrementally while building toward a comprehensive command generation platform.

### Next Steps

1. Review and refine this plan
2. Set up development environment
3. Initialize Raycast extension project
4. Begin Phase 1 implementation
5. Iterate based on testing and feedback

---

**Document Version**: 1.0
**Created**: 2025-11-16
**Author**: AI Planning Assistant
**Status**: Draft - Ready for Review