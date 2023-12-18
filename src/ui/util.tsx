import React from 'react';
import { ComboBox } from './common/combo-box';

export function colorStyle(clr: [r: number, g: number, b: number]) {
    return `rgb(${clr.join(',')})`;
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
        return <div className='text-secondary-third'>toks[0]</div>;

    const elems = toks.map(x => <div className='text-secondary-third'>{x}</div>);
    return <div>{elems}</div>;
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
