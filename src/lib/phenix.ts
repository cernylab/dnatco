import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Category, Parser as CifParser } from 'tscif';
import { Pdb, PdbParser } from 'tspdb';
import { Coordinates } from '../dnatco/coordinates';
import { dequote } from '../util';

const Zero = '0'.charCodeAt(0);
const Nine = '9'.charCodeAt(0);
const ALwr = 'a'.charCodeAt(0);
const ZLwr = 'z'.charCodeAt(0);
const AUpr = 'A'.charCodeAt(0);
const ZUpr = 'Z'.charCodeAt(0);
const NL = '\n'.charCodeAt(0);
const CR = '\r'.charCodeAt(0);
const Tab = '\t'.charCodeAt(0);

// Simplified structure representation used only to match up PDB/mmCIF atoms with Phenix output

export type Atom = {
    id: number,
    name: string,
    altId: string,
}

export type Residue = {
    seqId: number,
    insCode: string,
    atoms: Atom[],
}

export type Chain = {
    name: string,
    residues: Residue[],
}

export type Model = {
    num: number,
    chains: Chain[],
}

export type Structure = {
    models: Model[];
}

export const AtomSite = {
    // Atom
    id: 0,
    label_alt_id: '',
    label_atom_id: '',
    auth_atom_id: '',
    // Residue
    label_seq_id: 0,
    auth_seq_id: 0,
    pdbx_PDB_ins_code: '',
    // Chain
    label_asym_id: '',
    auth_asym_id: '',
    // Model
    pdbx_PDB_model_num: 0,
}
export type AtomSite = Partial<typeof AtomSite>;

type PhxAtom = {
    chain: string,
    altId: string,
    comp: string,
    name: string,
    seqId: {
        num: number,
        inscode: string,
    },
    rscc: number,
};
function PhxAtom(ichain: string, comp: string, seqIdStr: string, atomName: string, rsccStr: string): PhxAtom {
    const { chain, altId } = parseChainAndAltId(ichain);
    const rscc = parseFloat(rsccStr);
    if (isNaN(rscc))
        throw new Error(`Invalid RSCC value ${rsccStr}`);

    return {
        chain,
        altId,
        comp: comp.trim(),
        name: atomName.trim(),
        seqId: parseSeqIdStr(seqIdStr),
        rscc
    };
}

function assignIds(phxAtoms: PhxAtom[], stru: Structure): Phenix.Rscc {
    let skipToNextAtom = false;
    const results = new Array<Phenix.RsccElement>();
    for (const phxAtom of phxAtoms) {
        for (const m of stru.models) {
            for (const ch of m.chains) {
                if (skipToNextAtom)
                    break;

                if (phxAtom.chain !== ch.name)
                    continue;

                for (const r of ch.residues) {
                    if (skipToNextAtom)
                        break;

                    if (r.seqId !== phxAtom.seqId.num)
                        continue;
                    if (r.insCode !== phxAtom.seqId.inscode)
                        continue;

                    for (const aa of r.atoms) {
                        if (phxAtom.altId === aa.altId && phxAtom.name === aa.name) {
                            results.push([ aa.id, phxAtom.rscc ]);
                            // Here is what happens when a genius with a blog declares gotos "harmful" and programming languages adopt id
                            skipToNextAtom = true;
                            break;
                        }
                    }
                }
            }

            skipToNextAtom = false;
            break;
        }
    }

    return results;
}

export function cifAtomToAtomSite(category: Category): AtomSite[] {
    const atomSites = new Array<AtomSite>();

    const len = category['id']?.length ?? void 0;
    if (len === undefined)
        throw new Error('Invalid atom_site category');

    for (let idx = 0; idx < len; idx++) {
        let nId: number|undefined = parseInt(category['id']?.[idx] ?? '');
        nId = isNaN(nId) ? void 0 : nId;

        let nLabelSeqId: number|undefined = parseInt(category['label_seq_id']?.[idx] ?? '');
        nLabelSeqId = isNaN(nLabelSeqId) ? void 0 : nLabelSeqId;

        let nAuthSeqId: number|undefined = parseInt(category['auth_seq_id']?.[idx] ?? '');
        nAuthSeqId = isNaN(nAuthSeqId) ? void 0 : nAuthSeqId;

        let nModelNum: number|undefined = parseInt(category['pdbx_PDB_model_num']?.[idx] ?? '');
        nModelNum = isNaN(nModelNum) ? void 0 : nModelNum;

        const ats = {
            id: nId,
            label_alt_id: category['label_alt_id']?.[idx] ?? void 0,
            label_atom_id: category['label_atom_id']?.[idx] ?? void 0,
            auth_atom_id: category['auth_atom_id']?.[idx] ?? void 0,
            label_seq_id: nLabelSeqId,
            auth_seq_id: nAuthSeqId,
            pdbx_PDB_ins_code: category['pdbx_PDB_ins_code']?.[idx] ?? void 0,
            label_asym_id: category['label_asym_id']?.[idx] ?? void 0,
            auth_asym_id: category['auth_asym_id']?.[idx] ?? void 0,
            pdbx_PDB_model_num: nModelNum
        };

        atomSites.push(ats);
    }

    return atomSites;
}

