import { htmlColorAsNumber } from './';

export type Rgb = { r: number, g: number, b: number };
export function Rgb(r: number, g: number, b: number): Rgb { return { r, g, b }; }

export type Rgba = { r: number, g: number, b: number, a: number };
export function Rgba(r: number, g: number, b: number, a: number): Rgba { return { r, g, b, a }; }

export type ColorTuple = [r: number, g: number, b: number];
export type ColorAlphaTuple = [r: number, g: number, b: number, a: number];

function numToHex(c: number) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

export function colorToHex(clr: number) {
    const r = clr >> 16 & 0xFF;
    const g = (clr >> 8) & 0xFF;
    const b = clr & 0xFF;

    return `#${numToHex(r)}${numToHex(g)}${numToHex(b)}`;
}

export function colorToRgb(clr: number): Rgb {
    const tup = colorToTuple(clr);
    return { r: tup[0], g: tup[1], b: tup[2] };
}

export function colorToTuple(clr: number): ColorTuple  {
    const r = clr >> 16;
    const g = (clr >> 8) & 0xFF;
    const b = clr & 0xFF;

    return [r, g, b];
}

export function hexToRgb(hex: string): Rgb {
    const clr = htmlColorAsNumber(hex);
    if (!clr)
        throw new Error(`${hex} is not a valid HEX color`);

    const r = clr >> 16 & 0xFF;
    const g = (clr >> 8) & 0xFF;
    const b = clr & 0xFF;

    return { r, g, b };
}

export function hexToTuple(hex: string): ColorTuple {
    const clr = htmlColorAsNumber(hex);
    if (!clr)
        throw new Error(`${hex} is not a valid HEX color`);

    const r = clr >> 16 & 0xFF;
    const g = (clr >> 8) & 0xFF;
    const b = clr & 0xFF;

    return [r, g, b];
}

/* https://alienryderflex.com/hsp.html */
export function luminance(clr: number) {
    let [r, g, b] = colorToTuple(clr);
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;
    return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
}

export function nclr(clr: number) {
    return clr / 255;
}

export function nrgb(rgb: Rgb): Rgb {
    return {
        r: nclr(rgb.r),
        g: nclr(rgb.g),
        b: nclr(rgb.b),
    };
}

export function nrgba(rgba: Rgba): Rgba {
    return {
        r: nclr(rgba.r),
        g: nclr(rgba.g),
        b: nclr(rgba.b),
        a: rgba.a,
    };
}

export function rgbToColor(r: number, g: number, b: number) {
    return (r << 16) | (g << 8) | b;
}

export function rgbToHex(rgb: Rgb | ColorTuple) {
    return Array.isArray(rgb)
        ? '#' + rgb.map(x => numToHex(x)).join('')
        : '#' + numToHex(rgb.r) + numToHex(rgb.g) + numToHex(rgb.b);
}
