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
        elem.scrollIntoView({ block: 'center', inline: 'start', behavior: 'smooth' });
}
