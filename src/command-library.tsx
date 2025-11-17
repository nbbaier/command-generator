import { randomUUID } from "node:crypto";
import {
	Action,
	ActionPanel,
	Detail,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { saveCommandSpec } from "./lib/specs/loader";
import { exampleSpecs } from "./lib/templates/example-specs";

export default function Command() {
	async function instantiateTemplate(index: number) {
		const template = exampleSpecs[index];

		// Create a new spec with a unique ID
		const newSpec = {
			...template,
			id: randomUUID(),
			metadata: {
				...template.metadata,
				created: new Date().toISOString(),
				modified: new Date().toISOString(),
			},
		};

		try {
			await saveCommandSpec(newSpec);
			await showToast({
				style: Toast.Style.Success,
				title: "Template instantiated",
				message: `"${newSpec.title}" is now available in Run Generated Commands`,
			});
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to save template",
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return (
		<List searchBarPlaceholder="Search command templates...">
			{exampleSpecs.map((spec, index) => (
				<List.Item
					key={index}
					icon={spec.icon || Icon.Code}
					title={spec.title}
					subtitle={spec.description}
					accessories={[
						{ tag: spec.mode },
						{ text: spec.metadata.tags.join(", ") },
					]}
					actions={
						<ActionPanel>
							<Action
								title="Add to My Commands"
								icon={Icon.Plus}
								onAction={() => instantiateTemplate(index)}
							/>
							<Action.Push
								title="View Template"
								icon={Icon.Eye}
								target={<TemplateDetail spec={spec} />}
							/>
							<Action.CopyToClipboard
								title="Copy JSON"
								content={JSON.stringify(spec, null, 2)}
								shortcut={{ modifiers: ["cmd"], key: "c" }}
							/>
						</ActionPanel>
					}
				/>
			))}
		</List>
	);
}

function TemplateDetail({ spec }: { spec: (typeof exampleSpecs)[0] }) {
	const markdown = `
# ${spec.title}

${spec.description}

## Details
- **Mode**: ${spec.mode}
- **Operations**: ${spec.steps.length}
- **Tags**: ${spec.metadata.tags.join(", ")}

## Operations
${spec.steps.map((step, i) => `${i + 1}. **${step.type}**${step.outputVar ? ` → \`${step.outputVar}\`` : ""}`).join("\n")}

## UI Configuration
- **Mode**: ${spec.ui.mode}
- **Data Source**: ${spec.ui.dataSource}

${spec.actions ? `## Available Actions\n${spec.actions.map((a) => `- ${a.title}`).join("\n")}` : ""}

## JSON Specification
\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\`
`;

	return <Detail markdown={markdown} />;
}
