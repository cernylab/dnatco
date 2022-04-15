/**
 * Copyright (c) 2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 *
 * ported from https://github.com/photopea/UZIP.js/blob/master/UZIP.js
 * MIT License, Copyright (c) 2018 Photopea
 *
 * - added `ungzip`
 */

import { readUint, readUshort, readUTF8, toInt32 } from './bin'
import { crc } from './checksum';
import { _inflate } from './inflate';

export async function unzip(buf: ArrayBuffer, onlyNames = false) {
    const out: { [k: string]: Uint8Array | { size: number, csize: number } } = Object.create(null);
    const data = new Uint8Array(buf);
    let eocd = data.length - 4;

    while(readUint(data, eocd) !== 0x06054b50) eocd--;

    let o = eocd;
    o += 4;	// sign  = 0x06054b50
    o += 4; // disks = 0;
    const cnu = readUshort(data, o);
    o += 2;
    o += 2;

    o += 4;
    const coffs = readUint(data, o);  o += 4;

    o = coffs;
    for(let i = 0; i < cnu; i++) {
        // const sign = readUint(data, o);
        o += 4;
        o += 4;  // versions;
        o += 4;  // flag + compr
        o += 4;  // time

        o += 4;
        const csize = readUint(data, o);
        o += 4;
        const usize = readUint(data, o);
        o += 4;

        const nl = readUshort(data, o);
        const el = readUshort(data, o + 2);
        const cl = readUshort(data, o + 4);
        o += 6;  // name, extra, comment
        o += 8;  // disk, attribs

        const roff = readUint(data, o);  o += 4;
        o += nl + el + cl;

        await _readLocal(data, roff, out, csize, usize, onlyNames);
    }
    // console.log(out);
    return out;
}

async function _readLocal(data: Uint8Array, o: number, out: { [k: string]: Uint8Array | { size: number, csize: number } }, csize: number, usize: number, onlyNames: boolean) {
    o += 4;
    o += 2;
    o += 2;
    const cmpr  = readUshort(data, o);
    o += 2;

    o += 4;

    o += 4;
    o += 8;

    const nlen = readUshort(data, o);
    o += 2;
    const elen = readUshort(data, o);
    o += 2;

    const name = readUTF8(data, o, nlen);
    o += nlen;  // console.log(name);
    o += elen;

    if(onlyNames) {
        out[name] = { size: usize, csize };
        return;
    }

    const file = new Uint8Array(data.buffer, o);
    if(cmpr === 0) {
        out[name] = new Uint8Array(file.buffer.slice(o, o + csize));
    } else if(cmpr === 8) {
        const buf = new Uint8Array(usize);
        inflateRaw(file, buf);
        out[name] = buf;
    } else {
        throw `unknown compression method: ${cmpr}`;
    }
}

export function inflateRaw(file: Uint8Array, buf?: Uint8Array) {
    return _inflate(file, buf);
}

export function inflate(file: Uint8Array, buf?: Uint8Array) {
    return inflateRaw(new Uint8Array(file.buffer, file.byteOffset + 2, file.length - 6), buf);
}

// https://tools.ietf.org/html/rfc1952
export async function ungzip(file: Uint8Array, buf?: Uint8Array) {
    const flg = file[3];

    let o = 10;
    if (flg & 4) { // FEXTRA
        const xlen = readUshort(file, o);
        // console.log('FEXTRA', xlen)
        o += xlen;
    }
    if (flg & 8) { // FNAME
        let zero = o;
        while(file[zero] !== 0) ++zero;
        o = zero + 1;
    }
    if (flg & 16) { // FCOMMENT
        let zero = o;
        while(file[zero] !== 0) ++zero;
        o = zero + 1;
    }

    if (flg & 1) { // FHCRC
        o += 2;
    }

    const crc32 = toInt32(readUint(file, file.length - 8));
    const isize = readUint(file, file.length - 4);
    if (buf === undefined) buf = new Uint8Array(isize);

    const blocks = new Uint8Array(file.buffer, file.byteOffset + o, file.length - o - 8);
    const inflated = inflateRaw(blocks, buf);
    const crcValue = crc(inflated, 0, inflated.length);
    if (crc32 !== crcValue) {
        console.error("ungzip: checksums don't match");
    }

    return inflated;
}

