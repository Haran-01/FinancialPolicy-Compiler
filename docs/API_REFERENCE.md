# API Reference — FinPolicy Compiler

All endpoints are prefixed with `/api`. Authentication is via Bearer JWT in the `Authorization` header unless noted.

---

## Authentication

| Method | Path                     | Auth Required | Roles     | Description                          |
|--------|--------------------------|---------------|-----------|--------------------------------------|
| POST   | `/auth/login`            | No            | —         | Login with email + password          |
| POST   | `/auth/refresh`          | No (refresh)  | —         | Exchange refresh token for new pair  |
| POST   | `/auth/logout`           | Yes           | Any       | Invalidate current refresh token     |
| GET    | `/auth/me`               | Yes           | Any       | Get current authenticated user       |

---

## Users

| Method | Path                     | Auth Required | Roles          | Description                  |
|--------|--------------------------|---------------|----------------|------------------------------|
| GET    | `/users`                 | Yes           | ADMIN          | List all users               |
| POST   | `/users`                 | Yes           | ADMIN          | Create a new user            |
| GET    | `/users/:id`             | Yes           | ADMIN          | Get user by ID               |
| PATCH  | `/users/:id`             | Yes           | ADMIN          | Update user fields           |
| DELETE | `/users/:id`             | Yes           | ADMIN          | Deactivate user              |

---

## Policies

| Method | Path                              | Auth Required | Roles                          | Description                        |
|--------|-----------------------------------|---------------|--------------------------------|------------------------------------|
| GET    | `/policies`                       | Yes           | Any                            | List policies (paginated)          |
| POST   | `/policies`                       | Yes           | ADMIN, POLICY_MANAGER          | Create a new policy                |
| GET    | `/policies/:id`                   | Yes           | Any                            | Get policy by ID                   |
| PATCH  | `/policies/:id`                   | Yes           | ADMIN, POLICY_MANAGER          | Update policy metadata             |
| DELETE | `/policies/:id`                   | Yes           | ADMIN                          | Archive / delete policy            |
| POST   | `/policies/:id/publish`           | Yes           | ADMIN, POLICY_MANAGER          | Publish the current version        |
| GET    | `/policies/:id/versions`          | Yes           | Any                            | List all versions of a policy      |
| POST   | `/policies/:id/versions`          | Yes           | ADMIN, POLICY_MANAGER          | Save a new version                 |
| GET    | `/policies/:id/versions/:vid`     | Yes           | Any                            | Get a specific version             |

---

## Compiler

| Method | Path                        | Auth Required | Roles                          | Description                        |
|--------|-----------------------------|---------------|--------------------------------|------------------------------------|
| POST   | `/compiler/compile`         | Yes           | ADMIN, POLICY_MANAGER          | Submit a compile job               |
| GET    | `/compiler/jobs`            | Yes           | Any                            | List compilation jobs (paginated)  |
| GET    | `/compiler/jobs/:id`        | Yes           | Any                            | Get a compilation job + result     |
| GET    | `/compiler/artifacts/:id`   | Yes           | Any                            | Get a compiled artifact            |

### `POST /compiler/compile` — Request Body

```json
{
  "source": "policy LoanApproval ...",
  "policyId": "clxyz123",
  "versionId": "clver456",
  "options": {
    "optimizationLevel": 1,
    "emitAst": false,
    "emitIr": true,
    "emitTac": true,
    "emitQuadruples": true,
    "emitTriples": false
  }
}
```

---

## Executor

| Method | Path                      | Auth Required | Roles     | Description                           |
|--------|---------------------------|---------------|-----------|---------------------------------------|
| POST   | `/executor/execute`       | Yes           | Any       | Execute a compiled artifact           |
| GET    | `/executor/jobs`          | Yes           | Any       | List execution jobs (paginated)       |
| GET    | `/executor/jobs/:id`      | Yes           | Any       | Get an execution job + result         |

### `POST /executor/execute` — Request Body

```json
{
  "artifactId": "clart789",
  "inputData": {
    "customerId": "C001",
    "loanAmount": 50000,
    "creditScore": 720
  },
  "timeoutMs": 5000,
  "recordTrace": false
}
```

---

## Audit Logs

| Method | Path               | Auth Required | Roles          | Description                  |
|--------|--------------------|---------------|----------------|------------------------------|
| GET    | `/audit`           | Yes           | ADMIN, AUDITOR | List audit logs (paginated)  |
| GET    | `/audit/:id`       | Yes           | ADMIN, AUDITOR | Get a specific audit log     |

---

## API Keys

| Method | Path               | Auth Required | Roles | Description              |
|--------|--------------------|---------------|-------|--------------------------|
| GET    | `/api-keys`        | Yes           | Any   | List your API keys       |
| POST   | `/api-keys`        | Yes           | Any   | Generate a new API key   |
| DELETE | `/api-keys/:id`    | Yes           | Any   | Revoke an API key        |

---

## Standard Response Envelope

All endpoints return:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "requestId": "req_abc123",
    "timestamp": "2026-10-01T18:00:00.000Z"
  }
}
```

On error:

```json
{
  "success": false,
  "error": {
    "code": "POLICY_NOT_FOUND",
    "message": "No policy with ID 'clxyz123' was found.",
    "details": null
  }
}
```

---

## HTTP Status Codes

| Code | Meaning                            |
|------|------------------------------------|
| 200  | OK                                 |
| 201  | Created                            |
| 400  | Bad Request (validation error)     |
| 401  | Unauthorized (missing/invalid JWT) |
| 403  | Forbidden (insufficient role)      |
| 404  | Not Found                          |
| 409  | Conflict (duplicate resource)      |
| 422  | Unprocessable Entity               |
| 429  | Too Many Requests                  |
| 500  | Internal Server Error              |
