export namespace Net {
    export type NullableAbrtCtrl = AbortController | null;

    export function abortFetch(aborter: AbortController | null) {
        if (aborter !== null) {
            if (aborter.signal.aborted === false)
                aborter.abort();
        }
    }

    export function isAbortError(e: Error) {
        return e.name === 'AbortError';
    }

    export function isFetchAborted(aborter: AbortController | null) {
        return aborter === null ? false : aborter.signal.aborted;
    }

    export function openLink(url: string, newTab = false) {
        if (!newTab) {
            window.location.href = url;
        } else {
            window.open(url, '_blank')?.focus();
        }
    }

    export function serveFile(mimeType: string, data: string, filename: string) {
        const enc = encodeURIComponent(data);
        const payload = `data:${mimeType},${enc}`;

        const e = document.createElement('a');
        e.setAttribute('href', payload);
        e.setAttribute('download', filename);
        e.style.display = 'none';

        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    }
}
