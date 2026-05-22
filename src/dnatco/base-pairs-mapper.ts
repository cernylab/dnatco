import { Cif } from '../cif';
import {
    NdbBasePairList_Schema,
    NdbBasePairAnnotation_Schema,
    NdbBasePairValidation_Schema,
    NdbBaseUnpairedList_Schema,
} from '../cif/categories/ndb-base-pair';

export type BasePairValidation = {
    napairRmsd: number,
    napascoMetric: number | null,
    napascoAnnotation: string,
    nearestCuratedBP: string,
};

export type UnpairedResidue = {
    model: number,
    asymId: string,
    seqId: number,
    compId: string,
    altId: string,
    insCode: string,
    authAsymId: string,
    authSeqId: number,
};

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
    // Annotation (both sources)
    orientation: string,
    base1Edge: string,
    base2Edge: string,
    lwFamilyNum: number | null,
    lwFamily: string,   // l-w_family (FR3D) or l-w_family_name (NAPAIR), e.g. "cWW"
    family: string,     // class, e.g. "cWW_G-C"
    subclass: string,   // subclass (FR3D) or sub_class (NAPAIR)
    // Validation metrics (NAPAIR-only, null for FR3D)
    validation: BasePairValidation | null,
};

export namespace BasePairsMapper {
    export type Mapping = {
        readonly pairs: BasePair[],
        readonly byId: Map<number, number>,  // base_pair_id -> index into pairs
        readonly unpaired: UnpairedResidue[], // explicit (NAPAIR) or empty (FR3D - derive externally)
    };

    export function Mapping(): Mapping {
        return { pairs: [], byId: new Map(), unpaired: [] };
    }

    // ── internal helpers ──────────────────────────────────────────────────────

    function buildIndex<S extends Record<string, any>>(
        table: Cif.Table<S>,
        col: Cif.Column<number>
    ): Map<number, number> {
        const idx = new Map<number, number>();
        for (let row = 0; row < table._rowCount; row++) {
            const id = Cif.Column.value(col, row);
            if (id !== null) idx.set(id, row);
        }
        return idx;
    }

    function readAnnotation(
        id: number,
        annotations: Cif.Table<NdbBasePairAnnotation_Schema>,
        annIdx: Map<number, number>,
        isNapair: boolean,
    ) {
        const row = annIdx.get(id);
        if (row === undefined) {
            return {
                orientation: '', base1Edge: '', base2Edge: '',
                lwFamilyNum: null, lwFamily: '', family: '-', subclass: '',
            };
        }
        return {
            orientation: Cif.Column.value(annotations.orientation, row) ?? '',
            base1Edge: Cif.Column.value(annotations.base_1_edge, row) ?? '',
            base2Edge: Cif.Column.value(annotations.base_2_edge, row) ?? '',
            lwFamilyNum: Cif.Column.value(annotations['l-w_family_num'], row),
            lwFamily: isNapair
                ? Cif.Column.value(annotations['l-w_family_name'], row) ?? ''
                : Cif.Column.value(annotations['l-w_family'], row) ?? '',
            family: Cif.Column.value(annotations.class, row) ?? '-',
            subclass: isNapair
                ? Cif.Column.value(annotations.sub_class, row) ?? ''
                : Cif.Column.value(annotations.subclass, row) ?? '',
        };
    }

    function readValidation(
        id: number,
        validation: Cif.Table<NdbBasePairValidation_Schema>,
        valIdx: Map<number, number>,
    ): BasePairValidation | null {
        const row = valIdx.get(id);
        if (row === undefined) return null;
        return {
            napairRmsd: Cif.Column.value(validation.napair_rmsd, row) ?? 0,
            napascoMetric: Cif.Column.value(validation.napasco_metric, row),
            napascoAnnotation: Cif.Column.value(validation.napasco_annotation, row) ?? '',
            nearestCuratedBP: Cif.Column.value(validation.nearest_curated_BP, row) ?? '',
        };
    }

    // ── public API ────────────────────────────────────────────────────────────

