/** API tests run against the real Postgres + Redis from docker compose (npm run infra:up). */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testTimeout: 30000,
  maxWorkers: 1,
};
