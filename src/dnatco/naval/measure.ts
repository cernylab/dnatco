import * as jsLLKA from 'jsllka';
import { BunchOfAtoms, Common, StdBase } from "./common";

const Pyrimidines = new Set([
    "C", "U", "DC", "DT"
]);

function isDeoxyribose(compId: string) {
    return compId.startsWith('D');
}

function isPyrimidine(compId: string) {
    return Pyrimidines.has(compId);
}

function rad2deg(v: number) {
    return 180.0 * v / Math.PI;
}

export namespace Measure {
    type AtomPair = [MaybeLLKAAtom, MaybeLLKAAtom];
    type AtomTriplet = [MaybeLLKAAtom, MaybeLLKAAtom, MaybeLLKAAtom];
    type AtomQuad = [MaybeLLKAAtom, MaybeLLKAAtom, MaybeLLKAAtom, MaybeLLKAAtom];

    function ASpecific(): ASpecific {
        return {
            base: 'A',
            C5_N7: 0,
            N7_C8: 0,
            C8_N9: 0,
            N9_C4: 0,
            C6_N6: 0,
            N3_C4_N9: 0,
            C6_C5_N7: 0,
            C5_C4_N9: 0,
            C4_N9_C8: 0,
            N9_C8_N7: 0,
            C8_N7_C5: 0,
            N7_C5_C4: 0,
            N6_C6_N1: 0,
            N6_C6_C5: 0,
            C1p_N9: 0,
            N9_C1p_O4p: 0,
            N9_C1p_C2p: 0,
            C4p_C5p_O5p: 0,
            C1p_N9_C4: 0,
            C1p_N9_C8: 0
        };
    }
    function CSpecific(): CSpecific {
        return {
            base: 'C',
            C2_O2: 0,
            C4_N4: 0,
            O2_C2_N1: 0,
            O2_C2_N3: 0,
            N4_C4_C5: 0,
            N4_C4_N3: 0,
            C1p_N1: 0,
            N1_C1p_O4p: 0,
            N1_C1p_C2p: 0,
            C4p_C5p_O5p: 0,
            C1p_N1_C2: 0,
            C1p_N1_C6: 0,
        };
    }
    function GSpecific(): GSpecific {
        return {
            base: 'G',
            C5_N7: 0,
            N7_C8: 0,
            C8_N9: 0,
            N9_C4: 0,
            C6_O6: 0,
            C2_N2: 0,
            N3_C4_N9: 0,
            C6_C5_N7: 0,
            C5_C4_N9: 0,
            C4_N9_C8: 0,
            N9_C8_N7: 0,
            C8_N7_C5: 0,
            N7_C5_C4: 0,
            O6_C6_N1: 0,
            O6_C6_C5: 0,
            N2_C2_N1: 0,
            N2_C2_N3: 0,
            C1p_N9: 0,
            N9_C1p_O4p: 0,
            N9_C1p_C2p: 0,
            C4p_C5p_O5p: 0,
            C1p_N9_C4: 0,
            C1p_N9_C8: 0
        };
    }
    function TSpecific(): TSpecific {
        return {
            base: 'T',
            C2_O2: 0,
            C4_O4: 0,
            C7_C5: 0,
            O2_C2_N1: 0,
            O2_C2_N3: 0,
            O4_C4_C5: 0,
            O4_C4_N3: 0,
            C7_C5_C4: 0,
            C7_C5_C6: 0,
            C1p_N1: 0,
            N1_C1p_O4p: 0,
            N1_C1p_C2p: 0,
            C4p_C5p_O5p: 0,
            C1p_N1_C2: 0,
            C1p_N1_C6: 0,
        };
    }
    function USpecific(): USpecific {
        return {
            base: 'U',
            C2_O2: 0,
            C4_O4: 0,
            O2_C2_N1: 0,
            O2_C2_N3: 0,
            O4_C4_C5: 0,
            O4_C4_N3: 0,
            C1p_N1: 0,
            N1_C1p_O4p: 0,
            N1_C1p_C2p: 0,
            C4p_C5p_O5p: 0,
            C1p_N1_C2: 0,
            C1p_N1_C6: 0
        };
    }