function convert(atomSites: AtomSite[], phenixOutput: string) {
    let phxLines = phenixOutput.split('\n');
    const phxFirstLineIdx = findFirstDataLine(phxLines);
    phxLines = phxLines.slice(phxFirstLineIdx);

    const phxAtoms = new Array<PhxAtom>(); // TODO: Reserve space!
    for (const line of phxLines) {
        if (line.length < 41)
            continue;

        const chain = line.substring(0, 4).trim();
        const shift = chain.length === 4 ? 1 : 0;

        const comp = slice(line, 4 + shift, 4);
        const seqIdStr = slice(line, 9 + shift, 8);
        const atomName = slice(line, 17 + shift, 4);
        const rsccStr = slice(line, 34 + shift, 7);
        phxAtoms.push(PhxAtom(chain, comp, seqIdStr, atomName, rsccStr));
    }

    return assignIds(phxAtoms, toStructure(atomSites));
}

function convertWithCif(coordinates: string, phenixOutput: string) {
    const cif = CifParser.parse(coordinates);
    if (cif.length === 0)
        throw new Error('Empty mmCIF file');

    const atom_site = cif[0].categories['atom_site'];
    if (!atom_site)
        throw new Error('No atom_site category in mmCIF file');

    const atomSites = cifAtomToAtomSite(atom_site);
    return convert(atomSites, phenixOutput);
}

function convertWithPdb(coordinates: string, phenixOutput: string) {
    const pdb = PdbParser.parse(coordinates);
    const worstParseError = pdb.issues.reduce(
        (prev, curr) => PdbParser.compareErrorSeverity(curr.severity, prev) > 0 ? curr.severity : prev,
        'none' as PdbParser.ErrorSeverity
    );
    if (worstParseError === 'critical')
        throw new Error('Cannot parse PDB file to process Phenix output');

    const atomSites = [];
    for (const atom of pdb.stru.atoms)
        atomSites.push(pdbAtomToAtomSite(atom));

    return convert(atomSites, phenixOutput);
}

function findFirstDataLine(lines: string[]) {
    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        if (line.startsWith(' <----id string---->'))
            return idx + 1;
    }

    throw new Error('Phenix output does not seem to contain any data');
}

function isAlpha(cc: number) {
    return (
        (cc >= ALwr && cc <= ZLwr) ||
        (cc >= AUpr && cc <= ZUpr)
    );
}

function isExecutable(filePath: string) {
    try {
        const s = fs.statSync(filePath);
        return s.isFile() && s.mode && 0o111;
    } catch (e) {
        return false;
    }
}

function isSpace(cc: number) {
    return (cc === NL) || (cc === CR) || (cc === Tab);
}

function isWritableDirectory(dirPath: string) {
    try {
        const s = fs.statSync(dirPath);
        return s.isDirectory() && s.mode && 0o444;
    } catch (e) {
        return false;
    }
}

function parseChainAndAltId(str: string): { chain: string, altId: string } {
    // Now this is funny. Phenix output is not definitely parseable because not all fields
    // are present at all lines and the format does not indicate which fields are missing.
    // mmCif people, being morons, decided to care for empty values by introducing *two*
    // characters that denote "there is nothing here" because some values are empty
    // but some others are even emptier.
    // Phenix people, being morons++, decided to use the same character for empty value
    // and field separator, turning this into a "import 'crystal_ball'" kind of code.
    // One day, I will get an AK-47, put all people responsible for this mess in a room
    // and ask them to implement a fully conformant parser of this table in less than 7 minutes.
    // Whoever fails to do so within that deadline will meet the other kind of dead line...

    const len = str.length;

    let idx = 0;
    while (idx < len && isAlpha(str.charCodeAt(idx)))
        idx++;

    return idx === len
        ? { chain: str, altId: '' }
        : { chain: slice(str, 0, idx), altId: slice(str, idx + 1) };
}

function parseSeqIdStr(str: string): PhxAtom['seqId'] {
    const len = str.length;

    let idx = 0;
    while (idx < len && isSpace(str.charCodeAt(idx))) {
        idx++;
    }

    let idx2 = idx + 1;
    while (idx2 < len && !isSpace(str.charCodeAt(idx2))) {
        idx2++;
    }

    if (idx >= len)
        throw new Error('Cannot parse seqId');

    let num;
    let nv = slice(str, idx, idx2 - idx);
    if (isAlpha(nv.charCodeAt(0))) {
        let ext = nv.charCodeAt(0) - AUpr;
        let tv = parseTailOfPhenixWeirdNotReallyANumberStrBecauseFuckYou(slice(nv, 1));
        num = 10000 + (Math.pow(36, 3) * ext) + tv;
    } else
        num = parseInt(nv);

    while (idx2 < len && isSpace(str.charCodeAt(idx2))) {
        idx2++;
    }

    const inscode = idx2 < len ? slice(str, idx2) : '';

    return { num, inscode };
}

