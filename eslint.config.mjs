import globals from "globals";
import pluginJs from "@eslint/js";

// https://eslint.org/docs/latest/use/command-line-interface
export default [
  {
    ignores: ["coverage/**"],
  },
  {
    files: ["**/*.js"], 
    languageOptions: {sourceType: "commonjs"},
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {languageOptions: 
    { globals: 
      globals.browser}
  },{
    languageOptions:{
      globals: globals.node
    }
  },
  pluginJs.configs.recommended,
];
