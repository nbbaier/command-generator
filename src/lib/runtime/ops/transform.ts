// Transform operation handler using Handlebars

import Handlebars from "handlebars";
import { TransformConfig } from "../../../types/command-spec";

// Create a dedicated Handlebars instance and register custom helpers
const hbs = Handlebars.create();
hbs.registerHelper("eq", (a, b) => a === b);
hbs.registerHelper("gt", (a, b) => a > b);
hbs.registerHelper("lt", (a, b) => a < b);
hbs.registerHelper("and", (a, b) => a && b);
hbs.registerHelper("or", (a, b) => a || b);
hbs.registerHelper("not", (a) => !a);

export async function executeTransform(config: TransformConfig): Promise<string> {
  const template = hbs.compile(config.template);
  return template(config.data);
}
