// AI Tool: Analyze Command
// This tool analyzes existing Raycast command or script code

import { AI, environment } from "@raycast/api";
import { randomUUID } from "crypto";
import { CommandSpec } from "../types/command-spec";
import { saveCommandSpec } from "../lib/specs/loader";

interface AnalyzeCommandInput {
  commandCode: string;
  analysisType?: "explain" | "improve" | "convert-to-spec" | "security-review";
}

export default async function analyzeCommand(input: AnalyzeCommandInput): Promise<string> {
  try {
    const analysisType = input.analysisType || "explain";

    switch (analysisType) {
      case "explain":
        return await explainCommand(input.commandCode);

      case "improve":
        return await improveCommand(input.commandCode);

      case "convert-to-spec":
        return await convertToSpec(input.commandCode);

      case "security-review":
        return await securityReview(input.commandCode);

      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }
  } catch (error) {
    throw new Error(`Failed to analyze command: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function explainCommand(code: string): Promise<string> {
  const aiPrompt = `You are an expert Raycast extension developer. Analyze and explain this Raycast command code:

\`\`\`
${code}
\`\`\`

Provide:
1. A high-level explanation of what the command does
2. The command type (view, form, list, no-view)
3. Key features and functionality
4. APIs or external services used
5. User interactions available

Be clear and concise.`;

  const explanation = await AI.ask(aiPrompt, {
    model: "anthropic-claude-sonnet",
  });

  return explanation;
}

async function improveCommand(code: string): Promise<string> {
  const aiPrompt = `You are an expert Raycast extension developer. Review this command code and suggest improvements:

\`\`\`
${code}
\`\`\`

Provide specific recommendations for:
1. Code quality and best practices
2. Performance optimizations
3. Error handling improvements
4. User experience enhancements
5. Raycast API usage improvements

Format your response as a numbered list of actionable suggestions.`;

  const improvements = await AI.ask(aiPrompt, {
    model: "anthropic-claude-sonnet",
  });

  return `# Improvement Suggestions\n\n${improvements}`;
}

async function convertToSpec(code: string): Promise<string> {
  const aiPrompt = `You are an expert at converting Raycast commands to CommandSpec JSON format.

Analyze this command code and convert it to a CommandSpec:

\`\`\`
${code}
\`\`\`

Generate a CommandSpec JSON that replicates the functionality. The CommandSpec should follow this structure:
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

Generate ONLY the JSON spec.`;

  const generatedSpec = await AI.ask(aiPrompt, {
    model: "anthropic-claude-sonnet",
  });

  // Parse and save the spec
  try {
    const jsonMatch = generatedSpec.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : generatedSpec;
    const spec: CommandSpec = JSON.parse(jsonStr);

    // Ensure required fields
    spec.id = randomUUID();
    spec.metadata = {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: spec.metadata?.tags || ["converted"],
      author: "ai-analyzer",
    };

    // Save the spec
    await saveCommandSpec(spec);

    return `✅ Successfully converted command to CommandSpec!

📄 Spec saved to: ${environment.supportPath}/commands/${spec.id}.json
🎯 Title: "${spec.title}"
🔧 Operations: ${spec.steps.length}

The converted command is now available in "Run Generated Commands".

Original code has been analyzed and converted to use:
${spec.steps.map((s, i) => `${i + 1}. ${s.type}`).join("\n")}

You can now run this command immediately without rebuilding!`;
  } catch (parseError) {
    return `Failed to parse generated CommandSpec. Here's what was generated:\n\n${generatedSpec}\n\nError: ${parseError}`;
  }
}

async function securityReview(code: string): Promise<string> {
  const aiPrompt = `You are a security expert reviewing Raycast extension code. Analyze this code for security concerns:

\`\`\`
${code}
\`\`\`

Identify:
1. Security vulnerabilities (injection, XSS, etc.)
2. Unsafe API usage
3. Hardcoded secrets or credentials
4. Unsafe file system operations
5. Unvalidated user input
6. Missing error handling that could leak sensitive info

For each issue found, provide:
- Severity (Critical, High, Medium, Low)
- Description of the issue
- Recommended fix

If the code is secure, state that explicitly.`;

  const securityAnalysis = await AI.ask(aiPrompt, {
    model: "anthropic-claude-sonnet",
  });

  return `# Security Review\n\n${securityAnalysis}`;
}
