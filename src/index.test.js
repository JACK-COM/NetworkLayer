import APIConfig, { METHODS } from ".";
import configureRoute from "./configured-route";

describe("Network Layer - APIConfig", () => {
  it("Throws an error when initialized with an improper ENDPOINTS config", () => {
    expect(() => new APIConfig()).toThrowError(/Missing routes/);
    expect(() => new APIConfig(undefined)).toThrowError(/Missing routes/);
    expect(() => new APIConfig(null)).toThrowError(/Missing routes/);
  });

  it("Expects keys in its ENDPOINTS config", () => {
    expect(() => new APIConfig({})).toThrowError(
      /APIConfig needs at least one valid route definition/
    );
  });

  it("Initializes properly with an ENDPOINTS config", () => {
    let ENDPOINTS = { myEndpoint: { url: (p) => `https://test.url` } };
    let apiConfig = new APIConfig(ENDPOINTS);
    expect(apiConfig.routes).toBe(ENDPOINTS);
    expect(apiConfig.myEndpoint).toBeTruthy();
  });

  it("Uses a global error-handler if one is supplied", () => {
    // Mock API responses
    const mockResponse = { success: true };
    const mockReject = { message: "Invalid request" };

    // only one endpoint needed for this test
    const getUser = { url: (p) => `https://api.test/users/${p.id}` };

    // Global error handler to capture any rejected promise. We'll spy here
    // to assert that we got the error from the endpoint, then override
    // the error with a success response
    const globalErrorHandler = jest.fn((err, responseCode) => {
      expect(err).toBe(mockReject);
      return Promise.resolve(mockResponse);
    });

    // Instantiate 'APIConfig' with the error handler
    const apiConfig = new APIConfig({ getUser }, globalErrorHandler);

    // Intercept the endpoint! Jest doesn't recognize the `Request` object
    // from the Fetch API -- and we don't need to test that anyway. So just
    // focus on routing the error into the error-handler
    const endpointSpy = jest
      .spyOn(apiConfig, "getUser")
      .mockImplementation(() => globalErrorHandler(mockReject));

    return apiConfig.getUser().catch((response) => {
      expect(endpointSpy).toHaveBeenCalled();
      expect(globalErrorHandler).toHaveBeenCalledWith(mockReject);
      expect(response).toStrictEqual(mockResponse);
    });
  });

  it("Returns a raw error when a global error-handler is not supplied", () => {
    const mockReject = { message: "Invalid request" };
    const getUser = { url: (p) => `https://api.test/users/${p.id}` };
    const apiConfig = new APIConfig({ getUser });
    // Intercept the endpoint! (...again)
    const endpointSpy = jest
      .spyOn(apiConfig, "getUser")
      .mockImplementation(() => Promise.reject(mockReject));

    return apiConfig.getUser().catch((response) => {
      expect(endpointSpy).toHaveBeenCalled();
      expect(response).toStrictEqual(mockReject);
    });
  });

  it("Attaches each enpoint route as a method", () => {
    let ENDPOINTS = { myEndpoint: { url: (p) => `https://test.url` } };
    let apiConfig = new APIConfig(ENDPOINTS);

    expect(apiConfig.myEndpoint).not.toBe(ENDPOINTS.myEndpoint);
    expect(apiConfig.routes.myEndpoint.url()).toBe(ENDPOINTS.myEndpoint.url());
    expect(typeof apiConfig.myEndpoint).toBe("function");
  });

  it("Groups routes if a group identifier is present", () => {
    const baseURL = `https://api.url`;
    const ENDPOINTS = {
      getAccounts: {
        group: "billing",
        url: (p) => `${baseURL}/accounts/all`,
      },
      createAccount: {
        group: "billing",
        url: (p) => `${baseURL}/accounts/new`,
        method: METHODS.POST,
      },
      getUser: {
        group: "users",
        url: (p) => `${baseURL}/users/${p.id}`,
      },
      createUser: {
        group: "users",
        url: (p) => `${baseURL}/users`,
        method: METHODS.POST,
      },
      getUngroupedData: {
        url: () => `${baseURL}/some-endpoint`,
      },
    };
    const apiConfig = new APIConfig(ENDPOINTS);
    const badBitties = [
      apiConfig.getAccounts,
      apiConfig.createAccount,
      apiConfig.getUser,
      apiConfig.createUser,
    ];
    const groupedEndpoints = [
      apiConfig.billing.getAccounts,
      apiConfig.billing.createAccount,
      apiConfig.users.getUser,
      apiConfig.users.createUser,
    ];

    // Test grouped endpoints
    groupedEndpoints.forEach((endpoint) => {
      expect(endpoint).toBeTruthy();
      expect(typeof endpoint).toBe("function");
    });

    // Ensure endpoints only exist at the "grouped" level
    badBitties.forEach((endpoint) => {
      expect(endpoint).not.toBeTruthy();
      expect(typeof endpoint).not.toBe("function");
    });
  });

  it("Handles url param interpolation", () => {
    // Construct an "endpoint" with internals that can be spied upon. The URL prop
    // is a function, which allows some opportunity to test its behavior.
    const getUser = { url: (p) => `https://api.test/users/${p.id}` };
    const ENDPOINTS = { getUser };
    const mockResponse = { success: true };
    const apiConfig = new APIConfig(ENDPOINTS);

    // Simulate the endpoint url generation at runtime: then return something useful
    const urlSpy = jest.spyOn(ENDPOINTS.getUser, "url");
    const endpointSpy = jest
      .spyOn(apiConfig, "getUser")
      .mockImplementation((params) => {
        const url = apiConfig.routes.getUser.url(params);
        // Run some additional assertions here, with all this good real-estate...
        // especially since this data is not accessible outside this context
        expect(url).toStrictEqual("https://api.test/users/1");
        return Promise.resolve(mockResponse);
      });

    return apiConfig.getUser({ id: 1 }).then((res) => {
      expect(endpointSpy).toHaveBeenCalledWith({ id: 1 });
      expect(urlSpy).toHaveBeenCalledWith({ id: 1 });
      expect(res).toBe(mockResponse);
    });
  });
});

describe("Network Layer - Configured Route", () => {
  it("Returns a configured request as a function", () => {
    expect(typeof configureRoute({})).toBe("function");
  });

  it("Initializes with an endpoint config object", () => {
    const e = { myEndpoint: { url: (p) => `https://test.url` } };
    const request = configureRoute(e.myEndpoint);
    const fetchResponse = {
      body: "another response body",
      headers: { "X-Some-Response-Header": "Some header value" },
    };

    if (!window.fetch) {
      // Intercept fetch api for maximum profit
      window.Request = jest.fn(() => ({ url: "http://url.string" }));
      window.fetch = () => Promise.resolve(fetchResponse);
    }

    return request().then((res) => {
      expect(res).toStrictEqual(fetchResponse);
    });
  });
});
