import { Category, Schema } from './';

export const Em3dReconstruction_Schema = {
    entry_id: Schema.strM,
    id: Schema.strM,
    method: Schema.str,
    algorithm: Schema.str,
    citation_id: Schema.str,
    details: Schema.str,
    resolution: Schema.float,
    resolution_method: Schema.str,
    magnification_calibration: Schema.str,
    ctf_correction_method: Schema.str,
    nominal_pixel_size: Schema.float,
    actual_pixel_size: Schema.float,
    num_particles: Schema.int,
    euler_angles_details: Schema.str,
    num_class_averages: Schema.int,
    software: Schema.str,
    fsc_type: Schema.Enum<'even/odd maps refined totally independent (gold standard)'|'even/odd maps refined against the same model (semi-independent)'|null>(['even/odd maps refined totally independent (gold standard)', 'even/odd maps refined against the same model (semi-independent)', null]),
    refinement_type: Schema.Enum<'half-maps refined against same data'|'half-maps refined independently'|'half-maps refined with frequency range omitted'|'half-maps refined independently with frequency range omitted'|'other'|null>(['half-maps refined against same data', 'half-maps refined independently', 'half-maps refined with frequency range omitted', 'half-maps refined independently with frequency range omitted', 'other', null]),
    image_processing_id: Schema.strM,
    symmetry_type: Schema.Enum<'point'|'helical'|'2d crystal'|'3d crystal'|null>(['point', 'helical', '2d crystal', '3d crystal', null]),
};
export type Em3dReconstruction_Schema = typeof Em3dReconstruction_Schema;
export const Em3dReconstruction: Category<Em3dReconstruction_Schema> = {
    name: 'em_3d_reconstruction',
    schema: Em3dReconstruction_Schema,
};
