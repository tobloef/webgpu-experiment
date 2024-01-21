module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:jsdoc/recommended-error",
    "plugin:import/recommended"
  ],
  "overrides": [
    {
      "env": {
        "node": true
      },
      "files": [
        ".eslintrc.{js,cjs}"
      ],
      "parserOptions": {
        "sourceType": "script"
      }
    }
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  plugins: [
    "jsdoc"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns-description": "off",
    "import/extensions": ["error", "ignorePackages"],
  }
}
