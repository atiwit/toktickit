# Lab 1 Tests Evidence

Lab 1 tests are intended to prove that the initial TokTickIT vertical slice works correctly.

## Test Results

All tests passed in the main branch.

### API Tests — `server/tests/lab-01/`

| Test File | Tool | Test Description | Result |
| :--- | :--- | :--- | :---: |
| `API-01.test.ts` | Vitest + Supertest | `GET /api/health` returns HTTP 200 and `{ status: "ok", service: "Tok TickIT API" }` | ✅ PASS |
| `API-02.test.ts` | Vitest + Supertest | `GET /api/categories` returns HTTP 200 and the four seeded categories (`Account and Access`, `Hardware`, `Software`, `Network`) | ✅ PASS |

### UI Tests — `client/src/test/lab-01/`

| Test File | Tool | Test Description | Result |
| :--- | :--- | :--- | :---: |
| `UI-01.test.tsx` | Vitest + React Testing Library | Renders the `TokTickIT IT Service Desk` heading on the page | ✅ PASS |
| `UI-02.test.tsx` | Vitest + React Testing Library | Clicking `[ Check System ]` shows a loading state, then displays the category list after the API resolves | ✅ PASS |
| `UI-03.test.tsx` | Vitest + React Testing Library | When the API call fails, an `Unable to connect to Tok TickIT API` error message is shown | ✅ PASS |

### Summary

```
Test Files  3 passed (server) | 4 passed (client)
     Tests  5 passed (lab-01)
  Duration  < 1s (server) | ~20s (client)
```
