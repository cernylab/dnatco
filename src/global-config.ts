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
        navalMarkerColor: string,
        pGroups: AngleLengthPGroup[],
        outlierColor: string,
    },
    violinPlotMarkerColorA: string,
    violinPlotMarkerColorB: string,
    exampleStructures: {
        db: string,
        pdbId: string,
    }[],
    displayedProductName: string,
};
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '.',
    userDatabases: [],
    anglesLengths: {
        chartMarkerColor: '#ff03f2',
        navalMarkerColor: '#ff8080',
        maxWorst: 30,
        outlierColor: '#000000',
        pGroups: [
            { threshold: 80, color: '#006eff' },
            { threshold: 95, color: '#00ff00' },
            { threshold: 99.9, color: '#ffff00' },
        ],
    },
    violinPlotMarkerColorA: '#fff70c',
    violinPlotMarkerColorB: '#000',
    exampleStructures: [{db: '', pdbId: ''}],
    displayedProductName: 'ReDNATCO',
};
const AllowedPartials: Partial<{[k in keyof GlobalConfigData]: object}> = {
    anglesLengths: {}
};

function checkAndSetEntry<K extends keyof GlobalConfigData>(data: GlobalConfigData, k: K, inputObj: any, partials: typeof AllowedPartials) {
    console.log(k, data[k]);
    const to = data[k];
    const obj = fromTemplate(inputObj, to, partials[k]);
    if (obj)
        data[k] = obj;
    else
        console.warn(`${k} entry in the configuration file appears to be malformed. Falling back to default value`);
}

function checkAndSet(data: GlobalConfigData, input: Record<string, any>) {
    for (const prop in data) {
        const inputObj = input[prop];
        if (inputObj)
            checkAndSetEntry(data, prop as keyof GlobalConfigData, inputObj, AllowedPartials);
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
