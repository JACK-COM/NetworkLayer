import { configureRequestBody } from "./configureRequestBody";
import { MISSING_URL_PARAMS } from "./constants";
import { RESTReqConfig, Endpoint, RequestMethod } from "./types";
import { configureReqHeaders } from "./api.route";

/** Configure a request for `axios`. Useful for debugging. */

export default configureRequest_;

export const configureRequest = configureRequest_;

function configureRequest_(route: Endpoint, params: any) {
  let config: RESTReqConfig = {
    // Allow for setting cookies from origin
    credentials: "include",

    // Prevent automatic following of redirect responses (303, 30x response code)
    redirect: route.redirect ?? "manual",
    // CORS request policy
    mode: route.mode || "cors",
    method: (route.method || "get") as RequestMethod,
  };

  let url;

  try {
    url = route.url(params);
  } catch {
    url = MISSING_URL_PARAMS;
  }

  if (route.contentType !== "multipart/form-data") {
    config.headers = configureReqHeaders(route, params, url);
  }

  // Configure request body
  if (config.method !== "get") {
    config.body = configureRequestBody(params, config.headers!);
  }

  return { config, url };
}
