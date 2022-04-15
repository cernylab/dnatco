import { Category, Schema } from './';

export const Struct_Schema = {
    entry_id: Schema.strM,
    pdbx_CASP_flag: Schema.Enum<'Y'|'N'|null>(['Y', 'N', null]),
    pdbx_center_of_mass_x: Schema.float,
    pdbx_center_of_mass_y: Schema.float,
    pdbx_center_of_mass_z: Schema.float,
    pdbx_descriptor: Schema.str,
    pdbx_details: Schema.str,
    pdbx_formula_weight: Schema.float,
    pdbx_formula_weight_method: Schema.str,
    pdbx_model_details: Schema.str,
    pdbx_model_type_details: Schema.str,
    pdbx_structure_determination_methodology: Schema.Enum<'computational'|'experimental'|'integrative'>(['computational', 'experimental', 'integrative']),
    pdbx_title_text: Schema.str,
    title: Schema.strM,
};
export type Struct_Schema = typeof Struct_Schema;
export const Struct: Category<Struct_Schema> = {
    name: 'struct',
    schema: Struct_Schema,
};
