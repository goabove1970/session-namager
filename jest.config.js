module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/dist/$1',
    '^@src/(.*)$': '<rootDir>/dist/src/$1',
    '^@models/(.*)$': '<rootDir>/dist/src/models/$1',
    '^@routes/(.*)$': '<rootDir>/dist/src/routes/$1',
    '^@utils/(.*)$': '<rootDir>/dist/src/utils/$1',
    '^@controllers/(.*)$': '<rootDir>/dist/src/controllers/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: [],
};

