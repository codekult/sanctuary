export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["web", "mobile", "api", "db", "types", "i18n", "tooling", "ci", "docs", "deps", "release"],
    ],
  },
};
