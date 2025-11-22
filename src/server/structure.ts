import { Category } from 'tscif';
import { Pdb } from 'tspdb';
import { dequote } from './util';

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
