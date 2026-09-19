import { getColumns, getRows, AutocompletePrompt, settings, ConfirmPrompt, wrapTextWithPrefix, DatePrompt, runValidation, isCancel, MultiSelectPrompt, GroupMultiSelectPrompt, MultiLinePrompt, PasswordPrompt, block, SelectPrompt, SelectKeyPrompt, TextPrompt } from '@clack/core';
export { isCancel, settings, updateSettings } from '@clack/core';
import { styleText, stripVTControlCharacters } from 'node:util';
import process$1 from 'node:process';
import { wrapAnsi } from 'fast-wrap-ansi';
import l from 'fast-string-width';
import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cursor, erase } from 'sisteransi';

function isUnicodeSupported() {
	if (process$1.platform !== 'win32') {
		return process$1.env.TERM !== 'linux'; // Linux console (kernel)
	}

	return Boolean(process$1.env.CI)
		|| Boolean(process$1.env.WT_SESSION) // Windows Terminal
		|| Boolean(process$1.env.TERMINUS_SUBLIME) // Terminus (<0.2.27)
		|| process$1.env.ConEmuTask === '{cmd::Cmder}' // ConEmu and cmder
		|| process$1.env.TERM_PROGRAM === 'Terminus-Sublime'
		|| process$1.env.TERM_PROGRAM === 'vscode'
		|| process$1.env.TERM === 'xterm-256color'
		|| process$1.env.TERM === 'alacritty'
		|| process$1.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm';
}

const unicode = isUnicodeSupported(), isCI = () => process.env.CI === "true", isTTY = (o) => o.isTTY === true, unicodeOr = (o, e) => unicode ? o : e, S_STEP_ACTIVE = unicodeOr("\u25C6", "*"), S_STEP_CANCEL = unicodeOr("\u25A0", "x"), S_STEP_ERROR = unicodeOr("\u25B2", "x"), S_STEP_SUBMIT = unicodeOr("\u25C7", "o"), S_BAR_START = unicodeOr("\u250C", "T"), S_BAR = unicodeOr("\u2502", "|"), S_BAR_END = unicodeOr("\u2514", "\u2014"), S_BAR_START_RIGHT = unicodeOr("\u2510", "T"), S_BAR_END_RIGHT = unicodeOr("\u2518", "\u2014"), S_RADIO_ACTIVE = unicodeOr("\u25CF", ">"), S_RADIO_INACTIVE = unicodeOr("\u25CB", " "), S_CHECKBOX_ACTIVE = unicodeOr("\u25FB", "[\u2022]"), S_CHECKBOX_SELECTED = unicodeOr("\u25FC", "[+]"), S_CHECKBOX_INACTIVE = unicodeOr("\u25FB", "[ ]"), S_PASSWORD_MASK = unicodeOr("\u25AA", "\u2022"), S_BAR_H = unicodeOr("\u2500", "-"), S_CORNER_TOP_RIGHT = unicodeOr("\u256E", "+"), S_CONNECT_LEFT = unicodeOr("\u251C", "+"), S_CORNER_BOTTOM_RIGHT = unicodeOr("\u256F", "+"), S_CORNER_BOTTOM_LEFT = unicodeOr("\u2570", "+"), S_CORNER_TOP_LEFT = unicodeOr("\u256D", "+"), S_INFO = unicodeOr("\u25CF", "\u2022"), S_SUCCESS = unicodeOr("\u25C6", "*"), S_WARN = unicodeOr("\u25B2", "!"), S_ERROR = unicodeOr("\u25A0", "x"), symbol = (o) => {
  switch (o) {
    case "initial":
    case "active":
      return styleText("cyan", S_STEP_ACTIVE);
    case "cancel":
      return styleText("red", S_STEP_CANCEL);
    case "error":
      return styleText("yellow", S_STEP_ERROR);
    case "submit":
      return styleText("green", S_STEP_SUBMIT);
  }
}, symbolBar = (o) => {
  switch (o) {
    case "initial":
    case "active":
      return styleText("cyan", S_BAR);
    case "cancel":
      return styleText("red", S_BAR);
    case "error":
      return styleText("yellow", S_BAR);
    case "submit":
      return styleText("green", S_BAR);
  }
};
function formatInstructionFooter(o, e) {
  const r = [`${e ? `${styleText("cyan", S_BAR)}  ` : ""}${o.join(" \u2022 ")}`];
  return e && r.push(styleText("cyan", S_BAR_END)), r;
}

const I = (l, e, w, p, b, C = false) => {
  let r = e, O = 0;
  if (C)
    for (let i = p - 1; i >= w; i--) {
      const m = l[i];
      if (m && (r -= m.length), O++, r <= b) break;
    }
  else
    for (let i = w; i < p; i++) {
      const m = l[i];
      if (m && (r -= m.length), O++, r <= b) break;
    }
  return { lineCount: r, removals: O };
};
const limitOptions = ({
  cursor: l,
  options: e,
  style: w,
  output: p = process.stdout,
  maxItems: b = Number.POSITIVE_INFINITY,
  columnPadding: C = 0,
  rowPadding: r = 4
}) => {
  const i = getColumns(p) - C, m = getRows(p), M = styleText("dim", "..."), v = Math.max(m - r, 0), a = Math.max(Math.min(b, v), 5);
  let f = 0;
  l >= a - 3 && (f = Math.max(
    Math.min(l - a + 3, e.length - a),
    0
  ));
  let d = a < e.length && f > 0, c = a < e.length && f + a < e.length;
  const W = Math.min(
    f + a,
    e.length
  ), s = [];
  let g = 0;
  d && g++, c && g++;
  const T = f + (d ? 1 : 0), y = W - (c ? 1 : 0);
  for (let t = T; t < y; t++) {
    const n = e[t], o = n ? w(n, t === l) : "", h = wrapAnsi(o, i, {
      hard: true,
      trim: false
    }).split(`
`);
    s.push(h), g += h.length;
  }
  if (g > v) {
    let t = 0, n = 0, o = g;
    const h = l - T;
    let u = v;
    const L = () => I(s, o, 0, h, u), E = () => I(
      s,
      o,
      h + 1,
      s.length,
      u,
      true
    );
    d ? ({ lineCount: o, removals: t } = L(), o > u && (c || (u -= 1), { lineCount: o, removals: n } = E())) : (c || (u -= 1), { lineCount: o, removals: n } = E(), o > u && (u -= 1, { lineCount: o, removals: t } = L())), t > 0 && (d = true, s.splice(0, t)), n > 0 && (c = true, s.splice(s.length - n, n));
  }
  const x = [];
  d && x.push(M);
  for (const t of s)
    for (const n of t)
      x.push(n);
  return c && x.push(M), x;
};

