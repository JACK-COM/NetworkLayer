import { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from "axios";

export type RequestMethod = "post" | "get" | "delete" | "patch" | "put";
export type RequestMode =
  | "same-origin"
  | "no-cors"
  | "cors"
  | "navigate"
  | "websocket";
export type RequestRedirect = "follow" | "error" | "manual";

export type RESTReqConfig = {
  method:  RequestMethod;
  credentials: any;
  mode?: RequestMode;
  body?: any;
  redirect?: RequestRedirect;
  headers?: AxiosRequestHeaders;
};

export type Endpoint = {
  acceptHeaders?: any;
  authenticate?: boolean;
  contentType?: string;
  group?: string;
  headers?: Record<string, any>;
  method?: string | RequestMethod;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  url(params?: string | number | Record<string, any>): string;
};

export type Endpoints<T = Record<string, Endpoint>> = {
  [k in keyof T]: Endpoint;
};

export type ErrorHandler<T = any> = {
  (error: any, requestDetails?: RequestDetails): Promise<T | null> | void;
};

/** All available routes in their raw glory */
export type Requests<T extends any> = { [x in keyof T]: RESTRequest };
export type ConfiguredAPI<T extends any> = { routes: T } & Requests<T> & {
    [x: string]: any;
  };

export type AxiosFetchNoBody = <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
) => Promise<R>;
export type AxiosFetchWithBody = <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
) => Promise<R>;

export type AxiosFetch = AxiosFetchNoBody | AxiosFetchWithBody;

export type RequestDetails = { url: string; config: RESTReqConfig };

export type RESTRequest = { (...params: any[]): Promise<any> };
