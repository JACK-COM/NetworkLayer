import configureRoute from "./api.route";
import { configureRequest } from "./configureRequest";
import { MISSING_URL_PARAMS, TEST_API_URL } from "./constants";
import {
  ConfiguredAPI,
  Endpoint,
  ErrorHandler,
  RequestMethod,
  Requests,
} from "./types";

/** @internal */
const noOp = () => {};

/**
 * - Creates and configures a `Fetch` request using an APIRoute object
 * - Triggers the request and returns the JSON from the server
 * @param {T extends Endpoints} routes A key-value store of server endpoints. Each key in
 * `routes` will become a method on the new `APIConfig` instance. The value of each
 * key will be a `Endpoint`
 * @param {(e: any) => any} globalErrorHandler An error handler to run when any network request
 * fails. The handler will receive the (`APIConfig` instance-) rejected promise as its
 * only argument. It should also return a promise (resolve/rejected per implementation needs).
 */
export default function APIConfig<T extends Record<string, Endpoint>>(
  routes: T,
  globalErrorHandler: ErrorHandler = noOp
) {
  if (!routes) throw new Error("Missing routes");
  if (Object.keys(routes).length === 0) {
    throw new Error("APIConfig needs at least one valid route definition");
  }

  // Append route keys to object so accessibe as APIConfig.route(params).then(...);
  const requests = Object.keys(routes).reduce((configd, routeName: keyof T) => {
    configd[routeName] = async (params: any) => {
      const route: Endpoint = { ...routes[routeName] };
      const configuredRoute = configureRoute(route);
      const config = configureRequest(route, params);

      // Stop if params were required by route definition
      if (config.url === MISSING_URL_PARAMS) {
        const err = "Endpoint URL requires params but none were given";
        return globalErrorHandler({ message: err }, config);
      }

      // Intercept testing attempts
      if (config.url.includes(TEST_API_URL)) {
        const err = { message: "Network Error" };
        return globalErrorHandler(err, config);
      }

      try {
        const res = await configuredRoute(params);
        return res;
      } catch (error: any) {
        // Check for API failures and reject response if response status error
        const res = error.error || error.message || error || "Request failed";
        const err = { message: res };
        return globalErrorHandler(err, config);
      }
    };

    return configd;
  }, {} as Requests<T>);

  const api: ConfiguredAPI<T> = { routes, ...requests };
  return api;
}

const get: RequestMethod = "get";
const post: RequestMethod = "post";
const put: RequestMethod = "put";
const dlete: RequestMethod = "delete";
const patch: RequestMethod = "patch";
export const METHODS = {
  GET: get,
  POST: post,
  PUT: put,
  DELETE: dlete,
  PATCH: patch,
};
