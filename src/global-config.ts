import { Globals } from './globals';
import { KnownCoordinateFileTypes, KnownDensityMapKinds, KnownDensityMapTypes } from './remote/db';
import { BuiltInRemoteDatabases } from './remote/db/register';
import { IdTransformations, StaticDb } from './remote/db/static-db';
import { deepCopy, objKeys } from './util';
import { fromTemplate } from './util/json';

//                              *** BEWARE BEWARE ***
//
// Do not use any "Logger" facilities here. Configuration is supposed to be loaded
// early in the bootstrapping process. The Logger is expected to rely on information
// read from configuration so it is reasonable to assume that the Logger
// will *NOT* be initialized when this code runs!
//

const SchemeRegex = new RegExp('^([a-zA-Z]){1}([a-zA-Z0-9])*:\\/\\/');

export type AngleLengthPGroup = {
    threshold: number,
    color: string,
    name: string,
};
export const AngleLengthPGroup: AngleLengthPGroup = {
    threshold: 0,
    color: '#ffffff',
    name: '',
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
        navalPreferredColor: string,
        navalAllowedColor: string,
        navalOfConcernColor: string,
        pGroups: AngleLengthPGroup[],
        outlierColor: string,
        outlierName: string,
    },
    violinPlotMarkerColorA: string,
    violinPlotMarkerColorB: string,
    exampleStructures: {
        db: string,
        pdbId: string,
        name?: string,
    }[],
    displayedProductName: string,
    currentStepColor: string,
    previousStepColor: string,
    showHydrogensInReferences: boolean,
    nextStepColor: string,
    precalculateConnectivitiesAndSimilarities: boolean,
    highlightColor: string,
    highlightThickness: number,
    expectedParametersFingerprint: string,
    useHashRouter: boolean,
    basePairsLadder: {
        barRadius: number,
        barScale: number,
        cWWBallRadius: number,
        cisBallRadius: number,
        transBallRadius: number,
        unpairedBallRadius: number,
        showPairs: boolean,
        showUnpaired: boolean,
        showUnpairedBall: boolean,
        showcWWBall: boolean,
        showCisBall: boolean,
        showTransBall: boolean,
        showBrick: boolean,
        brickLength: number,
        brickWidth: number,
        brickHeight: number,
    },
    ntcTubeAlpha: number,
    pyramidAlpha: number,
    pairingLadderAlpha: number,
    showNtcTubeSegmentForSelectedResidues: boolean,
    cameraRadiusFactor: number,
    cameraClippingRadius: number,
    cameraClippingFar: boolean,
    cameraClippingMinNear: number,

    // Options relevant only for NodeJS builds
    referenceUrl: string,
    phenix: {
        rsccExec: string,
    }
};
const GlobalConfigData: GlobalConfigData = {
    isDevel: false,
    pathPrefix: '',
    userDatabases: [],
    primaryDatabase: '',
    anglesLengths: {
        chartMarkerColor: '#ff03f2',
        navalMarkerColor: '#ff8080',
        navalPreferredColor: '#00ff00',
        navalAllowedColor: '#ffff00',
        navalOfConcernColor: '#ff0000',
        maxWorst: 30,
        outlierColor: '#000000',
        outlierName: 'Outlier',
        pGroups: [
            { threshold: 80, color: '#006eff', name: '', },
            { threshold: 95, color: '#00ff00', name: '', },
            { threshold: 99.9, color: '#ffff00', name: '' },
        ],
    },
    violinPlotMarkerColorA: '#fff70c',
    violinPlotMarkerColorB: '#000',
    exampleStructures: [],
    displayedProductName: Globals.DefaultProductName,
    currentStepColor: '#ffff00',
    previousStepColor: '#0000ff',
    nextStepColor: '#00ffff',
    showHydrogensInReferences: false,
    precalculateConnectivitiesAndSimilarities: false,
    highlightColor: '#49ff92',
    highlightThickness: 2.0,
    expectedParametersFingerprint: '',
    useHashRouter: false,
    basePairsLadder: {
        barRadius: 0.5,
        barScale: 1.0,
        cWWBallRadius: 0.6,
        cisBallRadius: 0.6,
        transBallRadius: 1.2,
        unpairedBallRadius: 1.2,
        showPairs: true,
        showUnpaired: true,
        showUnpairedBall: false,
        showcWWBall: true,
        showCisBall: true,
        showTransBall: true,
        showBrick: true,
        brickLength: 4.0,
        brickWidth: 2.0,
        brickHeight: 0.6,
    },
    ntcTubeAlpha: 0.5,
    pyramidAlpha: 0.5,
    pairingLadderAlpha: 0.5,
    showNtcTubeSegmentForSelectedResidues: true,
    cameraRadiusFactor: 3,
    cameraClippingRadius: 100,
    cameraClippingFar: true,
    cameraClippingMinNear: 5,
    referenceUrl: '',
    phenix: {
        rsccExec: '',
    },
};
const AllowedPartials: Partial<{[k in keyof GlobalConfigData]: object}> = {
    anglesLengths: {},
    basePairsLadder: {}
};
const DefaultGlobalConfigData = deepCopy(GlobalConfigData);

function checkAndSetEntry<K extends keyof GlobalConfigData>(data: GlobalConfigData, k: K, inputObj: any, partials: typeof AllowedPartials) {
    const to = data[k];
    const obj = fromTemplate(inputObj, to, partials[k]);
    if (obj !== null && obj !== undefined)
        data[k] = obj;
    else
        console.warn(`"${k}" entry in the configuration file appears to be malformed. Falling back to default value. Mind that if the malformed entry is a complex object, the problem may be with one of its nested objects.`);
}

function checkAndSet(data: GlobalConfigData, input: Record<string, any>) {
    for (const prop in data) {
        const inputObj = input[prop];
        if (inputObj !== undefined)
            checkAndSetEntry(data, prop as keyof GlobalConfigData, inputObj, AllowedPartials);
    }
}

function fixups(data: GlobalConfigData) {
    if (data.pathPrefix.length > 0 && !data.pathPrefix.startsWith('/') && !SchemeRegex.test(data.pathPrefix))
        data.pathPrefix = '/' + data.pathPrefix;

    data.userDatabases = data.userDatabases.filter((x) => {
        let ok = KnownCoordinateFileTypes.includes(x.coords.type);
        ok = ok && (!x.coords.idTransformation || IdTransformations.includes(x.coords.idTransformation));

        for (const dm of x.densityMaps ?? []) {
            ok = ok && KnownDensityMapTypes.includes(dm.type) && KnownDensityMapKinds.includes(dm.kind) && (!dm.idTransformation || IdTransformations.includes(dm.idTransformation));
        }

        if (!ok)
            console.warn(`Disregarding user database "${x.id}" because its configuration is invalid. Check your config file.`);

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
            return await (await fetch('/config.json')).json();
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
