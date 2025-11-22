import fs from 'fs';
import path from 'path';
import { checkFilePermissions, checkInteger, checkShape, isDirectory } from './util';

const ConformersDb = {
    results: 'results.db',
    nonredundantResults: 'results_nonredundant.db',
    resolutions: 'resolutions.db',
};
export type ConformersDb = typeof ConformersDb;

const PhenixRscc = {
    execRealSpace: 'phenix.real_space_correlation',
    execMapModelCc: 'phenix.map_model_cc',
    scratchDir: '/tmp/phenix_rednatco',
};
export type PhenixRscc = typeof PhenixRscc;

const Configuration = {
    assets: '',
    coordinates: '',
    densityMaps: '',
    conformersDb: ConformersDb,
    maxPayloadKBytes: 1,
    phenixRscc: PhenixRscc,
    port: 8888,
};
export type Configuration = typeof Configuration;

function checkPrimary(config: Configuration) {
    if (config.assets === '')
        throw new Error('Empty path to assets. Check your configuration.');
    if (!path.isAbsolute(config.assets))
        config.assets = path.join(__dirname, config.assets);

    if (!checkFilePermissions(config.assets, fs.constants.R_OK | fs.constants.X_OK))
        throw new Error('Assets directory either does not exist or cannot be read. Check your configuration.');
    if (!isDirectory(config.assets))
        throw new Error('Path to assets is not a directory. Check your configuration.');

    if (!checkInteger(config.port, { min: 1, max: 65535 }))
        throw new Error('Invalid port number');

    if (!checkInteger(config.maxPayloadKBytes, { min: 1 }))
        throw new Error('Invalid maximum payload size');
}

function checkPhenixRscc(config: Configuration) {
    if (config.phenixRscc.execRealSpace !== '') {
        if (!path.isAbsolute(config.phenixRscc.execRealSpace))
            config.phenixRscc.execRealSpace = path.join(__dirname, config.phenixRscc.execRealSpace);

        if (!checkFilePermissions(config.phenixRscc.execRealSpace, fs.constants.X_OK))
            throw new Error('Phenix real_space_correlation executable either does not exist or is not executable. Check your configuration.');
    }

    if (config.phenixRscc.execMapModelCc !== '') {
        if (!path.isAbsolute(config.phenixRscc.execMapModelCc))
            config.phenixRscc.execMapModelCc = path.join(__dirname, config.phenixRscc.execMapModelCc);

        if (!checkFilePermissions(config.phenixRscc.execMapModelCc, fs.constants.X_OK))
            throw new Error('Phenix map_model_cc executable either does not exist or is not executable. Check your configuration.');
    }

    if (config.phenixRscc.scratchDir === '')
        throw new Error('Empty path to Phenix RSCC scratch directory. Check your configuration.');
    if (!path.isAbsolute(config.phenixRscc.scratchDir))
        config.phenixRscc.scratchDir = path.join(__dirname, config.phenixRscc.scratchDir);
    if (!fs.existsSync(config.phenixRscc.scratchDir))
        fs.mkdirSync(config.phenixRscc.scratchDir, { recursive: true });
}

function checkStructureResources(config: Configuration) {
    if (config.coordinates === null)
        throw new Error('Empty path to coordinates. Check your config file.');
    if (!path.isAbsolute(config.coordinates))
        config.coordinates = path.join(__dirname, config.coordinates);

    if (!checkFilePermissions(config.coordinates, fs.constants.R_OK | fs.constants.X_OK))
        throw new Error('Path to coordinates is either invalid or cannot be read. Check your configuration.');
    if (!isDirectory(config.coordinates))
        throw new Error('Path to coordinates is not a directory. Check your configuration.');

    if (config.densityMaps !== '') {
        if (!path.isAbsolute(config.densityMaps))
            config.densityMaps = path.join(__dirname, config.densityMaps);

        if (!checkFilePermissions(config.densityMaps, fs.constants.R_OK | fs.constants.X_OK))
            throw new Error('Path to density maps is either invalid or cannot be read. Check your configuration.');
        if (!isDirectory(config.densityMaps))
            throw new Error('Path to density maps is not a directory. Check your configuration.');
    }
}

function isConfiguration(v: any): v is Partial<Configuration> {
    if (!checkShape(v, Configuration))
        return false;

    if (v.conformersDb && !checkShape(v.conformersDb, ConformersDb, false))
        return false;

    if (v.phenixRscc && !checkShape(v.phenixRscc, PhenixRscc, false))
        return false;

    return true;
}

function readConfigFile(cfgpath: string): Partial<Configuration> {
    const f = fs.readFileSync(cfgpath);
    const inputConfig = JSON.parse(f.toString('utf8'));

    if (!isConfiguration(inputConfig))
        throw new Error('Configuration object is invalid');

    return inputConfig;
}

export function loadConfiguration(cfgpath: string): Configuration {
    try {
        const config = !fs.existsSync(cfgpath)
            ? { ...Configuration }
            : { ...Configuration,  ...readConfigFile(cfgpath) };

        checkPrimary(config);
        checkPhenixRscc(config);
        checkStructureResources(config);

        return config;
    } catch (e) {
        throw new Error(`Cannot read configuration: ${e}`);
    }
}
