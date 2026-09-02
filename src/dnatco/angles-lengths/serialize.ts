import { type ElementaryResidue, AnglesLengths, ProScoGroup } from './';
import { Triplet } from './angles';
import { Pair } from './lengths';
import { Measurements } from './measurements';
import { SummarizeProSco, SummarizeNaval } from './summarize';
import { ALM } from '../alm';
import { filterObject, objKeys } from '../../util';
import { M } from '../../util/math';
import { Serialization } from '../../util/serialization';

const DetailsHeader = ['kind', 'model', 'chain', 'seqid', 'inscode', 'altid', 'auth_chain', 'auth_seqid', 'compound', 'name', 'value', 'ProSco', 'ProSco_group', 'naval_tier'];

type Detail = { name: string, value: number, pGroup: string | null, prosco: number | null, naval_tier: string };
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

function formatProSco(prosco: number): string {
    const scaled = prosco * 100;
    const decimals = 1;
    const fvdd = M.firstValidDecimalDigit(scaled);
    return fvdd > decimals ? scaled.toExponential(decimals - 1) : scaled.toFixed(decimals);
}

function residueWithDetails(r: Measurements.Residue, details: Detail[]): Residue {
    return {
        model: r.modelNum,
        chain: r.chain,
        seqId: r.seqId,
        insCode: r.insCode || null,
        altId: r.altId || null,
        authChain: r.authChain,
        authSeqId: r.authSeqId,
        compound: r.compound,
        details,
    };
}

function proScoStatsToSerializable(counts: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>, kind: 'a' | 'l'): Serialization.Serializable {
    const tags = ['kind', 'ProSco_category', 'exclusive_count', 'exclusive_percentage', 'cumulative_count', 'cumulative_percentage'];
    const values = new Array<(number|string)[]>();

    // Merge 'unique' and 'outlier' into single 'Unique' row
    const grps: (ProScoGroup | 'outlier')[] = ['common', 'rare', 'ambiguous', 'unique'];
    const uniqueCount = counts['unique'];
    const outlierCount = counts['outlier'];
    const mergedUnique = {
        pGroup: 'unique' as const,
        cumulative: uniqueCount.cumulative + outlierCount.exclusive,
        exclusive: uniqueCount.exclusive + outlierCount.exclusive,
    };

    const total = outlierCount.cumulative;

    values.push((new Array<string>(grps.length)).fill(kind));
    values.push([...grps.slice(0, 3).map(g => AnglesLengths.pGroupName(counts[g].pGroup as ProScoGroup)), AnglesLengths.pGroupName(mergedUnique.pGroup)]);
    values.push([...grps.slice(0, 3).map(g => counts[g].exclusive), mergedUnique.exclusive]);
    values.push([...grps.slice(0, 3).map(g => (100 * counts[g].exclusive / total).toFixed(2)), (100 * mergedUnique.exclusive / total).toFixed(2)]);
    values.push([...grps.slice(0, 3).map(g => counts[g].cumulative), mergedUnique.cumulative]);
    values.push([...grps.slice(0, 3).map(g => (100 * counts[g].cumulative / total).toFixed(2)), (100 * mergedUnique.cumulative / total).toFixed(2)]);

    return { tags, values };
}

