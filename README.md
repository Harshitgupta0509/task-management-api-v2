# Task Management API V2

[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

Task Management API V2 is a production-oriented REST API for authenticated users to create and manage their own tasks. It demonstrates modern TypeScript backend engineering with layered Express modules, runtime validation, JWT-based authentication, ownership-aware database access, integration testing, structured logging, containerization, and a hosted PostgreSQL deployment.

This is a backend-only project: clients interact with JSON endpoints directly or through the interactive Swagger UI.

## Live Demo

- **Live API:** <https://task-management-api-v2.onrender.com>
- **Interactive Swagger / OpenAPI documentation:** <https://task-management-api-v2.onrender.com/api-docs>

The root endpoint returns a small JSON health response. Swagger UI provides an interactive interface for registering a user, logging in, authorizing with a JWT, and exercising the protected task endpoints.

> Render services may need a short cold-start period after inactivity.

## Features

### Authentication and authorization

- User registration and login with Zod-validated payloads.
- Password hashing with bcrypt using 10 salt rounds.
- Signed JWT access tokens with configurable expiration.
- Bearer-token middleware for every `/tasks` route.
- Per-user task ownership: task reads, updates, and deletes are scoped to the authenticated user.
- Generic invalid-credential responses and password omission from successful API responses.

### Task management

- Create, list, retrieve, update, and delete tasks.
- Offset pagination with configurable page size.
- Completion filtering.
- Case-insensitive search across task titles and descriptions.
- Sorting by creation time, update time, or title in ascending or descending order.
- Pagination metadata containing the current page, limit, total records, and total pages.

### API and operational design

- Route → middleware → controller → service → Prisma separation.
- Centralized handling for expected `AppError` instances and unexpected errors.
- Environment-variable validation at application startup.
- Helmet security headers, CORS configuration, a 100 KB JSON body limit, global rate limiting, and stricter authentication rate limiting.
- Structured Pino application and HTTP request/response logging, with pretty output during development and JSON output outside development.
- OpenAPI 3.0 specification and Swagger UI.
- Multi-stage Docker build running as the non-root `node` user.
- Vitest and Supertest coverage for validation, authentication, task CRUD, and cross-user authorization isolation.

## Tech Stack

| Category | Technology |
| --- | --- |
| Runtime / language | Node.js 24, TypeScript 6, ES modules |
| Web framework | Express 5 |
| Database / ORM | PostgreSQL, Prisma ORM 7 with the `pg` driver adapter |
| Production database | Neon-hosted PostgreSQL |
| Authentication | JSON Web Tokens (`jsonwebtoken`) and bcrypt |
| Validation | Zod 4 |
| Security | Helmet, CORS, `express-rate-limit`, bounded JSON request bodies |
| Logging | Pino and `pino-http`; `pino-pretty` in development |
| Testing | Vitest and Supertest |
| API documentation | OpenAPI 3.0 and Swagger UI Express |
| Containerization | Docker, multi-stage Node Alpine image |
| Deployment | Render web service connected to external PostgreSQL |

## High-Level System Architecture

```mermaid
flowchart TD
    CLIENTS["API clients<br/>Swagger UI · Postman · future frontend"]
    RENDER["Render web service"]

    subgraph API["Dockerized Node.js / Express API"]
        MIDDLEWARE["HTTP logging · Helmet · CORS<br/>rate limits · JSON parsing"]
        MODULES["Auth and task routes<br/>controllers · services"]
        ERROR["Centralized error handler"]
        MIDDLEWARE --> MODULES
        MODULES -.->|expected or unexpected error| ERROR
    end

    PRISMA["Prisma Client<br/>PostgreSQL driver adapter"]
    DATABASE[("Neon PostgreSQL")]

    CLIENTS -->|HTTPS| RENDER
    RENDER --> MIDDLEWARE
    MODULES --> PRISMA
    PRISMA --> DATABASE
```

## HTTP Request Lifecycle

Application middleware is registered in `src/app.ts`. Protected task routes authenticate before their Zod validators, while public authentication routes apply their own stricter rate limiter before validation.

```mermaid
flowchart TD
    REQUEST["HTTP request"] --> EXPRESS["Express 5"]
    EXPRESS --> LOGGER["pino-http request logger"]
    LOGGER --> SECURITY["Helmet · CORS · JSON parser<br/>global rate limiter"]
    SECURITY --> ROUTE["Matched route"]
    ROUTE --> PROTECTED{"Protected task route?"}

    PROTECTED -->|Yes| AUTH["Authenticate Bearer JWT"]
    AUTH -->|Invalid| R401["401 response"]
    AUTH -->|Valid; populate req.user| VALIDATE["Zod validation middleware"]
    PROTECTED -->|No| VALIDATE

    VALIDATE -->|Invalid| R400["400 validation response"]
    VALIDATE -->|Valid; store parsed data| CONTROLLER["Controller"]
    CONTROLLER --> SERVICE["Service"]
    SERVICE --> PRISMA["Prisma Client"]
    PRISMA --> POSTGRES[("PostgreSQL")]
    POSTGRES --> SERVICE
    SERVICE --> RESPONSE["JSON response"]

    SERVICE -. "AppError or rejected promise" .-> ERRORS["Global error middleware"]
    CONTROLLER -. "unexpected error" .-> ERRORS
    ERRORS -->|AppError| EXPECTED["Configured HTTP status + message"]
    ERRORS -->|Unexpected| INTERNAL["Internal log + generic 500"]
```

## Authentication Flow

Authentication is easier to follow as three focused paths: registration, login, and access to a protected task route.

### Registration

```mermaid
flowchart TD
    REG_REQUEST["POST /auth/register<br/>name · email · password"]
    REG_VALIDATE["Zod validates request body"]
    REG_VALID{"Payload valid?"}
    REG_LOOKUP["Prisma findUnique by email"]
    REG_EXISTS{"Email already registered?"}
    REG_HASH["bcrypt.hash<br/>10 salt rounds"]
    REG_CREATE["Prisma creates User<br/>with password hash"]
    REG_SAFE["Select safe fields only<br/>id · name · email · createdAt"]
    REG_201["201 Created<br/>user returned"]
    REG_400["400 Validation failed"]
    REG_409["409 User already exists"]

    REG_REQUEST --> REG_VALIDATE --> REG_VALID
    REG_VALID -->|No| REG_400
    REG_VALID -->|Yes| REG_LOOKUP --> REG_EXISTS
    REG_EXISTS -->|Yes| REG_409
    REG_EXISTS -->|No| REG_HASH --> REG_CREATE --> REG_SAFE --> REG_201

    classDef request fill:#0f172a,stroke:#38bdf8,color:#f8fafc,stroke-width:2px
    classDef process fill:#172554,stroke:#60a5fa,color:#f8fafc,stroke-width:2px
    classDef decision fill:#3b0764,stroke:#d8b4fe,color:#ffffff,stroke-width:2px
    classDef crypto fill:#4c1d95,stroke:#c084fc,color:#ffffff,stroke-width:2px
    classDef success fill:#064e3b,stroke:#34d399,color:#ffffff,stroke-width:2px
    classDef error fill:#7f1d1d,stroke:#f87171,color:#ffffff,stroke-width:2px

    class REG_REQUEST request
    class REG_VALIDATE,REG_LOOKUP,REG_CREATE,REG_SAFE process
    class REG_VALID,REG_EXISTS decision
    class REG_HASH crypto
    class REG_201 success
    class REG_400,REG_409 error
```

### Login

```mermaid
flowchart TD
    LOGIN_REQUEST["POST /auth/login<br/>email · password"]
    LOGIN_VALIDATE["Zod validates request body"]
    LOGIN_VALID{"Payload valid?"}
    LOGIN_LOOKUP["Prisma findUnique by email"]
    LOGIN_FOUND{"User found?"}
    LOGIN_COMPARE["bcrypt.compare<br/>submitted password vs stored hash"]
    LOGIN_MATCH{"Password matches?"}
    LOGIN_SIGN["JWT signs userId<br/>using configured secret and expiry"]
    LOGIN_200["200 Login successful<br/>JWT + safe user fields"]
    LOGIN_400["400 Validation failed"]
    LOGIN_401["401 Invalid email or password"]

    LOGIN_REQUEST --> LOGIN_VALIDATE --> LOGIN_VALID
    LOGIN_VALID -->|No| LOGIN_400
    LOGIN_VALID -->|Yes| LOGIN_LOOKUP --> LOGIN_FOUND
    LOGIN_FOUND -->|No| LOGIN_401
    LOGIN_FOUND -->|Yes| LOGIN_COMPARE --> LOGIN_MATCH
    LOGIN_MATCH -->|No| LOGIN_401
    LOGIN_MATCH -->|Yes| LOGIN_SIGN --> LOGIN_200

    classDef request fill:#0f172a,stroke:#38bdf8,color:#f8fafc,stroke-width:2px
    classDef process fill:#172554,stroke:#60a5fa,color:#f8fafc,stroke-width:2px
    classDef decision fill:#3b0764,stroke:#d8b4fe,color:#ffffff,stroke-width:2px
    classDef crypto fill:#4c1d95,stroke:#c084fc,color:#ffffff,stroke-width:2px
    classDef success fill:#064e3b,stroke:#34d399,color:#ffffff,stroke-width:2px
    classDef error fill:#7f1d1d,stroke:#f87171,color:#ffffff,stroke-width:2px

    class LOGIN_REQUEST request
    class LOGIN_VALIDATE,LOGIN_LOOKUP process
    class LOGIN_VALID,LOGIN_FOUND,LOGIN_MATCH decision
    class LOGIN_COMPARE,LOGIN_SIGN crypto
    class LOGIN_200 success
    class LOGIN_400,LOGIN_401 error
```

### Protected task request

```mermaid
flowchart TD
    TASK_REQUEST["Request to /tasks<br/>Authorization: Bearer &lt;JWT&gt;"]
    HEADER_CHECK{"Bearer header present<br/>and correctly formatted?"}
    VERIFY["jwt.verify<br/>token + JWT_SECRET"]
    TOKEN_VALID{"Signature and expiry valid?"}
    USER_CONTEXT["Populate req.user.id<br/>from decoded userId"]
    TASK_VALIDATE["Validate task body,<br/>params, or query with Zod"]
    TASK_HANDLER["Controller → service → Prisma<br/>using authenticated userId"]
    TASK_RESPONSE["User-scoped task response"]
    AUTH_401["401 Authentication required<br/>or invalid/expired token"]

    TASK_REQUEST --> HEADER_CHECK
    HEADER_CHECK -->|No| AUTH_401
    HEADER_CHECK -->|Yes| VERIFY --> TOKEN_VALID
    TOKEN_VALID -->|No| AUTH_401
    TOKEN_VALID -->|Yes| USER_CONTEXT --> TASK_VALIDATE --> TASK_HANDLER --> TASK_RESPONSE

    classDef request fill:#0f172a,stroke:#38bdf8,color:#f8fafc,stroke-width:2px
    classDef process fill:#172554,stroke:#60a5fa,color:#f8fafc,stroke-width:2px
    classDef decision fill:#3b0764,stroke:#d8b4fe,color:#ffffff,stroke-width:2px
    classDef crypto fill:#4c1d95,stroke:#c084fc,color:#ffffff,stroke-width:2px
    classDef success fill:#064e3b,stroke:#34d399,color:#ffffff,stroke-width:2px
    classDef error fill:#7f1d1d,stroke:#f87171,color:#ffffff,stroke-width:2px

    class TASK_REQUEST request
    class USER_CONTEXT,TASK_VALIDATE,TASK_HANDLER process
    class HEADER_CHECK,TOKEN_VALID decision
    class VERIFY crypto
    class TASK_RESPONSE success
    class AUTH_401 error
```

No pre-created account is required. Register a user first, then log in to obtain a JWT.

## Task CRUD and Ownership Authorization

The authenticated `userId` is never accepted from a task request body. It comes from the verified JWT and is added to Prisma filters or create data by the service layer.

```mermaid
flowchart TD
    TOKEN["Verified JWT"] --> USERID["req.user.id"]
    USERID --> KIND{"Task operation"}

    KIND -->|Create| CREATE["Create task with userId"]
    KIND -->|List| LIST["findMany and count<br/>where userId + optional filters"]
    KIND -->|Get by ID| FIND["findFirst<br/>where id + userId"]
    KIND -->|Update| CHECK["findFirst ownership check<br/>where id + userId"]
    KIND -->|Delete| DELETE["deleteMany<br/>where id + userId"]

    FIND --> FOUND{"Task found?"}
    CHECK --> FOUND
    DELETE --> DELETED{"Deleted count > 0?"}

    FOUND -->|Yes| OPERATION["Return task or apply update"]
    FOUND -->|No| NOTFOUND["404 Task not found"]
    DELETED -->|Yes| NOCONTENT["204 No Content"]
    DELETED -->|No| NOTFOUND

    CREATE --> DATABASE[("PostgreSQL")]
    LIST --> DATABASE
    OPERATION --> DATABASE
```

Returning `404` both for a missing task and for another user's task avoids exposing whether an inaccessible task ID exists.

## Database Design

```mermaid
erDiagram
    USER ||--o{ TASK : owns

    USER {
        int id PK
        string name
        string email UK
        string password
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        int id PK
        string title
        string description
        boolean completed
        int userId FK
        datetime createdAt
        datetime updatedAt
    }
```

- `User.id` and `Task.id` are auto-incrementing integer primary keys.
- `User.email` is unique.
- `User.password` stores a bcrypt hash rather than the submitted plaintext password.
- One user can own zero or more tasks; each task belongs to exactly one user.
- `Task.userId` is a required foreign key to `User.id`.
- `Task.description` is nullable; `Task.completed` defaults to `false`.
- Deleting a user cascades to that user's tasks.
- Task indexes support ownership queries on `userId`, completion filtering on `(userId, completed)`, and recent-task queries on `(userId, createdAt)`.
- Prisma manages `createdAt` defaults and automatically refreshes `updatedAt`.

## Project Structure

The tree below focuses on runtime, database, test, and deployment files.

```text
.
├── prisma/
│   ├── migrations/               # Versioned PostgreSQL migrations
│   └── schema.prisma             # User/Task models, relations, and indexes
├── src/
│   ├── config/
│   │   ├── env.ts                # Startup environment validation
│   │   └── swagger.ts            # OpenAPI 3.0 document
│   ├── generated/prisma/         # Generated Prisma Client; gitignored
│   ├── lib/
│   │   ├── logger.ts             # Pino logger configuration
│   │   └── prisma.ts             # PrismaPg adapter and Prisma Client
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Bearer JWT authentication
│   │   ├── error.middleware.ts   # Centralized error responses/logging
│   │   └── validate.middleware.ts # Zod request validation
│   ├── modules/
│   │   ├── auth/                 # Registration and login module
│   │   └── tasks/                # User-scoped task module
│   ├── types/                    # Express request type augmentation
│   ├── utils/                    # AppError utility
│   ├── app.ts                    # Express app and middleware composition
│   └── server.ts                 # Database connection and HTTP startup
├── tests/
│   ├── auth.test.ts              # Health and registration validation
│   ├── tasks.test.ts             # Protected-route authentication
│   └── integration.test.ts       # Auth, CRUD, and ownership isolation
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile                    # Multi-stage production image
├── package.json                  # Scripts and dependencies
├── prisma.config.ts              # Prisma schema, migrations, and datasource
└── tsconfig.json                 # Strict NodeNext TypeScript build
```

Each feature module follows the same responsibilities:

- `*.routes.ts` defines endpoints and middleware order.
- `*.schema.ts` defines Zod runtime schemas and inferred TypeScript input types.
- `*.controller.ts` translates validated HTTP data into service calls and responses.
- `*.service.ts` contains business rules and Prisma operations.

The core path is:

```text
Route → Middleware → Controller → Service → Prisma → PostgreSQL
```

## API Endpoints

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Return API health/status JSON. |
| `GET` | `/api-docs` | Public | Serve interactive Swagger UI. |
| `POST` | `/auth/register` | Public | Register a user and return safe user fields. |
| `POST` | `/auth/login` | Public | Validate credentials and return a JWT plus safe user fields. |
| `GET` | `/tasks` | Bearer JWT | List the authenticated user's tasks with pagination, filters, search, and sorting. |
| `POST` | `/tasks` | Bearer JWT | Create a task owned by the authenticated user. |
| `GET` | `/tasks/:id` | Bearer JWT | Get one owned task by numeric ID. |
| `PATCH` | `/tasks/:id` | Bearer JWT | Update an owned task's title, description, and/or completion state. |
| `DELETE` | `/tasks/:id` | Bearer JWT | Delete an owned task and return `204 No Content`. |

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

### `GET /tasks` query parameters

| Parameter | Type / allowed values | Default | Behavior |
| --- | --- | --- | --- |
| `page` | Positive integer | `1` | Selects the result page. |
| `limit` | Positive integer, maximum `100` | `10` | Sets records per page. |
| `completed` | `true` or `false` | — | Filters by completion state. |
| `search` | Non-empty string after trimming | — | Case-insensitive search in title and description. |
| `sortBy` | `createdAt`, `updatedAt`, or `title` | `createdAt` | Selects the sort field. |
| `order` | `asc` or `desc` | `desc` | Selects the sort direction. |

The list response includes:

```json
{
  "tasks": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

## Example API Usage

The examples below create a new account; they are not permanent production credentials.

### Register

```bash
curl -X POST https://task-management-api-v2.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@example.com",
    "password": "DemoPassword123"
  }'
