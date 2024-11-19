export namespace EnvDetect {
    export function isNode() {
        
        if (typeof require === 'function') {
            const process = require('process');

            if (!!process.browser) return false;
            return (typeof process !== 'undefined' && process.release?.name === 'node');
        } else
            return false;
    }
}
