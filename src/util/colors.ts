import { htmlColorAsNumber } from './';

export type Rgb = { k: 'rgb', r: number, g: number, b: number };
export function Rgb(r: number, g: number, b: number): Rgb { return { k: 'rgb', r, g, b }; }

export type Rgba = { k: 'rgba', r: number, g: number, b: number, a: number };
export function Rgba(r: number, g: number, b: number, a: number): Rgba { return { k: 'rgba', r, g, b, a }; }

export type NRgb = { k: 'nrgb', r: number, g: number, b: number };
export function NRgb(r: number, g: number, b: number): NRgb {
    const nrgb = { k: 'nrgb', r, g, b } as const;
    isNormalized(nrgb);

    return nrgb;
}

export type NRgba = { k: 'nrgba', r: number, g: number, b: number, a: number };
export function NRgba(r: number, g: number, b: number, a: number = 0): NRgba {
    const nrgba = { k: 'nrgba', r, g, b, a } as const;
    isNormalized(nrgba);

    return nrgba;
}

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
    return Rgb(tup[0], tup[1], tup[2]);
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

    return Rgb(r, g, b);
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

export function nrgb(rgb: Rgb): NRgb {
    const nrgb = NRgb(
        nclr(rgb.r),
        nclr(rgb.g),
        nclr(rgb.b),
    );

    isNormalized(nrgb);

    return nrgb;
}

export function nrgba(c: Rgb | Rgba | NRgb): NRgba {
    let nrgba;
    if (c.k === 'rgb') {
        nrgba = NRgba(
            nclr(c.r),
            nclr(c.g),
            nclr(c.b),
            0,
        );
    } else if (c.k === 'rgba') {
        nrgba = NRgba(
            nclr(c.r),
            nclr(c.g),
            nclr(c.b),
            c.a
        );
    } else {
        nrgba = NRgba(c.r, c.g, c.b, 0);
    }

    isNormalized(nrgba);

    return nrgba;
}

export function rgbToColor(r: number, g: number, b: number) {
    return (r << 16) | (g << 8) | b;
}

export function rgbToHex(rgb: Rgb | ColorTuple) {
    return Array.isArray(rgb)
        ? '#' + rgb.map(x => numToHex(x)).join('')
        : '#' + numToHex(rgb.r) + numToHex(rgb.g) + numToHex(rgb.b);
}

function isNormalized(c: NRgb | NRgba) {
    if (c.k === 'nrgb') {
        if (c.r > 1.0 || c.g > 1.0 || c.b > 1.0) throw new Error(`NRgb color [${c.r}, ${c.g}, ${c.b}] is not normalized`);
    }

    if (c.k === 'nrgba') {
        if (c.r > 1.0 || c.g > 1.0 || c.b > 1.0 || c.a > 1.0) throw new Error(`NRgba color [${c.r}, ${c.g}, ${c.b}, ${c.a}] is not normalized`);
    }
}
