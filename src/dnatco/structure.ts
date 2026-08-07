import { Cif } from '../cif';
import { AtomSite, AtomSite_Schema } from '../cif/categories/atom-site';

type AtomSiteTable = Cif.Table<AtomSite_Schema>;

type AtomColumns = {
    auth_asym_id: (string|null)[]|null,
    auth_atom_id: (string|null)[]|null,
    auth_comp_id: (string|null)[]|null,
    auth_seq_id: (number|null)[]|null,
    B_iso_or_equiv: (number|null)[]|null,
    Cartn_x: (number|null)[]|null,
    Cartn_y: (number|null)[]|null,
    Cartn_z: (number|null)[]|null,
    id: (number|null)[]|null,
    label_alt_id: (string|null)[]|null,
    label_asym_id: (string|null)[]|null,
    label_atom_id: (string|null)[]|null,
    label_comp_id: (string|null)[]|null,
    label_entity_id: (string|null)[]|null,
    label_seq_id: (number|null)[]|null,
    occupancy: (number|null)[]|null,
    pdbx_PDB_ins_code: (string|null)[]|null,
    pdbx_PDB_model_num: (number|null)[]|null,
    type_symbol: (string|null)[]|null,
};

function columnValues<T>(column: Cif.Column<T>): (T|null)[]|null {
    return column.values as (T|null)[]|null;
}

function atomColumns(table: AtomSiteTable): AtomColumns {
    return {
        auth_asym_id: columnValues(table.auth_asym_id),
        auth_atom_id: columnValues(table.auth_atom_id),
        auth_comp_id: columnValues(table.auth_comp_id),
        auth_seq_id: columnValues(table.auth_seq_id),
        B_iso_or_equiv: columnValues(table.B_iso_or_equiv),
        Cartn_x: columnValues(table.Cartn_x),
        Cartn_y: columnValues(table.Cartn_y),
        Cartn_z: columnValues(table.Cartn_z),
        id: columnValues(table.id),
        label_alt_id: columnValues(table.label_alt_id),
        label_asym_id: columnValues(table.label_asym_id),
        label_atom_id: columnValues(table.label_atom_id),
        label_comp_id: columnValues(table.label_comp_id),
        label_entity_id: columnValues(table.label_entity_id),
        label_seq_id: columnValues(table.label_seq_id),
        occupancy: columnValues(table.occupancy),
        pdbx_PDB_ins_code: columnValues(table.pdbx_PDB_ins_code),
        pdbx_PDB_model_num: columnValues(table.pdbx_PDB_model_num),
        type_symbol: columnValues(table.type_symbol),
    };
}

function at<T>(column: (T|null)[]|null, row: number): T|null {
    return column === null ? null : column[row];
}

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

    constructor(cols: AtomColumns, row: number) {
        this.altId = at(cols.label_alt_id, row);
        this.atomId = at(cols.label_atom_id, row)!;
        this.authAtomId = (at(cols.auth_atom_id, row) ?? at(cols.label_atom_id, row))!;
        this.bIso = at(cols.B_iso_or_equiv, row);
        this.id = at(cols.id, row)!;
        this.occupancy = at(cols.occupancy, row) ?? AtomSite.schema.occupancy.T!;
        this.symbol = at(cols.type_symbol, row)!;

        this.x = at(cols.Cartn_x, row) ?? AtomSite.schema.Cartn_x.T!;
        this.y = at(cols.Cartn_y, row) ?? AtomSite.schema.Cartn_y.T!;
        this.z = at(cols.Cartn_z, row) ?? AtomSite.schema.Cartn_z.T!;
    }
}

export class Residue {
    readonly atoms = new Array<Atom>();
    readonly authNum: number;
    readonly authCompound: string;
    readonly compound: string;
    readonly insCode: string|null;

    constructor(readonly num: number, cols: AtomColumns, rows: number[]) {
        const fr = rows[0];

        this.compound = at(cols.label_comp_id, fr)!.trim();
        this.authNum = at(cols.auth_seq_id, fr) ?? at(cols.label_seq_id, fr)!;
        this.authCompound = (at(cols.auth_comp_id, fr) ?? at(cols.label_comp_id, fr))!.trim();
        this.insCode = at(cols.pdbx_PDB_ins_code, fr);

        for (const row of rows)
            this.atoms.push(new Atom(cols, row));
    }
}

export class Chain {
    readonly residues = new Array<Residue>();
    readonly entityId: string;
    readonly authName: string;

    constructor(readonly name: string, cols: AtomColumns, rows: number[]) {
        const fr = rows[0];
        this.entityId = at(cols.label_entity_id, fr)!;
        this.authName = at(cols.auth_asym_id, fr) ?? at(cols.label_asym_id, fr)!;

        const extracted = extractResidues(cols, rows);
        for (const num of Array.from(extracted.keys()))
            this.residues.push(new Residue(num, cols, extracted.get(num)!));

        this.residues.sort((lhs, rhs) => lhs.num - rhs.num);
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

    constructor(readonly num: number, cols: AtomColumns, rows: number[]) {
        const extracted = extractChains(cols, rows);
        for (const ch of sortedKeys(extracted))
            this.chains.push(new Chain(ch, cols, extracted.get(ch)!));
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

    constructor(atom_site: AtomSiteTable) {
        const cols = atomColumns(atom_site);
        const extracted = extractModels(atom_site, cols);
        for (const num of sortedKeys(extracted, (a, b) => a - b))
            this.models.push(new Model(num, cols, extracted.get(num)!));
    }
}

function groupBy<K>(rows: number[], key: (row: number) => K) {
    const groups = new Map<K, number[]>();

    for (const row of rows) {
        const k = key(row);

        const group = groups.get(k);
        if (group)
            group.push(row);
        else
            groups.set(k, [row]);
    }

    return groups;
}

function extractChains(cols: AtomColumns, rows: number[]) {
    return groupBy(rows, (row) => at(cols.label_asym_id, row)!);
}

function extractModels(atom_site: AtomSiteTable, cols: AtomColumns) {
    const models = new Map<number, number[]>();
    const modelNums = cols.pdbx_PDB_model_num;

    if (modelNums !== null) {
        for (let row = 0; row < atom_site._rowCount; row++) {
            const modelNum = modelNums[row];
            if (!modelNum)
                throw new Error('Model number is not specified for all atoms. We don\'t know how to handle this');

            const model = models.get(modelNum);
            if (model)
                model.push(row);
            else
                models.set(modelNum, [row]);
        }
    } else {
        const model = new Array<number>(atom_site._rowCount);
        for (let row = 0; row < atom_site._rowCount; row++)
            model[row] = row;
        models.set(1, model);
    }

    return models;
}

function extractResidues(cols: AtomColumns, rows: number[]) {
    return groupBy(rows, (row) => at(cols.label_seq_id, row)!);
}

function sortedKeys<K extends number|string, T>(map: Map<K, T>, comparator?: (a: K, b: K) => number) {
    return Array.from(map.keys()).sort(comparator);
}
