export namespace EnvDetect {
    export function isNode() {
        // Mirror, mirror, tell me, tell me who is the prettiest JS runtime in my kingdom?

        if (typeof require === 'function') {
            const process = require('process');

            if (!!process.browser) return false;
            return (typeof process !== 'undefined' && process.release?.name === 'node');
        } else
            return false;
    }
}
