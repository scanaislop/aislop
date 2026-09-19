import process from 'node:process';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import tty from 'node:tty';

const defaultColumns = 80;
const defaultRows = 24;

const exec = (command, arguments_, {shell, env} = {}) =>
	execFileSync(command, arguments_, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
		timeout: 500,
		shell,
		env,
	}).trim();

const create = (columns, rows) => ({
	columns: Number.parseInt(columns, 10),
	rows: Number.parseInt(rows, 10),
});

const createIfNotDefault = (maybeColumns, maybeRows) => {
	const {columns, rows} = create(maybeColumns, maybeRows);

	if (Number.isNaN(columns) || Number.isNaN(rows)) {
		return;
	}

	if (columns === defaultColumns && rows === defaultRows) {
		return;
	}

	return {columns, rows};
};

const isForegroundProcess = () => {
	if (process.platform !== 'linux') {
		return true;
	}

	try {
		const statContents = fs.readFileSync('/proc/self/stat', 'utf8');
		const closingParenthesisIndex = statContents.lastIndexOf(') ');

		if (closingParenthesisIndex === -1) {
			return false;
		}

		const statFields = statContents.slice(closingParenthesisIndex + 2).trim().split(/\s+/);
		const processGroupId = Number.parseInt(statFields[2], 10);
		const foregroundProcessGroupId = Number.parseInt(statFields[5], 10);

		if (Number.isNaN(processGroupId) || Number.isNaN(foregroundProcessGroupId)) {
			return false;
		}

		if (foregroundProcessGroupId <= 0) {
			return false;
		}

		return processGroupId === foregroundProcessGroupId;
	} catch {
		return false;
	}
};

export default function terminalSize() {
	const {env, stdout, stderr} = process;

	if (stdout?.columns && stdout?.rows) {
		return create(stdout.columns, stdout.rows);
	}

	if (stderr?.columns && stderr?.rows) {
		return create(stderr.columns, stderr.rows);
	}

	// These values are static, so not the first choice.
	if (env.COLUMNS && env.LINES) {
		return create(env.COLUMNS, env.LINES);
	}

	const fallback = {
		columns: defaultColumns,
		rows: defaultRows,
	};

	if (process.platform === 'win32') {
		// We include `tput` for Windows users using Git Bash.
		return tput() ?? fallback;
	}

	if (process.platform === 'darwin') {
		return devTty() ?? tput() ?? fallback;
	}

	return devTty() ?? tput() ?? resize() ?? fallback;
}

const devTty = () => {
	try {
		// eslint-disable-next-line no-bitwise
		const flags = process.platform === 'darwin' ? fs.constants.O_EVTONLY | fs.constants.O_NONBLOCK : fs.constants.O_NONBLOCK;
		// eslint-disable-next-line new-cap
		const {columns, rows} = tty.WriteStream(fs.openSync('/dev/tty', flags));
		return {columns, rows};
	} catch {}
};

// On macOS, this only returns correct values when stdout is not redirected.
const tput = () => {
	try {
		// `tput` requires the `TERM` environment variable to be set.
		const columns = exec('tput', ['cols'], {env: {TERM: 'dumb', ...process.env}});
		const rows = exec('tput', ['lines'], {env: {TERM: 'dumb', ...process.env}});

		if (columns && rows) {
			return createIfNotDefault(columns, rows);
		}
	} catch {}
};

// Only exists on Linux.
const resize = () => {
	// `resize` is preferred as it works even when all file descriptors are redirected
	// https://linux.die.net/man/1/resize
	try {
		if (!isForegroundProcess()) {
			return;
		}

		const size = exec('resize', ['-u']).match(/\d+/g);

		if (size.length === 2) {
			return createIfNotDefault(size[0], size[1]);
		}
	} catch {}
};
