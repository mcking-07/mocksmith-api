# mocksmith-api

[![Bun](https://img.shields.io/badge/Bun-1.3+-violet)](https://bun.sh)
[![SQLite](https://img.shields.io/badge/SQLite-3-teal)](https://sqlite.org)
[![ci](https://github.com/mcking-07/mocksmith-api/actions/workflows/ci.yml/badge.svg)](https://github.com/mcking-07/mocksmith-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

a general-purpose api mocking service built with bun and sqlite. dynamically create, manage, and serve rest-api endpoints with custom javascript handlers.

## overview

mocksmith-api allows you to create, update and delete mock apis on-the-fly. define endpoints with custom javascript handlers that can access request data (query params, headers, path params, body) and return dynamic responses. features include path parameter support, request analytics, optional jwt authentication, and sqlite persistence.

## quick start

```bash
# install dependencies
bun install

# setup database
bun run db:create && bun run db:migrate

# start server
bun run dev
```

the api will be available at `http://localhost:6543`.

## architecture

| component         | responsibility                                                    |
| ----------------- | ----------------------------------------------------------------- |
| `Router`          | custom middleware composition engine with path-to-regexp matching |
| `Middleware`      | class-based, each implements `handle(context, next)`              |
| `ServiceRegistry` | typed service locator for dependency wiring                       |
| `SandboxService`  | subprocess-isolated javascript execution with timeout             |
| `EventPublisher`  | node eventemitter-based pub/sub for decoupled analytics           |
| `Repository`      | generic base with `create`, `read`, `update`, `delete`            |

## handler format

handlers are **javascript arrow function strings** that receive a context object and must return a response object:

```typescript
(context: { query, headers, params, body }) => ({
  status: number;     // http status code
  headers?: object;   // response headers (optional)
  body: any;          // response body
})
```

**context properties:**

- `query` - url query parameters as key-value pairs
- `headers` - request headers as key-value pairs
- `params` - url path parameters from dynamic routes (`:id` returns string, `*path` returns array)
- `body` - request body (for post/put/patch requests)

## api reference

### endpoints management

| method   | endpoint         | description                     |
| -------- | ---------------- | ------------------------------- |
| `GET`    | `/`              | api information                 |
| `GET`    | `/healthcheck`   | health status                   |
| `GET`    | `/endpoints`     | list all endpoints              |
| `GET`    | `/endpoints/:id` | get endpoint by id              |
| `POST`   | `/endpoints`     | create new endpoint             |
| `PUT`    | `/endpoints/:id` | update endpoint                 |
| `DELETE` | `/endpoints/:id` | delete endpoint                 |
| `GET`    | `/analytics`     | view request analytics          |
| `GET`    | `/analytics/:id` | analytics for specific endpoint |

### create endpoint request body

```typescript
{
  path: string;     // url pattern (e.g., "/users/:id")
  method: string;   // http method (get, post, put, patch, delete)
  handler: string;  // javascript handler function body
}
```

## environment variables

| variable        | default                   | description                   |
| --------------- | ------------------------- | ----------------------------- |
| `NODE_ENV`      | `development`             | `development` or `production` |
| `HOSTNAME`      | `0.0.0.0`                 | server bind address           |
| `PORT`          | `6543`                    | server port                   |
| `DATABASE_PATH` | `./database/mocksmith.db` | sqlite file path              |
| `AUTH_ENABLED`  | `false`                   | enable jwt auth               |
| `AUTH_SECRET`   | -                         | jwt secret (if auth enabled)  |
| `CORS_ORIGIN`   | `*`                       | allowed cors origins          |

## scripts

| command              | description                 |
| -------------------- | --------------------------- |
| `bun run dev`        | development with hot reload |
| `bun run start`      | production server           |
| `bun run lint`       | run eslint                  |
| `bun run test`       | run test suite              |
| `bun run db:create`  | create database             |
| `bun run db:migrate` | run migrations              |
| `bun run db:status`  | check database status       |

## docker

pull and run the docker image:

```bash
docker pull mcking-07/mocksmith-api:latest
docker run -p 6543:6543 mcking-07/mocksmith-api:latest
```

or build locally:

```bash
docker build -t mocksmith-api .
docker run -p 6543:6543 mocksmith-api
```

or use the provided `docker-compose.yml` file.

```bash
docker compose up
```

**docker features:**

- multi-stage build (deps → production)
- non-root user (`mocksmith`)
- resource limits (0.5 cpu, 512m memory)
- separate migration init container

## security

### sandbox isolation

user-submitted handlers execute in isolated subprocesses:

| layer                  | mechanism                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| ast validation         | `acorn` parses handler code before execution — rejects invalid syntax   |
| subprocess isolation   | runs via `bun -e` in a separate process — no shared memory              |
| timeout enforcement    | subprocess killed after 10s (configurable via `config.sandbox.timeout`) |
| restricted environment | `PATH`, `HOME`, `TMPDIR` scoped to `/tmp`, `cwd` set to `/tmp`          |
| no network access      | sandbox subprocess has no outbound connectivity                         |

### attack vectors mitigated

| vector                | mitigation                                       |
| --------------------- | ------------------------------------------------ |
| infinite loops        | subprocess timeout with `SIGKILL`                |
| memory bombs          | subprocess resource isolation                    |
| file system access    | `cwd: /tmp`, minimal `PATH`                      |
| `require()` / imports | `sourceType: 'script'` in acorn parser           |
| prototype pollution   | fresh subprocess per execution — no shared state |

## design decisions

### why subprocess sandboxing over vm2?

- `vm2` has known escape vulnerabilities (cve-2023-37466)
- subprocess provides os-level isolation
- timeout enforcement is reliable (`SIGKILL` vs cooperative cancellation)
- trade-off: ~50ms overhead per handler execution

### why custom router over hono/elysia?

- demonstrates middleware composition from scratch (~50 lines)
- no dependency for a core abstraction
- full control over route matching, middleware ordering, and skip logic
- the `compose` pattern is the same one express/koa use internally

## handler cookbook

### static responses

**basic json response:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/users",
    "method": "get",
    "handler": "(context) => ({ status: 200, body: { users: [{ id: 1, name: \"john\" }, { id: 2, name: \"jane\" }] } })"
  }'
```

```bash
curl http://localhost:6543/users
# { "users": [{ "id": 1, "name": "john" }, { "id": 2, "name": "jane" }] }
```

### path matching

**named parameters:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/orgs/:orgId/teams/:teamId/projects/:projectId",
    "method": "get",
    "handler": "(context) => ({ status: 200, body: { org: context.params.orgId, team: context.params.teamId, project: context.params.projectId } })"
  }'
```

```bash
curl http://localhost:6543/orgs/acme/teams/engineering/projects/alpha
# { "org": "acme", "team": "engineering", "project": "alpha" }
```

**wildcard parameters:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/files/*filepath",
    "method": "get",
    "handler": "(context) => ({ status: 200, body: { segments: context.params.filepath, path: context.params.filepath?.join(\"/\") } })"
  }'
```

```bash
curl http://localhost:6543/files/docs/2024/reports/annual.pdf
# { "segments": ["docs", "2024", "reports", "annual.pdf"], "path": "docs/2024/reports/annual.pdf" }
```

**note:** wildcards return an array of segments. use `.join("/")` to reconstruct the full path.

### status codes

**resource not found (404):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/users/:id",
    "method": "get",
    "handler": "(context) => { const users = { \"123\": { id: \"123\", name: \"john\" } }; const user = users[context.params.id]; if (!user) return { status: 404, body: { error: \"user not found\", id: context.params.id } }; return { status: 200, body: { user } }; }"
  }'
```

```bash
curl http://localhost:6543/users/123
# { "user": { "id": "123", "name": "john" } }

curl http://localhost:6543/users/999
# { "error": "user not found", "id": "999" }
```

**temporary redirect (302):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/login",
    "method": "get",
    "handler": "(context) => { const token = context.headers.authorization?.replace(\"bearer \", \"\"); if (token === \"valid-token\") return { status: 302, headers: { location: \"/dashboard\" }, body: { message: \"redirecting\" } }; return { status: 200, body: { form: true } }; }"
  }'
```

```bash
curl http://localhost:6543/login -H "authorization: bearer valid-token"
# => 302 location: /dashboard
```

**permanent redirect (301):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/v1/*path",
    "method": "get",
    "handler": "(context) => ({ status: 301, headers: { location: \"/v2\" + context.params.path?.join(\"/\") } })"
  }'
```

```bash
curl -L http://localhost:6543/v1/users
# => 301 location: /v2/users
```

**validation errors (422):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/register",
    "method": "post",
    "handler": "(context) => { const errors = []; if (!context.body?.email) errors.push({ field: \"email\", message: \"required\" }); else if (!context.body.email.includes("@")) errors.push({ field: \"email\", message: \"invalid format\" }); if (!context.body?.password) errors.push({ field: \"password\", message: \"required\" }); else if (context.body.password.length < 8) errors.push({ field: \"password\", message: \"must be at least 8 characters\" }); if (errors.length > 0) return { status: 422, body: { error: \"validation failed\", errors } }; return { status: 201, body: { id: 123, email: context.body.email } }; }"
  }'
```

```bash
curl -X post http://localhost:6543/register -H "content-type: application/json" -d '{"email": "invalid", "password": "123"}'
# { "error": "validation failed", "errors": [{ "field": "email", "message": "invalid format" }, { "field": "password", "message": "must be at least 8 characters" }] }

curl -X post http://localhost:6543/register -H "content-type: application/json" -d '{"email": "user@example.com", "password": "secure-password"}'
# { "id": 123, "email": "user@example.com" }
```

**error simulation:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/api/status",
    "method": "get",
    "handler": "(context) => { const code = parseInt(context.query.status) || 200; const responses = { 200: { body: { ok: true } }, 400: { body: { error: \"bad request\" } }, 401: { body: { error: \"unauthorized\" } }, 404: { body: { error: \"not found\" } }, 429: { body: { error: \"rate limited\" } }, 500: { body: { error: \"internal error\" } }, 503: { body: { error: \"service unavailable\" } } }; const response = responses[code] || responses[200]; return { status: code, ...response }; }"
  }'
```

```bash
curl "http://localhost:6543/api/status"                # 200
curl "http://localhost:6543/api/status?status=404"      # 404
curl "http://localhost:6543/api/status?status=500"      # 500
```

### advanced patterns

**paginated list:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/items",
    "method": "get",
    "handler": "(context) => { const page = parseInt(context.query.page) || 1; const limit = parseInt(context.query.limit) || 10; const items = Array.from({ length: limit }, (_, i) => ({ id: (page - 1) * limit + i + 1, name: \"item \" + ((page - 1) * limit + i + 1) })); return { status: 200, body: { data: items, meta: { page, limit, total: 100 } } }; }"
  }'
```

```bash
curl "http://localhost:6543/items?page=2&limit=3"
# { "data": [{ "id": 4, "name": "item 4" }, ...], "meta": { "page": 2, "limit": 3, "total": 100 } }
```

**authentication flow (401 / 200):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/profile",
    "method": "get",
    "handler": "(context) => { const token = context.headers.authorization?.replace(\"bearer \", \"\"); if (!token) return { status: 401, headers: { \"www-authenticate\": \"bearer\" }, body: { error: \"authentication required\" } }; if (token !== "valid-token-123") return { status: 401, body: { error: \"invalid token\" } }; return { status: 200, body: { id: 1, name: "john", email: \"john@example.com\" } }; }"
  }'
```

```bash
curl http://localhost:6543/profile
# { "error": \"authentication required\" }

curl http://localhost:6543/profile -H "authorization: bearer valid-token-123"
# { "id": 1, "name": "john", "email": \"john@example.com\" }
```

**conditional response by header:**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/negotiate",
    "method": "get",
    "handler": "(context) => { const accept = context.headers.accept || \"\"; if (accept.includes(\"text/plain\")) return { status: 200, headers: { \"content-type\": \"text/plain\" }, body: \"hello world\" }; return { status: 200, body: { message: \"hello world\" } }; }"
  }'
```

```bash
curl http://localhost:6543/negotiate -H "accept: text/plain"
# hello world

curl http://localhost:6543/negotiate -H "accept: application/json"
# { "message": "hello world" }
```

**delayed response (simulated latency):**

```bash
curl -X post http://localhost:6543/endpoints   -H "content-type: application/json"   -d '{
    "path": "/slow",
    "method": "get",
    "handler": "async (context) => { const delay = parseInt(context.query.delay) || 1000; await new Promise(r => setTimeout(r, delay)); return { status: 200, body: { delayed: true, ms: delay } }; }"
  }'
```

```bash
curl "http://localhost:6543/slow?delay=2000"
# { "delayed": true, "ms": 2000 }  (after 2 seconds)
```

## contributing

contributions are welcome! please feel free to submit a pull request.
