/* interface RouteDefinition {
    acceptHeaders: string | undefined;
	contentType: string | undefined;
	url: Function;
    authenticate: boolean | undefined;
    method: string | undefined
} */
const METHODS = {
    POST: 'POST',
    GET: 'GET',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    PUT: 'PUT',
}

export default {
    APIConfig,
    METHODS
}

/**
 * - Creates and configures a Fetch request using an APIRoute object
 * - Triggers the request and returns the JSON from the server
 */
function APIConfig(routes /* : { [x: string]: RouteDefinition } */ ) {

    if (!routes) throw new Error("Missing routes");
    this.routes = routes;

    this.request = (key /* : string */ ) /* : ConfiguredRoute */ => {
        const route = this.routes[key];
        if (!route) throw new Error(`Route ${key} is not defined: check Routes initialization`)
        return new ConfiguredRoute(route);
    }

    return this;
}

APIConfig.prototype.METHODS = METHODS;

function ConfiguredRoute (route/* : RouteDefinition */) {
    this.route = route;

    // with = (params/* : {[x: string]: string} */) => {
    this.with = params => {
        // Get an object ready to make a request
        const method = this.route.method || METHODS.GET;
        const staticSuccessResponse = { resolved: true };
        let url = this.route.url(params);

        let headers = {
            'Accept': this.route.acceptHeaders || 'application/json',
            'Content-Type': this.route.contentType || 'application/json;charset=utf-8',
        };

        // Inject token
        if (this.route.authenticate) {
            if (!params.token) throw new Error(`Did not pass token to authenticate at url ${url}`);
            headers.Authorization = `Bearer: ${params.token}`;
        }

        // Configure request
        let requestConfig = {
            method,
            headers,
            // Needed to prevent Safari from being a real dick about server redirect responses (303, 30x response code)
            redirect: "manual"
        };

        // Configure request body
        if (method !== METHODS.GET) {
            let body = (params && params.body) || params;
            requestConfig.body = JSON.stringify(body)
        }

        let fetchRequest = new Request(url, requestConfig)
        let responseCode = -1;

        // Return fetch Promise
        return fetch(fetchRequest)
            .then(data => {
                // Fetch won't reject a response unless there's a network failure, so handle that here
                responseCode = data.status;
                // Safari apparently handles API "redirect" (303, 30x) responses very, very poorly;
                // We intercept the response and send something that doesn't cause the app to sink into depression
                const responseIsAPIredirect = (data.type === "opaqueredirect");
                if (responseIsAPIredirect) return staticSuccessResponse;
                // "DELETE" request doesn't return a body, so return a boolean
                const responseForDeleteRequest = (method === METHODS.DELETE);
                if (responseForDeleteRequest && responseCode < 400) return staticSuccessResponse;
                // At this point, the response *better* have a body. Or else.
                return data.json();
            })
            // Check for API failures and reject response if response status error
            .then(response => response.hasOwnProperty("error") ?
                Promise.reject(response) :
                Promise.resolve(response || staticSuccessResponse))
            .catch(data => (responseCode > -1 && responseCode < 400) ? // Resolve response errors
                Promise.resolve(staticSuccessResponse) :
                Promise.reject(data)
            );
    }

    return this;
}