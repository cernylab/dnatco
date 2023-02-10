export type Atom = [name: string, shift: 0 | -1];

const Adenine = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["N6", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N7", 0], ["N1", 0], ["C3'", 0], ["C8", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0], ["N9", 0],
    ["O3'", -1],
] as Atom[];

const Cytidine = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["N4", 0], ["C5'", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

const Guanosine = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["N2", 0], ["C5'", 0], ["OP2", 0], ["C1'", 0], ["O6", 0], ["O3'", 0], ["N7", 0], ["N1", 0], ["C3'", 0], ["C8", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0], ["N9", 0],
    ["O3'", -1],
] as Atom[];

const Uracil = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["O4", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

const Thymine = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["C7", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["O4", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

export const Atoms = {
    'A': Adenine,
    'DA': Adenine,
    'C': Cytidine,
    'DC': Cytidine,
    'G': Guanosine,
    'DG': Guanosine,
    'DT': Thymine,
    'U': Uracil,
};

const ShiftSuffix = 'r2';

export function isShiftedName(name: string) {
    return name.endsWith(ShiftSuffix);
}

export function shiftedName(name: string, shift: 0 | -1) {
    return shift === 0 ? name : name + ShiftSuffix;
}

export function unshiftName(name: string) {
    return name.substring(0, name.length - ShiftSuffix.length);
}
