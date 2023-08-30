import { Logger } from '../logger';

export interface BrowserLoggerInstance extends Logger.LoggerInstance<any> {
    kind: 'browser';
}
function isInstance<K extends keyof Logger.Severity>(instance: Logger.LoggerInstance<K>): instance is BrowserLoggerInstance {
    const a = instance as any;
    return a['kind'] !== undefined && a['kind'] === 'browser';
}

export const LoggerImpl = {
    initialize<K extends keyof Logger.Severity>(appName: string, options?: { appId?: string, minSeverity?: Logger.Severity[K], logFileDir?: string }): BrowserLoggerInstance {
        return {
            kind: 'browser',
            appName,
            appId: options?.appId ?? void 0,
            minSeverity: options?.minSeverity ?? Logger.Severity.Info,
        };
    },

    log<K extends keyof Logger.Severity>(instance: Logger.LoggerInstance<K>, severity: Logger.Severity[K], message: string) {
        if (!isInstance(instance))
            throw new Error('Invalid Logger instance passed to NodeLoggerImpl');

        if (severity <= Logger.Severity.Info)
            console.log(message);
        else if (severity === Logger.Severity.Warning)
            console.warn(message);
        else
            console.error(message);
    },
};
