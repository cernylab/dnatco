import { isPdbId } from '../../util';
import { fromTemplate, isArr, isInt, isNum, isObj, isStr } from '../../util/json';

export const _WireReferenceSets = {
    rs: {
        bins: [] as Reference[],
    }
};
export type WireReferenceSets = {
    rs: {
        bins: References[],
    }
}
export type References = Reference[];

//
// We are expecting a hardcoded schema of the Reference tuple while
// the source kind of assumes that it could be dynamic.
// Implementation of a dynamic parser would be a lot more work that is
// absolutely unnecessary to make this work for now.
//
export type Reference = [
    number, // Value
    string, // entry_id
    number, // pdbx_PDB_model_numb er
    string, // auth_asym_id
    string, // auth_comp_id
    string, // label_alt_id
    number, // auth_seq_id
    string, // pdbx_PDB_ins_code
];

export function isWireReferenceSets(v: unknown): v is WireReferenceSets {
    if (!isObj(v)) return false;
    const rs = fromTemplate(v, _WireReferenceSets);
    if (!rs) return false;

    return isArr(rs.rs.bins, (x): x is Reference => {
        if (!Array.isArray(x)) return false;

        for (const item of x) {
            if (item.length !== 8) return false;

            const typesOk = (
                isNum(item[0]) &&
                isStr(item[1]) &&
                isInt(item[2]) &&
                isStr(item[3]) &&
                isStr(item[4]) &&
                isStr(item[5]) &&
                isInt(item[6]) &&
                isStr(item[7])
            );
            if (!typesOk) return false;

            if (!isPdbId(item[1])) return false;
        }

        return true;
    });
}
