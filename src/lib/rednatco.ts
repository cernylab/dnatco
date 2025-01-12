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
import { TaskContext } from '../tasks/task';

import { NavalAngleRestraintsFile, NavalBondRestraintsFile } from '../assets/params';
import {
    DnaBackdropAssigned, DnaBackdropUnassigned,
    RnaBackdropAssigned, RnaBackdropUnassigned
} from '../assets/rscc';

const ConfigFilePath = './config.json';

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
type ExitCode = typeof EXIT_SUCCESS | typeof EXIT_FAILURE;

function _relPath(_path: string) {
    return './' + _path;
}

function getAppName() {
    return path.basename(process.argv[1]);
}

async function getCoordinates(filePath: string): Promise<Coordinates> {
    const data = readTextFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.cif')
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

function printUsage() {
    const appName = getAppName();
    console.log(`Usage: ${appName} OUTPUT_DIRECTORY COORDINATES_FILE.(cif|pdb) [MAP_COEFFICIENTS.mtz]`);
}

function writeCif(d: Dnatcofication, outputDirPath: string) {
    const outPath = path.resolve(outputDirPath, `${d.pdbId}_annotated.cif`);
    writeTextFile(outPath, d.rawCif());
}

async function writeValidationReport(d: Dnatcofication, url: string, outputDirPath: string) {
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

    const outPath = path.resolve(outputDirPath, `${d.pdbId}_report.pdf`);
    writeBinaryFile(outPath, report);
}

async function main(argv: string[]): Promise<ExitCode> {
    if (argv.length < 2) {
        Logger.log(Logger.Severity.Error, 'Invalid arguments');
        printUsage();

        return EXIT_FAILURE;
    }

    const outputDirPath = argv[0];
    const coordsFilePath = argv[1];
    const reflnsFilePath = argv[2];

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

        writeCif(d, outputDirPath);
        await writeValidationReport(d, cfg.referenceUrl, outputDirPath);

        Logger.log(Logger.Severity.Debug, `Done processing "${coordsFilePath}"`);
    } catch (e) {
        Logger.log(Logger.Severity.Error, (e as Error).message);

        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

Logger.initialize(getAppName(),
    {
        appId: process.pid.toString(),
        logFileDir: process.argv[2],
    }
);

process.chdir(path.dirname(process.argv[1]));
main(process.argv.slice(2)).then((ret) => process.exit(ret));
