import { type ElementaryResidue, AnglesLengths, ProScoGroup, ProScoGroups } from './';
import { Triplet } from './angles';
import { Pair } from './lengths';
import { Measurements } from './measurements';
import { SummarizeProSco } from './summarize';
import { ALM } from '../alm';
import { filterObject, objKeys } from '../../util';
import { Serialization } from '../../util/serialization';

const DetailsHeader = ['kind', 'model', 'chain', 'seqid', 'inscode', 'altid', 'auth_chain', 'auth_seqid', 'compound', 'percentile', 'name', 'value', 'prosco'];

type Detail = { name: string, value: number, pGroup: ProScoGroup | null, prosco: number | null };
type Residue = {
    model: number,
    chain: string,
    seqId: number,
    insCode: string | null,
    altId: string | null,
    authChain: string,
    authSeqId: number,
    compound: string,
    details: Detail[]
};

function angleName(t: Triplet) {
    return t.join('-');
}

function lengthName(p: Pair) {
    return p.join('-');
}

function maybeBinValue(mb: ALM.MaybeBin) {
    return (mb === 'below' || mb === 'above' || mb === 'no-data') ? null : mb;
}

function residueWithDetails(r: Measurements.Residue, details: Detail[]): Residue {
    return {
        model: r.modelNum,
        chain: r.authChain,
        seqId: r.authSeqId,
        insCode: r.insCode || null,
        altId: r.altId || null,
        authChain: r.authChain,
        authSeqId: r.authSeqId,
        compound: r.compound,
        details,
    };
}

function proScoStatsToSerializable(counts: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>, kind: 'a' | 'l'): Serialization.Serializable {
    const tags = ['kind', 'percentile', 'cumulative_count', 'exclusive_count'];
    const values = new Array<(number|string)[]>();

    const grps = [...ProScoGroups, 'outlier'] as const;
    values.push((new Array<string>(ProScoGroups.length + 1)).fill(kind));
    values.push(grps.map(g => counts[g]).map(x => x.pGroup));
    values.push(grps.map(g => counts[g]).map(x => x.cumulative));
    values.push(grps.map(g => counts[g]).map(x => x.exclusive));

    return { tags, values };
}

