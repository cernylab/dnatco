import { EnvDetect } from '../util/env-detect';

const { LoggerImpl } = (() => {
    if (EnvDetect.isNode())
        return require('./impl/node');
    else
        return require('./impl/browser');
})();
let instance: Logger.LoggerInstance<any> | null = null;

export namespace Logger {
    export type InitOptions<K extends keyof Severity> = {
        appId?: string,
        minSeverity?: Severity[K],
        logFileDir?: string
    };

    const SeverityText = [ '.  ', '?  ', '!  ', '!!!' ];
    export const Severity = {
        Debug: 0,
        Info: 1,
        Warning: 2,
        Error: 3
    } as const;
    export type Severity = typeof Severity;

    export interface LoggerInstance<K extends keyof Severity> {
        appName: string;
        minSeverity: Severity[K];
        appId?: string;
    }

    function makeMessage<K extends keyof Severity>(severity: Severity[K], body: string) {
        return `${SeverityText[severity]} - (${instance?.appName}${instance?.appId ? ` ${instance.appId}` : ''}): ${body}`;
    }

    export function initialize<K extends keyof Severity>(appName: string, options?: InitOptions<K>) {
        if (instance !== null)
            return;

        instance = LoggerImpl.initialize(appName, options);
    }

    export function log<K extends keyof Severity>(severity: Severity[K], message: string) {
        if (!instance) {
            console.log(message);
            return;
        }

        if (severity >= instance.minSeverity)
            LoggerImpl.log(instance, severity, makeMessage(severity, message))
    }
}
