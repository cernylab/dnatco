import React from 'react';
import { ComboBox } from './common/combo-box';

export type Rgb = { r: number, g: number, b: number };
export type ColorTuple = [r: number, g: number, b: number];

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

export function deselectText() {
    if (window?.getSelection)
        window.getSelection()?.removeAllRanges();
    else if ((document as any)['selection'])
        (document as any).selection.empty();
}

export function formatErrorText(text: string) {
    const toks = text.split('\n');
    if (toks.length === 0)
        return <div className='rdo-error-text'>toks[0]</div>;

    const elems = toks.map(x => <div className='rdo-error-text'>{x}</div>);
    return <div>{elems}</div>;
}

/* https://alienryderflex.com/hsp.html */
export function luminance(clr: number) {
    let [r, g, b] = colorToTuple(clr);
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;
    return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
}

export function rgbToColor(r: number, g: number, b: number) {
    return (r << 16) | (g << 8) | b;
}

export function rgbToHex(rgb: Rgb | ColorTuple) {
    return Array.isArray(rgb)
        ? '#' + rgb.map(x => numToHex(x)).join('')
        : '#' + numToHex(rgb.r) + numToHex(rgb.g) + numToHex(rgb.b);
}

export function scrollIntoViewIfNeeded(elemId: string, tainer: string|HTMLElement) {
    const elem = document.getElementById(elemId);
    const ctainer = typeof tainer === 'string' ? document.getElementById(tainer) : tainer;
    if (!elem || !ctainer)
        return;

    const elemRect = elem.getBoundingClientRect();
    const tainerRect = ctainer.getBoundingClientRect();
    const notInView = elemRect.right > tainerRect.right ||
                      elemRect.bottom > tainerRect.bottom ||
                      elemRect.top < tainerRect.top ||
                      elemRect.left < tainerRect.left ||
                      elemRect.bottom < tainerRect.top;
    if (notInView)
        elem.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function toComboBoxOptions<T>(opts: T[], toComboOpt: (o: T) => { caption: string, value: string }) {
    const cbOpts: ComboBox.Option[] = opts.map(o => toComboOpt(o));
    return cbOpts;
}