```

### Log in

```bash
curl -X POST https://task-management-api-v2.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "DemoPassword123"
  }'
```

Copy the returned token and send it as `Authorization: Bearer <token>`. Never commit or publish a real token.

### Create a task

```bash
curl -X POST https://task-management-api-v2.onrender.com/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prepare backend portfolio",
    "description": "Review API documentation and integration tests"
  }'
```

### Paginate, filter, search, and sort

```bash
curl "https://task-management-api-v2.onrender.com/tasks?page=1&limit=10&completed=false&search=portfolio&sortBy=updatedAt&order=desc" \
  -H "Authorization: Bearer <token>"
```

## Environment Variables

Copy [`.env.example`](./.env.example) to `.env` and replace every placeholder required by your environment.

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/SEPARATE_TEST_DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

| Variable | Requirement | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Optional; defaults to `development` | Accepts `development`, `test`, or `production`; controls database selection and logging format. |
| `PORT` | Optional; defaults to `3000` | HTTP listening port. |
| `DATABASE_URL` | Required | PostgreSQL connection URL used outside test mode and required by startup validation. |
| `TEST_DATABASE_URL` | Required for integration tests | Separate PostgreSQL connection URL selected when `NODE_ENV=test`. |
| `JWT_SECRET` | Required; minimum 32 characters | Signs and verifies JWT access tokens. Use a long, random value. |
| `JWT_EXPIRES_IN` | Optional; defaults to `7d` | Token lifetime passed to `jsonwebtoken`. |
| `CLIENT_ORIGIN` | Required valid URL | Browser origin allowed by the environment-driven CORS configuration. |

Never commit `.env`. Production values belong in Render's environment settings, not in Git, source files, Docker build arguments, or the image.

> **Test database safety:** `tests/integration.test.ts` deletes every task and user before and after the integration suite. `TEST_DATABASE_URL` must point to a separate, disposable test database—never development or production.

## Local Development

### Prerequisites

- Node.js 24 or another version compatible with the installed dependencies
- npm
- A PostgreSQL database, locally hosted or provided by Neon
- Docker, only if you want to run the container workflow

### Setup

```bash
git clone https://github.com/Harshitgupta0509/task-management-api-v2.git
cd task-management-api-v2
npm ci
```

Create `.env` from the template, supply development credentials, then generate Prisma Client and apply the checked-in migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

`prisma migrate dev` is a development command: it applies existing migrations, detects schema drift, and creates a new migration when the Prisma schema changes. Run `npm run prisma:generate` again after schema changes so the generated client matches the schema.

The development server uses `tsx watch` and listens on `PORT` (default `3000`).

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run `src/server.ts` in TypeScript watch mode. |
| `npm run build` | Compile `src/**/*.ts` to `dist/` with `tsc`. |
| `npm start` | Run the compiled production entry point at `dist/server.js`. |
| `npm test` | Run Vitest in watch mode with `NODE_ENV=test`. |
| `npm run test:run` | Run the test suite once with `NODE_ENV=test`. |
| `npm run prisma:generate` | Generate Prisma Client into `src/generated/prisma`. |
| `npm run prisma:migrate` | Run `prisma migrate dev`. |
| `npm run prisma:studio` | Open Prisma Studio. |

### Production build

```bash
npm run prisma:generate
npm run build
npm start
```

## Testing

The suite uses Vitest as the test runner and Supertest to call the Express application without starting a network listener.

```bash
npm run test:run
```

The three test files currently cover:

- the root health response;
- rejected registration payloads;
- authentication enforcement on task routes;
- registration and login with a returned JWT;
- authenticated task creation, listing, updating, and deletion;
- ownership isolation, where a second user receives `404` for another user's task.

The integration suite clears the `Task` and `User` tables in `beforeAll` and `afterAll`, and disconnects Prisma after completion. Use only a disposable database in `TEST_DATABASE_URL`.

## Docker

The Dockerfile uses two Node 24 Alpine stages:

1. The builder installs all dependencies, generates Prisma Client, and compiles TypeScript.
2. The production stage installs production dependencies only, copies `dist/`, switches to the non-root `node` user, exposes port `3000`, and runs `npm start`.

Build and run the image:

```bash
docker build -t task-management-api-v2 .
docker run --env-file .env -e NODE_ENV=production -p 3000:3000 task-management-api-v2
```

The environment file is supplied at runtime and excluded from the Docker build context. The image does not contain PostgreSQL; it connects to the external database configured by `DATABASE_URL`.

The checked-in Dockerfile does **not** run production migrations automatically. Apply pending migrations separately before starting a new production release.

## Prisma and Database Workflow

Prisma 7 reads `prisma/schema.prisma` and the datasource URL from `prisma.config.ts`. The generated ESM client is written to `src/generated/prisma`, then initialized with `@prisma/adapter-pg` in `src/lib/prisma.ts`.

```bash
# Regenerate the typed client after schema changes
npx prisma generate

