import { Category, Schema } from './';

// ── ndb_base_pair_list ───────────────────────────────────────────────────────
// A single schema covers both FR3D (legacy) and NAPAIR (new) output.
// The two sources write to the *same* category name but use different column
// names for the primary key, model number and label-coord fields:
//
//   FR3D :  base_pair_id  PDB_model_number  asym_id_1  entity_id_1  …
//   NAPAIR: id            PDB_model_num     label_asym_id_1  label_entity_id_1  …
//
// All source-specific columns are kept optional (Schema.int / Schema.str).
// At runtime callers detect the active source with Cif.Column.hasValues().
// The auth_* columns are present in both and remain mandatory.

export const NdbBasePairList_Schema = {
    // ── FR3D-only columns ────────────────────────────────────────────────────
    base_pair_id: Schema.int,
    PDB_model_number: Schema.int,
    asym_id_1: Schema.str,
    entity_id_1: Schema.int,
    seq_id_1: Schema.int,
    comp_id_1: Schema.str,
    alt_id_1: Schema.str,
    asym_id_2: Schema.str,
    entity_id_2: Schema.int,
    seq_id_2: Schema.int,
    comp_id_2: Schema.str,
    alt_id_2: Schema.str,
    // ── NAPAIR-only columns ──────────────────────────────────────────────────
    id: Schema.int,
    PDB_model_num: Schema.int,
    label_asym_id_1: Schema.str,
    label_entity_id_1: Schema.int,
    label_seq_id_1: Schema.int,
    label_comp_id_1: Schema.str,
    label_alt_id_1: Schema.str,
    label_asym_id_2: Schema.str,
    label_entity_id_2: Schema.int,
    label_seq_id_2: Schema.int,
    label_comp_id_2: Schema.str,
    label_alt_id_2: Schema.str,
    // ── Columns present in both sources ─────────────────────────────────────
    PDB_ins_code_1: Schema.str,
    struct_oper_id_1: Schema.int,
    PDB_ins_code_2: Schema.str,
    struct_oper_id_2: Schema.int,
    auth_asym_id_1: Schema.strM,
    auth_seq_id_1: Schema.intM,
    auth_asym_id_2: Schema.strM,
    auth_seq_id_2: Schema.intM,
}

export type NdbBasePairList_Schema = typeof NdbBasePairList_Schema;
export const NdbBasePairList: Category<NdbBasePairList_Schema> = {
    name: 'ndb_base_pair_list',
    schema: NdbBasePairList_Schema,
}

// ── ndb_base_pair_annotation ─────────────────────────────────────────────────
// Again one schema for both sources.  The Leontis-Westhof family column and
// the subclass column are named differently:
//
//   FR3D :  l-w_family  subclass
//   NAPAIR: l-w_family_name  sub_class  (+ details)
//
// id, base_pair_id, orientation, edges, l-w_family_num and class are shared.

export const NdbBasePairAnnotation_Schema = {
    id: Schema.intM,
    base_pair_id: Schema.intM,
    orientation: Schema.strM,
    base_1_edge: Schema.strM,
    base_2_edge: Schema.strM,
    "l-w_family_num": Schema.int,
    "class": Schema.strM,
    // ── FR3D-only ────────────────────────────────────────────────────────────
    "l-w_family": Schema.str,
    subclass: Schema.str,
    // ── NAPAIR-only ──────────────────────────────────────────────────────────
    "l-w_family_name": Schema.str,
    sub_class: Schema.str,
    details: Schema.str,
}

export type NdbBasePairAnnotation_Schema = typeof NdbBasePairAnnotation_Schema;
export const NdbBasePairAnnotation: Category<NdbBasePairAnnotation_Schema> = {
    name: 'ndb_base_pair_annotation',
    schema: NdbBasePairAnnotation_Schema,
}

// ── ndb_base_pair_provenance (NAPAIR-only) ───────────────────────────────────
// Present only when data comes from NAPAIR; use hasTable() on this category
// as the reliable indicator that the file uses the new-style format.

export const NdbBasePairProvenance_Schema = {
    entry_id: Schema.strM,
    software_id: Schema.intM,
    software_name: Schema.strM,
    software_version: Schema.str,
    software_url: Schema.str,
    bp_params_version: Schema.str,
    details: Schema.str,
}

export type NdbBasePairProvenance_Schema = typeof NdbBasePairProvenance_Schema;
export const NdbBasePairProvenance: Category<NdbBasePairProvenance_Schema> = {
    name: 'ndb_base_pair_provenance',
    schema: NdbBasePairProvenance_Schema,
}

// ── ndb_base_pair_validation (NAPAIR-only) ───────────────────────────────────
// Geometric quality metrics per base pair produced by NAPAIR.

export const NdbBasePairValidation_Schema = {
    id: Schema.intM,
    base_pair_id: Schema.intM,
    napair_rmsd: Schema.floatM,
    napasco_metric: Schema.floatM,
    napasco_annotation: Schema.strM,
    nearest_curated_BP: Schema.str,
    details: Schema.str,
}

export type NdbBasePairValidation_Schema = typeof NdbBasePairValidation_Schema;
export const NdbBasePairValidation: Category<NdbBasePairValidation_Schema> = {
    name: 'ndb_base_pair_validation',
    schema: NdbBasePairValidation_Schema,
}

// ── ndb_base_unpaired_list (NAPAIR-only) ─────────────────────────────────────
// Nucleotides that are not part of any base pair according to NAPAIR.

export const NdbBaseUnpairedList_Schema = {
    id: Schema.intM,
    PDB_model_num: Schema.intM,
    label_entity_id: Schema.intM,
    label_asym_id: Schema.strM,
    label_seq_id: Schema.intM,
    label_comp_id: Schema.strM,
    label_alt_id: Schema.str,
    PDB_ins_code: Schema.str,
    auth_asym_id: Schema.strM,
    auth_seq_id: Schema.intM,
}

export type NdbBaseUnpairedList_Schema = typeof NdbBaseUnpairedList_Schema;
export const NdbBaseUnpairedList: Category<NdbBaseUnpairedList_Schema> = {
    name: 'ndb_base_unpaired_list',
    schema: NdbBaseUnpairedList_Schema,
}
