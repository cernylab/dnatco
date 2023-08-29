import fs from 'node:fs';
import path from 'node:path';

const encoder = new TextEncoder();

let loggerInstance: {
    appName: string,
    minSeverity: number,
    fd: number
    appId?: string,
} | null = null;

export namespace Logger {
    const SeverityText = [ '.  ', '?  ', '!  ', '!!!' ];
    export const Severity = {
        Debug: 0,
        Info: 1,
        Warning: 2,
        Error: 3
    } as const;
    export type Severity = typeof Severity;

    function makeMessage<K extends keyof Severity>(severity: Severity[K], body: string) {
        return `${SeverityText[severity]} - (${loggerInstance?.appName}${loggerInstance?.appId ? ` ${loggerInstance.appId}` : ''}): ${body}`;
    }

    export function initialize<K extends keyof Severity>(appName: string, options?: { appId?: string, minSeverity?: Severity[K], logFileDir?: string }) {
        if (loggerInstance !== null)
            return;

        let fd = -1;
        if (options?.logFileDir) {
            const logName = appName + (options.appId ? `_${options.appId}` : '') + '.log';
            fd = fs.openSync(path.resolve(options.logFileDir, logName), 'w');
            if (fd < 0)
                throw new Error('Cannot open log file for writing');
        }

        loggerInstance = {
            appName,
            appId: options?.appId ?? void 0,
            minSeverity: options?.minSeverity ?? Severity.Info,
            fd
        };
    }

    export function log<K extends keyof Severity>(severity: Severity[K], message: string) {
        if (!loggerInstance)
            throw new Error('Attempted to make a log but the Logger has not been initialized yet');

        if (severity >= loggerInstance.minSeverity) {
            const msg = makeMessage(severity, message);

            console.log(msg);
            if (loggerInstance.fd >= 0)
                fs.writeSync(loggerInstance.fd, encoder.encode(msg + '\n'));
        }
    }
}