# Create/apply migrations during development
npx prisma migrate dev --name describe_the_change

# Apply already committed migrations in production or staging
npx prisma migrate deploy
```

`migrate dev` can create migrations and requires development safeguards such as drift detection. `migrate deploy` only applies pending migration files and is the appropriate non-interactive production command. Because Prisma CLI, the schema, and migrations are not included in the final runtime image, production migration execution must occur in a separate deployment/pre-deploy environment that has the full repository and development tooling available.

## Security Measures Implemented

- bcrypt password hashing before persistence.
- JWT signature and expiration verification for protected routes.
- User identity derived from the verified token rather than task payloads.
- Ownership-scoped task queries and non-disclosing `404` responses.
- Zod validation for bodies, path parameters, and task-list query parameters.
- Helmet HTTP security headers.
- CORS configuration for local development and `CLIENT_ORIGIN`.
- Global limit of 100 requests per 15 minutes and a stricter shared limit of 10 requests per 15 minutes across authentication requests.
- JSON request bodies limited to 100 KB.
- Startup validation for required environment values and JWT-secret length.
- Generic production-style `500` responses while unexpected errors are logged internally.
- Password hashes are excluded from successful registration/login responses.
- Secrets are supplied through environment variables and excluded from Git and Docker build context.

These are practical security controls, not a claim of complete or enterprise-grade security. Production systems should also add token rotation/revocation strategy, secret rotation, monitoring, dependency scanning, and infrastructure-specific protections.

## Error Handling

Validation and authentication middleware return their own `400` or `401` responses. Services throw `AppError` for expected business failures, and Express 5 forwards rejected async handlers to the global error middleware.

```mermaid
flowchart TD
    SERVICE["Service or async handler"] --> FAILURE{"Failure type"}
    FAILURE -->|AppError| HANDLER["Centralized error middleware"]
    FAILURE -->|Unexpected error| HANDLER
    HANDLER -->|Expected| EXPECTED["Configured status + safe message"]
    HANDLER -->|Unexpected| LOG["Pino internal error log"]
    LOG --> GENERIC["500 Internal server error"]
