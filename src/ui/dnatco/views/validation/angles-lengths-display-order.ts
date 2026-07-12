import { shiftedName } from "../../../../dnatco/angles-lengths/atoms";
import { tripletTag } from "../../../../dnatco/angles-lengths/angles";
import { pairTag } from "../../../../dnatco/angles-lengths/lengths";
import { ElementaryResidue } from "../../../../dnatco/angles-lengths";

const DeoxyRiboseRingAnglesOrder = [
    tripletTag(["C4'", "O4'", "C1'"]),
    tripletTag(["O4'", "C1'", "C2'"]),
    tripletTag(["C1'", "C2'", "C3'"]),
    tripletTag(["C2'", "C3'", "C4'"]),
    tripletTag(["C3'", "C4'", "O4'"]),
];

const BackboneAnglesOrder = [
    tripletTag([shiftedName("C3'", -1), shiftedName("O3'", -1), "P"]),
    tripletTag([shiftedName("O3'", -1), "P", "O5'"]),
    tripletTag([shiftedName("O3'", -1), "P", "OP1"]),
    tripletTag([shiftedName("O3'", -1), "P", "OP2"]),
    tripletTag(["O5'", "P", "OP1"]),
    tripletTag(["O5'", "P", "OP2"]),
    tripletTag(["OP1", "P", "OP2"]),
    tripletTag(["P", "O5'", "C5'"]),
    tripletTag(["O5'", "C5'", "C4'"]),
    tripletTag(["C5'", "C4'", "C3'"]),
    tripletTag(["C4'", "C3'", "O3'"]),
    tripletTag(["C2'", "C3'", "O3'"]),
    tripletTag(["C5'", "C4'", "O4'"]),
    tripletTag(["C4'", "C5'", "O5'"]),
];

const RiboseRingAnglesOrder = [
    ...DeoxyRiboseRingAnglesOrder,
    tripletTag(["C3'", "C2'", "O2'"]),
    tripletTag(["C1'", "C2'", "O2'"]),
];

const AdenineOnlyAnglesOrder = [
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["C6", "C5", "N7"]),
    tripletTag(["O4'", "C1'", "N9"]),
    tripletTag(["C1'", "N9", "C8"]),
    tripletTag(["N7", "C8", "N9"]),
    tripletTag(["C5", "N7", "C8"]),
    tripletTag(["C4", "C5", "N7"]),
    tripletTag(["N1", "C6", "C5"]),
    tripletTag(["N1", "C6", "N6"]),
    tripletTag(["N6", "C6", "C5"]),
    tripletTag(["C2", "N1", "C6"]),
    tripletTag(["N3", "C2", "N1"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N9", "C4", "C5"]),
    tripletTag(["C8", "N9", "C4"]),
    tripletTag(["C1'", "N9", "C4"]),
    tripletTag(["C2'", "C1'", "N9"]),
];

const AdenineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    ...AdenineOnlyAnglesOrder,
];

const deoxyAdenineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...DeoxyRiboseRingAnglesOrder,
    ...AdenineOnlyAnglesOrder,
];

const CytidineOnlyAnglesOrder = [
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N4", "C4", "C5"]),
    tripletTag(["N3", "C4", "N4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),
];

const CytidineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    ...CytidineOnlyAnglesOrder,
];

const deoxyCytidineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...DeoxyRiboseRingAnglesOrder,
    ...CytidineOnlyAnglesOrder,
];

const GuanosineOnlyAnglesOrder = [
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["C6", "C5", "N7"]),
    tripletTag(["O4'", "C1'", "N9"]),
    tripletTag(["C1'", "N9", "C8"]),
    tripletTag(["N7", "C8", "N9"]),
    tripletTag(["C5", "N7", "C8"]),
    tripletTag(["C4", "C5", "N7"]),
    tripletTag(["N1", "C6", "C5"]),
    tripletTag(["O6", "C6", "C5"]),
    tripletTag(["N1", "C6", "O6"]),
    tripletTag(["C2", "N1", "C6"]),
    tripletTag(["N3", "C2", "N1"]),
    tripletTag(["N2", "C2", "N1"]),
    tripletTag(["N3", "C2", "N2"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["N9", "C4", "C5"]),
    tripletTag(["C8", "N9", "C4"]),
    tripletTag(["C1'", "N9", "C4"]),
    tripletTag(["C2'", "C1'", "N9"]),
];

const GuanosineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    ...GuanosineOnlyAnglesOrder,
];

const deoxyGuanosineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...DeoxyRiboseRingAnglesOrder,
    ...GuanosineOnlyAnglesOrder,
];

