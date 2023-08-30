import fs from 'fs';
import path from 'path';
import { Logger } from '../logger';

const encoder = new TextEncoder();

export interface NodeLoggerInstance extends Logger.LoggerInstance<any> {
    kind: 'node';
    fd: number;
}
function isInstance<K extends keyof Logger.Severity>(instance: Logger.LoggerInstance<K>): instance is NodeLoggerInstance {
    const a = instance as any;
    return a['kind'] !== undefined && a['kind'] === 'node';
}

export const LoggerImpl = {
    initialize<K extends keyof Logger.Severity>(appName: string, options?: { appId?: string, minSeverity?: Logger.Severity[K], logFileDir?: string }): NodeLoggerInstance {
        let fd = -1;
        if (options?.logFileDir) {
            const logName = appName + (options.appId ? `_${options.appId}` : '') + '.log';
            fd = fs.openSync(path.resolve(options.logFileDir, logName), 'w');
            if (fd < 0)
                throw new Error('Cannot open log file for writing');
        }

        return {
            kind: 'node',
            appName,
            appId: options?.appId ?? void 0,
            minSeverity: options?.minSeverity ?? Logger.Severity.Info,
            fd
        };
    },

    log<K extends keyof Logger.Severity>(instance: Logger.LoggerInstance<K>, severity: Logger.Severity[K], message: string) {
        if (!isInstance(instance))
            throw new Error('Invalid Logger instance passed to NodeLoggerImpl');

        console.log(message);
        if (instance.fd >= 0)
            fs.writeSync(instance.fd, encoder.encode(message + '\n'));
    },
};
