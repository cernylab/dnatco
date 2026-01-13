import './browser-faker';

import path from 'node:path';
import process from 'node:process';
import { fileExists, isDirectory, isReadable, isWriteable, readBinaryFile, readTextFile, writeBinaryFile, writeTextFile } from './io';
import { Logger } from '../log/logger';
import { Version } from '../version';
import { isCanvasAvailable, getCanvasInstallMessage } from '../node-util/canvas-check';
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
import { Serialization } from '../util/serialization';
import { SerializeByCompound, SerializeByResidue } from '../dnatco/angles-lengths/serialize';
import { SummarizeProSco, SummarizeNaval } from '../dnatco/angles-lengths/summarize';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../cif/categories/ndb-struct-ntc';
import { objKeys } from '../util';
import { ImageSerialization } from '../util/image-serialization';
import { RsccPlot } from '../ui/dnatco/rscc-plot';

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
    doReportText: boolean,
    doBusterRestraints: boolean,
    doRefmacRestraints: boolean,
    doCootRestraints: boolean,
    doPhenixRestraints: boolean,
    restraintsRmsd: number,
    restraintsSigmaFactor: number,
    logFilePath: string,
    doNtcCsv: boolean,
    doNtcJson: boolean,
    doNtcFullCsv: boolean,
    doNtcFullJson: boolean,
    doAnglesLengthsByCompoundCsv: boolean,
    doAnglesLengthsByCompoundJson: boolean,
    doAnglesLengthsByResidueCsv: boolean,
    doAnglesLengthsByResidueJson: boolean,
    doRsccRmsdPlots: boolean,
    phenixDataLabels: string,
};