    function gatherAtomsOfInterest(boa: BunchOfAtoms, compId: string) {
        const isPyr = isPyrimidine(compId);
        const aoi = new AtomsOfInterest();

        aoi.C3p_1 = boa.before ? Common.findAtom(boa.before, "C3'") : void 0;
        aoi.O3p_1 = boa.before ? Common.findAtom(boa.before, "O3'") : void 0;

        aoi.P_2 = Common.findAtom(boa.current, "P");
        aoi.O5p_2 = Common.findAtom(boa.current, "O5'");
        aoi.C5p_2 = Common.findAtom(boa.current, "C5'");
        aoi.C4p_2 = Common.findAtom(boa.current, "C4'");
        aoi.C3p_2 = Common.findAtom(boa.current, "C3'");
        aoi.O3p_2 = Common.findAtom(boa.current, "O3'");

        aoi.P_3 = boa.after ? Common.findAtom(boa.after, "P") : void 0;
        aoi.O5p_3 =  boa.after ?Common.findAtom(boa.after, "O5'") : void 0;
        aoi.C5p_3 =  boa.after ?Common.findAtom(boa.after, "C5'") : void 0;

        aoi.O4p_2 = Common.findAtom(boa.current, "O4'");
        aoi.C1p_2 = Common.findAtom(boa.current, "C1'");
        aoi.C2p_2 = Common.findAtom(boa.current, "C2'");
        if (!isDeoxyribose(compId))
            aoi.O2p_2 = Common.findAtom(boa.current, "O2'");

        aoi.OP1_2 = Common.findAtom(boa.current, "OP1");
        aoi.OP2_2 = Common.findAtom(boa.current, "OP2");

        aoi.N1 = Common.findAtom(boa.current, "N1");
        aoi.C2 = Common.findAtom(boa.current, "C2");
        aoi.N3 = Common.findAtom(boa.current, "N3");
        aoi.C4 = Common.findAtom(boa.current, "C4");
        aoi.C5 = Common.findAtom(boa.current, "C5");
        aoi.C6 = Common.findAtom(boa.current, "C6");

        if (compId == "A" || compId == "DA" || compId == "G" || compId == "DG") {
            aoi.N7 = Common.findAtom(boa.current, "N7");
            aoi.C8 = Common.findAtom(boa.current, "C8");
            aoi.N9 = Common.findAtom(boa.current, "N9");

            if (compId == "A" || compId == "DA") {
                aoi.N6 = Common.findAtom(boa.current, "N6");
            } else {
                aoi.N2 = Common.findAtom(boa.current, "N2");
                aoi.O6 = Common.findAtom(boa.current, "O6");
            }
        } else {
            aoi.O2 = Common.findAtom(boa.current, "O2");

            if (compId == "DT") {
                aoi.O4 = Common.findAtom(boa.current, "O4");
                aoi.C7 = Common.findAtom(boa.current, "C7");
            } else if (compId == "U") {
                aoi.O4 = Common.findAtom(boa.current, "O4");
            } else {
                aoi.N4 = Common.findAtom(boa.current, "N4");
            }
        }

        aoi.baseA_2 = isPyr ? aoi.N1 : aoi.N9;
        aoi.baseB_2 = isPyr ? aoi.C2 : aoi.C4;

        return aoi;
    }

    function measureAngle(triplet: AtomTriplet): number {
        return rad2deg(jsLLKA.LLKA.measureAngle(triplet[0], triplet[1], triplet[2]));
    }

    function measureLength(pair: AtomPair): number {
        return jsLLKA.LLKA.measureDistance(pair[0], pair[1]);
    }

    function measureTorsion(quad: AtomQuad): number {
        return rad2deg(jsLLKA.LLKA.measureDihedral(quad[0], quad[1], quad[2], quad[3]));
    }

    function alphaZetaConf(angle: number) {
        if (30.0 <= angle && angle <= 110)
            return 'ScPlus';
        else if (-110.0  <= angle && angle <= -30)
            return 'ScMinus';
        else if (angle <= -130.0 || 110 < angle)
            return 'Ap';

        return 'Other';
    }

    function gammaConf(angle: number): GammaConformation {
        if (30.0 <= angle && angle <= 90.0)
            return 'GauchePlus';
        else if (-90.0 <= angle && angle <= -30)
            return 'GaucheMinus';
        else if (angle >= 150 || angle <= -150)
            return 'Trans';

        return 'Other';
    }

    function chiConf(angle: number): ChiConformation {
        if (-90.0 <= angle && angle <= 90.0)
            return 'Syn';

        return 'Anti';
    }

