import { Globals } from './globals';
import { KnownCoordinateFileTypes, KnownDensityMapKinds, KnownDensityMapTypes } from './remote/db';
import {BuiltInRemoteDatabases} from './remote/db/register';
import { StaticDb } from './remote/db/static-db';
import { objKeys } from './util';
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
    primaryDatabase: string,
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
    currentStepColor: string,
    previousStepColor: string,
    nextStepColor: string,
    precalculateConnectivitiesAndSimilarities: boolean,
};
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '.',
    userDatabases: [],
    primaryDatabase: '',
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
    displayedProductName: Globals.DefaultProductName,
    currentStepColor: '#ffff00',
    previousStepColor: '#0000ff',
    nextStepColor: '#00ffff',
    precalculateConnectivitiesAndSimilarities: false,
};
const AllowedPartials: Partial<{[k in keyof GlobalConfigData]: object}> = {
    anglesLengths: {}
};
const DefaultGlobalConfigData = { ...GlobalConfigData }; // FIXME: This is wrong - we need to do a proper deep copy!!!

function checkAndSetEntry<K extends keyof GlobalConfigData>(data: GlobalConfigData, k: K, inputObj: any, partials: typeof AllowedPartials) {
    const to = data[k];
    const obj = fromTemplate(inputObj, to, partials[k]);
    if (obj)
        data[k] = obj;
    else
        console.warn(`"${k}" entry in the configuration file appears to be malformed. Falling back to default value. Mind that if the malformed entry is a complex object, the problem may be with one of its nested objects.`);
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

    if (!data.primaryDatabase) {
        if (data.userDatabases.length > 0)
            data.primaryDatabase = data.userDatabases[0].id;
        else
            data.primaryDatabase = objKeys(BuiltInRemoteDatabases)[0];
    }
}

const Status = {
    isLoaded: false,
};
export namespace GlobalConfig {
    export function data() {
        return GlobalConfigData;
    }

    export function defaultValue<K extends keyof GlobalConfigData>(k: K): GlobalConfigData[K] {
        return DefaultGlobalConfigData[k];
    }

    export async function fetchConfigFile() {
        try {
            return await (await fetch('./config.json')).json();
        } catch (e) {
            return {};
        }
    }

    export function isLoaded() {
        return Status.isLoaded;
    }

    export function load(input: Record<string, any>) {
        if (Status.isLoaded)
            return GlobalConfigData;

        checkAndSet(GlobalConfigData, input);
        fixups(GlobalConfigData);

        Status.isLoaded = true;

        return GlobalConfigData;
    }
}
