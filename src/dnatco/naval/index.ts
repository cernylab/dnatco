import * as jsLLKA from 'jsllka';
import { VoidResult, ErrorResult } from '../';
import { AnglesReport } from './angles-report';
import { BondsReport } from './bonds-report';
import { GeometryReport } from './geometry-report';
import { MappedAngleRestraints, MappedBondRestraints, Restraints } from './restraints';
import { Validate } from './validate';
import { isWithin, Interval } from '../../util';

let anglesStr = '';
let bondsStr = '';

const AnglesHeader = [
    'type', 'pdbcode', 'model_id', 'chain',
    'atom1_res_name', 'atom1_resid', 'atom1_name', 'atom1_altloc',
    'atom2_res_name', 'atom2_resid', 'atom2_name', 'atom2_altloc',
    'atom3_res_name', 'atom3_resid', 'atom3_name', 'atom3_altloc',
    'calculated', 'target', 'validation_label', 'validator_name'
];
const BondsHeader = [
    'type', 'pdbcode', 'model_id', 'chain',
    'atom1_res_name', 'atom1_resid', 'atom1_name', 'atom1_altloc',
    'atom2_res_name', 'atom2_resid', 'atom2_name', 'atom2_altloc',
    'calculated', 'target', 'validation_label', 'validator_name'
];
const GeometryHeader = ['type', 'pdbcode', 'model_id', 'chain', 'res_name', 'resid', 'altloc', 'name', 'calculated', 'validation_label'];

export type NavalContext = {
    angles: string,
    bonds: string,
}

export type NavalResult = {
    geometry: GeometryReport.Report,
    bonds: BondsReport.Report,
    angles: AnglesReport.Report,
}

export namespace Naval {
    function quality(v: number, preferred: Interval, acceptable: Interval, suspicious: Interval): Quality {
        if (isWithin(v, preferred))
            return 'csd-preferred';
        if (isWithin(v, acceptable))
            return 'pdb-acceptable';
        if (isWithin(v, suspicious))
            return 'pdb-suspicious';
        return 'outlier';
    }

    export type Quality = 'csd-preferred' | 'pdb-acceptable' | 'pdb-suspicious' | 'outlier';
    const QualityName: Record<Quality, string> = {
        'csd-preferred': 'CSD-preferred',
        'pdb-acceptable': 'PDB-acceptable',
        'pdb-suspicious': 'PDB-suspicious',
        'outlier': 'PDB-outlier',
    };

    export function context(): NavalContext {
        return {
            angles: anglesStr,
            bonds: bondsStr,
        };
    }

    export async function initialize(anglesUrl: string, bondsUrl: string) {
        try {
            const anglesReq = fetch(anglesUrl);
            const bondsReq = fetch(bondsUrl);

            const anglesResp = await anglesReq;
            if (!anglesResp.ok)
                throw new Error(`Cannot fetch Naval angles restraints: ${anglesResp.status} - ${anglesResp.statusText}`);
            anglesStr = await anglesResp.text();

            const bondsResp = await bondsReq;
            if (!bondsResp.ok)
                throw new Error(`Cannot fetch Naval bonds restraints: ${bondsResp.status} - ${bondsResp.statusText}`);
            bondsStr = await bondsResp.text();

            return VoidResult();
        } catch (e) {
            return ErrorResult((e as Error).message);
        }
    }

    export function anglesAsCsv(angles: AnglesReport.Report, delimiter = ';') {
        let out = AnglesHeader.join(delimiter) + '\n';

        for (const item of angles) {
            const csd_preferred_left = item.target_value - 3 * item.target_sigma;
            const csd_preferred_right = item.target_value + 3 * item.target_sigma;
            const qual = quality(
                item.calculated_value,
                Interval(csd_preferred_left, csd_preferred_right),
                Interval(item.pdb_allowed_left, item.pdb_allowed_right),
                Interval(item.pdb_suspicious_left, item.pdb_suspicious_right),
            );

            out += [
                'angle', item.pdbcode, item.modelNum, item.chain,
                item.atoms.a.res_name, item.atoms.a.resid, item.atoms.a.name, item.atoms.a.altloc,
                item.atoms.b.res_name, item.atoms.b.resid, item.atoms.b.name, item.atoms.b.altloc,
                item.atoms.c.res_name, item.atoms.c.resid, item.atoms.c.name, item.atoms.c.altloc,
                item.calculated_value.toFixed(1), item.target_value, QualityName[qual], item.name
            ].join(delimiter) + '\n';
        }

        return out;
    }

    export function bondsAsCsv(bonds: BondsReport.Report, delimiter = ';') {
        let out = BondsHeader.join(delimiter) + '\n';

        for (const item of bonds) {
            const csd_preferred_left = item.target_value - 3 * item.target_sigma;
            const csd_preferred_right = item.target_value + 3 * item.target_sigma;
            const qual = quality(
                item.calculated_value,
                Interval(csd_preferred_left, csd_preferred_right),
                Interval(item.pdb_allowed_left, item.pdb_allowed_right),
                Interval(item.pdb_suspicious_left, item.pdb_suspicious_right),
            );

            out += [
                'bond', item.pdbcode, item.modelNum, item.chain,
                item.atoms.a.res_name, item.atoms.a.resid, item.atoms.a.name, item.atoms.a.altloc,
                item.atoms.b.res_name, item.atoms.b.resid, item.atoms.b.name, item.atoms.b.altloc,
                item.calculated_value.toFixed(1), item.target_value, QualityName[qual], item.name
            ].join(delimiter) + '\n';
        }

        return out;
    }

    export function geometryAsCsv(geometry: GeometryReport.Report, delimiter = ';') {
        let out = GeometryHeader.join(delimiter) + '\n';

        for (const item of geometry) {
            out += [item.type, item.pdbcode, item.model_id, item.chain, item.res_name, item.altloc, item.name, item.calculated?.toFixed(1) ?? '', item.value_label].join(delimiter);
            out += '\n';
        }

        return out;
    }

    export function validate(stru: jsLLKA.LLKAStructure, pdbId: string, angleRestraintsIn: string, bondRestraintsIn: string): NavalResult {
        const angleRestraints = MappedAngleRestraints.map(Restraints.angles(angleRestraintsIn));
        const bondRestraints = MappedBondRestraints.map(Restraints.bonds(bondRestraintsIn));

        return Validate.validate(pdbId, stru, angleRestraints, bondRestraints);
    }
}
