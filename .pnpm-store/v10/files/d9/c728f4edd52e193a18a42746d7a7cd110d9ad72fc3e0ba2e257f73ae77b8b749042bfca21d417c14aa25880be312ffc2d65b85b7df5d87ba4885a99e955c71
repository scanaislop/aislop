import { styleText } from 'node:util';
import { stdout, stdin } from 'node:process';
import * as l from 'node:readline';
import l__default from 'node:readline';
import { wrapAnsi } from 'fast-wrap-ansi';
import { cursor, erase } from 'sisteransi';
import { ReadStream } from 'node:tty';

function findCursor(s, o, l) {
  if (!l.some((r) => !r.disabled))
    return s;
  const t = s + o, n = Math.max(l.length - 1, 0), e = t < 0 ? n : t > n ? 0 : t;
  return l[e]?.disabled ? findCursor(e, o < 0 ? -1 : 1, l) : e;
}
function findTextCursor(s, o, l, i) {
  const t = i.split(`
`);
  let n = 0, e = s;
  for (const r of t) {
    if (e <= r.length)
      break;
    e -= r.length + 1, n++;
  }
  for (n = Math.max(0, Math.min(t.length - 1, n + l)), e = Math.min(e, t[n].length) + o; e < 0 && n > 0; )
    n--, e += t[n].length + 1;
  for (; e > t[n].length && n < t.length - 1; )
    e -= t[n].length + 1, n++;
  e = Math.max(0, Math.min(t[n].length, e));
  let h = 0;
  for (let r = 0; r < n; r++)
    h += t[r].length + 1;
  return h + e;
}

const a$1 = ["up", "down", "left", "right", "space", "enter", "cancel"], t = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const settings = {
  actions: new Set(a$1),
  aliases: /* @__PURE__ */ new Map([
    // vim support
    ["k", "up"],
    ["j", "down"],
    ["h", "left"],
    ["l", "right"],
    ["", "cancel"],
    // opinionated defaults!
    ["escape", "cancel"]
  ]),
  messages: {
    cancel: "Canceled",
    error: "Something went wrong"
  },
  withGuide: true,
  date: {
    monthNames: [...t],
    messages: {
      required: "Please enter a valid date",
      invalidMonth: "There are only 12 months in a year",
      invalidDay: (n, e) => `There are only ${n} days in ${e}`,
      afterMin: (n) => `Date must be on or after ${n.toISOString().slice(0, 10)}`,
      beforeMax: (n) => `Date must be on or before ${n.toISOString().slice(0, 10)}`
    }
  }
};
function updateSettings(n) {
  if (n.aliases !== void 0) {
    const e = n.aliases;
    for (const s in e) {
      if (!Object.hasOwn(e, s)) continue;
      const i = e[s];
      i === void 0 || !settings.actions.has(i) || settings.aliases.has(s) || settings.aliases.set(s, i);
    }
  }
  if (n.messages !== void 0) {
    const e = n.messages;
    e.cancel !== void 0 && (settings.messages.cancel = e.cancel), e.error !== void 0 && (settings.messages.error = e.error);
  }
  if (n.withGuide !== void 0 && (settings.withGuide = n.withGuide !== false), n.date !== void 0) {
    const e = n.date;
    e.monthNames !== void 0 && (settings.date.monthNames = [...e.monthNames]), e.messages !== void 0 && (e.messages.required !== void 0 && (settings.date.messages.required = e.messages.required), e.messages.invalidMonth !== void 0 && (settings.date.messages.invalidMonth = e.messages.invalidMonth), e.messages.invalidDay !== void 0 && (settings.date.messages.invalidDay = e.messages.invalidDay), e.messages.afterMin !== void 0 && (settings.date.messages.afterMin = e.messages.afterMin), e.messages.beforeMax !== void 0 && (settings.date.messages.beforeMax = e.messages.beforeMax));
  }
}
function isActionKey(n, e) {
  if (typeof n == "string")
    return settings.aliases.get(n) === e;
  for (const s of n)
    if (s !== void 0 && isActionKey(s, e))
      return true;
  return false;
}

function diffLines(i, s) {
  if (i === s) return;
  const e = i.split(`
`), t = s.split(`
`), r = Math.max(e.length, t.length), f = [];
  for (let n = 0; n < r; n++)
    e[n] !== t[n] && f.push(n);
  return {
    lines: f,
    numLinesBefore: e.length,
    numLinesAfter: t.length,
    numLines: r
  };
}

