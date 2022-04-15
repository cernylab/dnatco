/** TODO */

export type GlobalConfigOptions = {
    isDevel: boolean;
    pathPrefix: string;
}

class GlobalConfigKeeper {
    readonly data: GlobalConfigOptions;

    constructor(data: Partial<GlobalConfigOptions>) {
        this.data = {
            isDevel: false,
            pathPrefix: '',
            ...data,
        };
    }
}
let config = new GlobalConfigKeeper({});

export namespace GlobalConfig {
    export function get(item: keyof GlobalConfigOptions) {
        return config.data[item];
    }

    export function initialize(data: Partial<GlobalConfigOptions>) {
        config = new GlobalConfigKeeper(data);
    }
}