function P(t) {
  return t.label ?? String(t.value ?? "");
}
function E(t, c) {
  if (!t)
    return true;
  const n = (c.label ?? String(c.value ?? "")).toLowerCase(), i = (c.hint ?? "").toLowerCase(), l = String(c.value).toLowerCase(), o = t.toLowerCase();
  return n.includes(o) || i.includes(o) || l.includes(o);
}
function N(t, c) {
  const n = [];
  for (const i of c)
    t.includes(i.value) && n.push(i);
  return n;
}
const autocomplete = (t) => new AutocompletePrompt({
  options: t.options,
  initialValue: t.initialValue ? [t.initialValue] : void 0,
  initialUserInput: t.initialUserInput,
  placeholder: t.placeholder,
  filter: t.filter ?? ((n, i) => E(n, i)),
  signal: t.signal,
  input: t.input,
  output: t.output,
  validate: t.validate,
  render() {
    const n = t.withGuide ?? settings.withGuide, i = n ? [`${styleText("gray", S_BAR)}`, `${symbol(this.state)}  ${t.message}`] : [`${symbol(this.state)}  ${t.message}`], l = this.userInput, o = this.options, m = t.placeholder, p = l === "" && m !== void 0, $ = (r, s) => {
      const a = P(r), u = r.hint && r.value === this.focusedValue ? styleText("dim", ` (${r.hint})`) : "";
      switch (s) {
        case "active":
          return `${styleText("green", S_RADIO_ACTIVE)} ${a}${u}`;
        case "inactive":
          return `${styleText("dim", S_RADIO_INACTIVE)} ${styleText("dim", a)}`;
        case "disabled":
          return `${styleText("gray", S_RADIO_INACTIVE)} ${styleText(["strikethrough", "gray"], a)}`;
      }
    };
    switch (this.state) {
      case "submit": {
        const r = N(this.selectedValues, o), s = r.length > 0 ? `  ${styleText("dim", r.map(P).join(", "))}` : "", a = n ? styleText("gray", S_BAR) : "";
        return `${i.join(`
`)}
${a}${s}`;
      }
      case "cancel": {
        const r = l ? `  ${styleText(["strikethrough", "dim"], l)}` : "", s = n ? styleText("gray", S_BAR) : "";
        return `${i.join(`
`)}
${s}${r}`;
      }
      default: {
        const r = this.state === "error" ? "yellow" : "cyan", s = n ? `${styleText(r, S_BAR)}  ` : "", a = n ? styleText(r, S_BAR_END) : "";
        let u = "";
        if (this.isNavigating || p) {
          const d = p ? m : l;
          u = d !== "" ? ` ${styleText("dim", d)}` : "";
        } else
          u = ` ${this.userInputWithCursor}`;
        const V = this.filteredOptions.length !== o.length ? styleText(
          "dim",
          ` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? "" : "es"})`
        ) : "", y = this.filteredOptions.length === 0 && l ? [`${s}${styleText("yellow", "No matches found")}`] : [], b = this.state === "error" ? [`${s}${styleText("yellow", this.error)}`] : [];
        n && i.push(`${s.trimEnd()}`), i.push(
          `${s}${styleText("dim", "Search:")}${u}${V}`,
          ...y,
          ...b
        );
        const v = [
          `${styleText("dim", "\u2191/\u2193")} to select`,
          `${styleText("dim", "Enter:")} confirm`,
          `${styleText("dim", "Type:")} to search`
        ], g = [`${s}${v.join(" \u2022 ")}`, a], O = this.filteredOptions.length === 0 ? [] : limitOptions({
          cursor: this.cursor,
          options: this.filteredOptions,
          columnPadding: n ? 3 : 0,
          // for `|  ` when guide is shown
          rowPadding: i.length + g.length,
          style: (d, f) => $(
            d,
            d.disabled ? "disabled" : f ? "active" : "inactive"
          ),
          maxItems: t.maxItems,
          output: t.output
        });
        return [
          ...i,
          ...O.map((d) => `${s}${d}`),
          ...g
        ].join(`
`);
      }
    }
  }
}).prompt(), autocompleteMultiselect = (t) => {
  const c = (i, l, o, m) => {
    const p = o.includes(i.value), $ = i.label ?? String(i.value ?? ""), r = i.hint && m !== void 0 && i.value === m ? styleText("dim", ` (${i.hint})`) : "", s = p ? styleText("green", S_CHECKBOX_SELECTED) : styleText("dim", S_CHECKBOX_INACTIVE);
    return i.disabled ? `${styleText("gray", S_CHECKBOX_INACTIVE)} ${styleText(["strikethrough", "gray"], $)}` : l ? `${s} ${$}${r}` : `${s} ${styleText("dim", $)}`;
  }, n = new AutocompletePrompt({
    options: t.options,
    multiple: true,
    placeholder: t.placeholder,
    filter: t.filter ?? ((i, l) => E(i, l)),
    validate: () => {
      if (t.required && n.selectedValues.length === 0)
        return "Please select at least one item";
    },
    initialValue: t.initialValues,
    signal: t.signal,
    input: t.input,
    output: t.output,
    render() {
      const i = t.withGuide ?? settings.withGuide, l = `${i ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${t.message}
`, o = this.userInput, m = t.placeholder, p = o === "" && m !== void 0, $ = this.isNavigating || p ? styleText("dim", p ? m : o) : this.userInputWithCursor, r = this.options, s = this.filteredOptions.length !== r.length ? styleText(
        "dim",
        ` (${this.filteredOptions.length} match${this.filteredOptions.length === 1 ? "" : "es"})`
      ) : "";
      switch (this.state) {
        case "submit":
          return `${l}${i ? `${styleText("gray", S_BAR)}  ` : ""}${styleText(
            "dim",
            `${this.selectedValues.length} items selected`
          )}`;
        case "cancel":
          return `${l}${i ? `${styleText("gray", S_BAR)}  ` : ""}${styleText(
            ["strikethrough", "dim"],
            o
          )}`;
        default: {
          const a = this.state === "error" ? "yellow" : "cyan", u = i ? `${styleText(a, S_BAR)}  ` : "", V = i ? styleText(a, S_BAR_END) : "", y = [
            `${styleText("dim", "\u2191/\u2193")} to navigate`,
            `${styleText("dim", this.isNavigating ? "Space/Tab:" : "Tab:")} select`,
            `${styleText("dim", "Enter:")} confirm`,
            `${styleText("dim", "Type:")} to search`
          ], b = this.filteredOptions.length === 0 && o ? [`${u}${styleText("yellow", "No matches found")}`] : [], v = this.state === "error" ? [`${u}${styleText("yellow", this.error)}`] : [], g = [
            ...`${l}${i ? styleText(a, S_BAR) : ""}`.split(`
`),
            `${u}${styleText("dim", "Search:")} ${$}${s}`,
            ...b,
            ...v
          ], O = [`${u}${y.join(" \u2022 ")}`, V], d = limitOptions({
            cursor: this.cursor,
            options: this.filteredOptions,
            style: (f, _) => c(f, _, this.selectedValues, this.focusedValue),
            maxItems: t.maxItems,
            output: t.output,
            rowPadding: g.length + O.length
          });
          return [
            ...g,
            ...d.map((f) => `${u}${f}`),
            ...O
          ].join(`
`);
        }
      }
    }
  });
  return n.prompt();
};

