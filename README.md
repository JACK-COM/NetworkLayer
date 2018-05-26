# Application Network Request Layer

## Table Of Contents
1. [What is it?](#what-is-it)
2. [How do you use it?](#how-do-you-use-it)
3. [API](#api-available-via-import)
4. [Terminology](#terminology)
5. [FAQs](#faqs)

## What is it?
An abstraction layer for handling network requests/responses. 

## How do you use it?
### Installation
    npm i --save @jackcom/app-network-layer

### Usage
```javascript
import NetworkLayer from '@jackcom/app-network-layer'; 

// Define your endpoints in an object (the most basic example of a route is below).
// Endpoints/Routes require certain keys: see `RouteDefinition` interface below
const METHODS = NetworkLayer.METHODS; // GET, POST, DELETE, PUT, PATCH
const endpoints = {
    getUsers: {
        url: params => `https://my.api.domain/${params.userId}`,
        method: METHODS.GET
    }
}

// Instantiate your layer
const APIConfig = NetworkLayer.APIConfig;
const config = new APIConfig(endpoints); 

// Use it with an endpoint:
config
    .getUsers({ userId: mySource.userId }) // returns a Promise object
    .then( ... )

// OR
config
    .request("getUsers")
    .with({ userId: mySource.userId }) // returns a Promise object
    .then( ... ) 
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