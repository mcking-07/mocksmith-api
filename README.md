# mocksmith-api

[![Bun](https://img.shields.io/badge/Bun-1.3+-violet)](https://bun.sh)
[![SQLite](https://img.shields.io/badge/SQLite-3-teal)](https://sqlite.org)
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

## usage examples

### basic json response (200)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/users",
    "method": "get",
    "handler": "(context) => ({ status: 200, body: { users: [{ id: 1, name: \"john\" }, { id: 2, name: \"jane\" }] } })"
  }'
```

```bash
curl http://localhost:6543/users
# { "users": [{ "id": 1, "name": "john" }, { "id": 2, "name": "jane" }] }
```

### create resource with validation (201 / 400)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/users",
    "method": "post",
    "handler": "(context) => { if (!context.body?.name) return { status: 400, body: { error: \"name is required\" } }; const id = math.floor(math.random() * 1000); return { status: 201, headers: { location: \"/users/\" + id }, body: { id, name: context.body.name, created: true } }; }"
  }'
```

```bash
curl -x post http://localhost:6543/users -h "content-type: application/json" -d '{"name": "alice"}'
# { "id": 847, "name": "alice", "created": true }

curl -x post http://localhost:6543/users -h "content-type: application/json" -d '{}'
# { "error": "name is required" }
```

### authentication flow (401 / 200)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/profile",
    "method": "get",
    "handler": "(context) => { const token = context.headers.authorization?.replace(\"bearer \", \"\"); if (!token) return { status: 401, headers: { \"www-authenticate\": \"bearer\" }, body: { error: \"authentication required\" } }; if (token !== \"valid-token-123\") return { status: 401, body: { error: \"invalid token\" } }; return { status: 200, body: { id: 1, name: \"john\", email: \"john@example.com\" } }; }"
  }'
```

```bash
curl http://localhost:6543/profile
# { "error": "authentication required" }

curl http://localhost:6543/profile -h "authorization: bearer valid-token-123"
# { "id": 1, "name": "john", "email": "john@example.com" }
```

### path parameters

create endpoints with dynamic path segments using `:param` and `*wildcard` syntax:

**named parameters:**

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
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
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
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

### resource not found (404)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
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

### validation errors (422)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/register",
    "method": "post",
    "handler": "(context) => { const errors = []; if (!context.body?.email) errors.push({ field: "email", message: "required" }); else if (!context.body.email.includes("@")) errors.push({ field: "email", message: "invalid format" }); if (!context.body?.password) errors.push({ field: "password", message: "required" }); else if (context.body.password.length < 8) errors.push({ field: "password", message: "must be at least 8 characters" }); if (errors.length > 0) return { status: 422, body: { error: "validation failed", errors } }; return { status: 201, body: { id: 123, email: context.body.email } }; }"
  }'
```

```bash
curl -x post http://localhost:6543/register -h "content-type: application/json" -d '{"email": "invalid", "password": "123"}'
# { "error": "validation failed", "errors": [{ "field": "email", "message": "invalid format" }, { "field": "password", "message": "must be at least 8 characters" }] }

curl -x post http://localhost:6543/register -h "content-type: application/json" -d '{"email": "user@example.com", "password": "securepass123"}'
# { "id": 123, "email": "user@example.com" }
```

### rate limiting (429)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/api/limited",
    "method": "get",
    "handler": "(context) => { const key = context.headers[\"x-api-key\"]; if (key === \"blocked\") return { status: 429, body: { error: \"rate limit exceeded\" } }; return { status: 200, body: { data: [] } }; }"
  }'

curl http://localhost:6543/api/limited -h "x-api-key: valid"     # => 200
curl http://localhost:6543/api/limited -h "x-api-key: blocked"    # => 429
```

### redirects (301 / 302)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/login",
    "method": "get",
    "handler": "(context) => { const token = context.headers.authorization?.replace(\"bearer \", \"\"); if (token === \"valid-token\") return { status: 302, headers: { location: \"/dashboard\" }, body: { message: "redirecting" } }; return { status: 200, body: { form: true } }; }"
  }'

# temporary redirect (302)
curl http://localhost:6543/login -h "authorization: bearer valid-token"
# => 302 location: /dashboard

curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/v1/*path",
    "method": "get", 
    "handler": "(context) => ({ status: 301, headers: { location: \"/v2/\" + context.params.path?.join(\"/\") } })"
  }'

# permanent redirect (301)
curl -l http://localhost:6543/v1/users
# => 301 location: /v2/users
```

### server errors (500 / 503)

```bash
curl -x post http://localhost:6543/endpoints \
  -h "content-type: application/json" \
  -d '{
    "path": "/api/status",
    "method": "get",
    "handler": "(context) => { if (context.query.error === \"500\") return { status: 500, body: { error: \"internal error\" } }; if (context.query.error === \"503\") return { status: 503, body: { error: \"service unavailable\" } }; return { status: 200, body: { status: \"ok\" } }; }"
  }'

curl "http://localhost:6543/api/status?error=500"  # => 500
curl "http://localhost:6543/api/status?error=503"  # => 503
curl "http://localhost:6543/api/status"            # => 200
```

## contributing

contributions are welcome! please feel free to submit a pull request.
