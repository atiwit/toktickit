# Lab 1 Tests Evidence

Lab 1 tests are intended to prove that the initial TokTickIT vertical slice works correctly.

## Test Results
All tests passed in the main branch.

| Test File `tests/lab-01/` | Tool | Test Description |
| :--- | :--- | :--- |
| `API-01` | Supertest | Health endpoint returns 200 and expected JSON |
| `API-02` | Supertest | Categories endpoint returns the four seeded categories |
| `UI-01` | Vitest | TokTickIT heading renders |
| `UI-02` | Vitest | Loading state changes to category list |
| `UI-03` | Vitest | API failure displays a useful error message |
