import { Category, Schema } from './';

export const Exptl_Schema = {
    absorpt_coefficient_mu: Schema.float,
    absorpt_correction_T_max: Schema.float,
    absorpt_correction_T_min: Schema.float,
    absorpt_correction_type: Schema.Enum<'analytical'|'cylinder'|'empirical'|'gaussian'|'integration'|'multi-scan'|'none'|'numerical'|'psi-scan'|'refdelf'|'sphere'|null>(['analytical', 'cylinder', 'empirical', 'gaussian', 'integration', 'multi-scan', 'none', 'numerical', 'psi-scan', 'refdelf', 'sphere', null]),
    absorpt_process_details: Schema.str,
    entry_id: Schema.strM,
    crystals_number: Schema.int,
    details: Schema.str,
    method: Schema.Enum<'x-ray diffraction'|'neutron diffraction'|'fiber diffraction'|'electron crystallography'|'electron microscopy'|'solution nmr'|'solid-state nmr'|'solution scattering'|'powder diffraction'|'infrared spectroscopy'|'epr'|'fluorescence transfer'|'theoretical model'>(['x-ray diffraction', 'neutron diffraction', 'fiber diffraction', 'electron crystallography', 'electron microscopy', 'solution nmr', 'solid-state nmr', 'solution scattering', 'powder diffraction', 'infrared spectroscopy', 'epr', 'fluorescence transfer', 'theoretical model']),
    method_details: Schema.str,
};
export type Exptl_Schema = typeof Exptl_Schema;
export const Exptl: Category<Exptl_Schema> = {
    name: 'exptl',
    schema: Exptl_Schema,
};

export const ExptlCrystal_Schema = {
    colour: Schema.str,
    density_diffrn: Schema.float,
    density_Matthews: Schema.float,
    density_method: Schema.str,
    density_percent_sol: Schema.float,
    description: Schema.str,
    F_000: Schema.int,
    id: Schema.strM,
    preparation: Schema.str,
    size_max: Schema.float,
    size_mid: Schema.float,
    size_min: Schema.float,
    size_rad: Schema.float,
    colour_lustre: Schema.Enum<'metallic'|'dull'|'clear'|null>(['metallic', 'dull', 'clear', null]),
    colour_modifier: Schema.Enum<'light'|'dark'|'whitish'|'blackish'|'grayish'|'brownish'|'reddish'|'pinkish'|'orangish'|'yellowish'|'greenish'|'bluish'|null>(['light', 'dark', 'whitish', 'blackish', 'grayish', 'brownish', 'reddish', 'pinkish', 'orangish', 'yellowish', 'greenish', 'bluish', null]),
    colour_primary: Schema.Enum<'colourless'|'white'|'black'|'gray'|'brown'|'red'|'pink'|'orange'|'yellow'|'green'|'blue'|'violet'|null>(['colourless', 'white', 'black', 'gray', 'brown', 'red', 'pink', 'orange', 'yellow', 'green', 'blue', 'violet', null]),
    density_meas: Schema.float,
    density_meas_esd: Schema.float,
    density_meas_gt: Schema.float,
    density_meas_lt: Schema.float,
    density_meas_temp: Schema.float,
    density_meas_temp_esd: Schema.float,
    density_meas_temp_gt: Schema.float,
    density_meas_temp_lt: Schema.float,
    pdbx_crystal_image_url: Schema.str,
    pdbx_crystal_image_format: Schema.str,
    pdbx_mosaicity: Schema.float,
    pdbx_mosaicity_esd: Schema.float,
    pdbx_crystal_image: Schema.Enum<'y'|'n'|null>(['y', 'n', null]),
    'pdbx_x-ray_image': Schema.Enum<'y'|'n'|null>(['y', 'n', null]),
    'pdbx_x-ray_image_type': Schema.str,
    pdbx_crystal_diffrn_limit: Schema.float,
    pdbx_crystal_diffrn_lifetime: Schema.float,
    pdbx_crystal_direction_1: Schema.float,
    pdbx_crystal_direction_2: Schema.float,
    pdbx_crystal_direction_3: Schema.float,
    pdbx_mosaic_method: Schema.str,
    pdbx_mosaic_block_size: Schema.float,
    pdbx_mosaic_block_size_esd: Schema.float,
};
export type ExptlCrystal_Schema = typeof ExptlCrystal_Schema;
export const ExptlCrystal: Category<ExptlCrystal_Schema> = {
    name: 'exptl_crystal',
    schema: ExptlCrystal_Schema,
};

export const ExptlCrystalGrow_Schema = {
    apparatus: Schema.str,
    atmosphere: Schema.str,
    crystal_id: Schema.strM,
    details: Schema.str,
    method: Schema.str,
    method_ref: Schema.str,
    pH: Schema.float,
    pressure: Schema.float,
    pressure_esd: Schema.float,
    seeding: Schema.str,
    seeding_ref: Schema.str,
    temp: Schema.float,
    temp_details: Schema.str,
    temp_esd: Schema.float,
    time: Schema.str,
    pdbx_details: Schema.str,
    pdbx_pH_range: Schema.str,
};
export type ExptlCrystalGrow_Schema = typeof ExptlCrystalGrow_Schema;
export const ExptlCrystalGrow: Category<ExptlCrystalGrow_Schema> = {
    name: 'exptl_crystal_grow',
    schema: ExptlCrystalGrow_Schema,
};