    function measureBase(m: Measurement) {
        const aoi = m.aoi;

        // Length common for all bases
        m.N1_C2 = measureLength([aoi.N1, aoi.C2]);
        m.C2_N3 = measureLength([aoi.C2, aoi.N3]);
        m.N3_C4 = measureLength([aoi.N3, aoi.C4]);
        m.C4_C5 = measureLength([aoi.C4, aoi.C5]);
        m.C5_C6 = measureLength([aoi.C5, aoi.C6]);
        m.C6_N1 = measureLength([aoi.C6, aoi.N1]);

        // Angles common for all bases
        m.C6_N1_C2 = measureAngle([aoi.C6, aoi.N1, aoi.C2]);
        m.N1_C2_N3 = measureAngle([aoi.N1, aoi.C2, aoi.N3]);
        m.C2_N3_C4 = measureAngle([aoi.C2, aoi.N3, aoi.C4]);
        m.N3_C4_C5 = measureAngle([aoi.N3, aoi.C4, aoi.C5]);
        m.C4_C5_C6 = measureAngle([aoi.C4, aoi.C5, aoi.C6]);
        m.C5_C6_N1 = measureAngle([aoi.C5, aoi.C6, aoi.N1]);

        if (isA(m.base)) {
            m.base.C5_N7 = measureLength([aoi.C5, aoi.N7]);
            m.base.N7_C8 = measureLength([aoi.N7, aoi.C8]);
            m.base.C8_N9 = measureLength([aoi.C8, aoi.N9]);
            m.base.N9_C4 = measureLength([aoi.N9, aoi.C4]);
            m.base.C6_N6 = measureLength([aoi.C6, aoi.N6]);

            m.base.N3_C4_N9 = measureAngle([aoi.N3, aoi.C4, aoi.N9]);
            m.base.C6_C5_N7 = measureAngle([aoi.C6, aoi.C5, aoi.N7]);
            m.base.C5_C4_N9 = measureAngle([aoi.C5, aoi.C4, aoi.N9]);
            m.base.C4_N9_C8 = measureAngle([aoi.C4, aoi.N9, aoi.C8]);
            m.base.N9_C8_N7 = measureAngle([aoi.N9, aoi.C8, aoi.N7]);
            m.base.C8_N7_C5 = measureAngle([aoi.C8, aoi.N7, aoi.C5]);
            m.base.N7_C5_C4 = measureAngle([aoi.N7, aoi.C5, aoi.C4]);
            m.base.N6_C6_N1 = measureAngle([aoi.N6, aoi.C6, aoi.N1]);
            m.base.N6_C6_C5 = measureAngle([aoi.N6, aoi.C6, aoi.C5]);
        } else if (isG(m.base)) {
            m.base.C5_N7 = measureLength([aoi.C5, aoi.N7]);
            m.base.N7_C8 = measureLength([aoi.N7, aoi.C8]);
            m.base.C8_N9 = measureLength([aoi.C8, aoi.N9]);
            m.base.N9_C4 = measureLength([aoi.N9, aoi.C4]);
            m.base.C6_O6 = measureLength([aoi.C6, aoi.O6]);
            m.base.C2_N2 = measureLength([aoi.C2, aoi.N2]);

            m.base.N3_C4_N9 = measureAngle([aoi.N3, aoi.C4, aoi.N9]);
            m.base.C6_C5_N7 = measureAngle([aoi.C6, aoi.C5, aoi.N7]);
            m.base.C5_C4_N9 = measureAngle([aoi.C5, aoi.C4, aoi.N9]);
            m.base.C4_N9_C8 = measureAngle([aoi.C4, aoi.N9, aoi.C8]);
            m.base.N9_C8_N7 = measureAngle([aoi.N9, aoi.C8, aoi.N7]);
            m.base.C8_N7_C5 = measureAngle([aoi.C8, aoi.N7, aoi.C5]);
            m.base.N7_C5_C4 = measureAngle([aoi.N7, aoi.C5, aoi.C4]);
            m.base.O6_C6_N1 = measureAngle([aoi.O6, aoi.C6, aoi.N1]);
            m.base.O6_C6_C5 = measureAngle([aoi.O6, aoi.C6, aoi.C5]);
            m.base.N2_C2_N1 = measureAngle([aoi.N2, aoi.C2, aoi.N1]);
            m.base.N2_C2_N3 = measureAngle([aoi.N2, aoi.C2, aoi.N3]);
        } else if (isC(m.base)) {
            m.base.C2_O2 = measureLength([aoi.C2, aoi.O2]);
            m.base.C4_N4 = measureLength([aoi.C4, aoi.N4]);

            m.base.O2_C2_N1 = measureAngle([aoi.O2, aoi.C2, aoi.N1]);
            m.base.O2_C2_N3 = measureAngle([aoi.O2, aoi.C2, aoi.N3]);
            m.base.N4_C4_C5 = measureAngle([aoi.N4, aoi.C4, aoi.C5]);
            m.base.N4_C4_N3 = measureAngle([aoi.N4, aoi.C4, aoi.N3]);
        } else if (isT(m.base)) {
            m.base.C2_O2 = measureLength([aoi.C2, aoi.O2]);
            m.base.C4_O4 = measureLength([aoi.C4, aoi.O4]);
            m.base.C7_C5 = measureLength([aoi.C7, aoi.C5]);

            m.base.O2_C2_N1 = measureAngle([aoi.O2, aoi.C2, aoi.N1]);
            m.base.O2_C2_N3 = measureAngle([aoi.O2, aoi.C2, aoi.N3]);
            m.base.O4_C4_C5 = measureAngle([aoi.O4, aoi.C4, aoi.C5]);
            m.base.O4_C4_N3 = measureAngle([aoi.O4, aoi.C4, aoi.N3]);
            m.base.C7_C5_C4 = measureAngle([aoi.C7, aoi.C5, aoi.C4]);
            m.base.C7_C5_C6 = measureAngle([aoi.C7, aoi.C5, aoi.C6]);
        } else if (isU(m.base)) {
            m.base.C2_O2 = measureLength([aoi.C2, aoi.O2]);
            m.base.C4_O4 = measureLength([aoi.C4, aoi.O4]);

            m.base.O2_C2_N1 = measureAngle([aoi.O2, aoi.C2, aoi.N1]);
            m.base.O2_C2_N3 = measureAngle([aoi.O2, aoi.C2, aoi.N3]);
            m.base.O4_C4_C5 = measureAngle([aoi.O4, aoi.C4, aoi.C5]);
            m.base.O4_C4_N3 = measureAngle([aoi.O4, aoi.C4, aoi.N3]);
        } else
            throw new Error('Base base');
    }

