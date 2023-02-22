import { KnownCoordinateFileTypes, KnownDensityMapKinds, KnownDensityMapTypes } from './remote/db';
import { UserRemoteDatabases } from './remote/db/register';
import { StaticDb } from './remote/db/static-db';
import { fromTemplate } from './util/json';

export type AngleLengthPGroup = {
    threshold: number,
    color: string,
};
export const AngleLengthPGroup: AngleLengthPGroup = {
    threshold: 0,
    color: '#ffffff',
};

export type GlobalConfigData = {
    isDevel: boolean,
    pathPrefix: string,
    userDatabases: StaticDb[],
    anglesLengths: {
        chartMarkerColor: string,
        maxWorst: number,
        pGroups: AngleLengthPGroup[],
        outlierColor: string,
    },
};
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '.',
    userDatabases: [],
    anglesLengths: {
        chartMarkerColor: '#ff03f2',
        maxWorst: 30,
        outlierColor: '#000000',
        pGroups: [
            { threshold: 80, color: '#006eff' },
            { threshold: 95, color: '#00ff00' },
            { threshold: 99.9, color: '#ffff00' },
        ],
    },
};

function checkAndSetEntry<K extends keyof GlobalConfigData>(data: GlobalConfigData, k: K, inputObj: any) {
    const to = data[k];
    const obj = fromTemplate(inputObj, to, true);
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