const J = [
  S_CORNER_TOP_LEFT,
  S_CORNER_TOP_RIGHT,
  S_CORNER_BOTTOM_LEFT,
  S_CORNER_BOTTOM_RIGHT
], K = [S_BAR_START, S_BAR_START_RIGHT, S_BAR_END, S_BAR_END_RIGHT];
function A$1(n, e, t, o) {
  let i = t, f = t;
  return o === "center" ? i = Math.floor((e - n) / 2) : o === "right" && (i = e - n - t), f = e - i - n, [i, f];
}
const Q = (n) => n;
const box = (n = "", e = "", t) => {
  const o = t?.output ?? process.stdout, i = getColumns(o), R = 1 * 2, u = t?.titlePadding ?? 1, h = t?.contentPadding ?? 2, w = t?.width === void 0 || t.width === "auto" ? 1 : Math.min(1, t.width), m = t?.withGuide ?? settings.withGuide ? `${S_BAR} ` : "", b = t?.formatBorder ?? Q, a = (t?.rounded ? J : K).map(b), _ = b(S_BAR_H), B = b(S_BAR), p = l(m), x = l(e), O = i - p;
  let r = Math.floor(i * w) - p;
  if (t?.width === "auto") {
    const c = n.split(`
`);
    let s = x + u * 2;
    for (const G of c) {
      const P = l(G) + h * 2;
      P > s && (s = P);
    }
    const g = s + R;
    g < r && (r = g);
  }
  r % 2 !== 0 && (r < O ? r++ : r--);
  const d = r - R, S = d - u * 2, T = x > S ? `${e.slice(0, S - 3)}...` : e, [y, W] = A$1(
    l(T),
    d,
    u,
    t?.titleAlign
  ), L = wrapAnsi(n, d - h * 2, {
    hard: true,
    trim: false
  });
  o.write(
    `${m}${a[0]}${_.repeat(y)}${T}${_.repeat(W)}${a[1]}
`
  );
  const E = L.split(`
`);
  for (const c of E) {
    const [s, g] = A$1(
      l(c),
      d,
      h,
      t?.contentAlign
    );
    o.write(
      `${m}${B}${" ".repeat(s)}${c}${" ".repeat(g)}${B}
`
    );
  }
  o.write(`${m}${a[2]}${_.repeat(d)}${a[3]}
`);
};

const confirm = (i) => {
  const a = i.active ?? "Yes", s = i.inactive ?? "No";
  return new ConfirmPrompt({
    active: a,
    inactive: s,
    signal: i.signal,
    input: i.input,
    output: i.output,
    initialValue: i.initialValue ?? true,
    render() {
      const e = i.withGuide ?? settings.withGuide, u = `${symbol(this.state)}  `, l = e ? `${styleText("gray", S_BAR)}  ` : "", f = wrapTextWithPrefix(
        i.output,
        i.message,
        l,
        u
      ), o = `${e ? `${styleText("gray", S_BAR)}
` : ""}${f}
`, c = this.value ? a : s;
      switch (this.state) {
        case "submit": {
          const r = e ? `${styleText("gray", S_BAR)}  ` : "";
          return `${o}${r}${styleText("dim", c)}`;
        }
        case "cancel": {
          const r = e ? `${styleText("gray", S_BAR)}  ` : "";
          return `${o}${r}${styleText(["strikethrough", "dim"], c)}${e ? `
${styleText("gray", S_BAR)}` : ""}`;
        }
        default: {
          const r = e ? `${styleText("cyan", S_BAR)}  ` : "", g = e ? styleText("cyan", S_BAR_END) : "";
          return `${o}${r}${this.value ? `${styleText("green", S_RADIO_ACTIVE)} ${a}` : `${styleText("dim", S_RADIO_INACTIVE)} ${styleText("dim", a)}`}${i.vertical ? e ? `
${styleText("cyan", S_BAR)}  ` : `
` : ` ${styleText("dim", "/")} `}${this.value ? `${styleText("dim", S_RADIO_INACTIVE)} ${styleText("dim", s)}` : `${styleText("green", S_RADIO_ACTIVE)} ${s}`}
${g}
`;
        }
      }
    }
  }).prompt();
};

