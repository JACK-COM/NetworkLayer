/** @internal Previously used `URLEncodedParams()` but that led to issues */
export function generateRequestBody<T extends Record<string, any>>(
  params: T
): T {
  const body = {} as T;
  const appendToBody = (key: keyof T) => (body[key] = params[key]);

  if (typeof params === "object" && !Array.isArray(params)) {
    Object.keys(params).forEach(appendToBody);
  }

  return body;
}
