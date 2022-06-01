import axios, { AxiosRequestConfig } from "axios";
import { configureRequest } from "./configureRequest";
import { AxiosFetch, Endpoint, RequestMethod } from "./types";

/** @internal */
const Fetchers: Record<RequestMethod, AxiosFetch> = {
  delete: axios.delete,
  get: axios.get,
  patch: axios.patch,
  post: axios.post,
  put: axios.put,
};

/**
 * @internal
 * A function that configures a request to a single endpoint. When called, it makes a
 * request to the specified endpoint and returns a promise.
 * which can implement retry or exit logic as needed.
 *
 * @param route Single endpoint request configuration
 * @param route.url Function that returns request URL with any interpolation (e.g `id` in `/user/:id`)
 * @param route.contentType Request `content-type` header. Defaults to `application/json;charset=UTF-8;`
 * @param route.acceptHeaders Request `accept` header. Defaults to `* /*`
 * @param route.authenticate When true, `APIConfig` will attempt to attach a `Authorization` header, and
 * look in the supplied (at runtime) params for a `token`. An error will be thrown if one is not found.
 * @param route.headers Optional request header overrides. Will be used to generate final request `headers`.
 * @param route.method HTTP verb (`get`, `post`, `put`, ...) Use the `METHODS` export to ensure `APIConfig`
 * recognizes the method.
 * @param route.mode CORS mode. Defaults to `cors`
 * @param route.redirect Redirect policy (one of `manual` or `follow`)
 * error handler. Receives this from `APIConfig` instance.
 *
 * @returns Function that returns a promise.
 */
export default function configureRoute(route: Endpoint) {
  // Configure request

  /**
   * Makes an http/s request `with` the supplied `params`. Enables the api
   * `configInstance.route(routeParams).with(requestParams)`
   * @param params The request body contents. Anything that would be
   * passed to a `fetch` call (except the `url` for the request) goes here.
   * @param params.token An optional bearer token for authenticating
   * with a remote server. Required if the `ConfiguredRoute` instance contains a
   * `authenticate: true` key/value.
   * @param params.body (optional) request `body` [required for `post`
   * requests]
   */
  return async function configuredRequest(params = {}) {
    // Get an object ready to make a request
    const { config, url } = configureRequest(route, params);
    const { method } = config;
    const successResponse = { message: "success" };
    const axiosFetch = Fetchers[method];
    const axiosReqConfig: AxiosRequestConfig = {
      headers: config.headers,
      method: config.method,
    };

    // Return fetch Promise
    return axiosFetch(url, axiosReqConfig, config)
      .then((res) => res.data || successResponse)
      .catch((e: any) => Promise.reject(e));
  };
}

/**
 * @internal
 * Configure request headers. If `route.authenticate` is true, optionally inject
 * an `Authorization: Bearer ...` header using an expected `token` key in `params`
 * @param params request params
 * @param url request url
 * @returns header
 */
export function configureReqHeaders(route: Endpoint, params: any, url: string) {
  // overrides
  const ov = {
    ...route.headers,
    ...route.acceptHeaders,
    ...(params || {}).headers,
  };
  const contentType =
    route.contentType || ov.contentType || "application/json;charset=utf-8";
  const headers: any = { "Content-Type": contentType };

  // Inject token
  if (route.authenticate) {
    if (params.token) {
      headers.Authorization = `Bearer ${params.token}`;
    } else throw new Error(`Params missing "token" key for request "${url}"`);
  }

  return headers;
}
