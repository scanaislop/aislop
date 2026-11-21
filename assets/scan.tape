# From the repository root: pnpm build && vhs assets/scan.tape
Output assets/scan.gif
Set Shell "bash"
Set Theme "Catppuccin Mocha"
Set FontFamily "Menlo"
Set FontSize 20
Set Width 1120
Set Height 570
Set Padding 24
Set TypingSpeed 24ms
Set Framerate 12

Hide
Type `cli=$PWD/dist/cli.js; demo=$(mktemp -d); cd "$demo"; trap 'rm -rf "$demo"' EXIT`
Enter
Type `export PS1='$ ' AISLOP_NO_TELEMETRY=1; unset PROMPT_COMMAND; aislop() { node "$cli" "$@"; }`
Enter
Type `printf 'export function total(prices) {\n\tdebugger;\n\treturn prices.reduce((sum, price) => sum + price, 0);\n}\n' > cart.js`
Enter
Type `clear`
Enter
Sleep 500ms
Show
Type `cat -n cart.js`
Enter
Sleep 2s
Type `aislop ci > report.json`
Enter
Sleep 2s
Type `jq '.diagnostics[] | select(.engine == "lint") | {filePath, line, rule}' report.json`
Enter
Sleep 3s
Type `sed '/debugger;/d' cart.js > clean.js && mv clean.js cart.js`
Enter
Sleep 1s
Type `aislop ci | jq '.engines.lint | {issues, skipped}'`
Enter
Sleep 4s