    /**
     * Build a Mapping from the raw CIF tables.
     *
     * Handles both FR3D (legacy) and NAPAIR (new) formats automatically — the
     * source is detected by checking which primary-key column is populated.
     *
     * validation and unpairedTable are NAPAIR-only; pass undefined for FR3D.
     */
    export function map(
        list: Cif.Table<NdbBasePairList_Schema>,
        annotations: Cif.Table<NdbBasePairAnnotation_Schema>,
        validation?: Cif.Table<NdbBasePairValidation_Schema>,
        unpairedTable?: Cif.Table<NdbBaseUnpairedList_Schema>,
    ): Mapping {
        const pairs: BasePair[] = [];
        const byId = new Map<number, number>();

        const isNapair = Cif.Column.hasValues(list.id);
        const annIdx = buildIndex(annotations, annotations.base_pair_id);
        const valIdx = validation ? buildIndex(validation, validation.base_pair_id) : new Map<number, number>();

        for (let row = 0; row < list._rowCount; row++) {
            const id = isNapair
                ? Cif.Column.value(list.id, row)!
                : Cif.Column.value(list.base_pair_id, row)!;

            pairs.push({
                id,
                model: isNapair
                    ? Cif.Column.value(list.PDB_model_num, row)!
                    : Cif.Column.value(list.PDB_model_number, row)!,
                // Residue 1
                asymId1: isNapair
                    ? Cif.Column.value(list.label_asym_id_1, row)!
                    : Cif.Column.value(list.asym_id_1, row)!,
                seqId1: isNapair
                    ? Cif.Column.value(list.label_seq_id_1, row)!
                    : Cif.Column.value(list.seq_id_1, row)!,
                compId1: isNapair
                    ? Cif.Column.value(list.label_comp_id_1, row)!
                    : Cif.Column.value(list.comp_id_1, row)!,
                insCode1: Cif.Column.value(list.PDB_ins_code_1, row) ?? '',
                altId1: isNapair
                    ? Cif.Column.value(list.label_alt_id_1, row) ?? ''
                    : Cif.Column.value(list.alt_id_1, row) ?? '',
                authAsymId1: Cif.Column.value(list.auth_asym_id_1, row)!,
                authSeqId1: Cif.Column.value(list.auth_seq_id_1, row)!,
                // Residue 2
                asymId2: isNapair
                    ? Cif.Column.value(list.label_asym_id_2, row)!
                    : Cif.Column.value(list.asym_id_2, row)!,
                seqId2: isNapair
                    ? Cif.Column.value(list.label_seq_id_2, row)!
                    : Cif.Column.value(list.seq_id_2, row)!,
                compId2: isNapair
                    ? Cif.Column.value(list.label_comp_id_2, row)!
                    : Cif.Column.value(list.comp_id_2, row)!,
                insCode2: Cif.Column.value(list.PDB_ins_code_2, row) ?? '',
                altId2: isNapair
                    ? Cif.Column.value(list.label_alt_id_2, row) ?? ''
                    : Cif.Column.value(list.alt_id_2, row) ?? '',
                authAsymId2: Cif.Column.value(list.auth_asym_id_2, row)!,
                authSeqId2: Cif.Column.value(list.auth_seq_id_2, row)!,
                // Annotation
                ...readAnnotation(id, annotations, annIdx, isNapair),
                // Validation
                validation: validation ? readValidation(id, validation, valIdx) : null,
            });

            byId.set(id, pairs.length - 1);
        }

        const unpaired: UnpairedResidue[] = [];
        if (unpairedTable) {
            for (let row = 0; row < unpairedTable._rowCount; row++) {
                unpaired.push({
                    model: Cif.Column.value(unpairedTable.PDB_model_num, row)!,
                    asymId: Cif.Column.value(unpairedTable.label_asym_id, row)!,
                    seqId: Cif.Column.value(unpairedTable.label_seq_id, row)!,
                    compId: Cif.Column.value(unpairedTable.label_comp_id, row)!,
                    altId: Cif.Column.value(unpairedTable.label_alt_id, row) ?? '',
                    insCode: Cif.Column.value(unpairedTable.PDB_ins_code, row) ?? '',
                    authAsymId: Cif.Column.value(unpairedTable.auth_asym_id, row)!,
                    authSeqId: Cif.Column.value(unpairedTable.auth_seq_id, row)!,
                });
            }
        }

        return { pairs, byId, unpaired };
    }

    // ── lookup functions — callers supply the Mapping ─────────────────────────

    export function byId(mapping: Mapping, id: number): BasePair | undefined {
        const idx = mapping.byId.get(id);
        return idx !== undefined ? mapping.pairs[idx] : undefined;
    }

    export function findByResidues(
        mapping: Mapping,
        asymId1: string, seqId1: number, insCode1: string,
        asymId2: string, seqId2: number, insCode2: string,
        altId1?: string,
        altId2?: string
    ): BasePair | undefined {
        return mapping.pairs.find(bp =>
            (bp.asymId1 === asymId1 && bp.seqId1 === seqId1 && bp.insCode1 === insCode1 &&
             bp.asymId2 === asymId2 && bp.seqId2 === seqId2 && bp.insCode2 === insCode2 &&
             (altId1 === undefined || bp.altId1 === altId1) &&
             (altId2 === undefined || bp.altId2 === altId2)) ||
            (bp.asymId1 === asymId2 && bp.seqId1 === seqId2 && bp.insCode1 === insCode2 &&
             bp.asymId2 === asymId1 && bp.seqId2 === seqId1 && bp.insCode2 === insCode1 &&
             (altId1 === undefined || bp.altId2 === altId1) &&
             (altId2 === undefined || bp.altId1 === altId2))
        );
    }

