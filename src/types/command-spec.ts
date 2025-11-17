// CommandSpec type definitions based on the plan

export interface CommandSpec {
  id: string; // UUID v4
  title: string; // Display name in runner
  description: string; // What the command does
  mode: "list" | "form" | "detail" | "view";
  icon?: string; // Emoji or image path
  inputs?: FormInput[]; // For form mode
  steps: Operation[]; // Operations to execute sequentially
  ui: UIBinding; // How to render results
  actions?: ActionDef[]; // Actions available on items
  metadata: {
    created: string; // ISO timestamp
    modified: string;
    tags: string[];
    author?: string;
  };
}

export interface FormInput {
  id: string;
  type: "textfield" | "textarea" | "dropdown" | "checkbox" | "datepicker";
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | boolean | Date;
  options?: string[]; // For dropdown
}

export interface Operation {
  type:
    | "httpRequest"
    | "shell"
    | "transform"
    | "fileRead"
    | "fileWrite"
    | "clipboard"
    | "open"
    | "showToast"
    | "showHUD";
  config: Record<string, unknown>;
  outputVar?: string; // Store result in this variable name
}

export interface UIBinding {
  mode: "list" | "form" | "detail";
  dataSource: string; // Variable name from operation output
  itemProps?: {
    // For list mode
    title: string; // Template: "{{name}}"
    subtitle?: string; // Template: "{{description}}"
    accessories?: string[]; // Templates for accessories
  };
  content?: string; // For detail mode (markdown template)
}

export interface ActionDef {
  title: string;
  icon?: string;
  shortcut?: { modifiers: string[]; key: string };
  operation: Operation; // Operation to run when action triggered
}

// Specific operation config types

export interface HttpRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ShellConfig {
  command: string;
  shell?: string;
  timeout?: number;
}

export interface TransformConfig {
  template: string;
  data: unknown;
  engine?: "handlebars";
}

export interface FileReadConfig {
  path: string;
  encoding?: string;
}

export interface FileWriteConfig {
  path: string;
  content: string;
  encoding?: string;
}

export interface ClipboardConfig {
  action: "copy" | "read";
  text?: string;
}

export interface OpenConfig {
  target: string; // URL or app path
}

export interface ShowToastConfig {
  style: "success" | "failure" | "animated";
  title: string;
  message?: string;
}

export interface ShowHUDConfig {
  title: string;
}

// Execution result types

export interface ExecutionResult {
  data: Record<string, unknown>;
  uiBinding: UIBinding;
  actions?: ActionDef[];
}

export interface ExecutionContext {
  env: Record<string, string | undefined>;
  input: Record<string, unknown>;
  supportPath: string;
  assetsPath: string;
  [key: string]: unknown;
}