const R = globalThis.process.platform.startsWith("win");
const CANCEL_SYMBOL = Symbol("clack:cancel");
function isCancel(e) {
  return e === CANCEL_SYMBOL;
}
function setRawMode(e, r) {
  const o = e;
  o.isTTY && o.setRawMode(r);
}
function block({
  input: e = stdin,
  output: r = stdout,
  overwrite: o = true,
  hideCursor: t = true
} = {}) {
  const s = l.createInterface({
    input: e,
    output: r,
    prompt: "",
    tabSize: 1
  });
  l.emitKeypressEvents(e, s), e instanceof ReadStream && e.isTTY && e.setRawMode(true);
  const n = (f, { name: a, sequence: p }) => {
    const c = String(f);
    if (isActionKey([c, a, p], "cancel")) {
      t && r.write(cursor.show), process.exit(0);
      return;
    }
    if (!o) return;
    const i = a === "return" ? 0 : -1, m = a === "return" ? -1 : 0;
    l.moveCursor(r, i, m, () => {
      l.clearLine(r, 1, () => {
        e.once("keypress", n);
      });
    });
  };
  return t && r.write(cursor.hide), e.once("keypress", n), () => {
    e.off("keypress", n), t && r.write(cursor.show), e instanceof ReadStream && e.isTTY && !R && e.setRawMode(false), s.terminal = false, s.close();
  };
}
const getColumns = (e) => "columns" in e && typeof e.columns == "number" ? e.columns : 80, getRows = (e) => "rows" in e && typeof e.rows == "number" ? e.rows : 20;
function wrapTextWithPrefix(e, r, o, t = o, s = o, n) {
  const f = getColumns(e ?? stdout);
  return wrapAnsi(r, f - o.length, {
    hard: true,
    trim: false
  }).split(`
`).map((c, i, m) => {
    const d = n ? n(c, i) : c;
    return i === 0 ? `${t}${d}` : i === m.length - 1 ? `${s}${d}` : `${o}${d}`;
  }).join(`
`);
}

function runValidation(e, n) {
  if ("~standard" in e) {
    const a = e["~standard"].validate(n);
    if (a instanceof Promise)
      throw new TypeError(
        "Schema validation must be synchronous. Update `validate()` and remove any asynchronous logic."
      );
    return a.issues?.at(0)?.message;
  }
  return e(n);
}

