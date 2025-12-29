import { Category, Schema } from './';

export const PdbxStructAssembly_Schema = {
    id: Schema.strM,
    details: Schema.str,
    method_details: Schema.str,
    oligomeric_details: Schema.str,
    oligomeric_count: Schema.int,
};
export type PdbxStructAssembly_Schema = typeof PdbxStructAssembly_Schema;
export const PdbxStructAssembly: Category<PdbxStructAssembly_Schema> = {
    name: 'pdbx_struct_assembly',
    schema: PdbxStructAssembly_Schema,
};

export const PdbxStructAssemblyGen_Schema = {
    assembly_id: Schema.strM,
    oper_expression: Schema.strM,
    asym_id_list: Schema.strM,
};
export type PdbxStructAssemblyGen_Schema = typeof PdbxStructAssemblyGen_Schema;
export const PdbxStructAssemblyGen: Category<PdbxStructAssemblyGen_Schema> = {
    name: 'pdbx_struct_assembly_gen',
    schema: PdbxStructAssemblyGen_Schema,
};
