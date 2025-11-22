import { Parser as CifParser } from 'tscif';
import { PdbParser } from 'tspdb';
import { cifAtomToAtomSite, pdbAtomToAtomSite, toStructure, AtomSite, Structure } from './structure';
import { Payloads } from './api/payloads';

const Zero = '0'.charCodeAt(0);
const Nine = '9'.charCodeAt(0);
const ALwr = 'a'.charCodeAt(0);
const ZLwr = 'z'.charCodeAt(0);
const AUpr = 'A'.charCodeAt(0);
const ZUpr = 'Z'.charCodeAt(0);
const NL = '\n'.charCodeAt(0);
const CR = '\r'.charCodeAt(0);
const Tab = '\t'.charCodeAt(0);

function slice(line: string, from: number, length?: number) {
    return line.substring(from, length !== undefined ? from + length : void 0);
}

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

function assignIds(phxAtoms: PhxAtom[], stru: Structure): Payloads.Rscc {
    let skipToNextAtom = false;
    const results = new Array<Payloads.RsccElement>();
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

function convert(atomSites: AtomSite[], phenixOutput: string) {
    let phxLines = phenixOutput.split('\n');
    const phxFirstLineIdx = findFirstDataLine(phxLines);
    phxLines = phxLines.slice(phxFirstLineIdx);

    const phxAtoms = new Array<PhxAtom>(); // TODO: Reserve space!
    for (const line of phxLines) {
        if (line.length < 41)
            continue;

        // Stop parsing when we hit the footer separator line
        if (line.trim().match(/^[=\-]+$/))
            break;

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

function isSpace(cc: number) {
    return (cc === NL) || (cc === CR) || (cc === Tab);
}

function parseChainAndAltId(str: string): { chain: string, altId: string } {
    //
    // Insert your favorite complaint about less-than-ideal data formats here...
    //

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
		let tv = parseTailOfPhenixWeirdNotReallyANumberStr(slice(nv, 1));
		num = 10000 + (Math.pow(36, 3) * ext) + tv;
	} else
		num = parseInt(nv);

	while (idx2 < len && isSpace(str.charCodeAt(idx2))) {
		idx2++;
	}

	const inscode = idx2 < len ? slice(str, idx2) : '';

	return { num, inscode };
}

function parseTailOfPhenixWeirdNotReallyANumberStr(fs: string) {
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

export namespace PhenixRsccConvert {
    export function convertWithCif(coordinates: string, phenixOutput: string) {
        const cif = CifParser.parse(coordinates);
        if (cif.length === 0)
            throw new Error('Empty mmCIF file');

        const atom_site = cif[0].categories['atom_site'];
        if (!atom_site)
            throw new Error('No atom_site category in mmCIF file');

        const atomSites = cifAtomToAtomSite(atom_site);
        return convert(atomSites, phenixOutput);
    }

    export function convertWithPdb(coordinates: string, phenixOutput: string) {
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
}