const date = (e) => {
  const r = e.validate;
  return new DatePrompt({
    ...e,
    validate(t) {
      if (t === void 0)
        return e.defaultValue !== void 0 ? void 0 : r ? runValidation(r, t) : settings.date.messages.required;
      const o = (i) => i.toISOString().slice(0, 10);
      if (e.minDate && o(t) < o(e.minDate))
        return settings.date.messages.afterMin(e.minDate);
      if (e.maxDate && o(t) > o(e.maxDate))
        return settings.date.messages.beforeMax(e.maxDate);
      if (r) return runValidation(r, t);
    },
    render() {
      const t = (e?.withGuide ?? settings.withGuide) !== false, i = `${`${t ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  `}${e.message}
`, l = this.state !== "initial" ? this.state : "active", d = b(this, l), c = this.value instanceof Date ? this.formattedValue : "";
      switch (this.state) {
        case "error": {
          const a = this.error ? `  ${styleText("yellow", this.error)}` : "", s = t ? `${styleText("yellow", S_BAR)}  ` : "", f = t ? styleText("yellow", S_BAR_END) : "";
          return `${i.trim()}
${s}${d}
${f}${a}
`;
        }
        case "submit": {
          const a = c ? `  ${styleText("dim", c)}` : "", s = t ? styleText("gray", S_BAR) : "";
          return `${i}${s}${a}`;
        }
        case "cancel": {
          const a = c ? `  ${styleText(["strikethrough", "dim"], c)}` : "", s = t ? styleText("gray", S_BAR) : "";
          return `${i}${s}${a}${c.trim() ? `
${s}` : ""}`;
        }
        default: {
          const a = t ? `${styleText("cyan", S_BAR)}  ` : "", s = t ? styleText("cyan", S_BAR_END) : "", f = t ? `${styleText("cyan", S_BAR)}  ` : "", g = this.inlineError ? `
${f}${styleText("yellow", this.inlineError)}` : "";
          return `${i}${a}${d}${g}
${s}
`;
        }
      }
    }
  }).prompt();
};
function b(e, r) {
  const t = e.segmentValues, o = e.segmentCursor;
  if (r === "submit" || r === "cancel")
    return e.formattedValue;
  const i = styleText("gray", e.separator);
  return e.segments.map((l, d) => {
    const c = d === o.segmentIndex && !["submit", "cancel"].includes(r), a = p[l.type];
    return x(t[l.type], { isActive: c, label: a });
  }).join(i);
}
function x(e, r) {
  const t = !e || e.replace(/_/g, "") === "";
  return r.isActive ? styleText("inverse", t ? r.label : e.replace(/_/g, " ")) : t ? styleText("dim", r.label) : e.replace(/_/g, styleText("dim", " "));
}
const p = {
  year: "yyyy",
  month: "mm",
  day: "dd"
};

const group = async (o, r) => {
  const t = {}, p = Object.keys(o);
  for (const e of p) {
    const i = o[e], n = await i({ results: t })?.catch((a) => {
      throw a;
    });
    if (typeof r?.onCancel == "function" && isCancel(n)) {
      t[e] = "canceled", r.onCancel({ results: t });
      continue;
    }
    t[e] = n;
  }
  return t;
};

const MULTISELECT_INSTRUCTIONS = [
  `${styleText("dim", "\u2191/\u2193")} to navigate`,
  `${styleText("dim", "Space:")} select`,
  `${styleText("dim", "Enter:")} confirm`
];
const m = (i, u) => i.split(`
`).map((d) => u(d)).join(`
`);
const multiselect = (i) => {
  const u = (t, a) => {
    const r = t.label ?? String(t.value);
    return a === "disabled" ? `${styleText("gray", S_CHECKBOX_INACTIVE)} ${m(r, (o) => styleText(["strikethrough", "gray"], o))}${t.hint ? ` ${styleText("dim", `(${t.hint ?? "disabled"})`)}` : ""}` : a === "active" ? `${styleText("cyan", S_CHECKBOX_ACTIVE)} ${r}${t.hint ? ` ${styleText("dim", `(${t.hint})`)}` : ""}` : a === "selected" ? `${styleText("green", S_CHECKBOX_SELECTED)} ${m(r, (o) => styleText("dim", o))}${t.hint ? ` ${styleText("dim", `(${t.hint})`)}` : ""}` : a === "cancelled" ? `${m(r, (o) => styleText(["strikethrough", "dim"], o))}` : a === "active-selected" ? `${styleText("green", S_CHECKBOX_SELECTED)} ${r}${t.hint ? ` ${styleText("dim", `(${t.hint})`)}` : ""}` : a === "submitted" ? `${m(r, (o) => styleText("dim", o))}` : `${styleText("dim", S_CHECKBOX_INACTIVE)} ${m(r, (o) => styleText("dim", o))}`;
  }, d = i.required ?? true, v = i.showInstructions ?? true;
  return new MultiSelectPrompt({
    options: i.options,
    signal: i.signal,
    input: i.input,
    output: i.output,
    initialValues: i.initialValues,
    required: d,
    cursorAt: i.cursorAt,
    validate(t) {
      if (d && (t === void 0 || t.length === 0))
        return `Please select at least one option.
${styleText(
          "reset",
          styleText(
            "dim",
            `Press ${styleText(["gray", "bgWhite", "inverse"], " space ")} to select, ${styleText(
              "gray",
              styleText("bgWhite", styleText("inverse", " enter "))
            )} to submit`
          )
        )}`;
    },
    render() {
      const t = i.withGuide ?? settings.withGuide, a = wrapTextWithPrefix(
        i.output,
        i.message,
        t ? `${symbolBar(this.state)}  ` : "",
        `${symbol(this.state)}  `
      ), r = `${t ? `${styleText("gray", S_BAR)}
` : ""}${a}
`, o = this.value ?? [], p = (n, l) => {
        if (n.disabled)
          return u(n, "disabled");
        const s = o.includes(n.value);
        return l && s ? u(n, "active-selected") : s ? u(n, "selected") : u(n, l ? "active" : "inactive");
      };
      switch (this.state) {
        case "submit": {
          const n = this.options.filter(({ value: s }) => o.includes(s)).map((s) => u(s, "submitted")).join(styleText("dim", ", ")) || styleText("dim", "none"), l = wrapTextWithPrefix(
            i.output,
            n,
            t ? `${styleText("gray", S_BAR)}  ` : ""
          );
          return `${r}${l}`;
        }
        case "cancel": {
          const n = this.options.filter(({ value: s }) => o.includes(s)).map((s) => u(s, "cancelled")).join(styleText("dim", ", "));
          if (n.trim() === "")
            return `${r}${styleText("gray", S_BAR)}`;
          const l = wrapTextWithPrefix(
            i.output,
            n,
            t ? `${styleText("gray", S_BAR)}  ` : ""
          );
          return `${r}${l}${t ? `
${styleText("gray", S_BAR)}` : ""}`;
        }
        case "error": {
          const n = t ? `${styleText("yellow", S_BAR)}  ` : "", l = this.error.split(`
`).map(
            ($, C) => C === 0 ? `${t ? `${styleText("yellow", S_BAR_END)}  ` : ""}${styleText("yellow", $)}` : `   ${$}`
          ).join(`
`), s = r.split(`
`).length, h = l.split(`
`).length + 1;
          return `${r}${n}${limitOptions({
            output: i.output,
            options: this.options,
            cursor: this.cursor,
            maxItems: i.maxItems,
            columnPadding: n.length,
            rowPadding: s + h,
            style: p
          }).join(`
${n}`)}
${l}
`;
        }
        default: {
          const n = t ? `${styleText("cyan", S_BAR)}  ` : "", l = r.split(`
`).length, s = v ? formatInstructionFooter(MULTISELECT_INSTRUCTIONS, t) : t ? [styleText("cyan", S_BAR_END)] : [], h = s.join(`
`), $ = s.length + 1;
          return `${r}${n}${limitOptions({
            output: i.output,
            options: this.options,
            cursor: this.cursor,
            maxItems: i.maxItems,
            columnPadding: n.length,
            rowPadding: l + $,
            style: p
          }).join(`
${n}`)}
${h}
`;
        }
      }
    }
  }).prompt();
};

const groupMultiselect = (o) => {
  const { selectableGroups: h = true, groupSpacing: x = 0 } = o, m = (n, l, g = []) => {
    const a = n.label ?? String(n.value), t = typeof n.group == "string", s = t && (g[g.indexOf(n) + 1] ?? { group: true }), u = t && s && s.group === true;
    let r = "", c = "";
    t && (h ? (r = u ? `${S_BAR_END} ` : `${S_BAR} `, c = u ? "  " : `${S_BAR} `) : r = "  ");
    let i = "";
    if (x > 0 && !t && (i = `
`.repeat(x)), l === "active")
      return wrapTextWithPrefix(
        o.output,
        `${a}${n.hint ? ` ${styleText("dim", `(${n.hint})`)}` : ""}`,
        `${i}${styleText("dim", r)} `,
        `${i}${styleText("dim", r)}${styleText("cyan", S_CHECKBOX_ACTIVE)} `,
        `${i}${styleText("dim", c)} `
      );
    if (l === "group-active")
      return wrapTextWithPrefix(
        o.output,
        a,
        `${i}${r} `,
        `${i}${r}${styleText("cyan", S_CHECKBOX_ACTIVE)} `,
        `${i}${c} `,
        (d) => styleText("dim", d)
      );
    if (l === "group-active-selected")
      return wrapTextWithPrefix(
        o.output,
        a,
        `${i}${r} `,
        `${i}${r}${styleText("green", S_CHECKBOX_SELECTED)} `,
        `${i}${c} `,
        (d) => styleText("dim", d)
      );
    if (l === "selected") {
      const d = t || h ? styleText("green", S_CHECKBOX_SELECTED) : "";
      return wrapTextWithPrefix(
        o.output,
        `${a}${n.hint ? ` (${n.hint})` : ""}`,
        `${i}${styleText("dim", r)} `,
        `${i}${styleText("dim", r)}${d} `,
        `${i}${styleText("dim", c)} `,
        (S) => styleText("dim", S)
      );
    }
    if (l === "cancelled")
      return `${styleText(["strikethrough", "dim"], a)}`;
    if (l === "active-selected")
      return wrapTextWithPrefix(
        o.output,
        `${a}${n.hint ? ` ${styleText("dim", `(${n.hint})`)}` : ""}`,
        `${i}${styleText("dim", r)} `,
        `${i}${styleText("dim", r)}${styleText("green", S_CHECKBOX_SELECTED)} `,
        `${i}${styleText("dim", c)} `
      );
    if (l === "submitted")
      return `${styleText("dim", a)}`;
    const f = t || h ? styleText("dim", S_CHECKBOX_INACTIVE) : "";
    return wrapTextWithPrefix(
      o.output,
      a,
      `${i}${styleText("dim", r)} `,
      `${i}${styleText("dim", r)}${f} `,
      `${i}${styleText("dim", c)} `,
      (d) => styleText("dim", d)
    );
  }, y = o.required ?? true, I = o.showInstructions ?? true;
  return new GroupMultiSelectPrompt({
    options: o.options,
    signal: o.signal,
    input: o.input,
    output: o.output,
    initialValues: o.initialValues,
    required: y,
    cursorAt: o.cursorAt,
    selectableGroups: h,
    validate(n) {
      if (y && (n === void 0 || n.length === 0))
        return `Please select at least one option.
${styleText(
          "reset",
          styleText(
            "dim",
            `Press ${styleText(["gray", "bgWhite", "inverse"], " space ")} to select, ${styleText(
              "gray",
              styleText(["bgWhite", "inverse"], " enter ")
            )} to submit`
          )
        )}`;
    },
    render() {
      const n = o.withGuide ?? settings.withGuide, l = `${n ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${o.message}
`, g = this.value ?? [], a = (t, s) => {
        const u = this.options, r = g.includes(t.value) || t.group === true && this.isGroupSelected(`${t.value}`);
        return !s && typeof t.group == "string" && this.options[this.cursor]?.value === t.group ? m(t, r ? "group-active-selected" : "group-active", u) : s && r ? m(t, "active-selected", u) : r ? m(t, "selected", u) : m(t, s ? "active" : "inactive", u);
      };
      switch (this.state) {
        case "submit": {
          const t = this.options.filter(({ value: u }) => g.includes(u)).map((u) => m(u, "submitted")), s = t.length === 0 ? "" : `  ${t.join(styleText("dim", ", "))}`;
          return `${l}${n ? styleText("gray", S_BAR) : ""}${s}`;
        }
        case "cancel": {
          const t = this.options.filter(({ value: s }) => g.includes(s)).map((s) => m(s, "cancelled")).join(styleText("dim", ", "));
          return `${l}${n ? `${styleText("gray", S_BAR)}  ` : ""}${t.trim() ? `${t}${n ? `
${styleText("gray", S_BAR)}` : ""}` : ""}`;
        }
        case "error": {
          const t = n ? `${styleText("yellow", S_BAR)}  ` : "", s = this.error.split(`
`).map(
            (i, f) => f === 0 ? `${n ? `${styleText("yellow", S_BAR_END)}  ` : ""}${styleText("yellow", i)}` : `   ${i}`
          ).join(`
`), u = l.split(`
`).length, r = s.split(`
`).length + 1, c = limitOptions({
            output: o.output,
            options: this.options,
            cursor: this.cursor,
            maxItems: o.maxItems,
            columnPadding: t.length,
            rowPadding: u + r,
            style: a
          }).join(`
${t}`);
          return `${l}${t}${c}
${s}
`;
        }
        default: {
          const t = n ? `${styleText("cyan", S_BAR)}  ` : "", s = l.split(`
`).length, u = I ? formatInstructionFooter(MULTISELECT_INSTRUCTIONS, n) : n ? [styleText("cyan", S_BAR_END)] : [], r = u.join(`
`), c = u.length + 1, i = limitOptions({
            output: o.output,
            options: this.options,
            cursor: this.cursor,
            maxItems: o.maxItems,
            columnPadding: t.length,
            rowPadding: s + c,
            style: a
          }).join(`
${t}`);
          return `${l}${t}${i}
${r}
`;
        }
      }
    }
  }).prompt();
};

const log = {
  message: (s = [], {
    symbol: e = styleText("gray", S_BAR),
    secondarySymbol: r = styleText("gray", S_BAR),
    output: m = process.stdout,
    spacing: l = 1,
    withGuide: c
  } = {}) => {
    const t = [], o = c ?? settings.withGuide, f = o ? r : "", O = o ? `${e}  ` : "", u = o ? `${r}  ` : "";
    for (let i = 0; i < l; i++)
      t.push(f);
    const g = Array.isArray(s) ? s : s.split(`
`);
    if (g.length > 0) {
      const [i, ...y] = g;
      i.length > 0 ? t.push(`${O}${i}`) : t.push(o ? e : "");
      for (const p of y)
        p.length > 0 ? t.push(`${u}${p}`) : t.push(o ? r : "");
    }
    m.write(`${t.join(`
`)}
`);
  },
  info: (s, e) => {
    log.message(s, { ...e, symbol: styleText("blue", S_INFO) });
  },
  success: (s, e) => {
    log.message(s, { ...e, symbol: styleText("green", S_SUCCESS) });
  },
  step: (s, e) => {
    log.message(s, { ...e, symbol: styleText("green", S_STEP_SUBMIT) });
  },
  warn: (s, e) => {
    log.message(s, { ...e, symbol: styleText("yellow", S_WARN) });
  },
  /** alias for `log.warn()`. */
  warning: (s, e) => {
    log.warn(s, e);
  },
  error: (s, e) => {
    log.message(s, { ...e, symbol: styleText("red", S_ERROR) });
  }
};

const cancel = (o = "", t) => {
  const i = t?.output ?? process.stdout, e = t?.withGuide ?? settings.withGuide ? `${styleText("gray", S_BAR_END)}  ` : "";
  i.write(`${e}${styleText("red", o)}

`);
}, intro = (o = "", t) => {
  const i = t?.output ?? process.stdout, e = t?.withGuide ?? settings.withGuide ? `${styleText("gray", S_BAR_START)}  ` : "";
  i.write(`${e}${o}
`);
}, outro = (o = "", t) => {
  const i = t?.output ?? process.stdout, e = t?.withGuide ?? settings.withGuide ? `${styleText("gray", S_BAR)}
${styleText("gray", S_BAR_END)}  ` : "";
  i.write(`${e}${o}

`);
};

const multiline = (e) => new MultiLinePrompt({
  validate: e.validate,
  placeholder: e.placeholder,
  defaultValue: e.defaultValue,
  initialValue: e.initialValue,
  showSubmit: e.showSubmit,
  output: e.output,
  signal: e.signal,
  input: e.input,
  render() {
    const i = e?.withGuide ?? settings.withGuide, o = `${`${i ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  `}${e.message}
`, m = e.placeholder && e.placeholder.length > 0 ? (
      // biome-ignore lint/style/noNonNullAssertion: guarded by placeholder.length > 0
      styleText("inverse", e.placeholder[0]) + styleText("dim", e.placeholder.slice(1))
    ) : styleText(["inverse", "hidden"], "_"), a = this.userInput ? this.userInputWithCursor : m, l = this.value ?? "", c = e.showSubmit ? `
  ${styleText(this.focused === "submit" ? "cyan" : "dim", "[ submit ]")}` : "";
    switch (this.state) {
      case "error": {
        const n = `${styleText("yellow", S_BAR)}  `, r = i ? wrapTextWithPrefix(e.output, a, n, void 0) : a, u = styleText("yellow", S_BAR_END);
        return `${o}${r}
${u}  ${styleText("yellow", this.error)}${c}
`;
      }
      case "submit": {
        const n = `${styleText("gray", S_BAR)}  `, r = i ? wrapTextWithPrefix(
          e.output,
          l,
          n,
          void 0,
          void 0,
          (u) => styleText("dim", u)
        ) : l ? styleText("dim", l) : "";
        return `${o}${r}`;
      }
      case "cancel": {
        const n = `${styleText("gray", S_BAR)}  `, r = i ? wrapTextWithPrefix(
          e.output,
          l,
          n,
          void 0,
          void 0,
          (u) => styleText(["strikethrough", "dim"], u)
        ) : l ? styleText(["strikethrough", "dim"], l) : "";
        return `${o}${r}`;
      }
      default: {
        const n = i ? `${styleText("cyan", S_BAR)}  ` : "", r = i ? styleText("cyan", S_BAR_END) : "", u = i ? wrapTextWithPrefix(e.output, a, n) : a;
        return `${o}${u}
${r}${c}
`;
      }
    }
  }
}).prompt();

const W$1 = (o) => o, C = (o, e, s) => {
  const a = {
    hard: true,
    trim: false
  }, i = wrapAnsi(o, e, a).split(`
`), c = i.reduce((n, t) => Math.max(l(t), n), 0), u = i.map(s).reduce((n, t) => Math.max(l(t), n), 0), g = e - (u - c);
  return wrapAnsi(o, g, a);
};
const note = (o = "", e = "", s) => {
  const a = s?.output ?? process$1.stdout, i = s?.withGuide ?? settings.withGuide, c = s?.format ?? W$1, g = ["", ...C(o, getColumns(a) - 6, c).split(`
`).map(c), ""], n = l(e), t = Math.max(
    g.reduce((m, F) => {
      const O = l(F);
      return O > m ? O : m;
    }, 0),
    n
  ) + 2, h = g.map(
    (m) => `${styleText("gray", S_BAR)}  ${m}${" ".repeat(t - l(m))}${styleText("gray", S_BAR)}`
  ).join(`
`), T = i ? `${styleText("gray", S_BAR)}
` : "", l$1 = i ? S_CONNECT_LEFT : S_CORNER_BOTTOM_LEFT;
  a.write(
    `${T}${styleText("green", S_STEP_SUBMIT)}  ${styleText("reset", e)} ${styleText(
      "gray",
      S_BAR_H.repeat(Math.max(t - n - 1, 1)) + S_CORNER_TOP_RIGHT
    )}
${h}
${styleText("gray", l$1 + S_BAR_H.repeat(t + 2) + S_CORNER_BOTTOM_RIGHT)}
`
  );
};

const password = (r) => new PasswordPrompt({
  validate: r.validate,
  mask: r.mask ?? S_PASSWORD_MASK,
  signal: r.signal,
  input: r.input,
  output: r.output,
  render() {
    const e = r.withGuide ?? settings.withGuide, o = `${e ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${r.message}
`, c = this.userInputWithCursor, i = this.masked;
    switch (this.state) {
      case "error": {
        const s = e ? `${styleText("yellow", S_BAR)}  ` : "", n = e ? `${styleText("yellow", S_BAR_END)}  ` : "", l = i ?? "";
        return r.clearOnError && this.clear(), `${o.trim()}
${s}${l}
${n}${styleText("yellow", this.error)}
`;
      }
      case "submit": {
        const s = e ? `${styleText("gray", S_BAR)}  ` : "", n = i ? styleText("dim", i) : "";
        return `${o}${s}${n}`;
      }
      case "cancel": {
        const s = e ? `${styleText("gray", S_BAR)}  ` : "", n = i ? styleText(["strikethrough", "dim"], i) : "";
        return `${o}${s}${n}${i && e ? `
${styleText("gray", S_BAR)}` : ""}`;
      }
      default: {
        const s = e ? `${styleText("cyan", S_BAR)}  ` : "", n = e ? styleText("cyan", S_BAR_END) : "";
        return `${o}${s}${c}
${n}
`;
      }
    }
  }
}).prompt();

const path = (e) => {
  const a = e.validate;
  return autocomplete({
    ...e,
    initialUserInput: e.initialValue ?? e.root ?? process.cwd(),
    maxItems: 5,
    validate(t) {
      if (!Array.isArray(t)) {
        if (!t)
          return "Please select a path";
        if (a)
          return runValidation(a, t);
      }
    },
    options() {
      const t = this.userInput;
      if (t === "")
        return [];
      try {
        let i;
        existsSync(t) ? lstatSync(t).isDirectory() && (!e.directory || t.endsWith("/")) ? i = t : i = dirname(t) : i = dirname(t);
        const c = t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
        return readdirSync(i).map((r) => {
          const n = join(i, r), m = lstatSync(n);
          return {
            name: r,
            path: n,
            isDirectory: m.isDirectory()
          };
        }).filter(
          ({ path: r, isDirectory: n }) => r.startsWith(c) && (n || !e.directory)
        ).map((r) => ({
          value: r.path
        }));
      } catch {
        return [];
      }
    }
  });
};

const W = (l) => styleText("magenta", l);
const spinner = ({
  indicator: l = "dots",
  onCancel: h,
  output: n = process.stdout,
  cancelMessage: G,
  errorMessage: O,
  frames: E = unicode ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"],
  delay: F = unicode ? 80 : 120,
  signal: m,
  ...I
} = {}) => {
  const u = isCI();
  let M, T, d = false, S = false, s = "", p, w = performance.now();
  const x = getColumns(n), k = I?.styleFrame ?? W, g = (e) => {
    const r = e > 1 ? O ?? settings.messages.error : G ?? settings.messages.cancel;
    S = e === 1, d && (a(r, e), S && typeof h == "function" && h());
  }, f = () => g(2), i = () => g(1), A = () => {
    process.on("uncaughtExceptionMonitor", f), process.on("unhandledRejection", f), process.on("SIGINT", i), process.on("SIGTERM", i), process.on("exit", g), m && m.addEventListener("abort", i);
  }, H = () => {
    process.removeListener("uncaughtExceptionMonitor", f), process.removeListener("unhandledRejection", f), process.removeListener("SIGINT", i), process.removeListener("SIGTERM", i), process.removeListener("exit", g), m && m.removeEventListener("abort", i);
  }, y = () => {
    if (p === void 0) return;
    u && n.write(`
`);
    const r = wrapAnsi(p, x, {
      hard: true,
      trim: false
    }).split(`
`);
    r.length > 1 && n.write(cursor.up(r.length - 1)), n.write(cursor.to(0)), n.write(erase.down());
  }, C = (e) => e.replace(/\.+$/, ""), _ = (e) => {
    const r = (performance.now() - e) / 1e3, t = Math.floor(r / 60), o = Math.floor(r % 60);
    return t > 0 ? `[${t}m ${o}s]` : `[${o}s]`;
  }, N = I.withGuide ?? settings.withGuide, P = (e = "") => {
    d = true, M = block({ output: n }), s = C(e), w = performance.now(), N && n.write(`${styleText("gray", S_BAR)}
`);
    let r = 0, t = 0;
    A(), T = setInterval(() => {
      if (u && s === p)
        return;
      y(), p = s;
      const o = k(E[r]);
      let v;
      if (u)
        v = `${o}  ${s}...`;
      else if (l === "timer")
        v = `${o}  ${s} ${_(w)}`;
      else {
        const B = ".".repeat(Math.floor(t)).slice(0, 3);
        v = `${o}  ${s}${B}`;
      }
      const j = wrapAnsi(v, x, {
        hard: true,
        trim: false
      });
      n.write(j), r = r + 1 < E.length ? r + 1 : 0, t = t < 4 ? t + 0.125 : 0;
    }, F);
  }, a = (e = "", r = 0, t = false) => {
    if (!d) return;
    d = false, clearInterval(T), y();
    const o = r === 0 ? styleText("green", S_STEP_SUBMIT) : r === 1 ? styleText("red", S_STEP_CANCEL) : styleText("red", S_STEP_ERROR);
    s = e ?? s, t || (l === "timer" ? n.write(`${o}  ${s} ${_(w)}
`) : n.write(`${o}  ${s}
`)), H(), M();
  };
  return {
    start: P,
    stop: (e = "") => a(e, 0),
    message: (e = "") => {
      s = C(e ?? s);
    },
    cancel: (e = "") => a(e, 1),
    error: (e = "") => a(e, 2),
    clear: () => a("", 0, true),
    get isCancelled() {
      return S;
    }
  };
};

const u = {
  light: unicodeOr("\u2500", "-"),
  heavy: unicodeOr("\u2501", "="),
  block: unicodeOr("\u2588", "#")
};
function progress({
  style: o = "heavy",
  max: d = 100,
  size: v = 40,
  ...x
} = {}) {
  const r = spinner(x);
  let a = 0, n = "";
  const c = Math.max(1, d), l = Math.max(1, v), S = (t) => {
    switch (t) {
      case "initial":
      case "active":
        return (e) => styleText("magenta", e);
      case "error":
      case "cancel":
        return (e) => styleText("red", e);
      case "submit":
        return (e) => styleText("green", e);
      default:
        return (e) => styleText("magenta", e);
    }
  }, p = (t, e) => {
    const m = Math.floor(a / c * l);
    return `${S(t)(u[o].repeat(m))}${styleText("dim", u[o].repeat(l - m))} ${e}`;
  }, h = (t = "") => {
    n = t, r.start(p("initial", t));
  }, g = (t = 1, e) => {
    a = Math.min(c, t + a), r.message(p("active", e ?? n)), n = e ?? n;
  };
  return {
    start: h,
    stop: r.stop,
    cancel: r.cancel,
    error: r.error,
    clear: r.clear,
    advance: g,
    isCancelled: r.isCancelled,
    message: (t) => g(0, t)
  };
}

const SELECT_INSTRUCTIONS = [
  `${styleText("dim", "\u2191/\u2193")} to navigate`,
  `${styleText("dim", "Enter:")} confirm`
];
const c = (t, o) => t.includes(`
`) ? t.split(`
`).map((d) => o(d)).join(`
`) : o(t);
const select = (t) => {
  const o = (n, m) => {
    if (n === void 0)
      return "";
    const s = n.label ?? String(n.value);
    switch (m) {
      case "disabled":
        return `${styleText("gray", S_RADIO_INACTIVE)} ${c(s, (i) => styleText("gray", i))}${n.hint ? ` ${styleText("dim", `(${n.hint ?? "disabled"})`)}` : ""}`;
      case "selected":
        return `${c(s, (i) => styleText("dim", i))}`;
      case "active":
        return `${styleText("green", S_RADIO_ACTIVE)} ${s}${n.hint ? ` ${styleText("dim", `(${n.hint})`)}` : ""}`;
      case "cancelled":
        return `${c(s, (i) => styleText(["strikethrough", "dim"], i))}`;
      default:
        return `${styleText("dim", S_RADIO_INACTIVE)} ${c(s, (i) => styleText("dim", i))}`;
    }
  }, d = t.showInstructions ?? true;
  return new SelectPrompt({
    options: t.options,
    signal: t.signal,
    input: t.input,
    output: t.output,
    initialValue: t.initialValue,
    render() {
      const n = t.withGuide ?? settings.withGuide, m = `${symbol(this.state)}  `, s = `${symbolBar(this.state)}  `, i = wrapTextWithPrefix(
        t.output,
        t.message,
        s,
        m
      ), u = `${n ? `${styleText("gray", S_BAR)}
` : ""}${i}
`;
      switch (this.state) {
        case "submit": {
          const r = n ? `${styleText("gray", S_BAR)}  ` : "", a = wrapTextWithPrefix(
            t.output,
            o(this.options[this.cursor], "selected"),
            r
          );
          return `${u}${a}`;
        }
        case "cancel": {
          const r = n ? `${styleText("gray", S_BAR)}  ` : "", a = wrapTextWithPrefix(
            t.output,
            o(this.options[this.cursor], "cancelled"),
            r
          );
          return `${u}${a}${n ? `
${styleText("gray", S_BAR)}` : ""}`;
        }
        default: {
          const r = n ? `${styleText("cyan", S_BAR)}  ` : "", a = u.split(`
`).length, p = d ? formatInstructionFooter(SELECT_INSTRUCTIONS, n) : n ? [styleText("cyan", S_BAR_END)] : [], b = p.join(`
`), f = p.length + 1;
          return `${u}${r}${limitOptions({
            output: t.output,
            cursor: this.cursor,
            options: this.options,
            maxItems: t.maxItems,
            columnPadding: r.length,
            rowPadding: a + f,
            style: (g, x) => o(g, g.disabled ? "disabled" : x ? "active" : "inactive")
          }).join(`
${r}`)}
${b}
`;
        }
      }
    }
  }).prompt();
};

const selectKey = (t) => {
  const l = (e, a = "inactive") => {
    if (e === void 0)
      return "";
    const n = e.label ?? String(e.value);
    return a === "selected" ? `${styleText("dim", n)}` : a === "cancelled" ? `${styleText(["strikethrough", "dim"], n)}` : a === "active" ? `${styleText(["bgCyan", "gray"], ` ${e.value} `)} ${n}${e.hint ? ` ${styleText("dim", `(${e.hint})`)}` : ""}` : `${styleText(["gray", "bgWhite", "inverse"], ` ${e.value} `)} ${n}${e.hint ? ` ${styleText("dim", `(${e.hint})`)}` : ""}`;
  };
  return new SelectKeyPrompt({
    options: t.options,
    signal: t.signal,
    input: t.input,
    output: t.output,
    initialValue: t.initialValue,
    caseSensitive: t.caseSensitive,
    render() {
      const e = t.withGuide ?? settings.withGuide, a = `${e ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  ${t.message}
`;
      switch (this.state) {
        case "submit": {
          const n = e ? `${styleText("gray", S_BAR)}  ` : "", s = this.options.find((u) => u.value === this.value) ?? t.options[0], c = wrapTextWithPrefix(
            t.output,
            l(s, "selected"),
            n
          );
          return `${a}${c}`;
        }
        case "cancel": {
          const n = e ? `${styleText("gray", S_BAR)}  ` : "", s = wrapTextWithPrefix(
            t.output,
            l(this.options[0], "cancelled"),
            n
          );
          return `${a}${s}${e ? `
${styleText("gray", S_BAR)}` : ""}`;
        }
        default: {
          const n = e ? `${styleText("cyan", S_BAR)}  ` : "", s = e ? styleText("cyan", S_BAR_END) : "", c = this.options.map(
            (u, d) => wrapTextWithPrefix(
              t.output,
              l(u, d === this.cursor ? "active" : "inactive"),
              n
            )
          ).join(`
`);
          return `${a}${c}
${s}
`;
        }
      }
    }
  }).prompt();
};

const i = `${styleText("gray", S_BAR)}  `;
const stream = {
  message: async (e, { symbol: l = styleText("gray", S_BAR) } = {}) => {
    process.stdout.write(`${styleText("gray", S_BAR)}
${l}  `);
    let s = 3;
    for await (let r of e) {
      r = r.replace(/\n/g, `
${i}`), r.includes(`
`) && (s = 3 + stripVTControlCharacters(r.slice(r.lastIndexOf(`
`))).length);
      const o = stripVTControlCharacters(r).length;
      s + o < process.stdout.columns ? (s += o, process.stdout.write(r)) : (process.stdout.write(`
${i}${r.trimStart()}`), s = 3 + stripVTControlCharacters(r.trimStart()).length);
    }
    process.stdout.write(`
`);
  },
  info: (e) => stream.message(e, { symbol: styleText("blue", S_INFO) }),
  success: (e) => stream.message(e, { symbol: styleText("green", S_SUCCESS) }),
  step: (e) => stream.message(e, { symbol: styleText("green", S_STEP_SUBMIT) }),
  warn: (e) => stream.message(e, { symbol: styleText("yellow", S_WARN) }),
  /** alias for `log.warn()`. */
  warning: (e) => stream.warn(e),
  error: (e) => stream.message(e, { symbol: styleText("red", S_ERROR) })
};

const tasks = async (o, e) => {
  for (const t of o) {
    if (t.enabled === false) continue;
    const s = spinner(e);
    s.start(t.title);
    const n = await t.task(s.message);
    s.stop(n || t.title);
  }
};

const A = (l) => l.replace(/\x1b\[(?:\d+;)*\d*[ABCDEFGHfJKSTsu]|\x1b\[(s|u)/g, "");
const taskLog = (l) => {
  const r = l.output ?? process.stdout, O = getColumns(r), i = styleText("gray", S_BAR), p = l.spacing ?? 1, k = 3, m = l.retainLog === true, d = !isCI() && isTTY(r);
  r.write(`${i}
`), r.write(`${styleText("green", S_STEP_SUBMIT)}  ${l.title}
`);
  for (let e = 0; e < p; e++)
    r.write(`${i}
`);
  const n = [
    {
      value: "",
      full: ""
    }
  ];
  let v = false;
  const f = (e) => {
    if (n.length === 0)
      return;
    let s = 0;
    e && (s += p + 2);
    for (const t of n) {
      const { value: o, result: a } = t;
      let g = a?.message ?? o;
      if (g.length === 0)
        continue;
      a === void 0 && t.header !== void 0 && t.header !== "" && (g += `
${t.header}`);
      const E = g.split(`
`).reduce((b, w) => w === "" ? b + 1 : b + Math.ceil((w.length + k) / O), 0);
      s += E;
    }
    s > 0 && (s += 1, r.write(erase.lines(s)));
  }, h = (e, s, t) => {
    const o = t ? `${e.full}
${e.value}` : e.value;
    e.header !== void 0 && e.header !== "" && log.message(
      e.header.split(`
`).map((a) => styleText("bold", a)),
      {
        output: r,
        secondarySymbol: i,
        symbol: i,
        spacing: 0
      }
    ), log.message(
      o.split(`
`).map((a) => styleText("dim", a)),
      {
        output: r,
        secondarySymbol: i,
        symbol: i,
        spacing: s ?? p
      }
    );
  }, T = () => {
    for (const e of n) {
      const { header: s, value: t, full: o } = e;
      (s === void 0 || s.length === 0) && t.length === 0 || h(e, void 0, m === true && o.length > 0);
    }
  }, L = (e, s, t) => {
    if (f(false), (t?.raw !== true || !v) && e.value !== "" && (e.value += `
`), e.value += A(s), v = t?.raw === true, l.limit !== void 0) {
      const o = e.value.split(`
`), a = o.length - l.limit;
      if (a > 0) {
        const g = o.splice(0, a);
        m && (e.full += (e.full === "" ? "" : `
`) + g.join(`
`));
      }
      e.value = o.join(`
`);
    }
    d && y();
  }, y = () => {
    for (const e of n)
      e.result ? e.result.status === "error" ? log.error(e.result.message, { output: r, secondarySymbol: i, spacing: 0 }) : log.success(e.result.message, { output: r, secondarySymbol: i, spacing: 0 }) : e.value !== "" && h(e, 0);
  }, B = (e, s) => {
    f(false), e.result = s, d && y();
  };
  return {
    message(e, s) {
      L(n[0], e, s);
    },
    group(e) {
      const s = {
        header: e,
        value: "",
        full: ""
      };
      return n.push(s), {
        message(t, o) {
          L(s, t, o);
        },
        error(t) {
          B(s, {
            status: "error",
            message: t
          });
        },
        success(t) {
          B(s, {
            status: "success",
            message: t
          });
        }
      };
    },
    error(e, s) {
      f(true), log.error(e, { output: r, secondarySymbol: i, spacing: 1 }), s?.showLog !== false && T(), n.splice(1, n.length - 1), n[0].value = "", n[0].full = "";
    },
    success(e, s) {
      f(true), log.success(e, { output: r, secondarySymbol: i, spacing: 1 }), s?.showLog === true && T(), n.splice(1, n.length - 1), n[0].value = "", n[0].full = "";
    }
  };
};

const text = (e) => new TextPrompt({
  validate: e.validate,
  placeholder: e.placeholder,
  defaultValue: e.defaultValue,
  initialValue: e.initialValue,
  output: e.output,
  signal: e.signal,
  input: e.input,
  render() {
    const i = e?.withGuide ?? settings.withGuide, s = `${`${i ? `${styleText("gray", S_BAR)}
` : ""}${symbol(this.state)}  `}${e.message}
`, c = e.placeholder && e.placeholder.length > 0 ? (
      // biome-ignore lint/style/noNonNullAssertion: guarded by placeholder.length > 0
      styleText("inverse", e.placeholder[0]) + styleText("dim", e.placeholder.slice(1))
    ) : styleText(["inverse", "hidden"], "_"), o = this.userInput ? this.userInputWithCursor : c, l = this.value ?? "";
    switch (this.state) {
      case "error": {
        const n = this.error ? `  ${styleText("yellow", this.error)}` : "", r = i ? `${styleText("yellow", S_BAR)}  ` : "", d = i ? styleText("yellow", S_BAR_END) : "";
        return `${s.trim()}
${r}${o}
${d}${n}
`;
      }
      case "submit": {
        const n = l ? `  ${styleText("dim", l)}` : "", r = i ? styleText("gray", S_BAR) : "";
        return `${s}${r}${n}`;
      }
      case "cancel": {
        const n = l ? `  ${styleText(["strikethrough", "dim"], l)}` : "", r = i ? styleText("gray", S_BAR) : "";
        return `${s}${r}${n}${l.trim() ? `
${r}` : ""}`;
      }
      default: {
        const n = i ? `${styleText("cyan", S_BAR)}  ` : "", r = i ? styleText("cyan", S_BAR_END) : "";
        return `${s}${n}${o}
${r}
`;
      }
    }
  }
}).prompt();

export { MULTISELECT_INSTRUCTIONS, SELECT_INSTRUCTIONS, S_BAR, S_BAR_END, S_BAR_END_RIGHT, S_BAR_H, S_BAR_START, S_BAR_START_RIGHT, S_CHECKBOX_ACTIVE, S_CHECKBOX_INACTIVE, S_CHECKBOX_SELECTED, S_CONNECT_LEFT, S_CORNER_BOTTOM_LEFT, S_CORNER_BOTTOM_RIGHT, S_CORNER_TOP_LEFT, S_CORNER_TOP_RIGHT, S_ERROR, S_INFO, S_PASSWORD_MASK, S_RADIO_ACTIVE, S_RADIO_INACTIVE, S_STEP_ACTIVE, S_STEP_CANCEL, S_STEP_ERROR, S_STEP_SUBMIT, S_SUCCESS, S_WARN, autocomplete, autocompleteMultiselect, box, cancel, confirm, date, formatInstructionFooter, group, groupMultiselect, intro, isCI, isTTY, limitOptions, log, multiline, multiselect, note, outro, password, path, progress, select, selectKey, spinner, stream, symbol, symbolBar, taskLog, tasks, text, unicode, unicodeOr };
