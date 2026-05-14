import { JSONPath } from "jsonpath-plus";
import { Parser } from "expr-eval";

const parser = new Parser({
  operators: {
    add: true,
    concatenate: true,
    conditional: true,
    divide: true,
    factorial: false,
    multiply: true,
    power: true,
    remainder: true,
    subtract: true,
    logical: true,
    comparison: true,
    in: true,
    assignment: false,
  },
});

export function applyJsonPath(input: unknown, expression: string): unknown {
  const result = JSONPath({ path: expression, json: input as object, wrap: false });
  return result;
}

export function applyExpression(input: unknown, expression: string): unknown {
  const expr = parser.parse(expression);
  const scope: Record<string, unknown> = {
    value: input,
    input,
  };
  if (input && typeof input === "object" && !Array.isArray(input)) {
    Object.assign(scope, input as Record<string, unknown>);
  }
  return expr.evaluate(scope as Record<string, never>);
}
