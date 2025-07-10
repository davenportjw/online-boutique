# Gemini CLI Learnings for the online-boutique Repository

This document summarizes key learnings and conventions to remember for future interactions within this project.

## General Workflow

For complex tasks like service migrations, the preferred workflow is:
1.  **Analyze:** Thoroughly examine the existing code.
2.  **Plan:** Create a detailed, step-by-step plan and save it to a file (e.g., `plan.md`).
3.  **Milestone Approval:** Stop and ask for user approval before proceeding to the next major step in the plan.
4.  **Test-Driven Development (TDD):** Write tests *before* implementing the application code.
5.  **Update Infrastructure:** Ensure that configuration like Dockerfiles and Kubernetes manifests are updated to reflect the code changes.

## Dependency Management (`package.json`)

This is a critical area with specific conventions:

*   **Pin Versions:** Always pin exact dependency versions (e.g., `"express": "4.19.2"`) instead of using ranges (e.g., `"^4.19.2"`).
*   **Node.js Version:** The `engines` field in `package.json` dictates the Node.js version.
*   **`@types/node` Version:** The major version of `@types/node` **must** match the major version of Node.js specified in the `engines` field (e.g., if `node` is `"22.x"`, `@types/node` should be a `"22.x.x"` version).
*   **Type Definition Compatibility:** For other packages like Jest, ensure the `@types/*` package version is compatible with the main package version. The latest available patch version for the same minor version is usually the correct choice if an exact match doesn't exist.

## TypeScript Configuration (`tsconfig.json`)

*   If type conflicts arise between different library declaration files during the `tsc` build process, adding `"skipLibCheck": true` to the `compilerOptions` is an acceptable workaround in this project.

## Service Migration (gRPC -> HTTP)

*   When migrating a service from gRPC to HTTP, the following artifacts need to be created or updated:
    *   An `openapi.yaml` spec should be created to define the new HTTP API.
    *   The `Dockerfile` must be updated to build the new TypeScript application and run the new entry point.
    *   The Kubernetes manifests (`*.yaml`) must be updated to:
        *   Use the new container image name.
        *   Change the container port from the gRPC port to the new HTTP port (e.g., 8080).
        *   Update the `readinessProbe` and `livenessProbe` from `grpc` to `httpGet`, pointing to a valid health check or general endpoint.
        *   Update the `Service` definition to expose the new HTTP port.
