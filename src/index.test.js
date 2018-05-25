import NetworkLayer from '.';

test("Throw an error when initialized without routes", () => {
    try {
        const Config = new NetworkLayer.APIConfig();
    } catch (e) {
        expect(e).toBeTruthy()
    }
});

const ROUTES = {
    getSong: {
     url: p => ``
    }
};
const ValidConfig = new NetworkLayer.APIConfig(ROUTES);

test("Initialize properly with routes", () => {
   expect(ValidConfig.routes).toBeTruthy();
})

test("Attach routes as object methods", () => {
    expect(ValidConfig.getSong).toBeTruthy();
})