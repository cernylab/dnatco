import { Dnatcofication } from './dnatcofication';
import { Cif } from '../cif';
import { NdbBasePairList_Schema, NdbBasePairAnnotation_Schema } from '../cif/categories/ndb-base-pair';

export type BasePair = {
    id: number,
    model: number,
    // Residue 1 (label/cif - for Molstar)
    asymId1: string,
    seqId1: number,
    compId1: string,
    insCode1: string,
    altId1: string,
    // Residue 1 (auth - for display)
    authAsymId1: string,
    authSeqId1: number,
    // Residue 2 (label/cif - for Molstar)
    asymId2: string,
    seqId2: number,
    compId2: string,
    insCode2: string,
    altId2: string,
    // Residue 2 (auth - for display)
    authAsymId2: string,
    authSeqId2: number,
    // Annotation
    family: string,
};

export namespace BasePairsMapper {
    export type Mapping = {
        readonly pairs: BasePair[],
        readonly byId: Map<number, number>,  // base_pair_id -> array index
    };

    export function Mapping(): Mapping {
        return {
            pairs: [],
            byId: new Map(),
        };
    }

    function findAnnotation(
        basePairId: number,
        annotations: Cif.Table<NdbBasePairAnnotation_Schema>
    ): string {
        for (let row = 0; row < annotations._rowCount; row++) {
            if (Cif.Column.value(annotations.base_pair_id, row) === basePairId) {
                return Cif.Column.value(annotations.class, row) ?? '-';
            }
        }
        return '-';
    }

    export function map(
        list: Cif.Table<NdbBasePairList_Schema>,
        annotations: Cif.Table<NdbBasePairAnnotation_Schema>
    ): Mapping {
        const pairs: BasePair[] = [];
        const byId = new Map<number, number>();

        for (let row = 0; row < list._rowCount; row++) {
            const id = Cif.Column.value(list.base_pair_id, row)!;

            pairs.push({
                id,
                model: Cif.Column.value(list.PDB_model_number, row)!,
                // Residue 1
                asymId1: Cif.Column.value(list.asym_id_1, row)!,
                seqId1: Cif.Column.value(list.seq_id_1, row)!,
                compId1: Cif.Column.value(list.comp_id_1, row)!,
                insCode1: Cif.Column.value(list.PDB_ins_code_1, row) ?? '',
                altId1: Cif.Column.value(list.alt_id_1, row) ?? '',
                authAsymId1: Cif.Column.value(list.auth_asym_id_1, row)!,
                authSeqId1: Cif.Column.value(list.auth_seq_id_1, row)!,
                // Residue 2
                asymId2: Cif.Column.value(list.asym_id_2, row)!,
                seqId2: Cif.Column.value(list.seq_id_2, row)!,
                compId2: Cif.Column.value(list.comp_id_2, row)!,
                insCode2: Cif.Column.value(list.PDB_ins_code_2, row) ?? '',
                altId2: Cif.Column.value(list.alt_id_2, row) ?? '',
                authAsymId2: Cif.Column.value(list.auth_asym_id_2, row)!,
                authSeqId2: Cif.Column.value(list.auth_seq_id_2, row)!,
                // Annotation
                family: findAnnotation(id, annotations),
            });

            byId.set(id, pairs.length - 1);
        }

        return { pairs, byId };
    }

    export function byId(d: Dnatcofication, id: number): BasePair | undefined {
        const idx = d.data.basePairs.byId.get(id);
        return idx !== undefined ? d.data.basePairs.pairs[idx] : undefined;
    }

    export function findByResidues(
        d: Dnatcofication,
        asymId1: string, seqId1: number, insCode1: string,
        asymId2: string, seqId2: number, insCode2: string
    ): BasePair | undefined {
        return d.data.basePairs.pairs.find(bp =>
            (bp.asymId1 === asymId1 && bp.seqId1 === seqId1 && bp.insCode1 === insCode1 &&
             bp.asymId2 === asymId2 && bp.seqId2 === seqId2 && bp.insCode2 === insCode2) ||
            (bp.asymId1 === asymId2 && bp.seqId1 === seqId2 && bp.insCode1 === insCode2 &&
             bp.asymId2 === asymId1 && bp.seqId2 === seqId1 && bp.insCode2 === insCode1)
        );
    }

    export function byAuthSeqIds(
        d: Dnatcofication,
        model: number,
        authSeqId1: number,
        authSeqId2: number
    ): BasePair | undefined {
        return d.data.basePairs.pairs.find(bp =>
            bp.model === model &&
            ((bp.authSeqId1 === authSeqId1 && bp.authSeqId2 === authSeqId2) ||
             (bp.authSeqId1 === authSeqId2 && bp.authSeqId2 === authSeqId1))
        );
    }
}
