# Application Network Request Layer 

> **Change notes:**\
> **version** `0.6.0` simplifies the library and may introduce some breaking changes.
> If you're looking for the old documentation [look here](README_v-041.md).
> 
> **version** `2.x.x` rewrites the underlying library and *definitely* introduces breaking changes. It also adds `axios` for more a stable api as well as predictable updates to the library. 

- [Application Network Request Layer](#application-network-request-layer)
  - [What is it?](#what-is-it)
  - [Why does it?](#why-does-it)
  - [How do you use it?](#how-do-you-use-it)
    - [Installation](#installation)
    - [Usage](#usage)
      - [1: Define Your endpoints.](#1-define-your-endpoints)
      - [2: Create an instance of `APIConfig`.](#2-create-an-instance-of-apiconfig)
    - [THAT'S IT!](#thats-it)
      - [3: (Optional) Global error handling](#3-optional-global-error-handling)
        - [3a. Define your global error handler](#3a-define-your-global-error-handler)
        - [3b. Supply endpoints AND the error-handler to your API config instance.](#3b-supply-endpoints-and-the-error-handler-to-your-api-config-instance)
  - [API (available via import):](#api-available-via-import)
  - [Terminology](#terminology)
    - [`RouteDefinition` interface](#routedefinition-interface)
    - [`APIConfig` class](#apiconfig-class)
    - [`Request Methods`](#request-methods)
  - [FAQs](#faqs)
    - [Why would you use this Library?](#why-would-you-use-this-library)
    - [Why _shouldn't_ you use this Library?](#why-shouldnt-you-use-this-library)

## What is it?
**TLDR:** 
* Turns a JS object-literal into an object for making REST requests
  * Allows management of your endpoint URLs in a single place

---
## Why does it?
This was created in an era before tools like `graphQL`, which -- by and large -- reduce or negate the need for large numbers of REST api endpoints to be stored in single-page applications. 

Maybe. 

That said; if you still find yourself doing stuff like:

```typescript
axios.get('https://some-url', someParams)

// or

fetch('https://some-url', someParams)
```
and `https://some-url` appears in a lot of different files, this may be for you. 

---

## How do you use it?
### Installation
    npm i --save @jackcom/app-network-layer

### Usage

> **Hint:** you can handle each of these sections in separate files, and merge them wherever you create your `APIConfig` instance. The following example is entirely mocked (i.e. not a real API that I know of), and is meant to convey the idea of using the `APIConfig` instance.

#### 1: Define Your endpoints. 

```typescript
// Optional if you want to avoid case-sensitivity errors
import { METHODS } from "@jackcom/network-layer";

// Your 'endpoints' config object will be used by the APIConfig instance. 
// Name the keys intuitively, since they will be converted into method names on 
// the instance.
const endpointsConfig = {
  
  getUserById: {
    // URL is required on all objects. It must be a function (with any
    // logic and/or arguments) that returns a url string. 
    url: ({ id }) => `https://api.example.com/users/${id}`,
    method: METHODS.POST, // or "post"
  },
  
  listUsers: {
    // (Optional) You can omit the "method" key for "GET" requests
    url: () => `https://api.example.com/users`
  },
  
  updateUser: { 
    // "METHODS" contains (get, post, put, patch, delete)
    url: ({ id }) => `https://api.example.com/users/${id}`,
    method: METHODS.PATCH, // or "patch"
  },
  
  uploadFile: {
    // You can statically override some request headers here, or on a per-request
    // basis by supplying the overrideable key in your request params
    contentType: "multipart/form-data",
    redirect: "follow",
    url: () => `https://api.example.com/files/upload`,
    method: METHODS.POST
  },
};
  
```

#### 2: Create an instance of `APIConfig`. 
This will return a singleton that consumes every outgoing request/response for your SPA.
```typescript
import APIconfig from "./api-config";

const api = new APIConfig(endpoints);

// Now 'api' has methods that return Promises. You can use them predictably:
api
  .listUsers()
  .then(users => ... )
  .catch(error =>  ... )

api
  .getUserById({ id: ... })
  .then(user => ... )
  .catch(error =>  ... )

api
  .updateUser({ id: ... })
  .then(response => ... )
  .catch(error =>  ... )

// OR 

const response = await api.updateUser({ id: ... });

const [user, users] = await Promise.all([
    api.getUserById({ id: ... }),
    api.listUsers(),
]);
```  
  
### THAT'S IT! 
If you also want the ability to handle all api errors in one place, read on.
  
  
#### 3: (Optional) Global error handling 
You can supply an error-handler function to capture any failed api request. The `handler` must also return a Promise (e.g. rejected promise with custom error message; or a fallback success response).

##### 3a. Define your global error handler
```typescript
/**
 * Implementor (i.e. YOU)-defined global promise error handler
 * @param error Error wrapped in an object returned from the library
 * @param config Parameters used to make the failed request.
 * @param config.url Failed request endpoint
 */
function onGlobalError(
  error: { message: any }, 
  config: { url: string; config: RequestConfig }
) {
    // [ You can do any of the following in here
      
    // Call an external logging service with the error
    myExternalLoggerService.log(error)

    // and/or return a custom error so your program can continue
    return Promise.reject("NETWORK_RESPONSE_ERROR") 

    // or a custom success message so the caller never sees the error
    return Promise.resolve(myCustomSuccessMessage) 

    // You can even retry the failed request!
    return apiConfig.muhUsers()
}
```
  
##### 3b. Supply endpoints AND the error-handler to your API config instance.
This is functionally similar to (2) above, except you're adding a new argument to the constructor.
So we use the `onGlobalError` we defined above in (3a):

```typescript
const api = new APIConfig(endpoints, onGlobalError);

try {
    // Now if the following request fails,
    const user = await api.getUserById({ id: badIdDoesNotExist });
}  catch (e) {
    // Note: if 'onGlobalError' doesn't return a rejected promise, 
    // any code in this 'catch' block will never run.
}

```

## API (available via import):
Note that although this guide uses **NetworkLayer** for clarity, the default export is not named.
* `NetworkLayer`: default library export 
* `NetworkLayer.APIConfig`: the class to instantiate: [route handler](#apiconfig-class) and promise-returner
* `NetworkLayer.METHODS`: dictionary/key-value map of [request methods](#request-methods)

## Terminology
### `RouteDefinition` interface 
A `RouteDefinition` defines a single resource endpoint. All properties are shown below:
```jaEndpoint
intEndpointinition {
    acceptHeaders: string | undefined;
    contenEndpoint undefined;
    url: Function;
    authenticate: boolean | undefined;
    method: string | undefined
}
```
Explanation: 
* `acceptHeaders`: maps to `headers["Accept"]`; defaults to `application/json`
* `contentType`: maps to `headers["Content-Type"]`; defaults to `application/json;charset=utf-8`
* `url`: *required* function that takes params and returns a string. See example in `How Do You Use It` section above
* `authenticate`: If used, this tells the `ConfiguredRoute` to check your params in `request( ...).with(params)` for a 'token' key to map to `headers["Authorization"]` (as "Bearer: {{ params.token }}").
* `method`: maps to `headers["method"]`; defaults to `GET`

### `APIConfig` class
This is the primary class you will instantiate with your `routes` object. You only need one instance, though you can instantiate as many as you wish.

### `Request Methods`
The following methods can be specified (as members of the exported `METHODS`) when defining a route:
```typescript
const METHODS = {
    POST: 'post',
    GET: 'get',
    DELETE: 'delete',
    PATCH: 'patch',
    PUT: 'put',
};
```

## FAQs
### Why would you use this Library?
This is ideal when you need to centralize the management of your
application's routes. This system means that if server endpoints change, you only
need to modify where your endpoints are defined, instead of in every view that may have 
been calling the server directly.

### Why _shouldn't_ you use this Library?
~~Because you know better~~ Probably because you don't need to solve/have never encountered the issue it purports to solve. 