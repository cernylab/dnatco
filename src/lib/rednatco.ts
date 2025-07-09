import './browser-faker';

import path from 'node:path';
import process from 'node:process';
import { fileExists, isDirectory, isReadable, isWriteable, readBinaryFile, readTextFile, writeBinaryFile, writeTextFile } from './io';
import { Logger } from '../log/logger';
import { Phenix } from './phenix';
import { isError, isOk } from '../dnatco';
import { AnglesLengths } from '../dnatco/angles-lengths';
import { ClassificationContext } from '../dnatco/classification-context';
import { Coordinates } from '../dnatco/coordinates';
import { Dnatcofication, DnatcoficationData } from '../dnatco/dnatcofication';
import { Naval } from '../dnatco/naval';
import { Rscc } from '../dnatco/rscc'
import { GlobalConfig } from '../global-config';
import { Report } from '../report';
import { Buster } from '../refine/buster';
import { Phenix as RPhenix } from '../refine/phenix';
import { Refmac } from '../refine/refmac';
import { Coot } from '../refine/coot';
import { TaskContext } from '../tasks/task';

import { NavalAngleRestraintsFile, NavalBondRestraintsFile } from '../assets/params';
import {
    DnaBackdropAssigned, DnaBackdropUnassigned,
    RnaBackdropAssigned, RnaBackdropUnassigned
} from '../assets/rscc';
import { parseFloatStrict } from '../util';

const ConfigFilePath = './config.json';

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
type ExitCode = typeof EXIT_SUCCESS | typeof EXIT_FAILURE;

type Configuration = {
    outputDir: string,
    coordsFilePath: string,
    reflnsFilePath: string,
    outputPrefix: string,
    doExtendedCif: boolean,
    doReport: boolean,
    doBusterRestraints: boolean,
    doRefmacRestraints: boolean,
    doCootRestraints: boolean,
    doPhenixRestraints: boolean,
    restraintsRmsd: number,
    restraintsSigmaFactor: number,
    logFilePath: string,
};

