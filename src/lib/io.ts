import fs from 'node:fs';
import path from 'node:path';

const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder();

export function copyFile(fromPath: string, toPath: string) {
    const fromPathNorm = path.normalize(fromPath);
    const toPathNorm = path.normalize(toPath);

    if (fromPathNorm === toPathNorm)
        throw new Error(`Cannot copy file because the target path "${toPath}" is the same as the source path.`);

    const buf = readBinaryFile(fromPathNorm);
    writeBinaryFile(toPathNorm, buf);
}

export function fileExists(filePath: string) {
    try {
        const s = fs.statSync(filePath);
        return s.isFile();
    } catch (e) {
        return false;
    }
}

export function readBinaryFile(filePath: string) {
    let s;
    try {
        s = fs.statSync(filePath);
    } catch (e) {
        throw new Error(`Cannot stat object on path "${filePath}": ${(e as Error).message}`);
    }
    if (!s.isFile())
        throw new Error(`Object on path "${filePath}" is not a file`);

    const fd = fs.openSync(filePath, 'r');
    if (fd < 0)
        throw new Error(`Cannot open file "${filePath}" for reading`);

    const buf = new Uint8Array(s.size);
    const bytesRead = fs.readSync(fd, buf, 0, s.size, null);
    if (bytesRead !== s.size) {
        fs.closeSync(fd);
        throw new Error(`Expected to read ${s.size} bytes from file "${filePath}" but the number of actually read bytes was ${bytesRead}`);
    }

    fs.closeSync(fd);

    return buf;
}

export function readTextFile(filePath: string, encoding?: string) {
    const buf = readBinaryFile(filePath);

    if (encoding && encoding !== 'utf-8') {
        const dec = new TextDecoder(encoding);
        return dec.decode(buf);
    } else
        return decoder.decode(buf);
}

export function writeBinaryFile(filePath: string, data: Uint8Array) {
    const fd = fs.openSync(filePath, 'w');
    if (fd < 0)
        throw new Error(`Cannot open file "${filePath}" for writing`);

    const bytesWritten = fs.writeSync(fd, data);
    if (bytesWritten !== data.length) {
        fs.closeSync(fd);
        throw new Error(`Expected to write ${data.length} bytes to file "${filePath}" but only ${bytesWritten} were actually written`);
    }

    fs.closeSync(fd);
}

export function writeTextFile(filePath: string, text: string) {
    const data = encoder.encode(text);
    writeBinaryFile(filePath, data);
}
