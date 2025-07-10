
# Migration Plan: src/currencyservice

This document outlines the plan to migrate the `currencyservice` from JavaScript and gRPC to TypeScript and HTTP.

## 1. Setup

*   Create a new `src/currency-service` directory.
*   Initialize a new Node.js project with `npm init -y`.
*   Install TypeScript and other dependencies.
*   Configure TypeScript with a `tsconfig.json` file.

## 2. API Definition

*   Convert the existing `demo.proto` file to an OpenAPI 3.0 specification named `openapi.yaml`.

## 3. Testing

*   Write API server tests using a testing framework like Jest and Supertest.
*   The tests will cover all the handlers from the original `server.js` file.

## 4. Implementation

*   Implement the HTTP server using Express.js.
*   Create handlers for the API endpoints defined in `openapi.yaml`.
*   The handlers will contain the business logic from the original `server.js` file.
*   The server will use the supported currencies from the original code.

## 5. Containerization

*   Create a new `Dockerfile` to build and run the TypeScript application.
*   The Dockerfile will use Node.js 22.

## 6. Deployment

*   Update the Kubernetes manifest `kubernetes-manifests/currencyservice.yaml` to use the new Docker image and expose the HTTP port.

## 7. Cleanup

*   Remove the old `src/currencyservice` directory.
*   Update any related documentation.
