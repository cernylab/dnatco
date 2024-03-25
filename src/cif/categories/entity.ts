import { Category, Schema } from './';

export const Entity_Schema = {
    details: Schema.str,
    formula_weight: Schema.float,
    id: Schema.strM,
    src_method: Schema.Enum<'nat'|'man'|'syn'|null>(['nat', 'man', 'syn', null]),
    type: Schema.Enum<'polymer'|'non-polymer'|'macrolide'|'water'|'branched'|null>(['polymer', 'non-polymer', 'macrolide', 'water', 'branched', null]),
    pdbx_description: Schema.str,
    pdbx_number_of_molecules: Schema.int,
    pdbx_parent_entity_id: Schema.str,
    pdbx_mutation: Schema.str,
    pdbx_fragment: Schema.str,
    pdbx_ec: Schema.str,
    pdbx_modification: Schema.str,
    pdbx_formula_weight_exptl: Schema.float,
    pdbx_formula_weight_exptl_method: Schema.Enum<'mass spec'|null>(['mass spec', null]),
    pdbx_target_id: Schema.str,
    pdbx_entities_per_biological_unit: Schema.float,
};
export type Entity_Schema = typeof Entity_Schema;
export const Entity: Category<Entity_Schema> = {
    name: 'entity',
    schema: Entity_Schema,
};

export const EntityPoly_Schema = {
    entity_id: Schema.strM,
    nstd_chirality: Schema.Enum<'no'|'n'|'yes'|'y'|null>(['no', 'n', 'yes', 'y', null]),
    nstd_linkage: Schema.Enum<'no'|'n'|'yes'|'y'|null>(['no', 'n', 'yes', 'y', null]),
    nstd_monomer: Schema.Enum<'no'|'n'|'yes'|'y'|null>(['no', 'n', 'yes', 'y', null]),
    number_of_monomers: Schema.int,
    type: Schema.Enum<'polypeptide(d)'|'polypeptide(l)'|'polydeoxyribonucleotide'|'polyribonucleotide'|'polydeoxyribonucleotide/polyribonucleotide hybrid'|'cyclic-pseudo-peptide'|'peptide nucleic acid'|'other'|null>(['polypeptide(d)', 'polypeptide(l)', 'polydeoxyribonucleotide', 'polyribonucleotide', 'polydeoxyribonucleotide/polyribonucleotide hybrid', 'cyclic-pseudo-peptide', 'peptide nucleic acid', 'other', null]),
    type_details: Schema.str,
    pdbx_strand_id: Schema.str,
    pdbx_seq_one_letter_code: Schema.str, // important 
    pdbx_seq_one_letter_code_can: Schema.str,
    pdbx_target_identifier: Schema.str,
    pdbx_seq_one_letter_code_sample: Schema.str,
    pdbx_explicit_linking_flag: Schema.Enum<'y'|'n'|null>(['y', 'n', null]),
    pdbx_sequence_evidence_code: Schema.Enum<'depositor provided'|'derived from coordinates'|null>(['depositor provided', 'derived from coordinates', null]),
    pdbx_build_self_reference: Schema.str,
    pdbx_N_terminal_seq_one_letter_code: Schema.str,
    pdbx_C_terminal_seq_one_letter_code: Schema.str,
    pdbx_seq_three_letter_code: Schema.str,
    pdbx_seq_db_name: Schema.Enum<'embl'|'gb'|'pir'|'sws'|'unp'|null>(['embl', 'gb', 'pir', 'sws', 'unp', null]),
    pdbx_seq_db_id: Schema.str,
    pdbx_seq_align_begin: Schema.int,
    pdbx_seq_align_end: Schema.int,
};
export type EntityPoly_Schema = typeof EntityPoly_Schema;
export const EntityPoly: Category<EntityPoly_Schema> = {
    name: 'entity_poly',
    schema: EntityPoly_Schema,
};

export const EntityPolySeq_Schema = {
    entity_id: Schema.strM,
    hetero: Schema.Enum<'no'|'n'|'yes'|'y'|null>(['no', 'n', 'yes', 'y', null]),
    mon_id: Schema.strM,
    num: Schema.intM,
};
export type EntityPolySeq_Schema = typeof EntityPolySeq_Schema;
export const EntityPolySeq: Category<EntityPolySeq_Schema> = {
    name: 'entity_poly_seq',
    schema: EntityPolySeq_Schema,
};
