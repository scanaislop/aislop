import { styleText } from 'node:util';
const isColors = !process.env.NO_COLOR && (process.env.FORCE_COLOR === '1' || !!process.stdout.isTTY);
const make = (mod) => (text) => {
    const str = String(text);
    return isColors ? styleText(mod, str, { validateStream: false }) : str;
};
const st = {
    red: make('red'),
    green: make('green'),
    yellow: make('yellow'),
    cyan: make('cyan'),
    white: make('white'),
    gray: make('gray'),
    dim: make('dim'),
    underline: make('underline'),
    cyanBright: make('cyanBright'),
    whiteBright: make('whiteBright'),
    yellowBright: make('yellowBright'),
    style: (mods, text) => {
        const str = String(text);
        return isColors ? styleText(mods, str, { validateStream: false }) : str;
    },
};
export default st;