function navalStatsToSerializable(counts: SummarizeNaval.CountsInGroup[], kind: 'a' | 'l'): Serialization.Serializable {
    const tags = ['kind', 'NA-VAL_tier', 'exclusive_count', 'exclusive_percentage', 'cumulative_count', 'cumulative_percentage'];
    const values = new Array<(number|string)[]>();

    const total = counts[counts.length - 1].cumulative;

    values.push((new Array<string>(counts.length)).fill(kind));
    values.push(counts.map(x => AnglesLengths.navalRankingClassName(x.class)));
    values.push(counts.map(x => x.exclusive));
    values.push(counts.map(x => (100 * x.exclusive / total).toFixed(2)));
    values.push(counts.map(x => x.cumulative));
    values.push(counts.map(x => (100 * x.cumulative / total).toFixed(2)));

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
        values.push(angles.flatMap((x) => x.angles.map((a) => angleName(a.angle.triplet))));
        values.push(angles.flatMap((x) => x.angles.map((a) => M.r2d(a.angle.angle).toFixed(2))));
        values.push(angles.flatMap((x) => x.angles.map((a) => {
            const bin = maybeBinValue(a.bin);
            return bin ? formatProSco(bin.prosco) : (a.bin as string);
        })));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.pGroup?.pGroup ?? 'outlier')));
        values.push(angles.flatMap((x) => x.angles.map((a) => a.navalRankingClass)));

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
        values.push(lengths.flatMap((x) => x.lengths.map((l) => lengthName(l.length.pair))));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.length.length.toFixed(4))));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => {
            const bin = maybeBinValue(l.bin);
            return bin ? formatProSco(bin.prosco) : (l.bin as string);
        })));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.pGroup?.pGroup ?? 'outlier')));
        values.push(lengths.flatMap((x) => x.lengths.map((l) => l.navalRankingClass)));

        return { tags, values };
    }

    export function toCsv(
        angles: ALM.AngleStats[],
        proScoCountsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        lengths: ALM.LengthStats[],
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        navalCountsAngles: SummarizeNaval.CountsInGroup[],
        navalCountsLengths: SummarizeNaval.CountsInGroup[]
    ) {
        const proScoStatsAngles = Serialization.toCsv(proScoStatsToSerializable(proScoCountsAngles, 'a'));
        const proScoStatsLengths = Serialization.toCsv(proScoStatsToSerializable(proScoCountsLengths, 'l'));
        const navalStatsAngles = Serialization.toCsv(navalStatsToSerializable(navalCountsAngles, 'a'));
        const navalStatsLengths = Serialization.toCsv(navalStatsToSerializable(navalCountsLengths, 'l'));
        const outAngles = Serialization.toCsv(anglesToSerializable(angles));
        const outLengths = Serialization.toCsv(lengthsToSerializable(lengths));

        return navalStatsLengths + '\n' + navalStatsAngles + '\n' + proScoStatsLengths + '\n' + proScoStatsAngles + '\n' + outLengths + '\n' + outAngles;
    }

    export function toJson(
        angles: ALM.AngleStats[],
        proScoCountsAngles: Record<ProScoGroup | 'outlier',  SummarizeProSco.CountsInGroup>,
        lengths: ALM.LengthStats[],
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        navalCountsAngles: SummarizeNaval.CountsInGroup[],
        navalCountsLengths: SummarizeNaval.CountsInGroup[]
    ) {
        type ProScoStats = { pGroup: string, exclusiveCount: number, exclusivePercentage: number, cumulativeCount: number, cumulativePercentage: number };
        type NavalStats = { navalTier: string, exclusiveCount: number, exclusivePercentage: number, cumulativeCount: number, cumulativePercentage: number };

        // Merge 'unique' and 'outlier' into single 'Unique' entry
        const grps: ProScoGroup[] = ['common', 'rare', 'ambiguous', 'unique'];
        const uniqueCount = proScoCountsAngles['unique'];
        const outlierCount = proScoCountsAngles['outlier'];
        const totalAngles = outlierCount.cumulative;
        const proScoAnglesStats: ProScoStats[] = [
            ...grps.slice(0, 3).map(g => ({
                pGroup: proScoCountsAngles[g].pGroup,
                exclusiveCount: proScoCountsAngles[g].exclusive,
                exclusivePercentage: parseFloat((100 * proScoCountsAngles[g].exclusive / totalAngles).toFixed(2)),
                cumulativeCount: proScoCountsAngles[g].cumulative,
                cumulativePercentage: parseFloat((100 * proScoCountsAngles[g].cumulative / totalAngles).toFixed(2))
            })),
            {
                pGroup: 'unique',
                exclusiveCount: uniqueCount.exclusive + outlierCount.exclusive,
                exclusivePercentage: parseFloat((100 * (uniqueCount.exclusive + outlierCount.exclusive) / totalAngles).toFixed(2)),
                cumulativeCount: uniqueCount.cumulative + outlierCount.exclusive,
                cumulativePercentage: parseFloat((100 * (uniqueCount.cumulative + outlierCount.exclusive) / totalAngles).toFixed(2))
            }
        ];

        const uniqueCountL = proScoCountsLengths['unique'];
        const outlierCountL = proScoCountsLengths['outlier'];
        const totalLengths = outlierCountL.cumulative;
        const proScoLengthsStats: ProScoStats[] = [
            ...grps.slice(0, 3).map(g => ({
                pGroup: proScoCountsLengths[g].pGroup,
                exclusiveCount: proScoCountsLengths[g].exclusive,
                exclusivePercentage: parseFloat((100 * proScoCountsLengths[g].exclusive / totalLengths).toFixed(2)),
                cumulativeCount: proScoCountsLengths[g].cumulative,
                cumulativePercentage: parseFloat((100 * proScoCountsLengths[g].cumulative / totalLengths).toFixed(2))
            })),
            {
                pGroup: 'unique',
                exclusiveCount: uniqueCountL.exclusive + outlierCountL.exclusive,
                exclusivePercentage: parseFloat((100 * (uniqueCountL.exclusive + outlierCountL.exclusive) / totalLengths).toFixed(2)),
                cumulativeCount: uniqueCountL.cumulative + outlierCountL.exclusive,
                cumulativePercentage: parseFloat((100 * (uniqueCountL.cumulative + outlierCountL.exclusive) / totalLengths).toFixed(2))
            }
        ];

        const totalNavalAngles = navalCountsAngles[navalCountsAngles.length - 1].cumulative;
        const navalAnglesStats: NavalStats[] = navalCountsAngles.map(x => ({
            navalTier: x.class,
            exclusiveCount: x.exclusive,
            exclusivePercentage: parseFloat((100 * x.exclusive / totalNavalAngles).toFixed(2)),
            cumulativeCount: x.cumulative,
            cumulativePercentage: parseFloat((100 * x.cumulative / totalNavalAngles).toFixed(2))
        }));
        const totalNavalLengths = navalCountsLengths[navalCountsLengths.length - 1].cumulative;
        const navalLengthsStats: NavalStats[] = navalCountsLengths.map(x => ({
            navalTier: x.class,
            exclusiveCount: x.exclusive,
            exclusivePercentage: parseFloat((100 * x.exclusive / totalNavalLengths).toFixed(2)),
            cumulativeCount: x.cumulative,
            cumulativePercentage: parseFloat((100 * x.cumulative / totalNavalLengths).toFixed(2))
        }));

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
            navalAnglesStats,
            navalLengthsStats,
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
        values.push(residues.flatMap(x => x.bondAngles.map(a => angleName(a.triplet))));
        values.push(residues.flatMap(x => x.bondAngles.map(a => M.r2d(a.angle).toFixed(2))));
        values.push(residues.flatMap((x, idx) => x.bondAngles.map((_y, jdx) => {
            const mb = stats[idx].angles[jdx].bin;
            const binVal = maybeBinValue(mb);
            return binVal ? formatProSco(binVal.prosco) : mb as string;
        })));
        values.push(residues.flatMap((x, idx) => x.bondAngles.map((_y, jdx) => {
            const pGroup = AnglesLengths.anglePGroup(x.compound, x.bondAngles[jdx])?.pGroup;
            return pGroup ?? 'outlier';
        })));
        values.push(residues.flatMap((x, idx) => x.bondAngles.map((_y, jdx) => stats[idx].angles[jdx].navalRankingClass)));

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
        values.push(residues.flatMap(x => x.bondLengths.map(l => lengthName(l.pair))));
        values.push(residues.flatMap(x => x.bondLengths.map(l => l.length.toFixed(4))));
        values.push(residues.flatMap((x, idx) => x.bondLengths.map((_y, jdx) => {
            const mb = stats[idx].lengths[jdx].bin;
            const binVal = maybeBinValue(mb);
            return binVal ? formatProSco(binVal.prosco) : mb as string;
        })));
        values.push(residues.flatMap((x, idx) => x.bondLengths.map((_y, jdx) => {
            const pGroup = AnglesLengths.lengthPGroup(x.compound, x.bondLengths[jdx])?.pGroup;
            return pGroup ?? 'outlier';
        })));
        values.push(residues.flatMap((x, idx) => x.bondLengths.map((_y, jdx) => stats[idx].lengths[jdx].navalRankingClass)));
        return { tags, values };
    }

    export function toCsv(
        proScoCountsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        proScoCountsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        navalCountsAngles: SummarizeNaval.CountsInGroup[],
        navalCountsLengths: SummarizeNaval.CountsInGroup[],
        residues: Measurements.Residue[],
        stats: ALM.ResidueStats[]
    ) {
        const proScoStatsAngles = Serialization.toCsv(proScoStatsToSerializable(proScoCountsAngles, 'a'));
        const proScoStatsLengths = Serialization.toCsv(proScoStatsToSerializable(proScoCountsLengths, 'l'));
        const navalStatsAngles = Serialization.toCsv(navalStatsToSerializable(navalCountsAngles, 'a'));
        const navalStatsLengths = Serialization.toCsv(navalStatsToSerializable(navalCountsLengths, 'l'));
        const angles = Serialization.toCsv(anglesToSerializable(residues, stats));
        const lengths = Serialization.toCsv(lengthsToSerializable(residues, stats));

        return navalStatsLengths + '\n' + navalStatsAngles + '\n' + proScoStatsLengths + '\n' + proScoStatsAngles + '\n' + lengths + '\n' + angles;
    }

    export function toJson(
        countsAngles: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        countsLengths: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
        navalCountsAngles: SummarizeNaval.CountsInGroup[],
        navalCountsLengths: SummarizeNaval.CountsInGroup[],
        residues: Measurements.Residue[],
        stats: ALM.ResidueStats[]
    ) {
        type ProScoStats = { pGroup: string, exclusiveCount: number, exclusivePercentage: number, cumulativeCount: number, cumulativePercentage: number };
        type NavalStats = { navalTier: string, exclusiveCount: number, exclusivePercentage: number, cumulativeCount: number, cumulativePercentage: number };

        // Merge 'unique' and 'outlier' into single 'unique' entry
        const grps: ProScoGroup[] = ['common', 'rare', 'ambiguous', 'unique'];
        const totalAngles = countsAngles['outlier'].cumulative;
        const proScoAnglesStats: ProScoStats[] = [
            ...grps.slice(0, 3).map(g => ({
                pGroup: AnglesLengths.pGroupName(g),
                exclusiveCount: countsAngles[g].exclusive,
                exclusivePercentage: parseFloat((100 * countsAngles[g].exclusive / totalAngles).toFixed(2)),
                cumulativeCount: countsAngles[g].cumulative,
                cumulativePercentage: parseFloat((100 * countsAngles[g].cumulative / totalAngles).toFixed(2))
            })),
            {
                pGroup: AnglesLengths.pGroupName('unique'),
                exclusiveCount: countsAngles['unique'].exclusive + countsAngles['outlier'].exclusive,
                exclusivePercentage: parseFloat((100 * (countsAngles['unique'].exclusive + countsAngles['outlier'].exclusive) / totalAngles).toFixed(2)),
                cumulativeCount: countsAngles['unique'].cumulative + countsAngles['outlier'].exclusive,
                cumulativePercentage: parseFloat((100 * (countsAngles['unique'].cumulative + countsAngles['outlier'].exclusive) / totalAngles).toFixed(2))
            }
        ];
        const totalLengths = countsLengths['outlier'].cumulative;
        const proScoLengthsStats: ProScoStats[] = [
            ...grps.slice(0, 3).map(g => ({
                pGroup: AnglesLengths.pGroupName(g),
                exclusiveCount: countsLengths[g].exclusive,
                exclusivePercentage: parseFloat((100 * countsLengths[g].exclusive / totalLengths).toFixed(2)),
                cumulativeCount: countsLengths[g].cumulative,
                cumulativePercentage: parseFloat((100 * countsLengths[g].cumulative / totalLengths).toFixed(2))
            })),
            {
                pGroup: AnglesLengths.pGroupName('unique'),
                exclusiveCount: countsLengths['unique'].exclusive + countsLengths['outlier'].exclusive,
                exclusivePercentage: parseFloat((100 * (countsLengths['unique'].exclusive + countsLengths['outlier'].exclusive) / totalLengths).toFixed(2)),
                cumulativeCount: countsLengths['unique'].cumulative + countsLengths['outlier'].exclusive,
                cumulativePercentage: parseFloat((100 * (countsLengths['unique'].cumulative + countsLengths['outlier'].exclusive) / totalLengths).toFixed(2))
            }
        ];

        const totalNavalAngles = navalCountsAngles[navalCountsAngles.length - 1].cumulative;
        const navalAnglesStats: NavalStats[] = navalCountsAngles.map(x => ({
            navalTier: AnglesLengths.navalRankingClassName(x.class),
            exclusiveCount: x.exclusive,
            exclusivePercentage: parseFloat((100 * x.exclusive / totalNavalAngles).toFixed(2)),
            cumulativeCount: x.cumulative,
            cumulativePercentage: parseFloat((100 * x.cumulative / totalNavalAngles).toFixed(2))
        }));
        const totalNavalLengths = navalCountsLengths[navalCountsLengths.length - 1].cumulative;
        const navalLengthsStats: NavalStats[] = navalCountsLengths.map(x => ({
            navalTier: AnglesLengths.navalRankingClassName(x.class),
            exclusiveCount: x.exclusive,
            exclusivePercentage: parseFloat((100 * x.exclusive / totalNavalLengths).toFixed(2)),
            cumulativeCount: x.cumulative,
            cumulativePercentage: parseFloat((100 * x.cumulative / totalNavalLengths).toFixed(2))
        }));

        const angles = new Array<Residue>();
        const lengths = new Array<Residue>();

        for (let idx = 0; idx < residues.length; idx++) {
            const r = residues[idx];
            const s = stats[idx];

            const anglesDetails: Detail[] = r.bondAngles.map((x, jdx) => {
                const bin = maybeBinValue(s.angles[jdx].bin);
                const pGroupObj = AnglesLengths.anglePGroup(r.compound, x);
                const pGroup = pGroupObj?.pGroup ?? null;
                return {
                    name: angleName(x.triplet),
                    value: M.r2d(x.angle),
                    pGroup: pGroup ? AnglesLengths.pGroupName(pGroup) : null,
                    prosco: bin ? bin.prosco * 100 : null,
                    naval_tier: AnglesLengths.navalRankingClassName(s.angles[jdx].navalRankingClass),
                };
            });
            const lengthsDetails: Detail[] = r.bondLengths.map((x, jdx) => {
                const bin = maybeBinValue(s.lengths[jdx].bin);
                const pGroupObj = AnglesLengths.lengthPGroup(r.compound, x);
                const pGroup = pGroupObj?.pGroup ?? null;
                return {
                    name: lengthName(x.pair),
                    value: x.length,
                    pGroup: pGroup ? AnglesLengths.pGroupName(pGroup) : null,
                    prosco: bin ? bin.prosco * 100 : null,
                    naval_tier: AnglesLengths.navalRankingClassName(s.lengths[jdx].navalRankingClass),
                };
            });

            angles.push(residueWithDetails(r, anglesDetails));
            lengths.push(residueWithDetails(r, lengthsDetails));
        }

        return JSON.stringify({
            proScoAnglesStats,
            proScoLengthsStats,
            navalAnglesStats,
            navalLengthsStats,
            angles,
            lengths,
        });
    }
}
