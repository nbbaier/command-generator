// AI Tool: Generate Script Command
// This tool generates a shell or Node.js script with a CommandSpec to execute it

import { AI, environment } from "@raycast/api";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { CommandSpec } from "../types/command-spec";
import { saveCommandSpec, getScriptsDirectory } from "../lib/specs/loader";

interface GenerateScriptCommandInput {
  commandDescription: string;
  scriptType?: "bash" | "javascript" | "node";
  mode?: "silent" | "inline" | "compact" | "fullOutput";
  requiresArguments?: boolean;
}

export default async function generateScriptCommand(input: GenerateScriptCommandInput): Promise<string> {
  try {
    const scriptType = input.scriptType || "bash";
    const mode = input.mode || "fullOutput";

    // Use Raycast AI to generate the script
    const aiPrompt = `You are an expert at writing ${scriptType} scripts for automation.

Generate a ${scriptType} script that: ${input.commandDescription}

Requirements:
- Script type: ${scriptType}
- Output mode: ${mode}
${input.requiresArguments ? "- The script should accept arguments" : ""}

${scriptType === "bash" ? "The script should be a standalone bash script with proper error handling and comments." : "The script should be a Node.js script using CommonJS (require/module.exports) syntax."}

Generate ONLY the script code, no markdown formatting or explanations.`;

    const generatedScript = await AI.ask(aiPrompt, {
      model: "anthropic-claude-sonnet",
    });

    // Clean up the generated script (remove markdown code blocks if present)
    const codeMatch = generatedScript.match(/```(?:bash|javascript|js)?\s*\n([\s\S]*?)\n```/);
    const scriptContent = codeMatch ? codeMatch[1] : generatedScript;

    // Determine file extension
    const extension = scriptType === "bash" ? "sh" : "js";
    const scriptName = generateScriptName(input.commandDescription);
    const scriptFileName = `${scriptName}.${extension}`;

    // Save script to scripts directory
    const scriptsDir = getScriptsDirectory();
    await fs.mkdir(scriptsDir, { recursive: true });
    const scriptPath = path.join(scriptsDir, scriptFileName);
    await fs.writeFile(scriptPath, scriptContent, "utf-8");

    // Make bash scripts executable
    if (scriptType === "bash") {
      await fs.chmod(scriptPath, 0o755);
    }

    // Create a CommandSpec that executes this script
    const spec: CommandSpec = {
      id: randomUUID(),
      title: generateTitle(input.commandDescription),
      description: input.commandDescription,
      mode: "detail",
      icon: scriptType === "bash" ? "🔧" : "📜",
      steps: [
        {
          type: "shell",
          config: {
            command: scriptType === "bash" ? scriptPath : `node ${scriptPath}`,
            timeout: 30000,
          },
          outputVar: "result",
        },
      ],
      ui: {
        mode: "detail",
        dataSource: "result",
        content: mode === "silent" ? "✅ Script executed successfully" : "```\n{{result.stdout}}\n```",
      },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: ["script", scriptType, "automation"],
        author: "ai-generator",
      },
    };

    // Save the CommandSpec
    await saveCommandSpec(spec);

    return `✅ Successfully generated script command "${spec.title}"!

📁 Script saved to: ${scriptPath}
📄 CommandSpec saved to: ${environment.supportPath}/commands/${spec.id}.json

The command is now available in "Run Generated Commands".

To use it:
1. Open "Run Generated Commands" in Raycast
2. Find "${spec.title}" in the list
3. Run it immediately

Script details:
- Type: ${scriptType}
- Mode: ${mode}
- Executable: ${scriptType === "bash" ? "Yes (chmod +x applied)" : "Via Node.js"}`;
  } catch (error) {
    throw new Error(`Failed to generate script command: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateScriptName(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

function generateTitle(description: string): string {
  // Capitalize first letter and clean up
  return description.charAt(0).toUpperCase() + description.slice(1);
}
