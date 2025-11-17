import {
	Action,
	ActionPanel,
	Clipboard,
	Detail,
	Form,
	Icon,
	List,
	open,
	showToast,
	Toast,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import {
	executeCommandSpec,
	interpolateTemplate,
} from "./lib/runtime/interpreter";
import { deleteCommandSpec, loadAllCommandSpecs } from "./lib/specs/loader";
import type { CommandSpec } from "./types/command-spec";

export default function Command() {
	const [specs, setSpecs] = useState<CommandSpec[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadSpecs();
	}, []);

	async function loadSpecs() {
		try {
			const loaded = await loadAllCommandSpecs();
			setSpecs(loaded);
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to load commands",
				message: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsLoading(false);
		}
	}

	async function handleDelete(spec: CommandSpec) {
		try {
			await deleteCommandSpec(spec.id);
			await showToast({
				style: Toast.Style.Success,
				title: "Command deleted",
				message: `"${spec.title}" has been removed`,
			});
			await loadSpecs();
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to delete command",
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search generated commands..."
		>
			{specs.length === 0 && !isLoading ? (
				<List.EmptyView
					icon={Icon.Document}
					title="No Generated Commands"
					description="Use Raycast AI with @generate-command-spec to create your first command"
				/>
			) : (
				specs.map((spec) => (
					<List.Item
						key={spec.id}
						icon={spec.icon || Icon.Code}
						title={spec.title}
						subtitle={spec.description}
						accessories={[
							{ tag: spec.mode },
							{ text: spec.metadata.tags.join(", ") },
							{ date: new Date(spec.metadata.created) },
						]}
						actions={
							<ActionPanel>
								<Action.Push
									title="Run Command"
									icon={Icon.Play}
									target={<RunCommand spec={spec} />}
								/>
								<Action.Push
									title="View Details"
									icon={Icon.Eye}
									target={<ViewCommandDetails spec={spec} />}
								/>
								<Action
									title="Delete Command"
									icon={Icon.Trash}
									style={Action.Style.Destructive}
									onAction={() => handleDelete(spec)}
									shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
								/>
							</ActionPanel>
						}
					/>
				))
			)}
		</List>
	);
}

// Component to run a command
function RunCommand({ spec }: { spec: CommandSpec }) {
	// If command requires form input, show form first
	if (spec.mode === "form" && spec.inputs && spec.inputs.length > 0) {
		return (
			<CommandForm
				spec={spec}
				onSubmit={(values) => executeCommandSpec(spec, values)}
			/>
		);
	}

	// Otherwise, execute immediately and show results
	return <CommandExecutor spec={spec} formValues={{}} />;
}

function CommandForm({
	spec,
	onSubmit,
}: {
	spec: CommandSpec;
	onSubmit: (values: Record<string, unknown>) => void;
}) {
	const [values, setValues] = useState<Record<string, unknown>>({});

	return (
		<Form
			actions={
				<ActionPanel>
					<Action.SubmitForm
						title="Run Command"
						onSubmit={() => onSubmit(values)}
					/>
				</ActionPanel>
			}
		>
			{spec.inputs?.map((input) => {
				switch (input.type) {
					case "textfield":
						return (
							<Form.TextField
								key={input.id}
								id={input.id}
								title={input.label}
								placeholder={input.placeholder}
								value={values[input.id] as string}
								onChange={(value) =>
									setValues({ ...values, [input.id]: value })
								}
							/>
						);
					case "textarea":
						return (
							<Form.TextArea
								key={input.id}
								id={input.id}
								title={input.label}
								placeholder={input.placeholder}
								value={values[input.id] as string}
								onChange={(value) =>
									setValues({ ...values, [input.id]: value })
								}
							/>
						);
					case "dropdown":
						return (
							<Form.Dropdown
								key={input.id}
								id={input.id}
								title={input.label}
								value={values[input.id] as string}
								onChange={(value) =>
									setValues({ ...values, [input.id]: value })
								}
							>
								{input.options?.map((option) => (
									<Form.Dropdown.Item
										key={option}
										value={option}
										title={option}
									/>
								))}
							</Form.Dropdown>
						);
					case "checkbox":
						return (
							<Form.Checkbox
								key={input.id}
								id={input.id}
								label={input.label}
								value={values[input.id] as boolean}
								onChange={(value) =>
									setValues({ ...values, [input.id]: value })
								}
							/>
						);
					default:
						return null;
				}
			})}
		</Form>
	);
}

// Component to execute a command and display results
function CommandExecutor({
	spec,
	formValues,
}: {
	spec: CommandSpec;
	formValues: Record<string, unknown>;
}) {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [resultData, setResultData] = useState<Record<string, unknown> | null>(
		null,
	);

	const executeCommand = useCallback(async () => {
		try {
			setIsLoading(true);
			const result = await executeCommandSpec(spec, formValues);
			setResultData(result.data);
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error));
			await showToast({
				style: Toast.Style.Failure,
				title: "Command execution failed",
				message: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsLoading(false);
		}
	}, [spec, formValues]);

	useEffect(() => {
		executeCommand();
	}, [executeCommand]);

	if (error) {
		return (
			<Detail
				markdown={`# Error\n\n${error}`}
				actions={
					<ActionPanel>
						<Action title="Retry" onAction={executeCommand} />
					</ActionPanel>
				}
			/>
		);
	}

	if (isLoading) {
		return <Detail isLoading={true} markdown="Executing command..." />;
	}

	// Render based on UI mode
	if (spec.ui.mode === "list") {
		return <ResultsList spec={spec} data={resultData} />;
	} else if (spec.ui.mode === "detail") {
		return <ResultsDetail spec={spec} data={resultData} />;
	}

	return <Detail markdown="Command executed successfully!" />;
}

// Component to display list results
function ResultsList({
	spec,
	data,
}: {
	spec: CommandSpec;
	data: Record<string, unknown> | null;
}) {
	if (!data || !spec.ui.dataSource) {
		return (
			<List>
				<List.EmptyView title="No data" />
			</List>
		);
	}

	const items = data[spec.ui.dataSource];
	if (!Array.isArray(items)) {
		return (
			<List>
				<List.EmptyView
					title="Invalid data format"
					description="Data source is not an array"
				/>
			</List>
		);
	}

	return (
		<List>
			{items.map((item: unknown, index: number) => {
				const itemContext = { ...data, item };

				// Interpolate templates for item properties
				const title = spec.ui.itemProps?.title
					? interpolateTemplate(spec.ui.itemProps.title, itemContext)
					: `Item ${index + 1}`;
				const subtitle = spec.ui.itemProps?.subtitle
					? interpolateTemplate(spec.ui.itemProps.subtitle, itemContext)
					: undefined;

				return (
					<List.Item
						key={index}
						title={title}
						subtitle={subtitle}
						actions={
							spec.actions ? (
								<ActionPanel>
									{spec.actions.map((action, actionIndex) => (
										<ActionForItem
											key={actionIndex}
											action={action}
											item={item}
											context={itemContext}
										/>
									))}
								</ActionPanel>
							) : undefined
						}
					/>
				);
			})}
		</List>
	);
}

// Component to display detail results
function ResultsDetail({
	spec,
	data,
}: {
	spec: CommandSpec;
	data: Record<string, unknown> | null;
}) {
	if (!data || !spec.ui.content) {
		return <Detail markdown="No content to display" />;
	}

	const content = interpolateTemplate(spec.ui.content, data);

	return <Detail markdown={content} />;
}

// Component to render an action for a list item
function ActionForItem({
	action,
	context,
}: {
	action: {
		title: string;
		icon?: string;
		operation: { type: string; config: Record<string, unknown> };
	};
	item: unknown;
	context: Record<string, unknown>;
}) {
	async function handleAction() {
		try {
			// For now, we support simple actions like open and clipboard
			const { type, config } = action.operation;

			if (type === "open") {
				const url = interpolateTemplate(config.target as string, context);
				await open(url);
				await showToast({ style: Toast.Style.Success, title: "Opened" });
			} else if (type === "clipboard") {
				const text = interpolateTemplate(config.text as string, context);
				await Clipboard.copy(text);
				await showToast({
					style: Toast.Style.Success,
					title: "Copied to clipboard",
				});
			} else {
				await showToast({
					style: Toast.Style.Failure,
					title: "Unsupported action",
					message: `Action type "${type}" is not supported.`,
				});
			}
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "Action failed",
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return (
		<Action
			title={action.title}
			icon={action.icon || Icon.Dot}
			onAction={handleAction}
		/>
	);
}

// Component to view command details
function ViewCommandDetails({ spec }: { spec: CommandSpec }) {
	const markdown = `
# ${spec.title}

${spec.description}

## Details
- **Mode**: ${spec.mode}
- **Operations**: ${spec.steps.length}
- **Created**: ${new Date(spec.metadata.created).toLocaleString()}
- **Modified**: ${new Date(spec.metadata.modified).toLocaleString()}
- **Tags**: ${spec.metadata.tags.join(", ")}

## Operations
${spec.steps.map((step, i) => `${i + 1}. **${step.type}**${step.outputVar ? ` → \`${step.outputVar}\`` : ""}`).join("\n")}

## JSON Specification
\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\`
`;

	return <Detail markdown={markdown} />;
}
