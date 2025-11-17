// AI Tool: Generate Command Spec
// This tool generates an executable CommandSpec JSON that runs immediately in the command runner

import { AI, environment } from "@raycast/api";
import { randomUUID } from "crypto";
import { CommandSpec } from "../types/command-spec";
import { saveCommandSpec } from "../lib/specs/loader";

interface GenerateCommandSpecInput {
  commandDescription: string;
  commandType?: "view" | "form" | "list" | "detail";
  requiresAPI?: boolean;
  apiDetails?: {
    endpoint: string;
    authType?: "none" | "bearer" | "apiKey" | "basic";
    method?: "GET" | "POST" | "PUT" | "DELETE";
  };
}

export default async function generateCommandSpec(input: GenerateCommandSpecInput): Promise<string> {
  try {
    // Use Raycast AI to generate the CommandSpec based on description
    const aiPrompt = `You are an expert at creating CommandSpec JSON specifications for Raycast commands.

Generate a CommandSpec JSON that: ${input.commandDescription}

Requirements:
- Command type: ${input.commandType || "list"}
- Requires API: ${input.requiresAPI ? "yes" : "no"}
${input.apiDetails ? `- API endpoint: ${input.apiDetails.endpoint}\n- Auth type: ${input.apiDetails.authType || "bearer"}\n- HTTP method: ${input.apiDetails.method || "GET"}` : ""}

The CommandSpec should follow this structure:
{
  "id": "uuid-here",
  "title": "Command Title",
  "description": "What the command does",
  "mode": "list" | "form" | "detail" | "view",
  "icon": "emoji-icon",
  "steps": [
    {
      "type": "httpRequest" | "shell" | "transform" | ...,
      "config": { /* operation specific config */ },
      "outputVar": "variableName"
    }
  ],
  "ui": {
    "mode": "list" | "detail",
    "dataSource": "variableName",
    "itemProps": { /* for list mode */ },
    "content": "markdown template" /* for detail mode */
  },
  "actions": [ /* optional actions */ ],
  "metadata": {
    "created": "ISO timestamp",
    "modified": "ISO timestamp",
    "tags": ["tag1", "tag2"]
  }
}

Available operation types:
- httpRequest: Fetch from APIs
- shell: Execute commands
- transform: Transform data with Handlebars
- fileRead/fileWrite: File operations
- clipboard: Copy/paste
- open: Open URLs
- showToast/showHUD: User feedback

Template syntax uses Handlebars: {{variable}}, {{env.VAR}}, {{input.fieldName}}

Generate ONLY the JSON spec, no additional text or markdown formatting.`;

    const generatedSpec = await AI.ask(aiPrompt, {
      model: "anthropic-claude-sonnet",
    });

    // Parse and validate the generated spec
    let spec: CommandSpec;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = generatedSpec.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : generatedSpec;

      spec = JSON.parse(jsonStr);

      // Ensure required fields are present
      spec.id = randomUUID();
      spec.metadata = {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: spec.metadata?.tags || [],
        author: "ai-generator",
      };
    } catch (parseError) {
      throw new Error(`Failed to parse generated CommandSpec: ${parseError}`);
    }

    // Save the spec to supportPath/commands/
    await saveCommandSpec(spec);

    return `✅ Successfully generated "${spec.title}" command!

📁 Saved to: ${environment.supportPath}/commands/${spec.id}.json
🎯 Mode: ${spec.mode}
🔧 Operations: ${spec.steps.length}

The command is now available in "Run Generated Commands".

To use it:
1. Open "Run Generated Commands" in Raycast
2. Find "${spec.title}" in the list
3. Run it immediately - no rebuild required!

${spec.steps.some((s) => s.type === "httpRequest") ? "\n⚠️ Note: This command makes HTTP requests. Ensure any required API keys are set in environment variables." : ""}`;
  } catch (error) {
    throw new Error(`Failed to generate command: ${error instanceof Error ? error.message : String(error)}`);
  }
}