export namespace SerializeByCompound {
    function anglesToSerializable(angles: ALM.AngleStats[]) {
        const tags = DetailsHeader;
        const values = new Array<(number|string)[]>();

        values.push(angles.flatMap((x) => x.angles.map(() => 'a')));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.modelNum)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.chain)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.seqId)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.insCode)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.altId)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.authChain)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.authSeqId)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.residue.compound)));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.pGroup?.pGroup ?? 'outlier')));
        values.push(angles.flatMap((x) => x.angles.map((a) => angleName(a.angle.triplet))));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.angle.angle)));
        values.push(angles.flatMap((x) => x.angles.map((a) => maybeBinValue(a.bin)?.prosco ?? a.bin as string)));

        return { tags, values };
    }

    function lengthsToSerializable(lengths: ALM.LengthStats[]) {
        const tags = DetailsHeader;
        const values = new Array<(number|string)[]>();

        values.push(lengths.flatMap((x) => x.lengths.map(() => 'l')));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.modelNum)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.chain)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.seqId)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.insCode)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.altId)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.authChain)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.authSeqId)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.residue.compound)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.pGroup?.pGroup ?? 'outlier')));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => lengthName(l.length.pair))));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.length.length)));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => maybeBinValue(l.bin)?.prosco ?? l.bin as string)));

        return { tags, values };
    }

    export function toCsv(
        angles: ALM.AngleStats[],
        proScoCountsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        lengths: ALM.LengthStats[],
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>
    ) {
        const proScoStatsAngles = Serialization.toCsv(proScoStatsToSerializable(proScoCountsAngles, 'a'));
        const proScoStatsLengths = Serialization.toCsv(proScoStatsToSerializable(proScoCountsLengths, 'l'));
        const outAngles = Serialization.toCsv(anglesToSerializable(angles));
        const outLengths = Serialization.toCsv(lengthsToSerializable(lengths));

        return proScoStatsLengths + '\n' + proScoStatsAngles + '\n' + outLengths + '\n' + outAngles;
    }

    export function toJson(
        angles: ALM.AngleStats[],
        proScoCountsAngles: Record<ProScoGroup | 'outlier',  SummarizeProSco.CountsInGroup>,
        lengths: ALM.LengthStats[],
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>
    ) {
        type Stats = { pGroup: ProScoGroup | 'outlier', cumulativeCount: number, exclusiveCount: number };

        const grps = [...ProScoGroups, 'outlier'] as const;
        const proScoAnglesStats: Stats[] = grps.map(g => proScoCountsAngles[g]).map(x => ({ pGroup: x.pGroup, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));
        const proScoLengthsStats: Stats[] = grps.map(g => proScoCountsLengths[g]).map(x => ({ pGroup: x.pGroup, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));

        type OutStats<T extends ALM.AngleStats['angles'] | ALM.LengthStats['lengths']> = {
            stats: Omit<T[0], 'residue'>,
            residue: Omit<Measurements.Residue, 'bondAngles' | 'bondLengths'>,
        }
        type AngleOutStats = OutStats<ALM.AngleStats['angles']>;
        type LengthOutStats = OutStats<ALM.LengthStats['lengths']>;

        const outAngles: Record<ElementaryResidue, Map<string, AngleOutStats[]>> = {
            'A': new Map(),
            'C': new Map(),
            'G': new Map(),
            'U': new Map(),
            'DA': new Map(),
            'DC': new Map(),
            'DG': new Map(),
            'DT': new Map(),
            'DU': new Map(),
        };
        const outLengths: Record<ElementaryResidue, Map<string, LengthOutStats[]>> = {
            'A': new Map(),
            'C': new Map(),
            'G': new Map(),
            'U': new Map(),
            'DA': new Map(),
            'DC': new Map(),
            'DG': new Map(),
            'DT': new Map(),
            'DU': new Map(),
        };

        // We need to map the input arrays out to compoud -> metric mapping again to get nicely structured JSONs.
        for (const a of angles) {
            const dst = outAngles[a.r.compound];
            for (const x of a.angles) {
                const key = angleName(x.angle.triplet);
                if (!dst.has(key))
                    dst.set(key, []);
                const stats = dst.get(key)!;

                const outResidue = filterObject(x.residue, objKeys(x.residue, ['bondAngles', 'bondLengths']));
                stats.push({ stats: filterObject(x, ['angle', 'bin', 'pGroup', 'navalRankingClass']), residue: outResidue });
            }
        }
        for (const l of lengths) {
            const dst = outLengths[l.r.compound];
            for (const x of l.lengths) {
                const key = lengthName(x.length.pair);
                if (!dst.has(key))
                    dst.set(key, []);
                const stats = dst.get(key)!;

                const outResidue = filterObject(x.residue, objKeys(x.residue, ['bondAngles', 'bondLengths']));
                stats.push({ stats: filterObject(x, ['length', 'bin', 'pGroup', 'navalRankingClass']), residue: outResidue });
            }
        }

        const demappedOutAngles = objKeys(outAngles).map((base) => ({ [base]: Array.from(outAngles[base].entries()).map(([metric, values]) => ({ [metric]: values })) }));
        const demappedOutLengths = objKeys(outLengths).map((base) => ({ [base]: Array.from(outLengths[base].entries()).map(([metric, values]) => ({ [metric]: values })) }));

        return JSON.stringify({
            proScoAnglesStats,
            proScoLengthsStats,
            angles: demappedOutAngles,
            lengths: demappedOutLengths,
        });
    }
}

export namespace SerializeByResidue {
    function anglesToSerializable(residues: Measurements.Residue[], stats: ALM.ResidueStats[]): Serialization.Serializable {
        const tags = DetailsHeader;
        const values = new Array<(number|string)[]>();

        values.push(residues.flatMap(x => x.bondAngles.map(() => 'a')));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.modelNum)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.chain)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.seqId)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.insCode)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.altId)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.authChain)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.authSeqId)));
        values.push(residues.flatMap(x => x.bondAngles.map(() => x.compound)));
        values.push(residues.flatMap(x => x.bondAngles.map(a => AnglesLengths.anglePGroup(x.compound, a)?.pGroup?? 'outlier')));
        values.push(residues.flatMap(x => x.bondAngles.map(a => angleName(a.triplet))));
        values.push(residues.flatMap(x => x.bondAngles.map(a => a.angle)));
        values.push(residues.flatMap((x, idx) => x.bondAngles.map((_y, jdx) => {
            const mb = stats[idx].angles[jdx].bin;
            return maybeBinValue(mb)?.prosco ?? mb as string;
        })));

        return { tags, values };
    }

    function lengthsToSerializable(residues: Measurements.Residue[], stats: ALM.ResidueStats[]): Serialization.Serializable {
        const tags = DetailsHeader;
        const values = new Array<(number|string)[]>();

        values.push(residues.flatMap(x => x.bondLengths.map(() => 'l')));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.modelNum)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.chain)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.seqId)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.insCode)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.altId)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.authChain)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.authSeqId)));
        values.push(residues.flatMap(x => x.bondLengths.map(() => x.compound)));
        values.push(residues.flatMap(x => x.bondLengths.map(l => AnglesLengths.lengthPGroup(x.compound, l)?.pGroup ?? 'outlier')));
        values.push(residues.flatMap(x => x.bondLengths.map(l => lengthName(l.pair))));
        values.push(residues.flatMap(x => x.bondLengths.map(l => l.length)));
        values.push(residues.flatMap((x, idx) => x.bondLengths.map((_y, jdx) => {
            const mb = stats[idx].lengths[jdx].bin;
            return maybeBinValue(mb)?.prosco ?? mb as string;
        })));
        return { tags, values };
    }

    export function toCsv(
        proScoCountsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        residues: Measurements.Residue[],
        stats: ALM.ResidueStats[]
    ) {
        const proScoStatsAngles = Serialization.toCsv(proScoStatsToSerializable(proScoCountsAngles, 'a'));
        const proScoStatsLengths = Serialization.toCsv(proScoStatsToSerializable(proScoCountsLengths, 'l'));
        const angles = Serialization.toCsv(anglesToSerializable(residues, stats));
        const lengths = Serialization.toCsv(lengthsToSerializable(residues, stats));

        return proScoStatsLengths + '\n' + proScoStatsAngles + '\n' + lengths + '\n' + angles;
    }

    export function toJson(
        countsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        countsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        residues: Measurements.Residue[],
        stats: ALM.ResidueStats[]
    ) {
        type Stats = { pGroup: ProScoGroup | 'outlier', cumulativeCount: number, exclusiveCount: number };

        const grps = [...ProScoGroups, 'outlier'] as const;
        const proScoAnglesStats: Stats[] = grps.map(g => countsAngles[g]).map(x => ({ pGroup: x.pGroup, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));
        const proScoLengthsStats: Stats[] = grps.map(g => countsLengths[g]).map(x => ({ pGroup: x.pGroup, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));

        const angles = new Array<Residue>();
        const lengths = new Array<Residue>();

        for (let idx = 0; idx < residues.length; idx++) {
            const r = residues[idx];
            const s = stats[idx];

            const anglesDetails: Detail[] = r.bondAngles.map((x, jdx) => ({
                name: angleName(x.triplet), value: x.angle, pGroup: AnglesLengths.anglePGroup(r.compound, x)?.pGroup ?? null, prosco: maybeBinValue(s.angles[jdx].bin)?.prosco ?? null,
            }));
            const lengthsDetails: Detail[] = r.bondLengths.map((x, jdx) => ({
                name: lengthName(x.pair), value: x.length, pGroup: AnglesLengths.lengthPGroup(r.compound, x)?.pGroup ?? null, prosco: maybeBinValue(s.lengths[jdx].bin)?.prosco ?? null,
            }));

            angles.push(residueWithDetails(r, anglesDetails));
            lengths.push(residueWithDetails(r, lengthsDetails));
        }

        return JSON.stringify({
            proScoAnglesStats,
            proScoLengthsStats,
            angles,
            lengths,
        });
    }
}