```

Common responses include:

| Status | Example condition |
| --- | --- |
| `400 Bad Request` | Zod validation failure. |
| `401 Unauthorized` | Missing/invalid Bearer token or invalid login credentials. |
| `404 Not Found` | Task does not exist or is not owned by the authenticated user. |
| `409 Conflict` | Registration email already exists. |
| `500 Internal Server Error` | Unexpected failure; details are logged rather than returned. |

## Logging

`pino-http` records request/response activity using the shared Pino logger. Application startup, database connectivity, and unhandled errors also use structured log events.

- Development uses `pino-pretty`, colored output, and debug-level logging.
- Test and production modes emit structured JSON without the pretty transport.
- Production logging is set to the `info` level.

Operational logs should be access-controlled and reviewed for sensitive request headers before being shipped to a long-term log platform.

## Swagger and OpenAPI

[OpenAPI](https://www.openapis.org/) is the machine-readable API specification; Swagger UI renders that specification as interactive documentation.

- Live Swagger UI: <https://task-management-api-v2.onrender.com/api-docs>
- Local Swagger UI: <http://localhost:3000/api-docs>

To test protected routes:

1. Call `POST /auth/register` with a new account.
2. Call `POST /auth/login` with the same email and password.
3. Copy the returned JWT.
4. Click **Authorize** in Swagger UI.
5. Paste the token into the bearer-auth field.
6. Execute the protected `/tasks` operations.

Do not paste the literal word `Bearer` unless the Swagger prompt requests it; the OpenAPI HTTP bearer scheme normally adds that prefix automatically.

## Deployment Architecture

```mermaid
flowchart LR
    GITHUB["GitHub repository"] --> RENDER["Render Docker build"]

    subgraph BUILDER["Builder stage · node:24-alpine"]
        INSTALL["npm ci"] --> GENERATE["npx prisma generate"]
        GENERATE --> BUILD["npm run build"]
    end

    RENDER --> INSTALL
    BUILD --> PROD["Production stage<br/>npm ci --omit=dev<br/>copy dist · USER node"]
    PROD --> START["npm start<br/>node dist/server.js"]
    ENV["Render runtime environment variables"] -.->|injected at runtime| START
    START --> API["Express API"]
    API --> PRISMA["Prisma Client + pg adapter"]
    PRISMA --> NEON[("Neon PostgreSQL")]
```

The production service is available at <https://task-management-api-v2.onrender.com>. Runtime secrets are configured in Render rather than committed to the repository or baked into the image.

The repository does not contain a `render.yaml`, a Render pre-deploy command, or a GitHub Actions workflow. Therefore, this documentation does not claim an automated migration or CI/CD pipeline beyond the deployed Render service itself.

## Engineering Highlights

This project demonstrates:

- an ORM-backed, strongly typed PostgreSQL data layer with explicit migrations;
- compile-time TypeScript safety combined with runtime Zod validation;
- layered backend architecture with focused route, controller, service, and middleware responsibilities;
- password-based authentication and ownership-aware authorization;
- practical filtering, search, sorting, pagination, and index design;
- consistent expected/unexpected error handling;
- integration tests against a real PostgreSQL-compatible database;
- production-oriented logging, container builds, and hosted deployment.

## Possible Future Improvements

The following are ideas and are **not currently implemented**:

- refresh-token rotation and server-side token revocation;
- email verification and password-reset flows;
- role-based access control;
- Redis caching and background jobs;
- automated CI checks and deployment gates;
- metrics, distributed tracing, and explicit Pino header redaction;
- cursor-based pagination for large task collections;
- expanded OpenAPI response schemas and automated contract tests.
