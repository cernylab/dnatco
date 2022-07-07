import { Category, Schema } from './';

export const NdbStructNtcOverall_Schema = {
    entry_id: Schema.strM,
    confal_score: Schema.floatM,
    confal_percentile: Schema.intM,
    ntc_version: Schema.strM,
    cana_version: Schema.strM,
    num_steps: Schema.intM,
    num_classified: Schema.intM,
    num_unclassified: Schema.intM,
    num_unclassified_rmsd_close: Schema.intM,
};
export type NdbStructNtcOverall_Schema = typeof NdbStructNtcOverall_Schema;
export const NdbStructNtcOverall: Category<NdbStructNtcOverall_Schema> = {
    name: 'ndb_struct_ntc_overall',
    schema: NdbStructNtcOverall_Schema,
};

export const NdbStructNtcStepParameters_Schema = {
    step_id: Schema.intM,
    tor_delta_1: Schema.floatM,
    tor_epsilon_1: Schema.floatM,
    tor_zeta_1: Schema.floatM,
    tor_alpha_2: Schema.floatM,
    tor_beta_2: Schema.floatM,
    tor_gamma_2: Schema.floatM,
    tor_delta_2: Schema.floatM,
    tor_chi_1: Schema.floatM,
    tor_chi_2: Schema.floatM,
    dist_NN: Schema.floatM,
    dist_CC: Schema.floatM,
    tor_NCCN: Schema.floatM,
    diff_tor_delta_1: Schema.floatM,
    diff_tor_epsilon_1: Schema.floatM,
    diff_tor_zeta_1: Schema.floatM,
    diff_tor_alpha_2: Schema.floatM,
    diff_tor_beta_2: Schema.floatM,
    diff_tor_gamma_2: Schema.floatM,
    diff_tor_delta_2: Schema.floatM,
    diff_tor_chi_1: Schema.floatM,
    diff_tor_chi_2: Schema.floatM,
    diff_dist_NN: Schema.floatM,
    diff_dist_CC: Schema.floatM,
    diff_tor_NCCN: Schema.floatM,
    confal_tor_delta_1: Schema.floatM,
    confal_tor_epsilon_1: Schema.floatM,
    confal_tor_zeta_1: Schema.floatM,
    confal_tor_alpha_2: Schema.floatM,
    confal_tor_beta_2: Schema.floatM,
    confal_tor_gamma_2: Schema.floatM,
    confal_tor_delta_2: Schema.floatM,
    confal_tor_chi_1: Schema.floatM,
    confal_tor_chi_2: Schema.floatM,
    confal_dist_NN: Schema.floatM,
    confal_dist_CC: Schema.floatM,
    confal_tor_NCCN: Schema.floatM,
    details: Schema.strM,
};
export type NdbStructNtcStepParameters_Schema = typeof NdbStructNtcStepParameters_Schema;
export const NdbStructNtcStepParameters: Category<NdbStructNtcStepParameters_Schema> = {
    name: 'ndb_struct_ntc_step_parameters',
    schema: NdbStructNtcStepParameters_Schema,
};

export const NdbStructNtcStep_Schema = {
    id: Schema.intM,
    name: Schema.strM,
    PDB_model_number: Schema.intM,
    label_entity_id_1: Schema.intM,
    label_asym_id_1: Schema.strM,
    label_seq_id_1: Schema.intM,
    label_comp_id_1: Schema.strM,
    label_alt_id_1: Schema.strM,
    label_entity_id_2: Schema.intM,
    label_asym_id_2: Schema.strM,
    label_seq_id_2: Schema.intM,
    label_comp_id_2: Schema.strM,
    label_alt_id_2: Schema.strM,
    auth_asym_id_1: Schema.strM,
    auth_seq_id_1: Schema.intM,
    auth_asym_id_2: Schema.strM,
    auth_seq_id_2: Schema.intM,
    PDB_ins_code_1: Schema.strM,
    PDB_ins_code_2: Schema.strM,
};
export type NdbStructNtcStep_Schema = typeof NdbStructNtcStep_Schema;
export const NdbStructNtcStep: Category<NdbStructNtcStep_Schema> = {
    name: 'ndb_struct_ntc_step',
    schema: NdbStructNtcStep_Schema,
}

export const NdbStructNtcStepSummary_Schema = {
    step_id: Schema.intM,
    assigned_CANA: Schema.strM,
    assigned_NtC: Schema.strM,
    confal_score: Schema.intM,
    euclidean_distance_NtC_ideal: Schema.floatM,
    cartesian_rmsd_closest_NtC_representative: Schema.floatM,
    closest_CANA: Schema.strM,
    closest_NtC: Schema.strM,
    closest_step_golden: Schema.strM,
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
