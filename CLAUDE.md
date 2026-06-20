# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`threadhive-backend/`)
```bash
npm run dev        # Start dev server with nodemon (port 5000)
npm run populate   # Seed the database with sample data
npm test           # Run all tests (Vitest, no file parallelism)
```

Run a single test file:
```bash
npx vitest run tests/integration/thread.test.js
```

### Frontend (`threadhive-frontend/`)
```bash
npm run dev        # Start Vite dev server (port 5173)
npm test           # Run all tests (watch mode)
npm run lint       # ESLint
npm run build      # Production build
```

Run a single test file:
```bash
npx vitest run tests/unit/components/Header.test.jsx
```

### Environment
Backend requires a `.env` with `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` / `OPENAI_API_KEY`. See `.env.example`.

## Architecture

### Backend — layered controller → service → model

Every request flows: **route → controller → service → Mongoose model**. Controllers handle HTTP concerns (extracting params, shaping the response); services hold all business logic. Throw errors from any layer using `createAppError(message, statusCode)` from `src/utils/createAppError.js` — the global `errorHandler` middleware in `src/middleware/errorHandler.js` catches them and formats the response.

```
main.js          → connects DB, starts server
src/app.js       → Express setup; all routes mounted here; errorHandler last
src/routes/      → thin routers, wire authHandler + controller functions
src/controllers/ → parse req, call service, send res (no business logic)
src/services/    → all DB access and logic (call createAppError for errors)
src/models/      → Mongoose schemas only
src/middleware/
  authHandler.js → verifies JWT, attaches req.user = { userId }
  errorHandler.js → global error handler (last middleware in app.js)
src/utils/
  createAppError.js → creates an Error with a .statusCode property
  aiProvider.js     → switchable Gemini/OpenAI wrapper; call generateAIContent(prompt)
```

All API responses follow this shape:
```json
{ "success": true/false, "message": "...", "data": ... }
```

Auth: JWT passed as `Authorization: Bearer <token>`. `authHandler` sets `req.user.userId` (a Mongoose ObjectId).

### Backend Tests

Tests use **Vitest + Supertest + mongodb-memory-server**. `tests/setup.js` starts an in-memory MongoDB before all tests and tears it down after. `fileParallelism: false` is set in `vitest.config.js` — tests run serially to avoid port/DB conflicts. Each integration test file imports `app` from `src/app.js` and passes it to `supertest`.

### Adding a New Backend Feature (vertical slice)

1. Add/update Mongoose schema in `src/models/`
2. Add service functions in `src/services/<feature>Service.js`
3. Add controller in `src/controllers/<feature>Controller.js`
4. Create route file in `src/routes/<feature>.js`, wire `authHandler` as needed
5. Mount the route in `src/app.js` (`app.use('/api/<feature>', featureRoutes)`)
6. Add integration tests in `tests/integration/<feature>.test.js`

### Frontend — Redux Toolkit + React

```
src/store/store.js       → configureStore; one key per domain
src/reducers/            → one RTK slice per domain (createSlice + createAsyncThunk)
src/services/            → axios calls; import { FEATURE_API } from '../config/apiConfig'
src/config/apiConfig.js  → all endpoint paths (base URL is http://localhost:5000/api)
src/api/axiosInstance.js → axios instance with baseURL
src/pages/               → route-level components (Auth/, User/)
src/components/          → shared UI components
```

Auth token is stored in `localStorage` and passed manually as `Authorization: Bearer <token>` in every service call via `getAuthHeaders()`. The `auth` Redux slice reads the token from `localStorage` on startup.

### Adding a New Frontend Feature (vertical slice)

1. Add endpoint constants to `src/config/apiConfig.js`
2. Create `src/services/<feature>Service.js` with axios calls
3. Create `src/reducers/<feature>Slice.js` with `createSlice` + `createAsyncThunk`
4. Register the reducer in `src/store/store.js`
5. Build the component or extend an existing page/component

### Frontend Tests

Vitest + React Testing Library + MSW for API mocking. `tests/setup.js` starts the MSW server. Mock handlers live in `tests/mocks/handlers.js`. The test environment is `jsdom`.
