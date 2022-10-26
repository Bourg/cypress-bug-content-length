# Cypress Intercept Header Bug Reproduction

## Specs

- OS: MacOS Monterey 12.5.1
- NodeJS Version: 18.12.0 (specified in [.nvmrc](./.nvmrc), also occurs in 16.15.0 from prior testing)
- Cypress Version: 10.11.0 (also occurs in 10.5.0, 10.10.0 from prior testing)

## Description

This repo is a minimal example of a Cypress test that exhibits a bug in which a "Content-Length: 0" header is added when `cy.intercept` is used to spy.
To demonstrate this behavior, this repo contains the simplest possible app and associated Cypress tests that exhibit the behavior.

For the app, a [simple Express server](app.js) is used that only has two routes:

- `/` - A static HTML document for Cypress to load in the tests
- `/api` - An API route that echoes back the headers in JSON (just `req.headers`)

The HTML document contains a script that fetches `/api` and writes the API response directly into the page,
which is how this behavior is exposed for testing in this minimal example.

For the Cypress tests, there are three tests in [interceptBug.cy.js](cypress/e2e/interceptBug.cy.js) that each assert that the server did not receive a `Content-Length` header.
They do this by checking the contents of the page, which contains the headers echoed back by the `/api` route.
Two of the tests pass - no intercept and using intercept to stub - but the test that uses intercept to spy fails due since it finds a stray `Content-Length: 0` header.

One important note here is that, if you look in the browser dev tools, you will not see a `Content-Length` header in the `/api` call during any of the three tests.
It seems to get added by Cypress's server process when it's proxying the requests, but that's as much as I've been able to figure out on my own.

## Running

### Start the application server

```shell
npm install
npm run start
```

### Open the example test in Cypress

```shell
npm run cypress:open
```

Then, navigate to:

1. Select "E2E Testing" as the testing type
2. Select "Chrome" (or any browser, seems to be agnostic) as the browser
3. Select `interceptBug.cy.js` as the spec
4. Observe that one of the tests fails because it sees a `Content-Length` header echoed back from the server

## Real-world consequence

I first noticed this behavior when our backends started responding with 400 status codes if and only if I used `cy.intercept` to spy.
After a lot of digging looking for what was different about the calls with and without `cy.intercept`, I determined that the only difference was this `Content-Length: 0` header that was being added somehow.
Our backend runs in AWS ECS behind ELB, and it seems that the error is actually from the ELB level, as these were the response headers from those 400s (formatted as JSON just from how I captured them):

```json
{
    “server”: “awselb/2.0",
    “date”: “Tue, 25 Oct 2022 18:37:31 GMT”,
    “content-type”: “text/html”,
    “content-length”: “524",
    “connection”: “close”
}
```

Note the `Server: awselb/2.0` header.
I was not able to find other cases of this exact behavior,
but there are a few StackOverflow posts out there about ELB's strictness with HTTP requests.
It rejects requests with 400s for things like lowercase HTTP method names or [trailing spaces in URIs](https://serverfault.com/questions/674670/aws-elb-400-bad-request-with-space-at-the-end-of-a-uri).

So, practically speaking, I can't use `cy.intercept` to spy in our app because ELB will reject the request with the incorrect `Content-Length` header.
