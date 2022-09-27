export type GlobalConfigData = {
    isDevel: boolean;
    pathPrefix: string;
    localDbUrl: string;
    localDbGzipped: boolean;
}
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '.',
    localDbUrl: '',
    localDbGzipped: false,
}

function checkAndSet<K extends keyof GlobalConfigData>(data: Record<string, any>, key: K) {
    if (data[key] !== undefined && (typeof data[key] === typeof GlobalConfigData[key]))
        GlobalConfigData[key] = data[key];

    // Fixups
    if (GlobalConfigData.pathPrefix === '')
        GlobalConfigData.pathPrefix = '.';
}

export namespace GlobalConfig {
    export function data() {
        return GlobalConfigData;
    }

    export function initialize(data: Record<string, any>) {
        for (const prop in GlobalConfigData)
            checkAndSet(data, prop as keyof GlobalConfigData);

        console.log(GlobalConfigData);
    }
}