    function measureGeometry(m: Measurement, bunch: BunchOfAtoms) {
        const aoi = m.aoi;

        // Backbone
        if (aoi.canLookBack() && aoi.hasPhosphateTetraherdron()) {
            m.zetaPrev = measureTorsion([aoi.C3p_1, aoi.O3p_1, aoi.P_2, aoi.O5p_2]);
            m.alpha = measureTorsion([aoi.O3p_1, aoi.P_2, aoi.O5p_2, aoi.C5p_2]);
            m.beta = measureTorsion([aoi.P_2, aoi.O5p_2, aoi.C5p_2, aoi.C4p_2]);

            m.zetaPrevConf = alphaZetaConf(m.zetaPrev);
            m.alphaConf = alphaZetaConf(m.alpha);
        }

        m.gamma = measureTorsion([aoi.O5p_2, aoi.C5p_2, aoi.C4p_2, aoi.C3p_2]);
        m.gammaConf = gammaConf(m.gamma);

        m.delta = measureTorsion([aoi.C5p_2, aoi.C4p_2, aoi.C3p_2, aoi.O3p_2]);

        if (aoi.canLookAhead()) {
            m.epsilon = measureTorsion([aoi.C4p_2, aoi.C3p_2, aoi.O3p_2, aoi.P_3]);
            m.zeta = measureTorsion([aoi.C3p_2, aoi.O3p_2, aoi.P_3, aoi.O5p_3]);
            m.alphaNext = measureTorsion([aoi.O3p_2, aoi.P_3, aoi.O5p_3,aoi.C5p_3]);

            m.zetaConf = alphaZetaConf(m.zeta);
            m.alphaNextConf = alphaZetaConf(m.alphaNext);
        }

        // Chi
        m.chi = measureTorsion([aoi.O4p_2, aoi.C1p_2, aoi.baseA_2, aoi.baseB_2]);
        m.chiConf = chiConf(m.chi);

        const riboseMet = jsLLKA.LLKA.riboseMetrics(bunch.current);
        if (riboseMet.isSuccess()) {
            const metrics = riboseMet.success();
            m.theta0 = rad2deg(metrics.nus.nu_0);
            m.theta1 = rad2deg(metrics.nus.nu_1);
            m.theta2 = rad2deg(metrics.nus.nu_2);
            m.theta3 = rad2deg(metrics.nus.nu_3);
            m.theta4 = rad2deg(metrics.nus.nu_4);
            m.pseudorotation = rad2deg(metrics.P);
            m.tau_max = rad2deg(metrics.tMax);
            m.pucker = toPucker(metrics.pucker);
        }
        riboseMet.delete();
    }

    function measurePO4(m: Measurement) {
        const aoi = m.aoi;

        m.O5p_C5p = measureLength([aoi.O5p_2, aoi.C5p_2]);
        m.O3p_C3p = measureLength([aoi.O3p_2, aoi.C3p_2]);

        if (aoi.hasPhosphateTetraherdron()) {
            m.OP1_P = measureLength([aoi.OP1_2, aoi.P_2]);
            m.OP2_P = measureLength([aoi.OP2_2, aoi.P_2]);
            m.O3p_P = measureLength([aoi.O3p_1, aoi.P_2]);
            m.O5p_P = measureLength([aoi.O5p_2, aoi.P_2]);

            m.OP1_P_OP2 = measureAngle([aoi.OP1_2, aoi.P_2, aoi.OP2_2]);
            m.OP1_P_O3p = measureAngle([aoi.OP1_2, aoi.P_2, aoi.O3p_1]);
            m.OP1_P_O5p = measureAngle([aoi.OP1_2, aoi.P_2, aoi.O5p_2]);
            m.OP2_P_O3p = measureAngle([aoi.OP2_2, aoi.P_2, aoi.O3p_1]);
            m.OP2_P_O5p = measureAngle([aoi.OP2_2, aoi.P_2, aoi.O5p_2]);
            m.O3p_P_O5p = measureAngle([aoi.O3p_1, aoi.P_2, aoi.O5p_2]);
            m.P_O3p_C3p = measureAngle([aoi.P_2, aoi.O3p_1, aoi.C3p_1]);
            m.P_O5p_C5p = measureAngle([aoi.P_2, aoi.O5p_2, aoi.C5p_2]);
        }
    }


