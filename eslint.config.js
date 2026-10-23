const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'web-build/*', 'coverage/*'],
  },
  {
    // TypeScript already verifies namespace members. The import plugin cannot read the
    // SDK 58 expo-notifications enum build output and reports existing enums as missing.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'import/namespace': 'off' },
  },
]);
