# Application Network Request Layer

## What is it?
An abstraction layer for handling network requests/responses. 

## How do you use it?
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

// Use it with an endpoint
config
    .request("getUsers")
    .with({ userId: mySource.userId })
    .then( ... ) // returns a Promise object
```
# API/Terminology
## `RouteDefinition` interface 
A `RouteDefinition` defines a single resource endpoint. When you instantiate a `NetworkLayer`, you will supply it an object whose keys are strings, and whose values are `RouteDefinitions`. All keys are shown below:
```javascript
interface RouteDefinition {
    acceptHeaders: string | undefined;
    contentType: string | undefined;
    url: Function;
    authenticate: boolean | undefined;
    method: string | undefined
}
```
Parameters are largely self-explanatory
* `acceptHeaders`: maps to `headers["Accept"]`; defaults to `application/json`
* `contentType`: maps to `headers["Content-Type"]`; defaults to `application/json;charset=utf-8`
* `url`: *required* function that takes params and returns a string. See example in `How Do You Use It` section above
* `authenticate`: If used, this tells the `ConfiguredRoute` to check your params in `request( ...).with(params)` for a 'token' key to map to `headers["Authorization"]` (as "Bearer: {{ params.token }}").
* `method`: maps to `headers["method"]`; defaults to `GET`
## Library Classes:
### `NetworkLayer` class
This object is instantiated with your routes. When you call `config.request( ... )`, this class uses the supplied key to find the route, with which it instantiates a `ConfiguredRoute` object to handle the request.
### `ConfiguredRoute` class
A `ConfiguredRoute` represents a single endpoint. It has one method, `with`, which uses your parameters to build a request object (e.g. construct the request URL, map content to headers). `ConfiguredRoute` returns a promise, which will default to `{ success: true }` if a remote server only sent back an "OK" response without a body.
# FAQs
## Why would you use this Library?
This is ideal when you need to centralize the management of your
application's routes. This system means that if server endpoints change, you only
need to modify where your endpoints are defined, instead of in every view that may have 
been calling the server directly.

## Why _shouldn't_ you use this Library?
~~Because you know better~~ Probably because you don't need to solve/have never encountered the issue it purports to solve. 