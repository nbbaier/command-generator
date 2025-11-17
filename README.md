# Raycast AI Command Generator

Generate and run custom Raycast commands using AI - no coding or rebuilding required!

## Overview

This extension leverages Raycast AI to help you create executable command specifications that run immediately through a dynamic command runner. It's perfect for:

- **Beginners**: Create custom commands without writing code
- **Power Users**: Rapidly prototype command ideas
- **Developers**: Scaffold new commands with AI assistance

## Key Features

### 🚀 Immediate Execution
Commands run instantly through the dynamic runner - no rebuild required!

### 🤖 AI-Powered Generation
Three AI tools that create commands for you:
- **Generate Command Spec**: Create HTTP API integrations, data transformations, and more
- **Generate Script Command**: Create bash or Node.js scripts with command wrappers
- **Analyze Command**: Convert existing code to CommandSpecs or get improvement suggestions

### 📚 Template Library
Browse and instantiate pre-built templates for common use cases:
- GitHub Stars viewer
- System disk usage monitor
- Weather lookup
- Hacker News reader
- IP address lookup

### 🔒 Secure by Design
- Allowlisted operations only
- File access restricted to extension support directory
- Template-based data transforms (no eval)
- Shell execution requires user opt-in

## How It Works

This extension uses a **CommandSpec architecture**:

1. **AI tools generate CommandSpec JSON** - Not TypeScript files
2. **Specs are stored** in your extension's support directory
3. **A dynamic runner executes specs** using an interpreter
4. **Operations are allowlisted** for security (HTTP, shell, transform, file, clipboard, etc.)

### Why CommandSpecs?

Raycast extensions cannot add commands at runtime (the manifest is read-only). Instead, this extension:
- Uses a single "runner" command that dynamically loads and executes specifications
- Provides immediate execution without rebuilding
- Offers export functionality to convert successful prototypes to standalone extensions

## Usage

### Creating Your First Command

1. Open Raycast AI (⌘ Space + "AI")
2. Type: "Create a command that shows my GitHub stars"
3. Mention: `@generate-command-spec`
4. The AI will generate a CommandSpec and save it automatically
5. Open "Run Generated Commands" to execute it immediately!

### Example Prompts

```
@generate-command-spec create a command that fetches the current Bitcoin price

@generate-script-command write a script to clear my downloads folder

@analyze-command [paste existing command code] convert-to-spec
```

### Browsing Templates

1. Open "Command Templates" in Raycast
2. Browse the gallery of pre-built examples
3. Select a template and choose "Add to My Commands"
4. Run it immediately from "Run Generated Commands"

## CommandSpec Structure

A CommandSpec is a JSON file that defines:

```json
{
  "id": "unique-id",
  "title": "Command Title",
  "description": "What it does",
  "mode": "list | form | detail",
  "steps": [
    {
      "type": "httpRequest | shell | transform | ...",
      "config": { /* operation config */ },
      "outputVar": "variableName"
    }
  ],
  "ui": {
    "mode": "list | detail",
    "dataSource": "variableName",
    "itemProps": { /* for list */ },
    "content": "markdown template" /* for detail */
  },
  "actions": [ /* optional */ ],
  "metadata": { /* timestamps, tags */ }
}
```

### Supported Operations

- **httpRequest**: Fetch from REST APIs
- **shell**: Execute shell commands
- **transform**: Transform data with Handlebars templates
- **fileRead/fileWrite**: File operations (restricted to support directory)
- **clipboard**: Copy/paste text
- **open**: Open URLs or applications
- **showToast/showHUD**: User feedback

### Template Syntax

Use Handlebars for dynamic values:
- `{{variable}}` - Access operation output
- `{{env.VAR}}` - Access environment variables
- `{{input.fieldName}}` - Access form input
- `{{item.property}}` - Access list item properties

## Development

### Building from Source

```bash
npm install
npm run dev
```

### Project Structure

```
src/
├── commands/              # UI commands
│   ├── manage-generated-commands.tsx  # Main runner
│   └── command-library.tsx            # Template gallery
├── tools/                 # AI tools
│   ├── generate-typescript-command.ts # Generate CommandSpecs
│   ├── generate-script-command.ts     # Generate scripts
│   └── analyze-command.ts             # Analyze code
├── lib/
│   ├── runtime/          # Interpreter and operations
│   │   ├── interpreter.ts
│   │   └── ops/          # Operation handlers
│   ├── specs/            # CommandSpec management
│   │   ├── schema.ts
│   │   ├── validator.ts
│   │   └── loader.ts
│   └── templates/        # Example specs
└── types/                # TypeScript definitions
```

## Security Considerations

This extension follows security best practices:

1. **Allowlisted Operations**: Only predefined operation types can execute
2. **No Dynamic Code Execution**: No `eval()` or `Function()` - templates only
3. **File System Restrictions**: Read/write limited to support directory
4. **Shell Execution Controls**: Opt-in required with user confirmation
5. **Template Sandboxing**: Handlebars with restricted helpers only

## Limitations

- Generated commands are not "first-class" Raycast commands until exported
- Limited to predefined operation types (extensible in future versions)
- Shell execution requires explicit user consent per command
- File operations restricted to extension support directory

## Troubleshooting

### Commands not appearing?
- Ensure you've opened "Run Generated Commands" after generation
- Check the support directory: `~/Library/Application Support/com.raycast.macos/extensions/command-generator/commands/`

### Command execution fails?
- Check that required environment variables are set (e.g., API keys)
- Review the CommandSpec JSON for syntax errors
- Check the Raycast logs for detailed error messages

### Template interpolation errors?
- Verify variable names match operation outputVar values
- Check Handlebars syntax: `{{variable}}` not `${variable}`
- Ensure data structure matches template expectations

## Contributing

This extension is designed to be extensible:

1. **Add new operations**: Create new handlers in `src/lib/runtime/ops/`
2. **Add templates**: Add CommandSpecs to `src/lib/templates/example-specs.ts`
3. **Improve AI prompts**: Enhance prompts in the tool files for better generation

## License

MIT

## Credits

Built with:
- [Raycast API](https://developers.raycast.com/)
- [Handlebars](https://handlebarsjs.com/) for templating
- [node-fetch](https://github.com/node-fetch/node-fetch) for HTTP requests

## Resources

- [Planning Documents](./PLAN.md)
- [Architecture Feasibility](./ARCHITECTURE-FEASIBILITY.md)
- [CommandSpec Details](./PLAN-ADDENDUM.md)