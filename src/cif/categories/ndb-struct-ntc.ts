import { Category, Schema } from './';

export const NdbStructNtcOverall_Schema = {
    entry_id: Schema.str,
    confal_score: Schema.float,
    confal_percentile: Schema.int,
    ntc_version: Schema.str,
    cana_version: Schema.str,
    num_steps: Schema.int,
    num_classified: Schema.int,
    num_unclassified: Schema.int,
    num_unclassified_rmsd_close: Schema.int,
};
export type NdbStructNtcOverall_Schema = typeof NdbStructNtcOverall_Schema;
export const NdbStructNtcOverall: Category<NdbStructNtcOverall_Schema> = {
    name: 'ndb_struct_ntc_overall',
    schema: NdbStructNtcOverall_Schema,
};

export const NdbStructNtcStepParameters_Schema = {
    step_id: Schema.int,
    tor_delta_1: Schema.float,
    tor_epsilon_1: Schema.float,
    tor_zeta_1: Schema.float,
    tor_alpha_2: Schema.float,
    tor_beta_2: Schema.float,
    tor_gamma_2: Schema.float,
    tor_delta_2: Schema.float,
    tor_chi_1: Schema.float,
    tor_chi_2: Schema.float,
    dist_NN: Schema.float,
    dist_CC: Schema.float,
    tor_NCCN: Schema.float,
    diff_tor_delta_1: Schema.float,
    diff_tor_epsilon_1: Schema.float,
    diff_tor_zeta_1: Schema.float,
    diff_tor_alpha_2: Schema.float,
    diff_tor_beta_2: Schema.float,
    diff_tor_gamma_2: Schema.float,
    diff_tor_delta_2: Schema.float,
    diff_tor_chi_1: Schema.float,
    diff_tor_chi_2: Schema.float,
    diff_dist_NN: Schema.float,
    diff_dist_CC: Schema.float,
    diff_tor_NCCN: Schema.float,
    confal_tor_delta_1: Schema.float,
    confal_tor_epsilon_1: Schema.float,
    confal_tor_zeta_1: Schema.float,
    confal_tor_alpha_2: Schema.float,
    confal_tor_beta_2: Schema.float,
    confal_tor_gamma_2: Schema.float,
    confal_tor_delta_2: Schema.float,
    confal_tor_chi_1: Schema.float,
    confal_tor_chi_2: Schema.float,
    confal_dist_NN: Schema.float,
    confal_dist_CC: Schema.float,
    confal_tor_NCCN: Schema.float,
    details: Schema.str,
};
export type NdbStructNtcStepParameters_Schema = typeof NdbStructNtcStepParameters_Schema;
export const NdbStructNtcStepParameters: Category<NdbStructNtcStepParameters_Schema> = {
    name: 'ndb_struct_ntc_step_parameters',
    schema: NdbStructNtcStepParameters_Schema,
};

export const NdbStructNtcStep_Schema = {
    id: Schema.int,
    name: Schema.str,
    PDB_model_number: Schema.int,
    label_entity_id_1: Schema.int,
    label_asym_id_1: Schema.str,
    label_seq_id_1: Schema.int,
    label_comp_id_1: Schema.str,
    label_alt_id_1: Schema.str,
    label_entity_id_2: Schema.int,
    label_asym_id_2: Schema.str,
    label_seq_id_2: Schema.int,
    label_comp_id_2: Schema.str,
    label_alt_id_2: Schema.str,
    auth_asym_id_1: Schema.str,
    auth_seq_id_1: Schema.int,
    auth_asym_id_2: Schema.str,
    auth_seq_id_2: Schema.int,
    PDB_ins_code_1: Schema.str,
    PDB_ins_code_2: Schema.str,
};
export type NdbStructNtcStep_Schema = typeof NdbStructNtcStep_Schema;
export const NdbStructNtcStep: Category<NdbStructNtcStep_Schema> = {
    name: 'ndb_struct_ntc_step',
    schema: NdbStructNtcStep_Schema,
}

export const NdbStructNtcStepSummary_Schema = {
    step_id: Schema.int,
    assigned_CANA: Schema.str,
    assigned_NtC: Schema.str,
    confal_score: Schema.int,
    euclidean_distance_NtC_ideal: Schema.float,
    cartesian_rmsd_closest_NtC_representative: Schema.float,
    closest_CANA: Schema.str,
    closest_NtC: Schema.str,
    closest_step_golden: Schema.str,
};
export type NdbStructNtcStepSummary_Schema = typeof NdbStructNtcStepSummary_Schema;
export const NdbStructNtcStepSummary: Category<NdbStructNtcStepSummary_Schema> = {
    name: 'ndb_struct_ntc_step_summary',
    schema: NdbStructNtcStepSummary_Schema,
};

export const NdbStructSugarStepParameters_Schema = {
    step_id: Schema.intM,
    P_1: Schema.floatM,
    tau_1: Schema.floatM,
    Pn_1: Schema.strM,
    P_2: Schema.floatM,
    tau_2: Schema.floatM,
    Pn_2: Schema.strM,
    nu_1_1: Schema.floatM,
    nu_1_2: Schema.floatM,
    nu_1_3: Schema.floatM,
    nu_1_4: Schema.floatM,
    nu_1_5: Schema.floatM,
    nu_2_1: Schema.floatM,
    nu_2_2: Schema.floatM,
    nu_2_3: Schema.floatM,
    nu_2_4: Schema.floatM,
    nu_2_5: Schema.floatM,
    diff_nu_1_1: Schema.float,
    diff_nu_1_2: Schema.float,
    diff_nu_1_3: Schema.float,
    diff_nu_1_4: Schema.float,
    diff_nu_1_5: Schema.float,
    diff_nu_2_1: Schema.float,
    diff_nu_2_2: Schema.float,
    diff_nu_2_3: Schema.float,
    diff_nu_2_4: Schema.float,
    diff_nu_2_5: Schema.float,
};
export type NdbStructSugarStepParameters_Schema = typeof NdbStructSugarStepParameters_Schema;
export const NdbStructSugarStepParameters: Category<NdbStructSugarStepParameters_Schema> = {
    name: 'ndb_struct_sugar_step_parameters',
    schema: NdbStructSugarStepParameters_Schema,
};
