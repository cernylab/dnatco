import { Cif } from '../cif';
import { AtomSite, AtomSite_Schema } from '../cif/categories/atom-site';

type AtomSiteRow = Cif.Row<AtomSite_Schema>;

export class Atom {
    readonly altId: string|null;
    readonly atomId: string;
    readonly authAtomId: string;
    readonly bIso: number|null;
    readonly id: number;
    readonly occupancy: number;
    readonly symbol: string;

    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(row: AtomSiteRow) {
        this.altId = row.label_alt_id;
        this.atomId = row.label_atom_id!;
        this.authAtomId = (row.auth_atom_id ?? row.label_atom_id)!;
        this.bIso = row.B_iso_or_equiv;
        this.id = row.id!;
        this.occupancy = row.occupancy ?? AtomSite.schema.occupancy.T!;
        this.symbol = row.type_symbol!;

        this.x = row.Cartn_x ?? AtomSite.schema.Cartn_x.T!;
        this.y = row.Cartn_y ?? AtomSite.schema.Cartn_y.T!;
        this.z = row.Cartn_z ?? AtomSite.schema.Cartn_y.T!;
    }
}

export class Residue {
    readonly atoms = new Array<Atom>();
    readonly authNum: number;
    readonly authCompound: string;
    readonly compound: string;
    readonly insCode: string|null;

    constructor(readonly num: number, rows: AtomSiteRow[]) {
        const fr = rows[0];

        this.compound = fr.label_comp_id!.trim();
        this.authNum = fr.auth_seq_id ?? fr.label_seq_id!;
        this.authCompound = (fr.auth_comp_id ?? fr.label_comp_id)!.trim();
        this.insCode = fr.pdbx_PDB_ins_code;

        for (const row of rows)
            this.atoms.push(new Atom(row));
    }
}

export class Chain {
    readonly residues = new Array<Residue>();
    readonly entityId: string;
    readonly authName: string;

    constructor(readonly name: string, rows: AtomSiteRow[]) {
        const fr = rows[0];
        this.entityId = fr.label_entity_id!;
        this.authName = fr.auth_asym_id ?? fr.label_asym_id!;

        const extracted = extractResidues(rows);
        for (const num of Array.from(extracted.keys())) {
            const residue = extracted.get(num)!;
            this.residues.push(new Residue(num, residue));
        }

        this.residues = this.residues.sort((lhs, rhs) => lhs.num - rhs.num);
    }
}
export namespace Chain {
    export type Kind = 'DNA' | 'RNA' | 'hybrid' | 'peptide' | 'other';

    export function isNAChain(ek: Kind) {
        return ek === 'DNA' || ek === 'RNA' || ek === 'hybrid';
    }
}

export class Model {
    readonly chains = new Array<Chain>();

    constructor(readonly num: number, rows: AtomSiteRow[]) {
        const extracted = extractChains(rows);
        for (const ch of sortedKeys(extracted)) {
            const chain = extracted.get(ch)!;
            this.chains.push(new Chain(ch, chain));
        }
    }
}
export namespace Model {
    export function modelNameToIndex(name: string, structure: Structure) {
        // Leave the room open to allow model "number" to be an arbitrary value
        // because the specs seems to allow that.
        return structure.models.findIndex(x => x.num.toString() === name);
    }
}

export class Structure {
    readonly models = new Array<Model>();

    constructor(atom_site: Cif.Table<AtomSite_Schema>) {
        const extracted = extractModels(atom_site);
        for (const num of sortedKeys(extracted, (a, b) => a - b)) {
            const model = extracted.get(num)!;
            this.models.push(new Model(num, model));
        }
    }
}

function extractChains(rows: AtomSiteRow[]) {
    const chains = new Map<string, AtomSiteRow[]>();
    for (const row of rows) {
        const ch = row.label_asym_id!;

        const chain = chains.get(ch);
        if (chain)
            chain.push(row);
        else
            chains.set(ch, [row]);
    }

    return chains;
}

function extractModels(atom_site: Cif.Table<AtomSite_Schema>) {
    const { pdbx_PDB_model_num, _rowCount } = atom_site;

    const models = new Map<number, AtomSiteRow[]>();
    if (Cif.Column.hasValues(pdbx_PDB_model_num)) {
        for (let row = 0; row < _rowCount; row++) {
            const modelNum = Cif.Column.value(pdbx_PDB_model_num, row);
            if (!modelNum)
                throw new Error('Model number is not specified for all atoms. We don\'t know how to handle this');
            const model = models.get(modelNum);
            if (model)
                model.push(Cif.Row(atom_site, row));
            else
                models.set(modelNum, [Cif.Row(atom_site, row)]);
        }
    } else {
        const model = [];
        for (let row = 0; row < _rowCount; row++)
            model.push(Cif.Row(atom_site, row));
        models.set(1, model);
    }

    return models;
}

function extractResidues(rows: AtomSiteRow[]) {
    const residues = new Map<number, AtomSiteRow[]>();

    for (const row of rows) {
        const resNo = row.label_seq_id!;
        const residue = residues.get(resNo);
        if (residue)
            residue.push(row);
        else
            residues.set(resNo, [row]);
    }

    return residues;
}

function sortedKeys<K extends number|string, T>(map: Map<K, T>, comparator?: (a: K, b: K) => number) {
    return Array.from(map.keys()).sort(comparator);
}
