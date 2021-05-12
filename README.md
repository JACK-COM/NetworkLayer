# Application Network Request Layer 

> **IMPORTANT:** version `0.5.0` simplifies the library and may introduce some breaking changes.
> If you're looking for the old documentation [look here](README_v-041.md).

[![npm][npm]][npm-url]

## What is it?
**TLDR:** An abstraction layer for handling network requests/responses. 

A complex single-page application (SPA) might make a few requests for data: authenticating a user,
fetching lists, and so on. When used, this library provides a single exit point for all SPA network
requests, which enables easy debugging, logging, and error-handling of outgoing traffic. 

## Table Of Contents
1. [How do you use it?](#how-do-you-use-it)
2. [API](#api-available-via-import)
3. [Terminology](#terminology)
4. [FAQs](#faqs)

## How do you use it?
### Installation
    npm i --save @jackcom/app-network-layer

### Usage

> **Hint:** you can handle each of these sections in separate files, and merge them wherever you create your `APIConfig` instance. The following example is entirely mocked (i.e. not a real API that I know of), and is meant to convey the idea of using the `APIConfig` instance.

#### 1: Define Your endpoints. 

```javascript
const MY_BASE_URL = "https://api.example.com"

// Your 'endpoints' config object will be used by the APIConfig instance. 
// Name the keys intuitively, since they will be converted into method names on 
// the instance.
const endpointsConfig = {
  
  getUserById: {
    // URL is required on all objects. It must be a function (with any
    // logic and/or arguments) that returns a url string. 
    url: ({ id }) => `${MY_BASE_URL}/users/${id}`,
    method: APIConfig.METHODS.POST,
  },
  
  listUsers: {
    // (Optional) You can omit the "method" key for "GET" requests
    url: () => `${MY_BASE_URL}/users`
  },
  
  updateUser: { 
    // "APIConfig.METHODS" contains (get, post, put, patch, delete)
    url: ({ id }) => `${MY_BASE_URL}/users/${id}`,
    method: APIConfig.METHODS.PATCH,
  },
  
  uploadFile: {
    // You can statically override some request headers here, or on a per-request
    // basis by supplying the overrideable key in your request params
    contentType: "multipart/form-data",
    redirect: "follow",
    url: () => `${MY_BASE_URL}/files/upload`,
    method: APIConfig.METHODS.POST
  },
};
  
```

#### 2: Create an instance of `APIConfig`. 
This will return a singleton that consumes every outgoing request/response for your SPA.
```javascript
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
```javascript
/**
 * Implementor (i.e. YOU)-defined global promise error handler
 * @param {object} error Error returned from `fetch` or your target API
 * @param {number} responseCode Request response code. If -1, request didn't go through.
 * @param {Request} requestParams `Fetch` `Request` object. Can be used to retry the failed request.
 */
function onGlobalError(error, responseCode, requestParams) {
  console.log('Failed API Request:', error);
  // [ additional logic follows, e.g. any of the following:
    //   [return] myExternalLoggerService.log(error)

    //   [return] Promise.reject(myCustomErrorMessage) 

    //   [return] Promise.resolve(myCustomSuccessMessage) 

  // You can even retry the failed request!
    //   [return] fetch(requestParams)
}
```
  
##### 3b. Supply endpoints AND the error-handler to your API config instance.
This is functionally similar to (2) above, except you're adding a new argument to the constructor.
So we use the `onGlobalError` we defined above in (3a):

```javascript
const api = new APIConfig(endpoints, onGlobalError);

try {
    // Now if the following request fails,
    const user = await api.getUserById({ id: badIdDoesNotExist });
}  catch (e) {
    // console logs => // 'Failed API request', ... (( error data ))

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
```javascript
interface RouteDefinition {
    acceptHeaders: string | undefined;
    contentType: string | undefined;
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
The following methods can be specified (as members of `NetworkLayer.METHODS`) when defining a route:
```typescript
const METHODS = {
    POST: 'POST',
    GET: 'GET',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    PUT: 'PUT',
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