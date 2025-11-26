import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuid_v4 } from 'uuid';
import { PhenixRscc } from "./config";
import { PhenixRsccConvert } from './phenix-rscc-convert';
import { Result } from './result';
import { b64decode } from './util';
import { Requests } from './api/requests';
import { Payloads } from './api/payloads';

function cleanup(dataDir: string) {
    rmdirRecursive(dataDir);
}

function isKnownCoordinateType(type: string): type is 'cif' | 'pdb' {
    return type === 'cif' || type === 'pdb';
}

function makeDataDir(scratch: string) {
    let ctr = 0;

    while (ctr++ < 10) {
        const id = uuid_v4();
        const dataDir = path.join(scratch, id);

        if (fs.existsSync(dataDir))
            continue; // Highly unlikely but let's check anyway

        fs.mkdirSync(dataDir, { recursive: true });

        return dataDir;
    }

    throw new Error('Failed to create directory for job');
}

function phenixCommand(exec: string, coordsPath: string, densityDataPath: string, useMapModelCc: boolean, resolution?: number) {
    const args = [coordsPath, densityDataPath];

    if (useMapModelCc) {
        // phenix.map_model_cc requires resolution parameter for EM maps
        if (resolution && resolution > 0) {
            args.push(`resolution=${resolution}`);
        }
        args.push('compute.cc_per_atom=True');
        args.push('print_cc_per_atom=True');
    } else {
        // phenix.real_space_correlation for MTZ and crystallographic maps
        args.push('detail=atom');
        args.push('resolution_factor=1./8');
    }

    return {
        cmd: exec,
        args
    };
}

function rmdirRecursive(dirPath: string) {
    let entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const e of entries) {
        const ePath = path.join(dirPath, e.name);
        if (e.isDirectory())
            rmdirRecursive(ePath);
        else if (e.isFile())
            fs.unlinkSync(ePath);
    }

    fs.rmdirSync(dirPath);
}

function writeBuf(fd: number, buf: Uint8Array) {
    let written = 0;
    while (written != buf.length) {
        written = fs.writeSync(fd, buf, written);
    }
}

function writeToScratch(filepath: string, buf: Uint8Array) {
    const fd = fs.openSync(filepath, 'w');
    if (fd < 1)
        throw new Error();
    writeBuf(fd, buf);
    fs.closeSync(fd);
}

function isMtzFile(data: Uint8Array): boolean {
    // MTZ files start with 'MTZ ' magic bytes
    if (data.length < 4)
        return false;
    return data[0] === 0x4D && data[1] === 0x54 && data[2] === 0x5A && data[3] === 0x20;
}

function isSfCifFile(data: Uint8Array): boolean {
    // Structure factor CIF files are text files that:
    // 1. Start with 'data_' (CIF format)
    // 2. Contain reflection data categories like '_refln'
    // They are used like MTZ files for phenix.real_space_correlation

    // Check if it's a text file starting with typical CIF markers
    if (data.length < 100)
        return false;

    // Convert first portion to string for text-based detection
    const header = Buffer.from(data.slice(0, Math.min(4096, data.length))).toString('utf8');

    // Check for CIF data block marker
    if (!header.includes('data_'))
        return false;

    // Check for structure factor specific categories
    // SF-CIF files contain reflection data
    return header.includes('_refln') || header.includes('_diffrn_refln');
}

function isCcp4MapFile(data: Uint8Array): boolean {
    // CCP4/MRC map files have specific format markers
    // Check for typical CCP4 map characteristics (this is a simplified check)
    if (data.length < 1024)
        return false;

    // CCP4 maps typically have the word "MAP " at bytes 208-211
    const mapMarkerOffset = 208;
    if (data.length > mapMarkerOffset + 4) {
        const hasMapMarker = data[mapMarkerOffset] === 0x4D &&
                            data[mapMarkerOffset + 1] === 0x41 &&
                            data[mapMarkerOffset + 2] === 0x50 &&
                            data[mapMarkerOffset + 3] === 0x20;
        if (hasMapMarker)
            return true;
    }

    // If MTZ check failed and file is binary, assume it's a map
    return !isMtzFile(data) && !isSfCifFile(data);
}

export namespace PhenixRsccCalc {
    export function calculate(req: Requests.Rscc, config: PhenixRscc): Result.Result<Payloads.Rscc> {
        if (!isKnownCoordinateType(req.coordsType))
            return Result.Error(501, 'Unknown coordinates type');

        let dataDir;
        let coordsPath;
        let densityDataPath;

        const coords = b64decode(req.coords);
        const densityData = b64decode(req.coeffs);

        // Detect file type first
        const isMtz = isMtzFile(densityData);
        const isSfCif = !isMtz && isSfCifFile(densityData);
        const isMap = !isMtz && !isSfCif && isCcp4MapFile(densityData);

        // Determine which Phenix program to use based on file type
        // MTZ and SF-CIF files use real_space_correlation
        // CCP4/MRC maps (both EM and 2fo-fc) use map_model_cc
        const useMapModelCc = isMap;
        const exec = useMapModelCc ? config.execMapModelCc : config.execRealSpace;

        try {
            dataDir = makeDataDir(config.scratchDir);

            coordsPath = path.join(dataDir, `coords.${req.coordsType}`);

            // Write with appropriate extension
            if (isMtz) {
                densityDataPath = path.join(dataDir, 'refls.mtz');
            } else if (isSfCif) {
                densityDataPath = path.join(dataDir, 'refls-sf.cif');
            } else if (isMap) {
                densityDataPath = path.join(dataDir, 'map.ccp4');
            } else {
                // Default to MTZ if detection is uncertain
                densityDataPath = path.join(dataDir, 'refls.mtz');
            }

            writeToScratch(coordsPath, coords);
            writeToScratch(densityDataPath, densityData);
        } catch (e) {
            if (dataDir)
                cleanup(dataDir);

            return Result.Error(500, 'Failed to prepare job');
        }

        const { cmd, args } = phenixCommand(exec, coordsPath, densityDataPath, useMapModelCc, req.resolution);
        try {
            const stdout = child_process.execFileSync(cmd, args, { cwd: dataDir });
            cleanup(dataDir);

            try {
                const coordsText = coords.toString('utf8');
                const phenixOutput = stdout.toString('utf8');
                const rscc = req.coordsType === 'cif'
                    ? PhenixRsccConvert.convertWithCif(coordsText, phenixOutput)
                    : PhenixRsccConvert.convertWithPdb(coordsText, phenixOutput);

                return Result.Ok(rscc);
            } catch (e) {
                const phenixOutput = stdout.toString('utf8');
                console.error('Phenix output:\n', phenixOutput);
                return Result.Error(500, `Failed to aggregate RSCC results: ${(e as Error).message}`);
            }

        } catch (e) {
            return Result.Error(500, `Failed to calculate RSCC: ${(e as Error).message}`);
        }
    }
}
