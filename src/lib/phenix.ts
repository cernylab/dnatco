import fs from 'node:fs';
import { Coordinates } from '../dnatco/coordinates';

function isExecutable(filePath: string) {
    try {
        const s = fs.statSync(filePath);
        return s.isFile() && s.mode && 0o111;
    } catch (e) {
        return false;
    }
}

function isWritableDirectory(dirPath: string) {
    try {
        const s = fs.statSync(dirPath);
        return s.isDirectory() && s.mode && 0o444;
    } catch (e) {
        return false;
    }
}


export namespace Phenix {
    export type Context = {
        exec: string,
        scratchDir: string,
    };

    export function calculateRscc(coords: Coordinates, refls: Uint8Array, ctx: Context) {
    }

    export function makeContext(exec: string, scratchDir: string): Context | undefined {
        if (!isExecutable(exec)) {
            console.log(`Path "${exec}" does not point to an executable file. Disabling Phenix.`);
            return void 0;
        }

        if (!isWritableDirectory(scratchDir)) {
            console.log(`Path "${scratchDir}" does not point to a writable directory. Disabling Phenix.`);
            return void 0;
        }

        return { exec, scratchDir };
    }
}