const ThymineOnlyAnglesOrder = [
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["C7", "C5", "C6"]),
    tripletTag(["C4", "C5", "C7"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["O4", "C4", "C5"]),
    tripletTag(["N3", "C4", "O4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),
];

const ThymineAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    ...ThymineOnlyAnglesOrder,
];

const UracilOnlyAnglesOrder = [
    tripletTag(["O4'", "C1'", "N1"]),
    tripletTag(["C1'", "N1", "C6"]),
    tripletTag(["C5", "C6", "N1"]),
    tripletTag(["C4", "C5", "C6"]),
    tripletTag(["N3", "C4", "C5"]),
    tripletTag(["O4", "C4", "C5"]),
    tripletTag(["N3", "C4", "O4"]),
    tripletTag(["C2", "N3", "C4"]),
    tripletTag(["N1", "C2", "N3"]),
    tripletTag(["O2", "C2", "N3"]),
    tripletTag(["N1", "C2", "O2"]),
    tripletTag(["C1'", "N1", "C2"]),
    tripletTag(["C2'", "C1'", "N1"]),
]

const UracilAnglesOrder = [
    ...BackboneAnglesOrder,
    ...RiboseRingAnglesOrder,
    ...UracilOnlyAnglesOrder,
];

const deoxyUracilAnglesOrder = [
    ...BackboneAnglesOrder,
    ...DeoxyRiboseRingAnglesOrder,
    ...UracilOnlyAnglesOrder,
];

const BackboneLengthsOrder = [
    pairTag([shiftedName("O3'", -1), "P"]),
    pairTag(["P", "OP1"]),
    pairTag(["P", "OP2"]),
    pairTag(["P", "O5'"]),
    pairTag(["O5'", "C5'"]),
    pairTag(["C5'", "C4'"]),
    pairTag(["C4'", "C3'"]),
    pairTag(["C3'", "O3'"]),
];

const DeoxyRiboseRingLengthsOrder = [
    pairTag(["C4'", "O4'"]),
    pairTag(["O4'", "C1'"]),
    pairTag(["C1'", "C2'"]),
    pairTag(["C2'", "C3'"]),
];

const RiboseRingLengthsOrder = [
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C2'", "O2'"]),
];

const DeoxyAdenineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "N6"]),
    pairTag(["N1", "C6"]),
    pairTag(["N9", "C4"]),
    pairTag(["C2", "N1"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const AdenineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "N6"]),
    pairTag(["N1", "C6"]),
    pairTag(["N9", "C4"]),
    pairTag(["C2", "N1"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const CytidineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "N4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const DeoxyCytidineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "N4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const GuanosineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "O6"]),
    pairTag(["N1", "C6"]),
    pairTag(["N9", "C4"]),
    pairTag(["C2", "N1"]),
    pairTag(["C2", "N2"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const DeoxyGuanosineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C1'", "N9"]),
    pairTag(["C8", "N9"]),
    pairTag(["N7", "C8"]),
    pairTag(["C5", "N7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C6", "C5"]),
    pairTag(["C6", "O6"]),
    pairTag(["N1", "C6"]),
    pairTag(["N9", "C4"]),
    pairTag(["C2", "N1"]),
    pairTag(["C2", "N2"]),
    pairTag(["N3", "C2"]),
    pairTag(["C4", "N3"]),
];

const UracilLengthsOrder = [
    ...BackboneLengthsOrder,
    ...RiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "O4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const DeoxyUracilLengthsOrder = [
    ...BackboneLengthsOrder,
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "O4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

const DeoxyThymineLengthsOrder = [
    ...BackboneLengthsOrder,
    ...DeoxyRiboseRingLengthsOrder,
    pairTag(["C1'", "N1"]),
    pairTag(["C6", "N1"]),
    pairTag(["C5", "C6"]),
    pairTag(["C5", "C7"]),
    pairTag(["C4", "C5"]),
    pairTag(["C4", "O4"]),
    pairTag(["N3", "C4"]),
    pairTag(["C2", "N3"]),
    pairTag(["C2", "O2"]),
    pairTag(["N1", "C2"]),
];

export namespace AnglesLengthsDisplayOrder {
    export const Angles: Record<ElementaryResidue, string[]> = {
        A: AdenineAnglesOrder,
        C: CytidineAnglesOrder,
        G: GuanosineAnglesOrder,
        U: UracilAnglesOrder,
        DA: deoxyAdenineAnglesOrder,
        DC: deoxyCytidineAnglesOrder,
        DG: deoxyGuanosineAnglesOrder,
        DT: ThymineAnglesOrder,
        DU: deoxyUracilAnglesOrder,
    } as const;

    export const Lengths: Record<ElementaryResidue, string[]> = {
        A: AdenineLengthsOrder,
        C: CytidineLengthsOrder,
        G: GuanosineLengthsOrder,
        U: UracilLengthsOrder,
        DA: DeoxyAdenineLengthsOrder,
        DC: DeoxyCytidineLengthsOrder,
        DG: DeoxyGuanosineLengthsOrder,
        DT: DeoxyThymineLengthsOrder,
        DU: DeoxyUracilLengthsOrder,
    } as const;
}