const Parameters = [
    {
        cmd: '--help',
        desc: 'Print usage and exit',
        proc: () => {
            printUsage();
            process.exit(EXIT_SUCCESS);
        },
        required: false,
    },
    {
        cmd: '--outputDir',
        desc: 'Path to output directory [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, 'Parameter "outputDir" requires an argument');
                throw new Error();
            }
            if (!!config.outputDir) {
                Logger.log(Logger.Severity.Error, 'Parameter "outputDir" is already set');
                throw new Error();
            }
            config.outputDir = args[0];

            return args.slice(1);
        },
        required: true,
    },
    {
        cmd: '--coords',
        desc: 'Path to file with coordinates [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, 'Parameter "coords" requires an argument');
                throw new Error();
            }
            if (!!config.coordsFilePath) {
                Logger.log(Logger.Severity.Error, 'Parameter "coords" is already set');
                throw new Error();
            }
            config.coordsFilePath = args[0];

            return args.slice(1);
        },
        required: true,
    },
    {
        cmd: '--reflns',
        desc: 'Path to file with reflections [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, 'Parameter "reflns" requires an argument');
                throw new Error();
            }
            if (!!config.reflnsFilePath) {
                Logger.log(Logger.Severity.Error, 'Parameter "reflns" is already set');
                throw new Error();
            }
            config.reflnsFilePath = args[0];

            return args.slice(1);
        },
        required: false,
    },
    {
        cmd: '--prefix',
        desc: 'Prefix for output files [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, 'Parameter "prefix" requires an argument');
                throw new Error();
            }
            if (!!config.outputPrefix) {
                Logger.log(Logger.Severity.Error, 'Parameter "prefix" is already set');
                throw new Error();
            }
            config.outputPrefix = args[0];

            return args.slice(1);
        },
        required: false,
    },
    {
        cmd: '--extendedCIF',
        desc: 'Generate mmCIF file extended with additional DNATCO categories',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doExtendedCif) {
                Logger.log(Logger.Severity.Error, 'Parameter "extendedCIF" is already set');
                throw new Error();
            }
            config.doExtendedCif = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--report',
        desc: 'Generate comprehensive DNATCO validation report',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doReport) {
                Logger.log(Logger.Severity.Error, 'Parameter "report" is already set');
                throw new Error();
            }
            config.doReport = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--busterRestraints',
        desc: 'Generate file with NtC restraints for Buster',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doBusterRestraints) {
                Logger.log(Logger.Severity.Error, 'Parameter "busterRestraints" is already set');
                throw new Error();
            }
            config.doBusterRestraints = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--refmacRestraints',
        desc: 'Generate file with NtC restraints for Refmac/Servalcat',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doRefmacRestraints) {
                Logger.log(Logger.Severity.Error, 'Parameter "refmacRestraints" is already set');
                throw new Error();
            }
            config.doRefmacRestraints = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--cootRestraints',
        desc: 'Generate file with NtC restraints for Coot',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doCootRestraints) {
                Logger.log(Logger.Severity.Error, 'Parameter "cootRestraints" is already set');
                throw new Error();
            }
            config.doCootRestraints = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--phenixRestraints',
        desc: 'Generate file with NtC restraints for Phenix',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doPhenixRestraints) {
                Logger.log(Logger.Severity.Error, 'Parameter "phenixRestraints" is already set');
                throw new Error();
            }
            config.doPhenixRestraints = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--restraintsRmsd',
        desc: 'Maximum allowed NtC RMSD (default 0.5Å) [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, '"restraintsRmsd" parameter requires an argument');
                throw new Error();
            }
            if (!!config.restraintsRmsd) {
                Logger.log(Logger.Severity.Error, 'Parameter "restraintsRmsd" is already set');
                throw new Error();
            }
            config.restraintsRmsd = parseFloatStrict(args[0]);
            if (isNaN(config.restraintsRmsd)) {
                Logger.log(Logger.Severity.Error, '"restraintsRmsd" value is invalid');
                throw new Error();
            }

            return args.slice(1);
        },
        required: false,
    },
    {
        cmd: '--restraintsSigmaFactor',
        desc: 'Restraints sigma factor (default 1.0) [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, '"restraintsSigmaFactor" parameter requires an argument');
                throw new Error();
            }
            if (!!config.restraintsSigmaFactor) {
                Logger.log(Logger.Severity.Error, 'Parameter "restraintsSigmaFactor" is already set');
                throw new Error();
            }
            config.restraintsSigmaFactor = parseFloatStrict(args[0]);
            if (isNaN(config.restraintsSigmaFactor)) {
                Logger.log(Logger.Severity.Error, '"restraintsSigmaFactor" value is invalid');
                throw new Error();
            }

            return args.slice(1);
        },
        required: false,
    },
    {
        cmd: '--log',
        desc: 'Path to a log file [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, '"log" parameter requires an argument');
                throw new Error();
            }
            if (!!config.logFilePath) {
                Logger.log(Logger.Severity.Error, 'Parameter "log" is already set');
                throw new Error();
            }

            config.logFilePath = args[0];

            return args.slice(1);
        },
        required: false,
    }
];

function _relPath(_path: string) {
    return './' + _path;
}

function getAppName() {
    return path.basename(process.argv[1]);
}

async function getCoordinates(filePath: string): Promise<Coordinates> {
    const data = readTextFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.cif' || ext === '.mmcif')
        return { data, type: 'cif' };
    else if (ext === '.pdb')
        return { data, type: 'pdb' };
    else
        throw new Error(`Cannot determine coordinates file type from an unknown suffix "${ext}".`);
}

async function initAnglesLengthsContext() {
    const res = await AnglesLengths.initialize((subpath) => readTextFile(_relPath(subpath)));
    if (isError(res))
        throw new Error(`Cannot initialize AnglesLengths context: ${res.message}.`);
}

async function initClassificationContext() {
    const err = await ClassificationContext.initialize(
        './classification/clusters.csv',
        './classification/confals.csv',
        './classification/golden_steps.csv',
        './classification/nu_angles.csv',
        './classification/confal_percentiles.csv',
        readTextFile
    );

    if (err)
        throw new Error(`Failed to initialize classification context: ${err}.`);
}

async function initNavalContext() {
    const res = await Naval.initialize(_relPath(NavalAngleRestraintsFile), _relPath(NavalBondRestraintsFile), readTextFile);
    if (isError(res))
        throw new Error(res.message ?? 'Unknown error during initialization of Naval context.');
}

function initRscc() {
    try {
        initRsccFile(DnaBackdropAssigned, 'dna-assigned');
        initRsccFile(DnaBackdropUnassigned, 'dna-unassigned');
        initRsccFile(RnaBackdropAssigned, 'rna-assigned');
        initRsccFile(RnaBackdropUnassigned, 'rna-unassigned');
    } catch (e) {
        throw new Error(`Rscc initialization failed: ${(e as Error).message}`);
    }
}

