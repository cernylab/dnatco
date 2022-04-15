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
}
