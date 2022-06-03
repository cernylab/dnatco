import { Category, Schema } from './';

export const AtomSite_Schema = {
    auth_asym_id: Schema.strM,
    auth_atom_id: Schema.str,
    auth_comp_id: Schema.str,
    auth_seq_id: Schema.int, /* The specification considers this a string but a lot of tools treat this as a number.
                                For convenience, we treat this as a number too */
    B_iso_or_equiv: Schema.float,
    Cartn_x: Schema.Float(0),
    Cartn_y: Schema.Float(0),
    Cartn_z: Schema.Float(0),
    footnote_id: Schema.str,
    group_PDB: Schema.Enum<'ATOM'|'HETATM'>(['ATOM', 'HETATM']),
    id: Schema.intM,
    label_alt_id: Schema.strM,
    label_asym_id: Schema.strM,
    label_atom_id: Schema.strM,
    label_comp_id: Schema.strM,
    label_entity_id: Schema.strM,
    label_seq_id: Schema.intM,
    occupancy: Schema.Float(1.0),
    pdbx_PDB_model_num: Schema.int,
    pdbx_PDB_ins_code: Schema.str,
    type_symbol: Schema.strM,
};
export type AtomSite_Schema = typeof AtomSite_Schema;
export const AtomSite: Category<AtomSite_Schema> = {
    name: 'atom_site',
    schema: AtomSite_Schema,
};