function parseTailOfPhenixWeirdNotReallyANumberStrBecauseFuckYou(fs: string) {
    const SPAN = ZUpr - AUpr + 11;
    const len = fs.length;

    let num = 0;
    for (let idx = 0; idx < len; idx++) {
        let v;
        let ch = fs.charCodeAt(idx)
        if (ch >= AUpr && ch <= ZUpr)
            v = ch - AUpr + 10;
        else if (ch >= Zero && ch <= Nine)
            v = ch - Zero;
        else
            throw new Error('Unexpected character in Phenix numstr');

        num += Math.pow(SPAN, len - idx - 1) * v;
    }

    return num;
}

export function pdbAtomToAtomSite(pdbAtom: Pdb.Atom): AtomSite {
    return {
        id: pdbAtom.id,
        label_alt_id: pdbAtom.altPos,
        label_atom_id: pdbAtom.name,
        auth_atom_id: pdbAtom.name,
        label_seq_id: pdbAtom.resNo,
        auth_seq_id: pdbAtom.resNo,
        pdbx_PDB_ins_code: pdbAtom.insCode,
        label_asym_id: pdbAtom.chain,
        pdbx_PDB_model_num: pdbAtom.modelNum,
    };
}

function phenixCommand(exec: string, coordsFilePath: string, reflnsFilePath: string) {
    return {
        cmd: exec,
        args: [
            `pdb_file_name="${coordsFilePath}"`,
            `reflection_file_name="${reflnsFilePath}"`,
            'detail=atom',
            'resolution_factor=1./8'
        ]
    };
}

function slice(line: string, from: number, length?: number) {
    return line.substring(from, length !== undefined ? from + length : void 0);
}

export function toStructure(atomSites: AtomSite[]): Structure {
    const models = new Array<Model>();

    for (const ats of atomSites) {
        if (ats.id === undefined)
            throw new Error('Atom without serial ID');
        const name = ats.auth_atom_id ?? ats.label_atom_id;
        if (!name)
            throw new Error('Atom without a name');

        const altId = ats.label_alt_id ?? '';

        const seqId = ats.auth_seq_id ?? ats.label_seq_id;
        if (seqId === undefined)
            throw new Error('Atom without seqId');

        const insCode = ats.pdbx_PDB_ins_code ?? '';

        const asymId = ats.auth_asym_id ?? ats.label_asym_id;
        if (asymId === undefined)
            throw new Error('Atom without asymId');

        const modelNum = ats.pdbx_PDB_model_num ?? 1;

        let m = models.find(x => x.num === modelNum);
        if (!m) {
            m = { num: modelNum, chains: new Array<Chain>() };
            models.push(m);
        }

        let chain = m.chains.find(x => x.name === asymId);
        if (!chain) {
            chain = { name: asymId, residues: new Array<Residue>() };
            m.chains.push(chain);
        }

        let residue = chain.residues.find(x => x.seqId === seqId && x.insCode === insCode);
        if (!residue) {
            residue = { seqId: seqId, insCode: insCode, atoms: new Array<Atom>() };
            chain.residues.push(residue);
        }

        residue.atoms.push({ name: dequote(name), altId, id: ats.id });
    }

    return { models };
}

export namespace Phenix {
    export type Context = {
        exec: string,
        scratchDir: string,
    };
    export type RsccElement = [atomId: number, rscc: number];
    export type Rscc = RsccElement[];

    export function calculateRscc(coords: { filePath: string, coords: Coordinates }, reflnsFilePath: string, ctx: Context) {
        const coordsFilePathNorm = path.normalize(coords.filePath);
        const reflnsFilePathNorm = path.normalize(reflnsFilePath);

        const { cmd, args } = phenixCommand(ctx.exec, coordsFilePathNorm, reflnsFilePathNorm);

        try {
            const stdout = child_process.execFileSync(cmd, args);
            const phenixOutput = stdout.toString('utf8');
            return coords.coords.type === 'cif'
                ? convertWithCif(coords.coords.data, phenixOutput)
                : convertWithPdb(coords.coords.data, phenixOutput);
        } catch (e) {
            const _e = e as child_process.SpawnSyncReturns<Buffer>;
            console.log(`Phenix process has failed with exit code ${_e.status} and stderr output: "${_e.stderr}"`);
        }
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

        return { exec, scratchDir: path.normalize(scratchDir) };
    }
}
