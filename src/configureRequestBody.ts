import { generateRequestBody } from "./generateURLEncodedBody";

/**
 * @internal
 * Configure request `body`.
 * @param params request params
 * @param headers request headers
 * @returns header
 */
export function configureRequestBody(
  params: any,
  headers: Record<string, any>
) {
  if (!headers) throw new Error("Invalid request headers");

  switch (headers["Content-Type"]) {
    case "application/x-www-form-urlencoded":
      return generateRequestBody(params.body || params);

    default:
      return JSON.stringify(params.body || params);
  }
}
