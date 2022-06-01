/**
 * @jest-environment jsdom
 */

import APIConfig from ".";
import { METHODS } from "./api.config";
import configureRoute from "./api.route";
import configureRequest from "./configureRequest";
import { MISSING_URL_PARAMS, TEST_API_URL } from "./constants";
import { ErrorHandler } from "./types";

const baseURL = TEST_API_URL;
const ALL_ENDPOINTS = {
  getAccounts: { url: () => `${baseURL}/accounts/all` },
  createAccount: {
    url: () => `${baseURL}/accounts/new`,
    method: METHODS.POST,
  },
  getUser: { url: (p: any) => `${baseURL}/users/${p.id}` },
  createUser: {
    url: () => `${baseURL}/users`,
    method: METHODS.POST,
  },
  getUngroupedData: { url: () => `${baseURL}/some-endpoint` },
  recentlyRegisteredOregonBusinesses: {
    // This url doesn't need params, so just returns a string
    url: () => `https://data.oregon.gov/resource/qajw-6p2c.json`,
    method: METHODS.GET,
  },
};

describe("Network Layer - APIConfig", () => {
  it("Throws an error when initialized with an improper ENDPOINTS config", () => {
    // @ts-expect-error
    expect(() => APIConfig()).toThrowError(/Missing routes/);
    expect(() => APIConfig(undefined)).toThrowError(/Missing routes/);
    expect(() => APIConfig(null)).toThrowError(/Missing routes/);
  });

  it("Expects keys in its ENDPOINTS config", () => {
    expect(() => APIConfig({})).toThrowError(
      /APIConfig needs at least one valid route definition/
    );
  });

  it("Initializes with an ENDPOINTS config", () => {
    let ENDPOINTS = { myEndpoint: { url: () => TEST_API_URL } };
    let apiConfig = APIConfig(ENDPOINTS);
    expect(apiConfig.routes).toBe(ENDPOINTS);
    expect(apiConfig.myEndpoint).toBeTruthy();
  });

  it("Uses a global error-handler if one is supplied", async () => {
    expect.assertions(3);
    // Mock API responses
    const mockResponse = { success: true };
    const mockReject = { message: "Network Error" };

    // Global error handler to capture any rejected promise. We'll spy here
    // to assert that we got the error from the endpoint, then override
    // the error with a success response
    const globalErrorHandler = jest.fn().mockImplementation(() => {
      return Promise.resolve(mockResponse);
    });

    // Instantiate 'APIConfig' with the error handler
    const endpoints = { getUser: ALL_ENDPOINTS.getUser };
    const apiConfig = APIConfig(endpoints, globalErrorHandler);
    const getUserParams = { id: 1 };
    const expectedConfig = configureRequest(endpoints.getUser, getUserParams);

    // Focus on routing the error into the error-handler
    const endpointSpy = jest.spyOn(apiConfig, "getUser");
    const response = await apiConfig.getUser(getUserParams);
    expect(response).toStrictEqual(mockResponse);
    expect(globalErrorHandler).toHaveBeenCalledWith(mockReject, expectedConfig);
    expect(endpointSpy).toHaveBeenCalled();
  });

  it("Returns a raw error when a global error-handler is not supplied", async () => {
    const mockReject = { message: "Invalid request" };
    const getUser = { url: (p: any) => `https://api.test/users/${p.id}` };
    const apiConfig = APIConfig({ getUser });
    // Intercept the endpoint!
    const endpointSpy = jest
      .spyOn(apiConfig, "getUser")
      .mockImplementation(() => Promise.reject(mockReject));

    try {
      return await apiConfig.getUser();
    } catch (response) {
      expect(endpointSpy).toHaveBeenCalled();
      expect(response).toStrictEqual(mockReject);
    }
  });

  it("Attaches each enpoint route as a method", () => {
    let ENDPOINTS = { myEndpoint: { url: () => `https://test.url` } };
    let apiConfig = APIConfig(ENDPOINTS);

    expect(apiConfig.myEndpoint).not.toBe(ENDPOINTS.myEndpoint);
    expect(apiConfig.routes.myEndpoint.url()).toBe(ENDPOINTS.myEndpoint.url());
    expect(typeof apiConfig.myEndpoint).toBe("function");
  });

  it("Handles url param interpolation", async () => {
    expect.assertions(3);
    // Construct an "endpoint" with internals that can be spied upon. The URL prop
    // is a function, which allows some opportunity to test its behavior.
    const getUser = {
      url: (p: { id: string }) => `https://api.test/users/${p.id}`,
    };
    const urlSpy = jest.spyOn(getUser, "url");
    const expectedURL = MISSING_URL_PARAMS;
    const assertions: ErrorHandler = (err, details) => {
      expect(urlSpy).toHaveBeenCalled();
      expect(details?.url).toStrictEqual(expectedURL);
      expect(details?.config.method).toBe("get");
    };

    // Simulate the endpoint url generation at runtime: then return something useful
    const api = APIConfig({ getUser }, assertions);
    await api.getUser();
  });
});

describe("Network Layer - Configured Route", () => {
  it("Returns a configured request as a function", () => {
    expect(typeof configureRoute({ url: () => "" })).toBe("function");
  });

  it("Initializes with an endpoint config object", async () => {
    const oregonBusinesses = configureRoute(
      ALL_ENDPOINTS.recentlyRegisteredOregonBusinesses
    );
    expect.assertions(3);
    const spy = jest.spyOn(
      ALL_ENDPOINTS.recentlyRegisteredOregonBusinesses,
      "url"
    );
    expect(typeof oregonBusinesses).toBe("function");
    const res = (await oregonBusinesses()).slice(0, 1);
    expect(spy).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });
});
