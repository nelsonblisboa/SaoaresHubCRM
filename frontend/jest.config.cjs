// jest.config.cjs - Configuração simplificada
const { defaults } = require('ts-jest');

module.exports = {
  ...defaults,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Transform para lidar com import.meta.env
  transform: {
    '^.+\\.tsx?$': '<rootDir>/jest.transform.js',
  },
};
