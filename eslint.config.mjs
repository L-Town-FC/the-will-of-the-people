import globals from "globals";
import pluginJs from "@eslint/js";

// https://eslint.org/docs/latest/use/command-line-interface
export default [
  {
    ignores: ["coverage/**"],
  },
  {
    files: ["**/*.js"], 
    languageOptions: {sourceType: "commonjs"}},
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
