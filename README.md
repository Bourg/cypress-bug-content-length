# Cypress Intercept Header Bug Reproduction

This repo is a minimal example of a Cypress test that exhibits a bug in which a "Content-Length: 0" header is added when intercept is used to spy.

## Specs

NodeJS Version: 18.12.0 (.nvmrc)
