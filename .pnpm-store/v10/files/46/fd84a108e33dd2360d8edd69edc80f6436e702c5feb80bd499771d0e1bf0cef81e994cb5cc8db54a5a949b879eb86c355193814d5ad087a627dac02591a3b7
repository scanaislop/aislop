import { formatly } from "./formatly.js";
async function cli(args) {
  const result = await formatly(args);
  if (result.ran) {
    console.log(`Formatted with ${result.formatter.name}. \u{1F9FC}`);
    return 0;
  }
  console.error(result.message);
  return 1;
}
export {
  cli
};
