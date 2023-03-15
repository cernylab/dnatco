import { Common } from "./common";
import { Measure } from './measure';

export namespace GeometryReport {
    type ValuesOfInterest = keyof Pick<
        Measure.Measurement,
        'alpha' | 'beta' |'gamma' | 'delta' | 'epsilon' | 'zeta' | 'chi' |
        'theta0' | 'theta1' | 'theta2' | 'theta3' | 'theta4' |
        'tau_max' | 'pseudorotation'
    >;
    const Pseudorotations = ['tau_max', 'pseudorotation'] as ValuesOfInterest[];

    function alphaZetaConf(conf: Measure.AlphaConformation | Measure.ZetaConformation) {
        switch (conf) {
            case 'ScMinus': return 'sc-';
            case 'ScPlus':  return 'sc+';
            case 'Ap':      return 'ap';
            case 'Other':   return 'other';
        }
    }

    function gammaConf(conf: Measure.GammaConformation) {
        switch (conf) {
            case 'GaucheMinus': return "gauche-";
            case 'GauchePlus':  return "gauche+";
            case 'Trans':       return "trans";
            case 'Other':       return "other";
        }
    }

    function chiConf(conf: Measure.ChiConformation) {
        switch (conf) {
            case 'Anti': return 'anti';
            case 'Syn':  return 'syn';
        }
    }

    function puckerName(p: Measure.SugarPucker) {
        switch (p) {
            case 'C3Endo': return "C3'endo";
            case 'C4Exo': return "C4'Exo";
            case 'O4Endo': return "O4'Endo";
            case 'C1Exo': return "C1'Exo";
            case 'C2Endo': return "C2'Endo";
            case 'C3Exo': return "C3'Exo";
            case 'C4Endo': return "C4'Endo";
            case 'O4Exo': return "O4'Exo";
            case 'C1Endo': return "C1'Endo";
            case 'C2Exo': return "C2'Exo";
        }
    }

    function makeItem(m: Measure.Measurement, param: ValuesOfInterest, label: string): Item {
        const type = Pseudorotations.includes(param) ? 'pseudorotation' : 'torsion';

        return {
            type,
            pdbcode: m.pdbcode,
            model_id: m.modelNum,
            chain: m.chain,
            res_name: m.compId,
            resid: Common.residueId(m.seqId, m.insCode),
            altloc: m.altId,
            name: param,
            calculated: m[param],
            value_label: label
        };
    }

    export type Item = {
        type: 'torsion' | 'pseudorotation';
        pdbcode: string;
        model_id: number;
        chain: string;
        res_name: string;
        resid: string;
        altloc: string;
        name: string;
        calculated: Measure.MaybeNumber;
        value_label: string;
    }
    export type Report = Item[];

    export function make(measurements: Measure.Measurement[]) {
        const report = [];

        for (const m of measurements) {
            report.push(makeItem(m, 'alpha', m.alphaConf !== undefined ? alphaZetaConf(m.alphaConf) : 'undefined'));
            report.push(makeItem(m, 'beta', ''));
            report.push(makeItem(m, 'gamma', gammaConf(m.gammaConf)));
            report.push(makeItem(m, 'delta', ''));
            report.push(makeItem(m, 'epsilon', ''));
            report.push(makeItem(m, 'zeta', m.zetaConf !== undefined ? alphaZetaConf(m.zetaConf) : 'undefined'));
            report.push(makeItem(m, 'chi', chiConf(m.chiConf)));
            report.push(makeItem(m, 'theta0', ''));
            report.push(makeItem(m, 'theta1', ''));
            report.push(makeItem(m, 'theta2', ''));
            report.push(makeItem(m, 'theta3', ''));
            report.push(makeItem(m, 'theta4', ''));
            report.push(makeItem(m, 'tau_max', ''));
            report.push(makeItem(m, 'pseudorotation', m.pucker !== undefined ? puckerName(m.pucker) : 'N/A'));
        }

        return report;
    }
}
