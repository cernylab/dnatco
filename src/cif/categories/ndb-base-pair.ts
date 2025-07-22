import { Category, Schema } from './';

export const NdbBasePairList_Schema = {
    base_pair_id: Schema.intM,
    PDB_model_number: Schema.intM,
    asym_id_1: Schema.strM,
    entity_id_1: Schema.intM,
    seq_id_1: Schema.intM,
    comp_id_1: Schema.strM,
    PDB_ins_code_1: Schema.str,
    alt_id_1: Schema.str,
    struct_oper_id_1: Schema.int,
    asym_id_2: Schema.strM,
    entity_id_2: Schema.intM,
    seq_id_2: Schema.intM,
    comp_id_2: Schema.strM,
    PDB_ins_code_2: Schema.str,
    alt_id_2: Schema.str,
    struct_oper_id_2: Schema.int,
/*    auth_asym_id_1: Schema.strM,
    auth_seq_id_1: Schema.intM,
    auth_asym_id_2: Schema.strM,
    auth_seq_id_2: Schema.intM,*/
}

export type NdbBasePairList_Schema = typeof NdbBasePairList_Schema;
export const NdbBasePairList: Category<NdbBasePairList_Schema> = {
    name: 'ndb_base_pair_list',
    schema: NdbBasePairList_Schema,
}

export const NdbBasePairAnnotation_Schema = {
    id: Schema.intM,
    base_pair_id: Schema.intM,
    orientation: Schema.strM,
    base_1_edge: Schema.strM,
    base_2_edge: Schema.strM,
    "l-w_family_num": Schema.int,
    "l-w_family": Schema.str,
    "class": Schema.strM,
    subclass: Schema.str,
}

export type NdbBasePairAnnotation_Schema = typeof NdbBasePairAnnotation_Schema;
export const NdbBasePairAnnotation: Category<NdbBasePairAnnotation_Schema> = {
    name: 'ndb_base_pair_annotation',
    schema: NdbBasePairAnnotation_Schema,
}