    function measureSugar(m: Measurement) {
        const aoi = m.aoi;

        // Common lengths
        m.C1p_C2p = measureLength([aoi.C1p_2, aoi.C2p_2]);
        m.C2p_C3p = measureLength([aoi.C2p_2, aoi.C3p_2]);
        m.C3p_C4p = measureLength([aoi.C3p_2, aoi.C4p_2]);
        m.C4p_O4p = measureLength([aoi.C4p_2, aoi.O4p_2]);
        m.C1p_O4p = measureLength([aoi.C1p_2, aoi.O4p_2]);
        m.C4p_C5p = measureLength([aoi.C4p_2, aoi.C5p_2]);

        // Common angles
        m.C1p_C2p_C3p = measureAngle([aoi.C1p_2, aoi.C2p_2, aoi.C3p_2]);
        m.C2p_C3p_C4p = measureAngle([aoi.C2p_2, aoi.C3p_2, aoi.C4p_2]);
        m.C3p_C4p_O4p = measureAngle([aoi.C3p_2, aoi.C4p_2, aoi.O4p_2]);
        m.C1p_O4p_C4p = measureAngle([aoi.C1p_2, aoi.O4p_2, aoi.C4p_2]);
        m.C2p_C1p_O4p = measureAngle([aoi.C2p_2, aoi.C1p_2, aoi.O4p_2]);
        m.C2p_C3p_O3p = measureAngle([aoi.C2p_2, aoi.C3p_2, aoi.O3p_2]);
        m.C4p_C3p_O3p = measureAngle([aoi.C4p_2, aoi.C3p_2, aoi.O3p_2]);
        m.C3p_C4p_C5p = measureAngle([aoi.C3p_2, aoi.C4p_2, aoi.C5p_2]);
        m.C5p_C4p_O4p = measureAngle([aoi.C5p_2, aoi.C4p_2, aoi.O4p_2]);
        if (!m.isDeoxyribose) {
            // assert(aoi.isOxyribose()); Let's keep some optimism

            m.C2p_O2p = measureLength([aoi.C2p_2, aoi.O2p_2]);

            m.C1p_C2p_O2p = measureAngle([aoi.C1p_2, aoi.C2p_2, aoi.O2p_2]);
            m.C3p_C2p_O2p = measureAngle([aoi.C3p_2, aoi.C2p_2, aoi.O2p_2]);
        }

        if (isA(m.base)) {
            m.base.C1p_N9 = measureLength([aoi.C1p_2, aoi.N9]);

            m.base.N9_C1p_O4p = measureAngle([aoi.N9, aoi.C1p_2, aoi.O4p_2]);
            m.base.N9_C1p_C2p = measureAngle([aoi.N9, aoi.C1p_2, aoi.C2p_2]);
            m.base.C4p_C5p_O5p = measureAngle([aoi.C4p_2, aoi.C5p_2, aoi.O5p_2]);
            m.base.C1p_N9_C4 = measureAngle([aoi.C1p_2, aoi.N9, aoi.C4]);
            m.base.C1p_N9_C8 = measureAngle([aoi.C1p_2, aoi.N9, aoi.C8]);
        } else if (isG(m.base)) {
            m.base.C1p_N9 = measureLength([aoi.C1p_2, aoi.N9]);

            m.base.N9_C1p_O4p = measureAngle([aoi.N9, aoi.C1p_2, aoi.O4p_2]);
            m.base.N9_C1p_C2p = measureAngle([aoi.N9, aoi.C1p_2, aoi.C2p_2]);
            m.base.C4p_C5p_O5p = measureAngle([aoi.C4p_2, aoi.C5p_2, aoi.O5p_2]);
            m.base.C1p_N9_C4 = measureAngle([aoi.C1p_2, aoi.N9, aoi.C4]);
            m.base.C1p_N9_C8 = measureAngle([aoi.C1p_2, aoi.N9, aoi.C8]);
        } else if (isC(m.base)) {
            m.base.C1p_N1 = measureLength([aoi.C1p_2, aoi.N1]);

            m.base.N1_C1p_O4p = measureAngle([aoi.N1, aoi.C1p_2, aoi.O4p_2]);
            m.base.N1_C1p_C2p = measureAngle([aoi.N1, aoi.C1p_2, aoi.C2p_2]);
            m.base.C4p_C5p_O5p = measureAngle([aoi.C4p_2, aoi.C5p_2, aoi.O5p_2]);
            m.base.C1p_N1_C2 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C2]);
            m.base.C1p_N1_C6 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C6]);
        } else if (isT(m.base)) {
            m.base.C1p_N1 = measureLength([aoi.C1p_2, aoi.N1]);

            m.base.N1_C1p_O4p = measureAngle([aoi.N1, aoi.C1p_2, aoi.O4p_2]);
            m.base.N1_C1p_C2p = measureAngle([aoi.N1, aoi.C1p_2, aoi.C2p_2]);
            m.base.C4p_C5p_O5p = measureAngle([aoi.C4p_2, aoi.C5p_2, aoi.O5p_2]);
            m.base.C1p_N1_C2 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C2]);
            m.base.C1p_N1_C6 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C6]);
        } else if (isU(m.base)) {
            m.base.C1p_N1 = measureLength([aoi.C1p_2, aoi.N1]);

            m.base.N1_C1p_O4p = measureAngle([aoi.N1, aoi.C1p_2, aoi.O4p_2]);
            m.base.N1_C1p_C2p = measureAngle([aoi.N1, aoi.C1p_2, aoi.C2p_2]);
            m.base.C4p_C5p_O5p = measureAngle([aoi.C4p_2, aoi.C5p_2, aoi.O5p_2]);
            m.base.C1p_N1_C2 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C2]);
            m.base.C1p_N1_C6 = measureAngle([aoi.C1p_2, aoi.N1, aoi.C6]);
        } else
            throw new Error('Bad base');
    }

    function prepare(pdbcode: string, bunch: BunchOfAtoms) {
        const at = bunch.current.get(0);
        const compId = at.label_comp_id;
        const aoi = gatherAtomsOfInterest(bunch, compId);

        return new Measurement(
            pdbcode,
            at.pdbx_PDB_model_num,
            at.auth_asym_id,
            at.label_asym_id,
            at.label_comp_id,
            at.auth_seq_id,
            at.pdbx_PDB_ins_code,
            bunch.expandedAltId,
            aoi
        );
    }

    function toPucker(p: any): SugarPucker {
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C3_ENDO)
            return 'C3Endo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C4_EXO)
            return 'C4Exo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_O4_ENDO)
            return 'O4Endo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C1_EXO)
            return 'C1Exo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C2_ENDO)
            return 'C2Endo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C3_EXO)
            return 'C3Exo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C4_ENDO)
            return 'C4Endo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_O4_EXO)
            return 'O4Exo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C1_ENDO)
            return 'C1Endo';
        if (p === jsLLKA.LLKA.SugarPucker.LLKA_C2_EXO)
            return 'C2Exo';

        throw new Error('Unknown sugar pucker');
    }

    export type MaybeLLKAAtom = jsLLKA.LLKAAtom|undefined;
    export type MaybeNumber = number|undefined;

    export type AlphaConformation = 'ScMinus' | 'ScPlus' | 'Ap' | 'Other';
    export type GammaConformation = 'GaucheMinus' | 'GauchePlus' | 'Trans' | 'Other';
    export type ZetaConformation = 'ScMinus' | 'ScPlus' | 'Ap' | 'Other';
    export type ChiConformation = 'Syn' | 'Anti';
    export type SugarPucker = 'C3Endo' | 'C4Exo' | 'O4Endo' | 'C1Exo' | 'C2Endo' | 'C3Exo' | 'C4Endo' | 'O4Exo' | 'C1Endo' | 'C2Exo';

    export class AtomsOfInterest {
        //
        // Backbone
        //
        C3p_1: MaybeLLKAAtom;
        O3p_1: MaybeLLKAAtom;
        P_2: MaybeLLKAAtom;
        O5p_2: MaybeLLKAAtom;
        C5p_2: MaybeLLKAAtom;
        C4p_2: MaybeLLKAAtom;
        C3p_2: MaybeLLKAAtom;
        O3p_2: MaybeLLKAAtom;
        P_3: MaybeLLKAAtom;
        O5p_3: MaybeLLKAAtom;
        C5p_3: MaybeLLKAAtom;

        //
        // Ribose
        //
        O4p_2: MaybeLLKAAtom;
        C1p_2: MaybeLLKAAtom;
        C2p_2: MaybeLLKAAtom;
        // C3' is in backbone
        // C4' is in backbone
        // Only for "oxy"ribose
        O2p_2: MaybeLLKAAtom;

        // Different for purine/pyrimidine bases
        baseA_2: MaybeLLKAAtom;
        baseB_2: MaybeLLKAAtom;

        // Phosphate tetrahedron
        OP1_2: MaybeLLKAAtom;
        OP2_2: MaybeLLKAAtom;

        //
        // Base - extra
        //
        // Common for all bases
        N1: MaybeLLKAAtom;
        C2: MaybeLLKAAtom;
        N3: MaybeLLKAAtom;
        C4: MaybeLLKAAtom;
        C5: MaybeLLKAAtom;
        C6: MaybeLLKAAtom;

        // Common for A/G
        N7: MaybeLLKAAtom;
        C8: MaybeLLKAAtom;
        N9: MaybeLLKAAtom;
        // A only
        N6: MaybeLLKAAtom;
        // G only
        N2: MaybeLLKAAtom;
        O6: MaybeLLKAAtom;

        // Common for C/T/U
        O2: MaybeLLKAAtom;
        // T/U
        O4: MaybeLLKAAtom;
        // T only
        C7: MaybeLLKAAtom;
        // C only
        N4: MaybeLLKAAtom;

        hasCommon() {
            return (
                // Backbone
                this.O5p_2 && this.C5p_2 && this.C4p_2 && this.C3p_2 && this.O3p_2 &&

                // Ribose
                this.O4p_2 && this.C1p_2 && this.C2p_2 &&

                // Chi helpers
                this.baseA_2 && this.baseB_2 &&

                // Base
                this.N1 && this.C2 && this.N3 && this.C4 && this.C5 && this.C6
            );
        }

        private isAG() {
            return this.N7 && this.C8 && this.N9;
        }

        private isCTU() {
            return !!this.O2;
        }

        private isTU() {
            return this.isCTU() && this.O4;
        }

        canLookAhead() {
            return this.P_3 && this.O5p_3 && this.C5p_3;
        }

        canLookBack() {
            return this.C3p_1 && this.O3p_1;
        }

        hasPhosphateTetraherdron() {
            return this.OP1_2 && this.OP2_2 && this.P_2 && this.O3p_1;
        }

        isA() {
            return this.isAG() && this.N6;
        }

        isC() {
            return this.isCTU() && this.N4;
        }

        isG() {
            return this.isAG() && this.N2 && this.O6;
        }

        isT() {
            return this.isTU() && this.C7;
        }

        isU() {
            return this.isTU();
        }

        isOxyribose() {
            return !!this.O2p_2;
        }

        isValid(b: StdBase, isDeoxyribose: boolean) {
            const riboseOk = !isDeoxyribose ? this.isOxyribose() : true;

            switch (b) {
                case 'A':
                case 'DA':
                    return this.isA() && riboseOk;

                case 'C':
                case 'DC':
                    return this.isC() && riboseOk;

                case 'G':
                case 'DG':
                    return this.isG() && riboseOk;

                case 'DT':
                    return this.isT() && riboseOk;

                case 'U':
                    return this.isU() && riboseOk;
            }
        }
    }

    export type ASpecific = {
        base: 'A';

        // Base lengths
        C5_N7: number;
        N7_C8: number;
        C8_N9: number;
        N9_C4: number;
        C6_N6: number;
        // Base angles
        N3_C4_N9: number;
        C6_C5_N7: number;
        C5_C4_N9: number;
        C4_N9_C8: number;
        N9_C8_N7: number;
        C8_N7_C5: number;
        N7_C5_C4: number;
        N6_C6_N1: number;
        N6_C6_C5: number;

        // Ribose lengths
        C1p_N9: number;
        // Ribose angles
        N9_C1p_O4p: number;
        N9_C1p_C2p: number;
        C4p_C5p_O5p: number;
        C1p_N9_C4: number;
        C1p_N9_C8: number;
    };

    export type CSpecific = {
        base: 'C';

        // Base lengths
        C2_O2: number;
        C4_N4: number;
        // Base angles
        O2_C2_N1: number;
        O2_C2_N3: number;
        N4_C4_C5: number;
        N4_C4_N3: number;

        // Ribose lengths
        C1p_N1: number;
        // Ribose angles
        N1_C1p_O4p: number;
        N1_C1p_C2p: number;
        C4p_C5p_O5p: number;
        C1p_N1_C2: number;
        C1p_N1_C6: number;
    };
    export type GSpecific = {
        base: 'G';

        // Base lengths
        C5_N7: number;
        N7_C8: number;
        C8_N9: number;
        N9_C4: number;
        C6_O6: number;
        C2_N2: number;
        // Base angles
        N3_C4_N9: number;
        C6_C5_N7: number;
        C5_C4_N9: number;
        C4_N9_C8: number;
        N9_C8_N7: number;
        C8_N7_C5: number;
        N7_C5_C4: number;
        O6_C6_N1: number;
        O6_C6_C5: number;
        N2_C2_N1: number;
        N2_C2_N3: number;

        // Ribose lengths
        C1p_N9: number;
        // Ribose angles
        N9_C1p_O4p: number;
        N9_C1p_C2p: number;
        C4p_C5p_O5p: number;
        C1p_N9_C4: number;
        C1p_N9_C8: number;
    };
    export type TSpecific = {
        base: 'T';

        // Base lengths
        C2_O2: number;
        C4_O4: number;
        C7_C5: number;
        // Base angles
        O2_C2_N1: number;
        O2_C2_N3: number;
        O4_C4_C5: number;
        O4_C4_N3: number;
        C7_C5_C4: number;
        C7_C5_C6: number;

        // Ribose lengths
        C1p_N1: number;
        // Ribose angles
        N1_C1p_O4p: number;
        N1_C1p_C2p: number;
        C4p_C5p_O5p: number;
        C1p_N1_C2: number;
        C1p_N1_C6: number;
    };
    export type USpecific = {
        base: 'U';

        // Base lengths
        C2_O2: number;
        C4_O4: number;
        // Base angles
        O2_C2_N1: number;
        O2_C2_N3: number;
        O4_C4_C5: number;
        O4_C4_N3: number;

        // Ribose lengths
        C1p_N1: number;
        // Ribose angles
        N1_C1p_O4p: number;
        N1_C1p_C2p: number;
        C4p_C5p_O5p: number;
        C1p_N1_C2: number;
        C1p_N1_C6: number;
    };

    export class Measurement {
        constructor(
            public readonly pdbcode: string,
            public readonly modelNum: number,
            public readonly chain: string,
            public readonly chainId: string,
            public readonly compId: string,
            public readonly seqId: number,
            public readonly insCode: string,
            public readonly altId: string,
            public readonly aoi: AtomsOfInterest
        ) {
            if (this.compId == "A")
                this.stdBase = 'A';
            else if (this.compId == "DA")
                this.stdBase =  'DA';

            else if (this.compId == "C")
                this.stdBase = 'C';
            else if (this.compId == "DC")
                this.stdBase = 'DC';

            else if (this.compId == "G")
                this.stdBase = 'G';
            else if (this.compId == "DG")
                this.stdBase = 'DG';

            else if (this.compId == "DT")
                this.stdBase = 'DT';
            else if (this.compId == "U")
                this.stdBase = 'U';
            else
                throw new Error('Unknown comp_id. This should never happen!');

            this.isDeoxyribose = Common.baseIs(this.stdBase, 'DA', 'DC', 'DG', 'DT');

            this.gamma = 0;
            this.delta = 0;
            this.chi = 0;
            this.gammaConf = 'GaucheMinus';
            this.chiConf = 'Syn';
            this.N1_C2 = 0;
            this.C2_N3 = 0;
            this.N3_C4 = 0;
            this.C4_C5 = 0;
            this.C5_C6 = 0;
            this.C6_N1 = 0;
            this.C6_N1_C2 = 0;
            this.N1_C2_N3 = 0;
            this.C2_N3_C4 = 0;
            this.N3_C4_C5 = 0;
            this.C4_C5_C6 = 0;
            this.C5_C6_N1 = 0;
            this.C1p_C2p = 0;
            this.C2p_C3p = 0;
            this.C3p_C4p = 0;
            this.C4p_O4p = 0;
            this.C1p_O4p = 0;
            this.C4p_C5p = 0;
            this.C2p_O2p = 0; // Undefined for deoxyriboses
            // Angles
            this.C1p_C2p_C3p = 0;
            this.C2p_C3p_C4p = 0;
            this.C3p_C4p_O4p = 0;
            this.C1p_O4p_C4p = 0;
            this.C2p_C1p_O4p = 0;
            this.C2p_C3p_O3p = 0;
            this.C4p_C3p_O3p = 0;
            this.C3p_C4p_C5p = 0;
            this.C5p_C4p_O4p = 0;
            this.C1p_C2p_O2p = 0; // Undefined in deoxyribose
            this.C3p_C2p_O2p = 0; // Undefined in deoxyribose
            // Torsions
            this.theta0 = 0;
            this.theta1 = 0;
            this.theta2 = 0;
            this.theta3 = 0;
            this.theta4 = 0;
            // Pucker geometry
            this.pseudorotation = 0;
            this.tau_max = 0;

            this.base = (() => {
                if (Common.baseIs(this.stdBase, 'A', 'DA'))
                    return ASpecific();
                else if (Common.baseIs(this.stdBase, 'C', 'DC'))
                    return CSpecific();
                else if (Common.baseIs(this.stdBase, 'G', 'DG'))
                    return GSpecific();
                else if (Common.baseIs(this.stdBase, 'DT'))
                    return TSpecific();
                else if (Common.baseIs(this.stdBase, 'U'))
                    return USpecific();
                else
                    return { base: 'none' };
            })();
        }

        //
        // Structure piece ID
        //
        readonly stdBase: StdBase;
        readonly isDeoxyribose: boolean;

        //
        // Geometry
        //
        alpha: MaybeNumber;
        beta: MaybeNumber;
        gamma: number;
        delta: number;
        epsilon: MaybeNumber;
        zeta: MaybeNumber;
        chi: number;
        // Needed to determine reference restraints correctly
        alphaNext: MaybeNumber;
        zetaPrev: MaybeNumber;
        // Assigned conformations
        alphaConf: AlphaConformation|undefined;
        alphaNextConf: AlphaConformation|undefined;
        gammaConf: GammaConformation;
        zetaConf: ZetaConformation|undefined;
        zetaPrevConf: ZetaConformation|undefined
        chiConf: ChiConformation;

        //
        // PO4
        //
        // Lengths
        OP1_P: MaybeNumber;
        OP2_P: MaybeNumber;
        O3p_P: MaybeNumber;
        O5p_P: MaybeNumber;
        O3p_C3p: MaybeNumber;
        O5p_C5p: MaybeNumber;
        // Angles
        OP1_P_OP2: MaybeNumber;
        OP1_P_O3p: MaybeNumber;
        OP1_P_O5p: MaybeNumber;
        OP2_P_O3p: MaybeNumber;
        OP2_P_O5p: MaybeNumber;
        O3p_P_O5p: MaybeNumber;
        P_O3p_C3p: MaybeNumber;
        P_O5p_C5p: MaybeNumber;

        //
        // Base
        //
        // Lengths
        N1_C2: number;
        C2_N3: number;
        N3_C4: number;
        C4_C5: number;
        C5_C6: number;
        C6_N1: number;
        // Angles
        C6_N1_C2: number;
        N1_C2_N3: number;
        C2_N3_C4: number;
        N3_C4_C5: number;
        C4_C5_C6: number;
        C5_C6_N1: number;

        base: ASpecific | CSpecific | GSpecific | TSpecific | USpecific | { base: 'none' };

        //
        // Ribose
        //
        // Lengths
        C1p_C2p: number;
        C2p_C3p: number;
        C3p_C4p: number;
        C4p_O4p: number;
        C1p_O4p: number;
        C4p_C5p: number;
        C2p_O2p: number; // Undefined for deoxyriboses
        // Angles
        C1p_C2p_C3p: number;
        C2p_C3p_C4p: number;
        C3p_C4p_O4p: number;
        C1p_O4p_C4p: number;
        C2p_C1p_O4p: number;
        C2p_C3p_O3p: number;
        C4p_C3p_O3p: number;
        C3p_C4p_C5p: number;
        C5p_C4p_O4p: number;
        C1p_C2p_O2p: number; // Undefined in deoxyribose
        C3p_C2p_O2p: number; // Undefined in deoxyribose
        // Torsions
        theta0: number;
        theta1: number;
        theta2: number;
        theta3: number;
        theta4: number;
        // Pucker geometry
        pseudorotation: number;
        tau_max: number;
        pucker: SugarPucker|undefined;
    };

    export function isA(base: Measurement['base']): base is ASpecific {
        return base.base === 'A';
    }
    export function isC(base: Measurement['base']): base is CSpecific {
        return base.base === 'C';
    }
    export function isG(base: Measurement['base']): base is GSpecific {
        return base.base === 'G';
    }
    export function isT(base: Measurement['base']): base is TSpecific {
        return base.base === 'T';
    }
    export function isU(base: Measurement['base']): base is USpecific {
        return base.base === 'U';
    }

    export function measure(pdbcode: string, bunch: BunchOfAtoms) {
        const m = prepare(pdbcode, bunch);
        if (!m.aoi.isValid(m.stdBase, m.isDeoxyribose))
            return void 0;

        measureBase(m);
        measureGeometry(m, bunch);
        measurePO4(m);
        measureSugar(m);

        return m;
    }
}