function initRsccFile(filePath: string, kind: Rscc.BackdropRsccKind) {
    const text = readTextFile(_relPath(filePath));
    const json = JSON.parse(text);
    const res = Rscc.loadBackdropRscc(json, kind);
    if (isError(res))
        throw new Error(`Cannot laod Rscc backdrop from file "${filePath}": ${res.message}.`);
}

async function initializeEverything() {
    try {
        loadConfig();

        await initClassificationContext();
        await initAnglesLengthsContext();
        await initNavalContext();
        initRscc();

        return {
            phenixCtx: Phenix.makeContext(GlobalConfig.data().phenix.rsccExec),
        };
    } catch (e) {
        console.log(`Initialization failed: ${(e as Error).message}`);

        return void 0;
    }
}

function loadConfig() {
    if (!fileExists(ConfigFilePath))
        return;

    const text = readTextFile(ConfigFilePath);
    GlobalConfig.load(JSON.parse(text));
}

function parseCmdParams(args: string[]) {
    const cfg: Partial<Configuration> = {};
    while (args.length > 0) {
        const current = args[0];
        const p = Parameters.find((x) => x.cmd === current);
        if (!p) throw new Error(`"${current}" is not a valid parameter`);

        try {
            args = args.slice(1);
            args = p.proc(args, cfg);
        } catch (e) {
            return null;
        }
    }

    return cfg;
}

function printUsage() {
    const appName = getAppName();
    console.log(`Usage: ${appName}`);
    for (const p of Parameters) {
        console.log(`\t${p.cmd.padEnd(25)} \t${p.desc} ${p.required ? '(REQUIRED)' : ''}`);
    }
}

function writeCif(d: Dnatcofication, outputDirPath: string, outputPrefix?: string) {
    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_extended.cif`);
    writeTextFile(outPath, d.rawCif());
}

function writeBusterRestraints(d: Dnatcofication, outputDirPath: string, maxRmsd?: number, sigmaFactor?: number, outputPrefix?: string) {
    const restraints  = Buster.restraints(d, '', maxRmsd ?? 0.5, sigmaFactor);
    const text = Buster.restraintsAsText(restraints);

    const restraintsPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_restraints_buster.txt`);
    writeTextFile(restraintsPath, text);
}

function writeRefmacRestraints(d: Dnatcofication, outputDirPath: string, maxRmsd?: number, sigmaFactor?: number, outputPrefix?: string) {
    const restraints  = Refmac.restraints(d, '', maxRmsd ?? 0.5, sigmaFactor);
    const text = Refmac.restraintsAsText(restraints);

    const restraintsPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_restraints_refmac.txt`);
    writeTextFile(restraintsPath, text);
}

function writeCootRestraints(d: Dnatcofication, outputDirPath: string, maxRmsd?: number, sigmaFactor?: number, outputPrefix?: string) {
    const restraints  = Coot.restraints(d, '', maxRmsd ?? 0.5, sigmaFactor);
    const text = Coot.restraintsAsText(restraints);

    const restraintsPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_restraints_coot.txt`);
    writeTextFile(restraintsPath, text);
}

function writePhenixRestraints(d: Dnatcofication, outputDirPath: string, maxRmsd?: number, sigmaFactor?: number, outputPrefix?: string) {
    const restraints  = RPhenix.restraints(d, '', maxRmsd ?? 0.5, sigmaFactor);
    const text = RPhenix.restraintsAsText(restraints);

    const restraintsPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_restraints_phenix.txt`);
    writeTextFile(restraintsPath, text);
}

async function writeValidationReport(d: Dnatcofication, url: string, outputDirPath: string, outputPrefix?: string) {
    const report = await Report.pdf(
        d,
        {
            href: url,
            assetLoaderFunc: readBinaryFile,
            completeStepsTable: true,
            completeAnglesLengths: true,
        },
        'offline'
    );

    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_report.pdf`);
    writeBinaryFile(outPath, report);
}

