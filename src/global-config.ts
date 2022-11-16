import { KnownCoordinateFileTypes, KnownDensityMapKinds, KnownDensityMapTypes } from './remote-db';
import { UserRemoteDatabases } from './remote-db/register';
import { StaticDb } from './remote-db/static-db';
import { fromTemplate } from './util/json';

export type GlobalConfigData = {
    isDevel: boolean,
    pathPrefix: string,
    userDatabases: StaticDb[],
}
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '.',
    userDatabases: [],
}

function checkAndSetEntry<K extends keyof GlobalConfigData>(data: GlobalConfigData, k: K, inputObj: any) {
    const to = data[k];
    const obj = fromTemplate(inputObj, to);
    if (obj)
        data[k] = obj;
}

function checkAndSet(data: GlobalConfigData, input: Record<string, any>) {
    for (const prop in data) {
        const inputObj = input[prop];
        if (inputObj)
            checkAndSetEntry(data, prop as keyof GlobalConfigData, inputObj)
    }
}

function fixups(data: GlobalConfigData) {
    if (data.pathPrefix === '')
        data.pathPrefix = '.';

    data.userDatabases = data.userDatabases.filter((x) => {
        let ok = KnownCoordinateFileTypes.includes(x.coords.type);
        for (const dm of x.densityMaps ?? []) {
            ok = ok && KnownDensityMapTypes.includes(dm.type) && KnownDensityMapKinds.includes(dm.kind);
        }

        return ok;
    });
}

export namespace GlobalConfig {
    export function data() {
        return GlobalConfigData;
    }

    export function initialize(input: Record<string, any>) {
        checkAndSet(GlobalConfigData, input);
        fixups(GlobalConfigData);

        for (const db of GlobalConfigData.userDatabases)
            UserRemoteDatabases.add(db);

        console.log(GlobalConfigData);
    }
}
