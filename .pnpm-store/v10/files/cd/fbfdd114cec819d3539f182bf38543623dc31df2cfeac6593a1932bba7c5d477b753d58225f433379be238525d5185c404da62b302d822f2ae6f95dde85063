import {
  createRunCommand,
  createRunPackageCommand
} from "./createRunCommand.js";
import { runPrettier } from "./runPrettier.js";
const formatters = [
  {
    name: "biome",
    runner: createRunPackageCommand({
      args: ["format", "--write"],
      command: "@biomejs/biome"
    }),
    testers: {
      configFile: /biome\.json/,
      script: /biome\s+format/
    }
  },
  {
    name: "deno",
    runner: createRunCommand({
      args: ["fmt"],
      command: "deno"
    }),
    testers: {
      configFile: /deno\.json/,
      script: /deno/
    }
  },
  {
    name: "dprint",
    runner: createRunPackageCommand({
      args: ["fmt"],
      command: "dprint"
    }),
    testers: {
      configFile: /dprint\.json/,
      script: /dprint/
    }
  },
  {
    name: "oxfmt",
    runner: createRunCommand({
      args: ["oxfmt"],
      command: "npx"
    }),
    testers: {
      configFile: /^(?:\.oxfmtrc\.(?:json|jsonc)|oxfmt\.config\.(?:mts|ts))$/,
      script: /oxfmt/
    }
  },
  {
    name: "prettier",
    runner: runPrettier,
    testers: {
      configFile: /prettier(?:rc|\.)/,
      packageKey: "prettier",
      script: /prettier/
    }
  }
];
export {
  formatters
};