async function main(argv: string[]): Promise<ExitCode> {
    const runCfg = parseCmdParams(argv);
    if (runCfg === null) {
        printUsage();
        return EXIT_FAILURE;
    }

    const outputDirPath = runCfg.outputDir;
    const coordsFilePath = runCfg.coordsFilePath;
    const reflnsFilePath = runCfg.reflnsFilePath;
    const outputPrefix = runCfg.outputPrefix;

    Logger.initialize(getAppName(),
        {
            appId: process.pid.toString(),
            logFileDir: runCfg.logFilePath,
        }
    );

    if (!outputDirPath) {
        printUsage();
        Logger.log(Logger.Severity.Error, 'Output directory is not set');
        return EXIT_FAILURE;
    }
    if (!coordsFilePath) {
        printUsage();
        Logger.log(Logger.Severity.Error, 'Coordinates file is not set');
        return EXIT_FAILURE;
    }

    if (!isDirectory(outputDirPath) || !isWriteable(outputDirPath)) {
        Logger.log(Logger.Severity.Error, `Output directory "${outputDirPath}" does not appear to be a writeable directory.`);
        return EXIT_FAILURE;
    }

    const ctx = await initializeEverything();
    if (!ctx)
        return EXIT_FAILURE;

    const cfg = GlobalConfig.data();

    if (!isReadable(coordsFilePath)) {
        Logger.log(Logger.Severity.Error, `Coordinates file "${coordsFilePath}" does not appear to be readable.`)
        return EXIT_FAILURE;
    }
    if (reflnsFilePath && !isReadable(reflnsFilePath)) {
        Logger.log(Logger.Severity.Error, `Reflections file "${reflnsFilePath}" does not appear to be readable.`);
        return EXIT_FAILURE;
    }

    // TODO:
    // The entire content of this try-catch block could be done in a loop
    // for multiple structures. This would be a major performance improvement
    // for mass-processing use cases. Especially for smaller structures the cost
    // of starting NodeJS and initializing the analyzing engine is quite high.
    //
    // To make this happen, the CLI of this program needs to be extended to support
    // input multiple structures.
    try {
        const coords = await getCoordinates(coordsFilePath);
        const dd = Dnatcofication.ingest(
            coords,
            null,
            path.basename(coordsFilePath),
            ClassificationContext.data(),
            AnglesLengths.context(),
            Naval.context(),
            false, // TODO: When should we mark a structure as custom structure?
            cfg,
            new TaskContext<DnatcoficationData>(''),
        );
        if (!dd)
            throw new Error('Failed to dnatcoify structure');

        if (ctx.phenixCtx && reflnsFilePath) {
            const rscc = Phenix.calculateRscc({ coords, filePath: coordsFilePath }, reflnsFilePath, ctx.phenixCtx);
            if (isOk(rscc)) {
                dd.rscc = rscc.data;
            } else
                Logger.log(Logger.Severity.Warning, rscc.message);
        }

        const d = new Dnatcofication();
        d.setData(dd);

        // TODO:
        // put the defaults (currently 0.5Å rmsd and 1.0 factor) to the config.json file (for both the app and offline)
        const maxRmsd = runCfg.restraintsRmsd;
        const sigmaFactor = runCfg.restraintsSigmaFactor;

        if (runCfg.doExtendedCif) {
            Logger.log(Logger.Severity.Warning, `Writing the DNATCO extended mmCIF file.`);
            writeCif(d, outputDirPath, outputPrefix);
        } else {
            Logger.log(Logger.Severity.Warning, `The DNATCO extended mmCIF file will NOT be produced (see --extendedCIF).`);
        }
        if (runCfg.doReport) {
            Logger.log(Logger.Severity.Warning, `Writing the DNATCO validation report file.`);
            await writeValidationReport(d, cfg.referenceUrl, outputDirPath, outputPrefix);
        } else {
            Logger.log(Logger.Severity.Warning, `The DNATCO validation report file will NOT be produced (see --report).`);
        }
        // warn users that they didn't ask for any restraints
        if (!(runCfg.doBusterRestraints || runCfg.doRefmacRestraints || runCfg.doCootRestraints || runCfg.doPhenixRestraints))
            Logger.log(Logger.Severity.Warning, `No restraints requested, consider adding any of --busterRestraints|--refmacRestraints|--cootRestraints|--phenixRestraints parameters.`);
        else
            Logger.log(Logger.Severity.Warning, `Writing restraints.`);
        if (runCfg.doBusterRestraints) writeBusterRestraints(d, outputDirPath, maxRmsd, sigmaFactor, outputPrefix);
        if (runCfg.doRefmacRestraints) writeRefmacRestraints(d, outputDirPath, maxRmsd, sigmaFactor, outputPrefix);
        if (runCfg.doCootRestraints) writeCootRestraints(d, outputDirPath, maxRmsd, sigmaFactor, outputPrefix);
        if (runCfg.doPhenixRestraints) writePhenixRestraints(d, outputDirPath, maxRmsd, sigmaFactor, outputPrefix);

        Logger.log(Logger.Severity.Debug, `Done processing "${coordsFilePath}"`);
    } catch (e) {
        Logger.log(Logger.Severity.Error, (e as Error).message);

        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

process.chdir(path.dirname(process.argv[1]));
main(process.argv.slice(2)).then((ret) => process.exit(ret));
