import path from 'path';
import process from 'process';
import { fileExists, readBinaryFile, readTextFile, writeBinaryFile, writeTextFile } from './io';
import { isError } from '../dnatco';
import { AnglesLengths } from '../dnatco/angles-lengths';
import { ClassificationContext } from '../dnatco/classification-context';
import { Coordinates } from '../dnatco/coordinates';
import { Dnatcofication, DnatcoficationData } from '../dnatco/dnatcofication';
import { Naval } from '../dnatco/naval';
import { GlobalConfig } from '../global-config';
import { Report } from '../report';
import { TaskContext } from '../tasks/task';

import { NavalAngleRestraintsFile, NavalBondRestraintsFile } from '../assets/params';

const ConfigFilePath = './config.json';

function _relPath(_path: string) {
    return './' + _path;
}

async function getCoordinates(filePath: string): Promise<Coordinates> {
    const data = readTextFile(filePath);
    const ext = path.extname(filePath);

    if (ext === '.cif')
        return { data, type: 'cif' };
    else if (ext === '.pdb')
        return { data, type: 'pdb' };
    else
        throw new Error(`Cannot determine coordinates file type from an unknown suffix "${ext}"`);
}

async function initAnglesLengthsContext() {
    const res = await AnglesLengths.initialize((subpath) => readTextFile(_relPath(subpath)));
    if (isError(res))
        throw new Error(`Cannot initialize AnglesLengths context: ${res.message}`);
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
        throw new Error(`Failed to initialize classification context: ${err}`);
}

async function initNavalContext() {
    const res = await Naval.initialize(_relPath(NavalAngleRestraintsFile), _relPath(NavalBondRestraintsFile), readTextFile);
    if (isError(res))
        throw new Error(res.message ?? 'Unknown error during initialization of Naval context');
}

async function loadConfig() {
    if (!fileExists(ConfigFilePath))
        return;

    const text = readTextFile(ConfigFilePath);
    GlobalConfig.load(JSON.parse(text));
}

function writeCif(d: Dnatcofication) {
    writeTextFile(`/tmp/${d.pdbId}_annotated.cif`, d.rawCif());
}

async function writeValidationReport(d: Dnatcofication, url: string) {
    const report = await Report.pdf(d, {
        href: url,
        assetLoaderFunc: readBinaryFile
    });

    writeBinaryFile(`/tmp/${d.pdbId}_report.pdf`, report);
}

async function main(argv: string[]) {
    if (argv.length < 1) {
        console.log('Invalid arguments');
        process.exit(1);
    }

    const coordsFilePath = argv[0];

    try {
        loadConfig();

        await initClassificationContext();
        await initAnglesLengthsContext();
        await initNavalContext();

        const coords = await getCoordinates(coordsFilePath);
        const dd = Dnatcofication.ingest(
            coords,
            null,
            path.basename(coordsFilePath),
            ClassificationContext.data(),
            AnglesLengths.context(),
            Naval.context(),
            false, // NO NO NO, decide what is a custom structure
            GlobalConfig.data(),
            new TaskContext<DnatcoficationData>(''),
        );
        if (!dd)
            throw new Error('Failed to dnatcoify structure');

        const d = new Dnatcofication();
        d.setData(dd);

        writeCif(d);
        writeValidationReport(d, GlobalConfig.data().referenceUrl);
    } catch (e) {
        console.log((e as Error).message);
        process.exit(1);
    }

}

process.chdir(path.dirname(process.argv[1]));
main(process.argv.slice(2));
