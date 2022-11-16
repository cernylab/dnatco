import { ComboBox } from './common/combo-box';

function componentToHex(c: number) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

export function colorToRgb(clr: number) {
    return { r: (clr >> 16), g: (clr >> 8) & 0xFF, b: clr & 0xFF };
}

export function deselectText() {
    if (window?.getSelection)
        window.getSelection()?.removeAllRanges();
    else if ((document as any)['selection'])
        (document as any).selection.empty();
}

export function rgbToHex(rgb: { r: number, g: number, b: number }) {
  return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
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
