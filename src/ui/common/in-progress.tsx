export namespace InProgress {
    export async function create(content: string): Promise<HTMLElement> {
        const tainer = document.createElement('div');

        // We cannot use React because it renders stuff asynchronously
        // but we need to be sure that this dialog will be visible before
        // any further code is executed. Let's do it the old-fashioned way.
        tainer.innerHTML = `
            <div class='rdo-popup'>
                <div class='rdo-popup-inner'>
                    <div style={{ flex: 1 }}>
                        <div>${content}</div>
                    </div>
                    <div class='rdo-popup-button-bar'>
                        <div style={{ flex: 1 }} />
                    </div>
                </div>
            </div>
        `;

        // We also need to wait for the browser to actually render the element.
        // For that we need to observe some events.
        // We need to do this from a promise so that we can await for it to happen.
        // ResizeObserver seems to be the most reliable way how to get this to work
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
}