const Parameters = [
    {
        cmd: '--version',
        desc: 'Print version information and exit',
        proc: () => {
            printVersionInfo();
            process.exit(EXIT_SUCCESS);
        },
        required: false,
    },
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
        desc: 'Generate comprehensive DNATCO validation report as PDF (requires canvas)',
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
        cmd: '--reportText',
        desc: 'Generate comprehensive DNATCO validation report as plain text',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doReportText) {
                Logger.log(Logger.Severity.Error, 'Parameter "reportText" is already set');
                throw new Error();
            }
            config.doReportText = true;
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
        cmd: '--phenixDataLabels',
        desc: 'Phenix RSCC data_labels parameter (overrides config.json) [VALUE]',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (args.length < 1) {
                Logger.log(Logger.Severity.Error, '"phenixDataLabels" parameter requires an argument');
                throw new Error();
            }
            if (!!config.phenixDataLabels) {
                Logger.log(Logger.Severity.Error, 'Parameter "phenixDataLabels" is already set');
                throw new Error();
            }
            config.phenixDataLabels = args[0];

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
    },
    {
        cmd: '--ntcCsv',
        desc: 'Generate CSV file with assigned NtCs (summary table)',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doNtcCsv) {
                Logger.log(Logger.Severity.Error, 'Parameter "ntcCsv" is already set');
                throw new Error();
            }
            config.doNtcCsv = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--ntcJson',
        desc: 'Generate JSON file with assigned NtCs (summary table)',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doNtcJson) {
                Logger.log(Logger.Severity.Error, 'Parameter "ntcJson" is already set');
                throw new Error();
            }
            config.doNtcJson = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--ntcFullCsv',
        desc: 'Generate CSV file with assigned NtCs including Confal Scores and RMSDs',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doNtcFullCsv) {
                Logger.log(Logger.Severity.Error, 'Parameter "ntcFullCsv" is already set');
                throw new Error();
            }
            config.doNtcFullCsv = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--ntcFullJson',
        desc: 'Generate JSON file with assigned NtCs including Confal Scores and RMSDs',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doNtcFullJson) {
                Logger.log(Logger.Severity.Error, 'Parameter "ntcFullJson" is already set');
                throw new Error();
            }
            config.doNtcFullJson = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--anglesLengthsByCompoundCsv',
        desc: 'Generate CSV file with bond angles and lengths statistics by nucleotide type',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doAnglesLengthsByCompoundCsv) {
                Logger.log(Logger.Severity.Error, 'Parameter "anglesLengthsByCompoundCsv" is already set');
                throw new Error();
            }
            config.doAnglesLengthsByCompoundCsv = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--anglesLengthsByCompoundJson',
        desc: 'Generate JSON file with bond angles and lengths statistics by nucleotide type',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doAnglesLengthsByCompoundJson) {
                Logger.log(Logger.Severity.Error, 'Parameter "anglesLengthsByCompoundJson" is already set');
                throw new Error();
            }
            config.doAnglesLengthsByCompoundJson = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--anglesLengthsByResidueCsv',
        desc: 'Generate CSV file with bond angles and lengths by residue',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doAnglesLengthsByResidueCsv) {
                Logger.log(Logger.Severity.Error, 'Parameter "anglesLengthsByResidueCsv" is already set');
                throw new Error();
            }
            config.doAnglesLengthsByResidueCsv = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--anglesLengthsByResidueJson',
        desc: 'Generate JSON file with bond angles and lengths by residue',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doAnglesLengthsByResidueJson) {
                Logger.log(Logger.Severity.Error, 'Parameter "anglesLengthsByResidueJson" is already set');
                throw new Error();
            }
            config.doAnglesLengthsByResidueJson = true;
            return args;
        },
        required: false,
    },
    {
        cmd: '--rsccRmsdPlots',
        desc: 'Generate RSCC vs RMSD plots as SVG files (requires canvas)',
        proc: (args: string[], config: Partial<Configuration>) => {
            if (config.doRsccRmsdPlots) {
                Logger.log(Logger.Severity.Error, 'Parameter "rsccRmsdPlots" is already set');
                throw new Error();
            }
            config.doRsccRmsdPlots = true;
            return args;
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

async function initializeEverything(phenixDataLabels?: string) {
    try {
        loadConfig();

        await initClassificationContext();
        await initAnglesLengthsContext();
        await initNavalContext();
        initRscc();

        // Use command-line argument if provided, otherwise use config file value
        const dataLabels = phenixDataLabels || GlobalConfig.data().phenix.dataLabels;

        return {
            phenixCtx: Phenix.makeContext(GlobalConfig.data().phenix.rsccExec, dataLabels),
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

function printVersionInfo() {
    console.log(`DNATCO version ${Version.tag()}`);
}

function printUsage() {
    const appName = getAppName();
    printVersionInfo();
    console.log('Comprehensive validation and analysis tool for nucleic acid structures');
    console.log('For more information, visit: https://dnatco.datmos.org and https://github.com/cernylab/dnatco');
    console.log('');
    console.log(`Usage: ${appName} [OPTIONS]`);
    console.log('');
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

async function writeValidationReportText(d: Dnatcofication, url: string, outputDirPath: string, outputPrefix?: string) {
    const report = await Report.text(
        d,
        {
            href: url,
            assetLoaderFunc: readBinaryFile,
            completeStepsTable: true,
            completeAnglesLengths: true,
        },
        'offline'
    );

    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_report.txt`);
    writeTextFile(outPath, report);
}

function assignmentTable(d: Dnatcofication, includeConfalsAndRmsds: boolean) {
    const steps = d.table(NdbStructNtcStep);
    const summary = d.table(NdbStructNtcStepSummary);
    const { label_asym_id_1, name } = steps;
    const {
        assigned_NtC,
        closest_NtC,
        assigned_CANA,
        closest_CANA,
        confal_score,
        cartesian_rmsd_closest_NtC_representative,
    } = summary;

    const chainColumn = {
        name: 'Chain',
        values: label_asym_id_1.values!.map((x) => x),
    };
    const stepColumn = {
        name: 'Step',
        values: name.values!.map((x) => x),
    };
    const assignedNtCColumn = {
        name: 'Assigned NtC',
        values: assigned_NtC.values!.map((x) => x),
    };
    const closestNtCColumn = {
        name: 'Closest NtC',
        values: closest_NtC.values!.map((x) => x),
    };
    const assignedCanaColumn = {
        name: 'Assigned CANA',
        values: assigned_CANA.values!.map((x) => x),
    };
    const closestCanaColumn = {
        name: 'Closest CANA',
        values: closest_CANA.values!.map((x) => x),
    };
    const confalScoreColumn = {
        name: 'CS',
        values: confal_score.values!.map((x) => x.toString()),
    };
    const rmsdColumn = {
        name: 'RMSD',
        values: cartesian_rmsd_closest_NtC_representative.values!.map((x) =>
            x.toString()
        ),
    };

    const columns = [
        chainColumn,
        stepColumn,
        assignedNtCColumn,
        closestNtCColumn,
        assignedCanaColumn,
        closestCanaColumn,
    ];
    if (includeConfalsAndRmsds) columns.push(confalScoreColumn, rmsdColumn);

    return columns;
}

function writeNtcAssignments(d: Dnatcofication, outputDirPath: string, fileType: 'csv' | 'json', full: boolean, outputPrefix?: string) {
    const table = assignmentTable(d, full);
    const text = Serialization.table(table, fileType);
    const suffix = full ? '_assigned_ntcs_full' : '_assigned_ntcs';
    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}${suffix}.${fileType}`);
    writeTextFile(outPath, text);
}

function writeAnglesLengthsByCompound(d: Dnatcofication, outputDirPath: string, fileType: 'csv' | 'json', outputPrefix?: string) {
    const multipleModels = Dnatcofication.Structure.numberOfModels(d) > 1;
    const data = d.data.almByCompound.models.get(
        multipleModels ? -1 : d.data.structures[0].models[0].num
    );
    if (!data) {
        Logger.log(Logger.Severity.Warning, 'No angles/lengths data available by compound');
        return;
    }

    const proScoCountsAngles = SummarizeProSco.countsInGroups(data.overallAnglesProSco);
    const proScoCountsLengths = SummarizeProSco.countsInGroups(data.overallLengthsProSco);
    const navalCountsAngles = SummarizeNaval.countsInGroups(data.overallAnglesNaval);
    const navalCountsLengths = SummarizeNaval.countsInGroups(data.overallLengthsNaval);

    const angles = objKeys(data.angles).flatMap((k) =>
        Array.from(data.angles[k].byMetric.values()).map((x) => x.individual)
    );
    const lengths = objKeys(data.lengths).flatMap((k) =>
        Array.from(data.lengths[k].byMetric.values()).map((x) => x.individual)
    );

    const text =
        fileType === 'csv'
            ? SerializeByCompound.toCsv(angles, proScoCountsAngles, lengths, proScoCountsLengths, navalCountsAngles, navalCountsLengths)
            : SerializeByCompound.toJson(angles, proScoCountsAngles, lengths, proScoCountsLengths, navalCountsAngles, navalCountsLengths);

    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_angles_lengths_by_compound.${fileType}`);
    writeTextFile(outPath, text);
}

function writeAnglesLengthsByResidue(d: Dnatcofication, outputDirPath: string, fileType: 'csv' | 'json', outputPrefix?: string) {
    const residues = d.data.almByResidue.residues;
    const proScoSummary = SummarizeProSco.substructure(residues);
    const navalSummary = SummarizeNaval.substructure(residues, d.data.naval);

    const proScoCountsAngles = SummarizeProSco.countsInGroups(proScoSummary.angles);
    const proScoCountsLengths = SummarizeProSco.countsInGroups(proScoSummary.lengths);
    const navalCountsAngles = SummarizeNaval.countsInGroups(navalSummary.angles);
    const navalCountsLengths = SummarizeNaval.countsInGroups(navalSummary.lengths);

    const text =
        fileType === 'csv'
            ? SerializeByResidue.toCsv(
                proScoCountsAngles,
                proScoCountsLengths,
                navalCountsAngles,
                navalCountsLengths,
                residues,
                d.data.almByResidue.stats
            )
            : SerializeByResidue.toJson(
                proScoCountsAngles,
                proScoCountsLengths,
                navalCountsAngles,
                navalCountsLengths,
                residues,
                d.data.almByResidue.stats
            );

    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}_angles_lengths_by_residue.${fileType}`);
    writeTextFile(outPath, text);
}

async function writeRsccRmsdPlots(d: Dnatcofication, outputDirPath: string, outputPrefix?: string) {
    // Process each model
    const numModels = d.data.structures[0].models.length;

    for (let modelIndex = 0; modelIndex < numModels; modelIndex++) {
        const modelSuffix = numModels > 1 ? `_model${modelIndex + 1}` : '';

        // Get RSCC data for this model
        const struRsccRes = await Rscc.structureRscc(d, modelIndex);
        if (!isOk(struRsccRes)) {
            Logger.log(Logger.Severity.Warning, `Cannot fetch RSCC data for model ${modelIndex + 1}: ${struRsccRes.message}`);
            continue;
        }

        const rqKinds = RsccPlot.requestedKinds(modelIndex, d);

        // Process assigned plot
        if (struRsccRes.data.assigned.length > 0) {
            const backdropRes = await Rscc.backdropRscc(rqKinds.assigned);
            if (isOk(backdropRes)) {
                const plotData = RsccPlot.makeData(struRsccRes.data.assigned, backdropRes.data, void 0, d);

                if (!RsccPlot.isPlotEmpty(plotData)) {
                    const layout = {
                        title: `${d.identifyingName}${modelSuffix} assigned`,
                        xaxis: { title: 'RSCC', automargin: true },
                        yaxis: { title: 'RMSD [Å]', automargin: true },
                        plot_bgcolor: 'white',
                        paper_bgcolor: 'white',
                    };

                    const plotlyData = RsccPlot.makePlotlyData(plotData.xy, plotData.contour, true) as any[];
                    const img = await ImageSerialization.toImage(plotlyData, layout, 1000, 1000, 'svg');

                    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}${modelSuffix}_rscc_rmsd_assigned.svg`);
                    writeBinaryFile(outPath, img);
                    Logger.log(Logger.Severity.Info, `Wrote RSCC/RMSD assigned plot for model ${modelIndex + 1}`);
                }
            } else {
                Logger.log(Logger.Severity.Warning, `Cannot fetch RSCC backdrop for assigned (model ${modelIndex + 1}): ${backdropRes.message}`);
            }
        }

        // Process unassigned plot
        if (struRsccRes.data.unassigned.length > 0) {
            const backdropRes = await Rscc.backdropRscc(rqKinds.unassigned);
            if (isOk(backdropRes)) {
                const plotData = RsccPlot.makeData(struRsccRes.data.unassigned, backdropRes.data, void 0, d);

                if (!RsccPlot.isPlotEmpty(plotData)) {
                    const layout = {
                        title: `${d.identifyingName}${modelSuffix} unassigned`,
                        xaxis: { title: 'RSCC', automargin: true },
                        yaxis: { title: 'RMSD [Å]', automargin: true },
                        plot_bgcolor: 'white',
                        paper_bgcolor: 'white',
                    };

                    const plotlyData = RsccPlot.makePlotlyData(plotData.xy, plotData.contour, true) as any[];
                    const img = await ImageSerialization.toImage(plotlyData, layout, 1000, 1000, 'svg');

                    const outPath = path.resolve(outputDirPath, `${outputPrefix ?? d.pdbId}${modelSuffix}_rscc_rmsd_unassigned.svg`);
                    writeBinaryFile(outPath, img);
                    Logger.log(Logger.Severity.Info, `Wrote RSCC/RMSD unassigned plot for model ${modelIndex + 1}`);
                }
            } else {
                Logger.log(Logger.Severity.Warning, `Cannot fetch RSCC backdrop for unassigned (model ${modelIndex + 1}): ${backdropRes.message}`);
            }
        }
    }
}

async function main(argv: string[]): Promise<ExitCode> {
    // If no arguments provided, print version info and usage
    if (argv.length === 0) {
        printUsage();
        return EXIT_SUCCESS;
    }

    const runCfg = parseCmdParams(argv);
    if (runCfg === null) {
        printUsage();
        return EXIT_FAILURE;
    }

    const outputDirPath = runCfg.outputDir;
    const coordsFilePath = runCfg.coordsFilePath;
    const reflnsFilePath = runCfg.reflnsFilePath;
    const outputPrefix = runCfg.outputPrefix;

    if (!outputDirPath) {
        printUsage();
        console.error('Output directory is not set');
        return EXIT_FAILURE;
    }
    if (!coordsFilePath) {
        printUsage();
        console.error('Coordinates file is not set');
        return EXIT_FAILURE;
    }

    if (!isDirectory(outputDirPath) || !isWriteable(outputDirPath)) {
        console.error(`Output directory "${outputDirPath}" does not appear to be a writeable directory.`);
        return EXIT_FAILURE;
    }

    // Initialize everything (including loading config) before initializing the Logger
    // so that the Logger can use the correct minSeverity from config.json
    const ctx = await initializeEverything(runCfg.phenixDataLabels);
    if (!ctx)
        return EXIT_FAILURE;

    // Now initialize Logger with the loaded config
    Logger.initialize(getAppName(),
        {
            appId: process.pid.toString(),
            logFileDir: runCfg.logFilePath,
            minSeverity: GlobalConfig.data().minSeverity,
        }
    );

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
            true, // Standalone tool: all structures are treated as custom (user-provided)
            cfg,
            new TaskContext<DnatcoficationData>(''),
        );
        if (!dd)
            throw new Error('Failed to dnatcoify structure');

        if (ctx.phenixCtx && reflnsFilePath) {
            const rscc = Phenix.calculateRscc({ coords, filePath: coordsFilePath }, reflnsFilePath, ctx.phenixCtx);
            if (isOk(rscc)) {
                dd.rscc = rscc.data;
                Logger.log(Logger.Severity.Info, `Phenix RSCC calculation succeeded, calculated ${rscc.data.length} RSCC values`);
            } else {
                Logger.log(Logger.Severity.Warning, `Phenix RSCC calculation failed: ${rscc.message}`);
            }
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
            if (!isCanvasAvailable()) {
                Logger.log(Logger.Severity.Error, `Cannot generate PDF report: canvas package is not installed.`);
                Logger.log(Logger.Severity.Error, getCanvasInstallMessage());
                Logger.log(Logger.Severity.Warning, `Skipping PDF report generation. All other outputs will be generated normally.`);
            } else {
                try {
                    Logger.log(Logger.Severity.Warning, `Writing the DNATCO validation report file.`);
                    await writeValidationReport(d, cfg.referenceUrl, outputDirPath, outputPrefix);
                } catch (e) {
                    if (e instanceof Error && e.message.includes('Canvas package is not available')) {
                        Logger.log(Logger.Severity.Error, `Cannot generate PDF report: ${e.message}`);
                        Logger.log(Logger.Severity.Error, getCanvasInstallMessage());
                        Logger.log(Logger.Severity.Warning, `Skipping PDF report generation. All other outputs will be generated normally.`);
                    } else {
                        throw e;
                    }
                }
            }
        } else {
            Logger.log(Logger.Severity.Warning, `The DNATCO validation report file will NOT be produced (see --report).`);
        }
        if (runCfg.doReportText) {
            Logger.log(Logger.Severity.Warning, `Writing the DNATCO text validation report file.`);
            await writeValidationReportText(d, cfg.referenceUrl, outputDirPath, outputPrefix);
        } else {
            Logger.log(Logger.Severity.Warning, `The DNATCO text validation report file will NOT be produced (see --reportText).`);
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

        // Export CSV/JSON data
        if (runCfg.doNtcCsv || runCfg.doNtcJson || runCfg.doNtcFullCsv || runCfg.doNtcFullJson ||
            runCfg.doAnglesLengthsByCompoundCsv || runCfg.doAnglesLengthsByCompoundJson ||
            runCfg.doAnglesLengthsByResidueCsv || runCfg.doAnglesLengthsByResidueJson) {
            Logger.log(Logger.Severity.Warning, `Writing CSV/JSON data exports.`);
        }
        if (runCfg.doNtcCsv) writeNtcAssignments(d, outputDirPath, 'csv', false, outputPrefix);
        if (runCfg.doNtcJson) writeNtcAssignments(d, outputDirPath, 'json', false, outputPrefix);
        if (runCfg.doNtcFullCsv) writeNtcAssignments(d, outputDirPath, 'csv', true, outputPrefix);
        if (runCfg.doNtcFullJson) writeNtcAssignments(d, outputDirPath, 'json', true, outputPrefix);
        if (runCfg.doAnglesLengthsByCompoundCsv) writeAnglesLengthsByCompound(d, outputDirPath, 'csv', outputPrefix);
        if (runCfg.doAnglesLengthsByCompoundJson) writeAnglesLengthsByCompound(d, outputDirPath, 'json', outputPrefix);
        if (runCfg.doAnglesLengthsByResidueCsv) writeAnglesLengthsByResidue(d, outputDirPath, 'csv', outputPrefix);
        if (runCfg.doAnglesLengthsByResidueJson) writeAnglesLengthsByResidue(d, outputDirPath, 'json', outputPrefix);

        // RSCC/RMSD plots (requires canvas, similar to PDF report)
        if (runCfg.doRsccRmsdPlots) {
            if (!isCanvasAvailable()) {
                Logger.log(Logger.Severity.Error, `Cannot generate RSCC/RMSD plots: canvas package is not installed.`);
                Logger.log(Logger.Severity.Error, getCanvasInstallMessage());
                Logger.log(Logger.Severity.Warning, `Skipping RSCC/RMSD plot generation. All other outputs will be generated normally.`);
            } else {
                try {
                    Logger.log(Logger.Severity.Warning, `Writing RSCC/RMSD plots.`);
                    await writeRsccRmsdPlots(d, outputDirPath, outputPrefix);
                } catch (e) {
                    if (e instanceof Error && e.message.includes('Canvas package is not available')) {
                        Logger.log(Logger.Severity.Error, `Cannot generate RSCC/RMSD plots: ${e.message}`);
                        Logger.log(Logger.Severity.Error, getCanvasInstallMessage());
                        Logger.log(Logger.Severity.Warning, `Skipping RSCC/RMSD plot generation. All other outputs will be generated normally.`);
                    } else {
                        throw e;
                    }
                }
            }
        }

        Logger.log(Logger.Severity.Debug, `Done processing "${coordsFilePath}"`);
    } catch (e) {
        Logger.log(Logger.Severity.Error, (e as Error).message);

        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

process.chdir(path.dirname(process.argv[1]));
main(process.argv.slice(2)).then((ret) => process.exit(ret));
