# terminal-size

> Reliably get the terminal window size

Because [`process.stdout.columns`](https://nodejs.org/api/tty.html#tty_writestream_columns) doesn't exist when run [non-interactively](http://www.tldp.org/LDP/abs/html/intandnonint.html), for example, in a child process or when piped. This module even works when all the TTY file descriptors are redirected!

Confirmed working on macOS, Linux, and Windows.

## Install

```sh
npm install terminal-size
```

## Usage

```js
import terminalSize from 'terminal-size';

terminalSize();
//=> {columns: 143, rows: 24}
```

## API

### terminalSize()

Returns an `object` with `columns` and `rows` properties.

## Related

- [terminal-size-cli](https://github.com/sindresorhus/terminal-size-cli) - CLI for this module