class V {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = /* @__PURE__ */ new Map();
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  constructor(t, e = true) {
    const { input: i = stdin, output: n = stdout, render: s, signal: r, ...o } = t;
    this.opts = o, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = s.bind(this), this._track = e, this._abortSignal = r, this.input = i, this.output = n;
  }
  /**
   * Unsubscribe all listeners
   */
  unsubscribe() {
    this._subscribers.clear();
  }
  /**
   * Set a subscriber with opts
   * @param event - The event name
   */
  setSubscriber(t, e) {
    const i = this._subscribers.get(t) ?? [];
    i.push(e), this._subscribers.set(t, i);
  }
  /**
   * Subscribe to an event
   * @param event - The event name
   * @param cb - The callback
   */
  on(t, e) {
    this.setSubscriber(t, { cb: e });
  }
  /**
   * Subscribe to an event once
   * @param event - The event name
   * @param cb - The callback
   */
  once(t, e) {
    this.setSubscriber(t, { cb: e, once: true });
  }
  /**
   * Emit an event with data
   * @param event - The event name
   * @param data - The data to pass to the callback
   */
  emit(t, ...e) {
    const i = this._subscribers.get(t) ?? [], n = [];
    for (const s of i)
      s.cb(...e), s.once && n.push(() => i.splice(i.indexOf(s), 1));
    for (const s of n)
      s();
  }
  prompt() {
    return new Promise((t) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), t(CANCEL_SYMBOL);
        this._abortSignal.addEventListener(
          "abort",
          () => {
            this.state = "cancel", this.close();
          },
          { once: true }
        );
      }
      this.rl = l__default.createInterface({
        input: this.input,
        tabSize: 2,
        prompt: "",
        escapeCodeTimeout: 50,
        terminal: true
      }), this.rl.prompt(), this.opts.initialUserInput !== void 0 && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), setRawMode(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t(this.value);
      }), this.once("cancel", () => {
        this.output.write(cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t(CANCEL_SYMBOL);
      });
    });
  }
  _isActionKey(t, e) {
    return t === "	";
  }
  _shouldSubmit(t, e) {
    return true;
  }
  _setValue(t) {
    this.value = t, this.emit("value", this.value);
  }
  _setUserInput(t, e) {
    this.userInput = t ?? "", this.emit("userInput", this.userInput), e && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  onKeypress(t, e) {
    if (this._track && e.name !== "return" && (e.name && this._isActionKey(t, e) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), e?.name && (!this._track && settings.aliases.has(e.name) && this.emit("cursor", settings.aliases.get(e.name)), settings.actions.has(e.name) && this.emit("cursor", e.name)), t && (t.toLowerCase() === "y" || t.toLowerCase() === "n") && this.emit("confirm", t.toLowerCase() === "y"), this.emit("key", t, e), e?.name === "return" && this._shouldSubmit(t, e)) {
      if (this.opts.validate) {
        const i = runValidation(this.opts.validate, this.value);
        i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
      }
      this.state !== "error" && (this.state = "submit");
    }
    isActionKey([t, e?.name, e?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), setRawMode(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const t = wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(cursor.move(-999, t * -1));
  }
  render() {
    const t = wrapAnsi(this._render(this) ?? "", process.stdout.columns, {
      hard: true,
      trim: false
    });
    if (t !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(cursor.hide);
      else {
        const e = diffLines(this._prevFrame, t), i = getRows(this.output);
        if (this.restoreCursor(), e) {
          const n = Math.max(0, e.numLinesAfter - i), s = Math.max(0, e.numLinesBefore - i);
          let r = e.lines.find((o) => o >= n);
          if (r === void 0) {
            this._prevFrame = t;
            return;
          }
          if (e.lines.length === 1) {
            this.output.write(cursor.move(0, r - s)), this.output.write(erase.lines(1));
            const o = t.split(`
`);
            this.output.write(o[r]), this._prevFrame = t, this.output.write(cursor.move(0, o.length - r - 1));
            return;
          } else if (e.lines.length > 1) {
            if (n < s)
              r = n;
            else {
              const h = r - s;
              h > 0 && this.output.write(cursor.move(0, h));
            }
            this.output.write(erase.down());
            const f = t.split(`
`).slice(r);
            this.output.write(f.join(`
`)), this._prevFrame = t;
            return;
          }
        }
        this.output.write(erase.down());
      }
      this.output.write(t), this.state === "initial" && (this.state = "active"), this._prevFrame = t;
    }
  }
}

function p$1(l, e) {
  if (l === void 0 || e.length === 0)
    return 0;
  const i = e.findIndex((s) => s.value === l);
  return i !== -1 ? i : 0;
}
function g(l, e) {
  return (e.label ?? String(e.value)).toLowerCase().includes(l.toLowerCase());
}
function m(l, e) {
  if (e)
    return l ? e : e[0];
}
let T$1 = class T extends V {
  filteredOptions;
  multiple;
  isNavigating = false;
  selectedValues = [];
  focusedValue;
  #e = 0;
  #s = "";
  #t;
  #i;
  #n;
  get cursor() {
    return this.#e;
  }
  get userInputWithCursor() {
    if (!this.userInput)
      return styleText(["inverse", "hidden"], "_");
    if (this._cursor >= this.userInput.length)
      return `${this.userInput}\u2588`;
    const e = this.userInput.slice(0, this.cursor), t = this.userInput.slice(this.cursor, this.cursor + 1), i = this.userInput.slice(this.cursor + 1);
    return `${e}${styleText("inverse", t)}${i}`;
  }
  get options() {
    return typeof this.#i == "function" ? this.#i() : this.#i;
  }
  constructor(e) {
    super(e), this.#i = e.options, this.#n = e.placeholder;
    const t = this.options;
    this.filteredOptions = [...t], this.multiple = e.multiple === true, this.#t = typeof e.options == "function" ? e.filter : e.filter ?? g;
    let i;
    if (e.initialValue && Array.isArray(e.initialValue) ? this.multiple ? i = e.initialValue : i = e.initialValue.slice(0, 1) : !this.multiple && this.options.length > 0 && (i = [this.options[0]?.value]), i)
      for (const s of i) {
        const n = t.findIndex((o) => o.value === s);
        n !== -1 && (this.toggleSelected(s), this.#e = n);
      }
    this.focusedValue = this.options[this.#e]?.value, this.on("key", (s, n) => this.#l(s, n)), this.on("userInput", (s) => this.#u(s));
  }
  _isActionKey(e, t) {
    return e === "	" || this.multiple && this.isNavigating && t.name === "space" && e !== void 0 && e !== "";
  }
  #l(e, t) {
    const i = t.name === "up", s = t.name === "down", n = t.name === "return", o = this.userInput === "" || this.userInput === "	", u = this.#n, a = this.options, f = u !== void 0 && u !== "" && a.some(
      (r) => !r.disabled && (this.#t ? this.#t(u, r) : true)
    );
    if (t.name === "tab" && o && f) {
      this.userInput === "	" && this._clearUserInput(), this._setUserInput(u, true), this.isNavigating = false;
      return;
    }
    i || s ? (this.#e = findCursor(this.#e, i ? -1 : 1, this.filteredOptions), this.focusedValue = this.filteredOptions[this.#e]?.value, this.multiple || (this.selectedValues = [this.focusedValue]), this.isNavigating = true) : n ? this.value = m(this.multiple, this.selectedValues) : this.multiple ? this.focusedValue !== void 0 && (t.name === "tab" || this.isNavigating && t.name === "space") ? this.toggleSelected(this.focusedValue) : this.isNavigating = false : (this.focusedValue && (this.selectedValues = [this.focusedValue]), this.isNavigating = false);
  }
  deselectAll() {
    this.selectedValues = [];
  }
  toggleSelected(e) {
    this.filteredOptions.length !== 0 && (this.multiple ? this.selectedValues.includes(e) ? this.selectedValues = this.selectedValues.filter((t) => t !== e) : this.selectedValues = [...this.selectedValues, e] : this.selectedValues = [e]);
  }
  #u(e) {
    if (e !== this.#s) {
      this.#s = e;
      const t = this.options;
      e && this.#t ? this.filteredOptions = t.filter((n) => this.#t?.(e, n)) : this.filteredOptions = [...t];
      const i = p$1(this.focusedValue, this.filteredOptions);
      this.#e = findCursor(i, 0, this.filteredOptions);
      const s = this.filteredOptions[this.#e];
      s && !s.disabled ? this.focusedValue = s.value : this.focusedValue = void 0, this.multiple || (this.focusedValue !== void 0 ? this.toggleSelected(this.focusedValue) : this.deselectAll());
    }
  }
};

class r extends V {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(t) {
    super(t, false), this.value = !!t.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (i) => {
      this.output.write(cursor.move(0, -1)), this.value = i, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}

const _ = {
  Y: { type: "year", len: 4 },
  M: { type: "month", len: 2 },
  D: { type: "day", len: 2 }
};
function M(r) {
  return [...r].map((t) => _[t]);
}
function P(r) {
  const i = new Intl.DateTimeFormat(r, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(2e3, 0, 15)), s = [];
  let n = "/";
  for (const e of i)
    e.type === "literal" ? n = e.value.trim() || e.value : (e.type === "year" || e.type === "month" || e.type === "day") && s.push({ type: e.type, len: e.type === "year" ? 4 : 2 });
  return { segments: s, separator: n };
}
function p(r) {
  return Number.parseInt((r || "0").replace(/_/g, "0"), 10) || 0;
}
function f(r) {
  return {
    year: p(r.year),
    month: p(r.month),
    day: p(r.day)
  };
}
function c(r, t) {
  return new Date(r || 2001, t || 1, 0).getDate();
}
function b(r) {
  const { year: t, month: i, day: s } = f(r);
  if (!t || t < 0 || t > 9999 || !i || i < 1 || i > 12 || !s || s < 1) return;
  const n = new Date(Date.UTC(t, i - 1, s));
  if (!(n.getUTCFullYear() !== t || n.getUTCMonth() !== i - 1 || n.getUTCDate() !== s))
    return { year: t, month: i, day: s };
}
function C(r) {
  const t = b(r);
  return t ? new Date(Date.UTC(t.year, t.month - 1, t.day)) : void 0;
}
function T(r, t, i, s) {
  const n = i ? {
    year: i.getUTCFullYear(),
    month: i.getUTCMonth() + 1,
    day: i.getUTCDate()
  } : null, e = s ? {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth() + 1,
    day: s.getUTCDate()
  } : null;
  return r === "year" ? { min: n?.year ?? 1, max: e?.year ?? 9999 } : r === "month" ? {
    min: n && t.year === n.year ? n.month : 1,
    max: e && t.year === e.year ? e.month : 12
  } : {
    min: n && t.year === n.year && t.month === n.month ? n.day : 1,
    max: e && t.year === e.year && t.month === e.month ? e.day : c(t.year, t.month)
  };
}
class U extends V {
  #i;
  #o;
  #t;
  #h;
  #u;
  #e = { segmentIndex: 0, positionInSegment: 0 };
  #n = true;
  #s = null;
  inlineError = "";
  get segmentCursor() {
    return { ...this.#e };
  }
  get segmentValues() {
    return { ...this.#t };
  }
  get segments() {
    return this.#i;
  }
  get separator() {
    return this.#o;
  }
  get formattedValue() {
    return this.#l(this.#t);
  }
  #l(t) {
    return this.#i.map((i) => t[i.type]).join(this.#o);
  }
  #r() {
    this._setUserInput(this.#l(this.#t)), this._setValue(C(this.#t) ?? void 0);
  }
  constructor(t) {
    const i = t.format ? { segments: M(t.format), separator: t.separator ?? "/" } : P(t.locale), s = t.separator ?? i.separator, n = t.format ? M(t.format) : i.segments, e = t.initialValue ?? t.defaultValue, m = e ? {
      year: String(e.getUTCFullYear()).padStart(4, "0"),
      month: String(e.getUTCMonth() + 1).padStart(2, "0"),
      day: String(e.getUTCDate()).padStart(2, "0")
    } : { year: "____", month: "__", day: "__" }, o = n.map((a) => m[a.type]).join(s);
    super({ ...t, initialUserInput: o }, false), this.#i = n, this.#o = s, this.#t = m, this.#h = t.minDate, this.#u = t.maxDate, this.#r(), this.on("cursor", (a) => this.#f(a)), this.on("key", (a, u) => this.#y(a, u)), this.on("finalize", () => this.#p(t));
  }
  #a() {
    const t = Math.max(0, Math.min(this.#e.segmentIndex, this.#i.length - 1)), i = this.#i[t];
    if (i)
      return this.#e.positionInSegment = Math.max(
        0,
        Math.min(this.#e.positionInSegment, i.len - 1)
      ), { segment: i, index: t };
  }
  #m(t) {
    this.inlineError = "", this.#s = null;
    const i = this.#a();
    i && (this.#e.segmentIndex = Math.max(
      0,
      Math.min(this.#i.length - 1, i.index + t)
    ), this.#e.positionInSegment = 0, this.#n = true);
  }
  #d(t) {
    const i = this.#a();
    if (!i) return;
    const { segment: s } = i, n = this.#t[s.type], e = !n || n.replace(/_/g, "") === "", m = Number.parseInt((n || "0").replace(/_/g, "0"), 10) || 0, o = T(
      s.type,
      f(this.#t),
      this.#h,
      this.#u
    );
    let a;
    e ? a = t === 1 ? o.min : o.max : a = Math.max(Math.min(o.max, m + t), o.min), this.#t = {
      ...this.#t,
      [s.type]: a.toString().padStart(s.len, "0")
    }, this.#n = true, this.#s = null, this.#r();
  }
  #f(t) {
    if (t)
      switch (t) {
        case "right":
          return this.#m(1);
        case "left":
          return this.#m(-1);
        case "up":
          return this.#d(1);
        case "down":
          return this.#d(-1);
      }
  }
  #y(t, i) {
    if (i?.name === "backspace" || i?.sequence === "\x7F" || i?.sequence === "\b" || t === "\x7F" || t === "\b") {
      this.inlineError = "";
      const n = this.#a();
      if (!n) return;
      if (!this.#t[n.segment.type].replace(/_/g, "")) {
        this.#m(-1);
        return;
      }
      this.#t[n.segment.type] = "_".repeat(n.segment.len), this.#n = true, this.#e.positionInSegment = 0, this.#r();
      return;
    }
    if (i?.name === "tab") {
      this.inlineError = "";
      const n = this.#a();
      if (!n) return;
      const e = i.shift ? -1 : 1, m = n.index + e;
      m >= 0 && m < this.#i.length && (this.#e.segmentIndex = m, this.#e.positionInSegment = 0, this.#n = true);
      return;
    }
    if (t && /^[0-9]$/.test(t)) {
      const n = this.#a();
      if (!n) return;
      const { segment: e } = n, m = !this.#t[e.type].replace(/_/g, "");
      if (this.#n && this.#s !== null && !m) {
        const h = this.#s + t, d = { ...this.#t, [e.type]: h }, g = this.#g(d, e);
        if (g) {
          this.inlineError = g, this.#s = null, this.#n = false;
          return;
        }
        this.inlineError = "", this.#t[e.type] = h, this.#s = null, this.#n = false, this.#r(), n.index < this.#i.length - 1 && (this.#e.segmentIndex = n.index + 1, this.#e.positionInSegment = 0, this.#n = true);
        return;
      }
      this.#n && !m && (this.#t[e.type] = "_".repeat(e.len), this.#e.positionInSegment = 0), this.#n = false, this.#s = null;
      const o = this.#t[e.type], a = o.indexOf("_"), u = a >= 0 ? a : Math.min(this.#e.positionInSegment, e.len - 1);
      if (u < 0 || u >= e.len) return;
      let l = o.slice(0, u) + t + o.slice(u + 1), D = false;
      if (u === 0 && o === "__" && (e.type === "month" || e.type === "day")) {
        const h = Number.parseInt(t, 10);
        l = `0${t}`, D = h <= (e.type === "month" ? 1 : 2);
      }
      if (e.type === "year" && (l = (o.replace(/_/g, "") + t).padStart(e.len, "_")), !l.includes("_")) {
        const h = { ...this.#t, [e.type]: l }, d = this.#g(h, e);
        if (d) {
          this.inlineError = d;
          return;
        }
      }
      this.inlineError = "", this.#t[e.type] = l;
      const y = l.includes("_") ? void 0 : b(this.#t);
      if (y) {
        const { year: h, month: d } = y, g = c(h, d);
        this.#t = {
          year: String(Math.max(0, Math.min(9999, h))).padStart(4, "0"),
          month: String(Math.max(1, Math.min(12, d))).padStart(2, "0"),
          day: String(Math.max(1, Math.min(g, y.day))).padStart(2, "0")
        };
      }
      this.#r();
      const S = l.indexOf("_");
      D ? (this.#n = true, this.#s = t) : S >= 0 ? this.#e.positionInSegment = S : a >= 0 && n.index < this.#i.length - 1 ? (this.#e.segmentIndex = n.index + 1, this.#e.positionInSegment = 0, this.#n = true) : this.#e.positionInSegment = Math.min(u + 1, e.len - 1);
    }
  }
  #g(t, i) {
    const { month: s, day: n } = f(t);
    if (i.type === "month" && (s < 0 || s > 12))
      return settings.date.messages.invalidMonth;
    if (i.type === "day" && (n < 0 || n > 31))
      return settings.date.messages.invalidDay(31, "any month");
  }
  #p(t) {
    const { year: i, month: s, day: n } = f(this.#t);
    if (i && s && n) {
      const e = c(i, s);
      this.#t = {
        ...this.#t,
        day: String(Math.min(n, e)).padStart(2, "0")
      };
    }
    this.value = C(this.#t) ?? t.defaultValue ?? void 0;
  }
}

let u$2 = class u extends V {
  options;
  cursor = 0;
  #t;
  getGroupItems(t) {
    return this.options.filter((r) => r.group === t);
  }
  isGroupSelected(t) {
    const r = this.getGroupItems(t), e = this.value;
    return e === void 0 ? false : r.every((s) => e.includes(s.value));
  }
  toggleValue() {
    const t = this.options[this.cursor];
    if (t !== void 0)
      if (this.value === void 0 && (this.value = []), t.group === true) {
        const r = t.value, e = this.getGroupItems(r);
        this.isGroupSelected(r) ? this.value = this.value.filter(
          (s) => e.findIndex((i) => i.value === s) === -1
        ) : this.value = [...this.value, ...e.map((s) => s.value)], this.value = Array.from(new Set(this.value));
      } else {
        const r = this.value.includes(t.value);
        this.value = r ? this.value.filter((e) => e !== t.value) : [...this.value, t.value];
      }
  }
  constructor(t) {
    super(t, false);
    const { options: r } = t;
    this.#t = t.selectableGroups !== false, this.options = Object.entries(r).flatMap(([e, s]) => [
      { value: e, group: true, label: e },
      ...s.map((i) => ({ ...i, group: e }))
    ]), this.value = [...t.initialValues ?? []], this.cursor = Math.max(
      this.options.findIndex(({ value: e }) => e === t.cursorAt),
      this.#t ? 0 : 1
    ), this.on("cursor", (e) => {
      switch (e) {
        case "left":
        case "up": {
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          const s = this.options[this.cursor]?.group === true;
          !this.#t && s && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
          break;
        }
        case "down":
        case "right": {
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          const s = this.options[this.cursor]?.group === true;
          !this.#t && s && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
          break;
        }
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
};

const o = /* @__PURE__ */ new Set(["up", "down", "left", "right"]);
class h extends V {
  #t = false;
  #s;
  focused = "editor";
  get userInputWithCursor() {
    if (this.state === "submit")
      return this.userInput;
    const t = this.userInput;
    if (this.cursor >= t.length)
      return `${t}\u2588`;
    const s = t.slice(0, this.cursor), r = t.slice(this.cursor, this.cursor + 1), i = t.slice(this.cursor + 1);
    return r === `
` ? `${s}\u2588
${i}` : `${s}${styleText("inverse", r)}${i}`;
  }
  get cursor() {
    return this._cursor;
  }
  #r(t) {
    if (this.userInput.length === 0) {
      this._setUserInput(t);
      return;
    }
    this._setUserInput(
      this.userInput.slice(0, this.cursor) + t + this.userInput.slice(this.cursor)
    );
  }
  #i(t) {
    const s = this.value ?? "";
    switch (t) {
      case "up":
        this._cursor = findTextCursor(this._cursor, 0, -1, s);
        return;
      case "down":
        this._cursor = findTextCursor(this._cursor, 0, 1, s);
        return;
      case "left":
        this._cursor = findTextCursor(this._cursor, -1, 0, s);
        return;
      case "right":
        this._cursor = findTextCursor(this._cursor, 1, 0, s);
        return;
    }
  }
  _shouldSubmit(t, s) {
    if (this.#s)
      return this.focused === "submit" ? true : (this.#r(`
`), this._cursor++, false);
    const r = this.#t;
    return this.#t = true, r && this.cursor === this.userInput.length ? (this.userInput[this.cursor - 1] === `
` && (this._setUserInput(
      this.userInput.slice(0, this.cursor - 1) + this.userInput.slice(this.cursor)
    ), this._cursor--), true) : (this.#r(`
`), this._cursor++, false);
  }
  constructor(t) {
    const s = t.initialUserInput ?? t.initialValue;
    super(
      {
        ...t,
        initialUserInput: s
      },
      false
    ), s !== void 0 && (this._cursor = s.length), this.#s = t.showSubmit ?? false, this.on("key", (r, i) => {
      if (i?.name && o.has(i.name)) {
        this.#t = false, this.#i(i.name);
        return;
      }
      if (r === "	" && this.#s) {
        this.focused = this.focused === "editor" ? "submit" : "editor";
        return;
      }
      if (i?.name !== "return") {
        if (this.#t = false, i?.name === "backspace" && this.cursor > 0) {
          this._setUserInput(
            this.userInput.slice(0, this.cursor - 1) + this.userInput.slice(this.cursor)
          ), this._cursor--;
          return;
        }
        if (i?.name === "delete" && this.cursor < this.userInput.length) {
          this._setUserInput(
            this.userInput.slice(0, this.cursor) + this.userInput.slice(this.cursor + 1)
          );
          return;
        }
        r && (this.#s && this.focused === "submit" && (this.focused = "editor"), this.#r(r ?? ""), this._cursor++);
      }
    }), this.on("userInput", (r) => {
      this._setValue(r);
    }), this.on("finalize", () => {
      this.value || (this.value = t.defaultValue), this.value === void 0 && (this.value = "");
    });
  }
}

class a extends V {
  options;
  cursor = 0;
  get _value() {
    return this.options[this.cursor]?.value;
  }
  get _enabledOptions() {
    return this.options.filter((e) => e.disabled !== true);
  }
  toggleAll() {
    const e = this._enabledOptions, i = this.value !== void 0 && this.value.length === e.length;
    this.value = i ? [] : e.map((t) => t.value);
  }
  toggleInvert() {
    const e = this.value;
    if (!e)
      return;
    const i = this._enabledOptions.filter((t) => !e.includes(t.value));
    this.value = i.map((t) => t.value);
  }
  toggleValue() {
    this.value === void 0 && (this.value = []);
    const e = this.value.includes(this._value);
    this.value = e ? this.value.filter((i) => i !== this._value) : [...this.value, this._value];
  }
  constructor(e) {
    super(e, false), this.options = e.options, this.value = [...e.initialValues ?? []];
    const i = Math.max(
      this.options.findIndex(({ value: t }) => t === e.cursorAt),
      0
    );
    this.cursor = this.options[i]?.disabled ? findCursor(i, 1, this.options) : i, this.on("key", (t, l) => {
      l.name === "a" && this.toggleAll(), l.name === "i" && this.toggleInvert();
    }), this.on("cursor", (t) => {
      switch (t) {
        case "left":
        case "up":
          this.cursor = findCursor(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = findCursor(this.cursor, 1, this.options);
          break;
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
}

let u$1 = class u extends V {
  _mask = "\u2022";
  get cursor() {
    return this._cursor;
  }
  get masked() {
    return this.userInput.replaceAll(/./g, this._mask);
  }
  get userInputWithCursor() {
    if (this.state === "submit" || this.state === "cancel")
      return this.masked;
    const t = this.userInput;
    if (this.cursor >= t.length)
      return `${this.masked}${styleText(["inverse", "hidden"], "_")}`;
    const s = this.masked, r = s.slice(0, this.cursor), i = s.slice(this.cursor, this.cursor + 1), o = s.slice(this.cursor + 1);
    return `${r}${styleText("inverse", i)}${o}`;
  }
  clear() {
    this._clearUserInput();
  }
  constructor({ mask: t, ...s }) {
    super(s), this._mask = t ?? "\u2022", this.on("userInput", (r) => {
      this._setValue(r);
    }), this.on("finalize", () => {
      this.value === void 0 && (this.value = "");
    });
  }
};

let n$1 = class n extends V {
  options;
  cursor = 0;
  get _selectedValue() {
    return this.options[this.cursor];
  }
  changeValue() {
    const e = this._selectedValue;
    this.value = e === void 0 ? void 0 : e.value;
  }
  constructor(e) {
    super(e, false), this.options = e.options;
    const o = this.options.findIndex(({ value: s }) => s === e.initialValue), t = o === -1 ? 0 : o;
    this.cursor = this.options[t]?.disabled ? findCursor(t, 1, this.options) : t, this.changeValue(), this.on("cursor", (s) => {
      switch (s) {
        case "left":
        case "up":
          this.cursor = findCursor(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = findCursor(this.cursor, 1, this.options);
          break;
      }
      this.changeValue();
    });
  }
};

class u extends V {
  options;
  cursor = 0;
  constructor(t) {
    super(t, false), this.options = t.options;
    const s = t.caseSensitive === true, i = this.options.map(({ value: [e] }) => s ? e : e?.toLowerCase());
    this.cursor = Math.max(i.indexOf(t.initialValue), 0), this.on("key", (e) => {
      if (!e)
        return;
      const o = s ? e : e.toLowerCase();
      if (!i.includes(o))
        return;
      const n = this.options.find(({ value: [r] }) => s ? r === o : r?.toLowerCase() === o);
      n && (this.value = n.value, this.state = "submit", this.emit("submit"));
    });
  }
}

class n extends V {
  get userInputWithCursor() {
    if (this.state === "submit")
      return this.userInput;
    const t = this.userInput;
    if (this.cursor >= t.length)
      return `${this.userInput}\u2588`;
    const r = t.slice(0, this.cursor), s = t.slice(this.cursor, this.cursor + 1), e = t.slice(this.cursor + 1);
    return `${r}${styleText("inverse", s)}${e}`;
  }
  get cursor() {
    return this._cursor;
  }
  constructor(t) {
    super({
      ...t,
      initialUserInput: t.initialUserInput ?? t.initialValue
    }), this.on("userInput", (r) => {
      this._setValue(r);
    }), this.on("finalize", () => {
      this.value || (this.value = t.defaultValue), this.value === void 0 && (this.value = "");
    });
  }
}

export { T$1 as AutocompletePrompt, r as ConfirmPrompt, U as DatePrompt, u$2 as GroupMultiSelectPrompt, h as MultiLinePrompt, a as MultiSelectPrompt, u$1 as PasswordPrompt, V as Prompt, u as SelectKeyPrompt, n$1 as SelectPrompt, n as TextPrompt, block, getColumns, getRows, isCancel, runValidation, settings, updateSettings, wrapTextWithPrefix };
