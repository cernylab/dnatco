export namespace InProgress {
    function makeAbortButton() {
        return `
            <div class="rdo-pushbutton rdo-pushbutton-border">
                <div class="rdo-pushbutton-text">Abort</div>
            </div>
        `;
    }
    function makeContent(title: string, status: string, abortButton: boolean) {
        return `
            <div class="rdo-popup">
                <div class="rdo-popup-inner">
                    <div class="rdo-popup-text" style="flex: 1">
                        ${makeText(title, status)}
                    </div>
                    <div class="rdo-popup-button-bar">
                        <div style="flex: 1">&nbsp;</div>
                        ${abortButton
                            ? makeAbortButton()
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    function makeText(title: string, status: string) {
       return `
            <div style="font-weight: bold">${title}</div>
            <div style>${status.length === 0 ? '&nbsp;' : status}</div>
        `;
    }

    export function bindAbort(tainer: HTMLElement, handler: (ev: MouseEvent) => void) {
        const btn = tainer.getElementsByClassName('rdo-pushbutton')[0];
        if (btn)
            (btn as HTMLDivElement).onclick = handler;
    }

    export async function create(title: string, status: string, abortButton: boolean): Promise<HTMLElement> {
        const tainer = document.createElement('div');

        /* We cannot use React because it renders stuff asynchronously
         * but we need to be sure that this dialog will be visible before
         * any further code is executed. Let's do it the old-fashioned way.
         */
        tainer.innerHTML = makeContent(title, status, abortButton);

        /* We also need to wait for the browser to actually render the element.
         * For that we need to observe some events.
         * We need to do this from a promise so that we can await for it to happen.
         * ResizeObserver seems to be the most reliable way how to get this to work
         */
        const prom = new Promise<HTMLElement>((resolve, _reject) => {
            const observer = new ResizeObserver((entries, obs) => {
                obs.disconnect();
                resolve(tainer);
            });
            observer.observe(tainer);
            document.body.appendChild(tainer);
        });

        return prom;
    }

    export function dismiss(tainer: HTMLElement) {
        document.body.removeChild(tainer);
    }

    export function update(tainer: HTMLElement, title: string, status: string) {
        tainer.getElementsByClassName('rdo-popup-text')[0].innerHTML = makeText(title, status);
    }
}