    export function byAuthSeqIds(
        mapping: Mapping,
        model: number,
        authSeqId1: number,
        authSeqId2: number
    ): BasePair | undefined {
        return mapping.pairs.find(bp =>
            bp.model === model &&
            ((bp.authSeqId1 === authSeqId1 && bp.authSeqId2 === authSeqId2) ||
             (bp.authSeqId1 === authSeqId2 && bp.authSeqId2 === authSeqId1))
        );
    }

    /**
     * Parse base pair name from URL parameter and find matching base pair.
     * Format: {pdbid}[-mX]_{chain1}_{comp1}[.{altId1}]_{seqId1}[.{insCode1}]_{chain2}_{comp2}[.{altId2}]_{seqId2}[.{insCode2}]
     * Example: 4qvi_B_U_2109_B_A_2125 or 4qvi-m2_B_U.B_2109.A_B_A.C_2125.D
     */
    export function byName(mapping: Mapping, name: string): BasePair | undefined {
        const parts = name.split('_');
        if (parts.length !== 7) {
            console.warn(`Invalid basePair format: ${name}. Expected 7 underscore-separated parts.`);
            return undefined;
        }

        const pdbidWithModel = parts[0];
        let model = 1;
        const modelMatch = pdbidWithModel.match(/^(.+)-m(\d+)$/);
        if (modelMatch) {
            model = parseInt(modelMatch[2]);
            if (isNaN(model)) {
                console.warn(`Invalid model number in basePair: ${pdbidWithModel}`);
                return undefined;
            }
        }

        const authChain1 = parts[1];
        const comp1WithAltId = parts[2];
        const seqId1WithInsCode = parts[3];
        const authChain2 = parts[4];
        const comp2WithAltId = parts[5];
        const seqId2WithInsCode = parts[6];

        const parseCompound = (compWithAltId: string) => {
            const dotIdx = compWithAltId.indexOf('.');
            if (dotIdx > 0)
                return { compound: compWithAltId.substring(0, dotIdx), altId: compWithAltId.substring(dotIdx + 1) };
            return { compound: compWithAltId, altId: '' };
        };

        const parseSeqId = (seqIdWithInsCode: string) => {
            const dotIdx = seqIdWithInsCode.indexOf('.');
            if (dotIdx > 0)
                return { authSeqId: parseInt(seqIdWithInsCode.substring(0, dotIdx)), insCode: seqIdWithInsCode.substring(dotIdx + 1) };
            return { authSeqId: parseInt(seqIdWithInsCode), insCode: '' };
        };

        const res1Comp = parseCompound(comp1WithAltId);
        const res1Seq = parseSeqId(seqId1WithInsCode);
        const res2Comp = parseCompound(comp2WithAltId);
        const res2Seq = parseSeqId(seqId2WithInsCode);

        if (isNaN(res1Seq.authSeqId) || isNaN(res2Seq.authSeqId)) {
            console.warn(`Invalid sequence IDs in basePair: ${seqId1WithInsCode}, ${seqId2WithInsCode}`);
            return undefined;
        }

        return mapping.pairs.find(bp =>
            bp.model === model && (
                (bp.authAsymId1 === authChain1 && bp.authSeqId1 === res1Seq.authSeqId &&
                 bp.compId1 === res1Comp.compound && bp.altId1 === res1Comp.altId &&
                 bp.insCode1 === res1Seq.insCode &&
                 bp.authAsymId2 === authChain2 && bp.authSeqId2 === res2Seq.authSeqId &&
                 bp.compId2 === res2Comp.compound && bp.altId2 === res2Comp.altId &&
                 bp.insCode2 === res2Seq.insCode) ||
                (bp.authAsymId1 === authChain2 && bp.authSeqId1 === res2Seq.authSeqId &&
                 bp.compId1 === res2Comp.compound && bp.altId1 === res2Comp.altId &&
                 bp.insCode1 === res2Seq.insCode &&
                 bp.authAsymId2 === authChain1 && bp.authSeqId2 === res1Seq.authSeqId &&
                 bp.compId2 === res1Comp.compound && bp.altId2 === res1Comp.altId &&
                 bp.insCode2 === res1Seq.insCode)
            )
        );
    }
}
