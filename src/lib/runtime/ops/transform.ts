// Transform operation handler using Handlebars

import Handlebars from "handlebars";
import { TransformConfig } from "../../../types/command-spec";

// Register custom Handlebars helpers
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);
Handlebars.registerHelper("lt", (a, b) => a < b);
Handlebars.registerHelper("and", (a, b) => a && b);
Handlebars.registerHelper("or", (a, b) => a || b);
Handlebars.registerHelper("not", (a) => !a);

export async function executeTransform(config: TransformConfig): Promise<string> {
  const template = Handlebars.compile(config.template);
  return template(config.data);
}
