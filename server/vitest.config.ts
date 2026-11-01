import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    include: [
      'src/**/*.test.ts',
      'tests/lab-01/**/*.test.ts',
      'tests/lab-02/utils.unit.test.ts',
      'tests/lab-02/create-ticket.api.test.ts',
      'tests/lab-02/my-tickets.api.test.ts',
      'tests/lab-03/**/*.test.ts',
      'tests/lab-04/**/*.test.ts',
    ],
  },
});
