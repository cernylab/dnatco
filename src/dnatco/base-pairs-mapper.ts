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
        asymId2: string, seqId2: number, insCode2: string,
        altId1?: string,
        altId2?: string
    ): BasePair | undefined {
        return d.data.basePairs.pairs.find(bp =>
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

    /**
     * Parse base pair name from URL parameter and find matching base pair
     * Format: {pdbid}[-mX]_{chain1}_{comp1}[.{altId1}]_{seqId1}[.{insCode1}]_{chain2}_{comp2}[.{altId2}]_{seqId2}[.{insCode2}]
     * Example: 4qvi_B_U_2109_B_A_2125 or 4qvi-m2_B_U.B_2109.A_B_A.C_2125.D (for model 2, with altIds and insCodes)
     * Model 1 is implicit (no suffix), other models use -mX suffix
     */
    export function byName(d: Dnatcofication, name: string): BasePair | undefined {
        const parts = name.split('_');
        if (parts.length !== 7) {
            console.warn(`Invalid basePair format: ${name}. Expected 7 underscore-separated parts.`);
            return undefined;
        }

        // Parse pdbid[-mX] to extract model number
        const pdbidWithModel = parts[0];
        let model = 1; // Default to model 1
        const modelMatch = pdbidWithModel.match(/^(.+)-m(\d+)$/);
        if (modelMatch) {
            model = parseInt(modelMatch[2]);
            if (isNaN(model)) {
                console.warn(`Invalid model number in basePair: ${pdbidWithModel}`);
                return undefined;
            }
        }

        // Parse first residue: chain1_comp1[.altId1]_seqId1[.insCode1]
        const authChain1 = parts[1];
        const comp1WithAltId = parts[2];    // e.g., "U", "U.B" (altId=B)
        const seqId1WithInsCode = parts[3]; // e.g., "2109", "2109.A" (insCode=A)

        // Parse second residue: chain2_comp2[.altId2]_seqId2[.insCode2]
        const authChain2 = parts[4];
        const comp2WithAltId = parts[5];
        const seqId2WithInsCode = parts[6];

        // Extract compound and altId (format: compound[.altId])
        const parseCompound = (compWithAltId: string) => {
            const dotIdx = compWithAltId.indexOf('.');
            if (dotIdx > 0) {
                return {
                    compound: compWithAltId.substring(0, dotIdx),
                    altId: compWithAltId.substring(dotIdx + 1)
                };
            }
            return { compound: compWithAltId, altId: '' };
        };

        // Extract seqId and insCode (format: seqId[.insCode])
        const parseSeqId = (seqIdWithInsCode: string) => {
            const dotIdx = seqIdWithInsCode.indexOf('.');
            if (dotIdx > 0) {
                const authSeqId = parseInt(seqIdWithInsCode.substring(0, dotIdx));
                return {
                    authSeqId,
                    insCode: seqIdWithInsCode.substring(dotIdx + 1)
                };
            }
            return {
                authSeqId: parseInt(seqIdWithInsCode),
                insCode: ''
            };
        };

        const res1Comp = parseCompound(comp1WithAltId);
        const res1Seq = parseSeqId(seqId1WithInsCode);
        const res2Comp = parseCompound(comp2WithAltId);
        const res2Seq = parseSeqId(seqId2WithInsCode);

        if (isNaN(res1Seq.authSeqId) || isNaN(res2Seq.authSeqId)) {
            console.warn(`Invalid sequence IDs in basePair: ${seqId1WithInsCode}, ${seqId2WithInsCode}`);
            return undefined;
        }

        // Find matching base pair
        return d.data.basePairs.pairs.find(bp =>
            bp.model === model && (
                // Forward match
                (bp.authAsymId1 === authChain1 && bp.authSeqId1 === res1Seq.authSeqId &&
                 bp.compId1 === res1Comp.compound && bp.altId1 === res1Comp.altId &&
                 bp.insCode1 === res1Seq.insCode &&
                 bp.authAsymId2 === authChain2 && bp.authSeqId2 === res2Seq.authSeqId &&
                 bp.compId2 === res2Comp.compound && bp.altId2 === res2Comp.altId &&
                 bp.insCode2 === res2Seq.insCode) ||
                // Reverse match (base pairs are bidirectional)
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
