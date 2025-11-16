import { type NavalRankingClass, AnglesLengths, ElementaryResidue } from './angles-lengths';
import { tripletTag, Angles, Triplet } from './angles-lengths/angles';
import { Bin } from './angles-lengths/bin';
import { pairTag, Lengths, Pair } from './angles-lengths/lengths';
import { Measurements } from './angles-lengths/measurements';
import { Summarize, SummarizeNaval, SummarizeProSco } from './angles-lengths/summarize';
import { MappedNaval } from './dnatcofication';
import { objKeys } from '../util';
import { InvalidModelIndex } from '../util/structure-selection';

export type ALMCompoundAngleLength = {
    models: Map<number, ALM.ByCompound>,
    chains: Map<number, Map<string, ALM.ByCompound>>,
}

export type ALMByResidue = {
    models: Map<number, number[]>,
    chains: Map<number, Map<string, number[]>>,
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
}

function accumulateArray(target: number[], source: number[]) {
    if (target.length !== source.length) {
        target.length = 0;
        for (let idx = 0; idx < source.length; idx++)
            target.push(0);
    }

    for (let idx = 0; idx < source.length; idx++)
        target[idx] += source[idx];
}

function asMaybeBin(bin: Bin | 'above' | 'below' | 'no-data', binIndex: number | 'above' | 'below'): ALM.MaybeBin | 'above' | 'below' | 'no-data' {
    switch (bin) {
        case 'above':
        case 'below':
        case 'no-data':
            return bin;
        default:
            return {
                ...bin,
                binIndex: binIndex as number,
            };
    }
}

function aggregateWithParent(parent: Summarize.Counts, subaggregation: Summarize.Counts) {
    accumulateArray(parent.cumulative, subaggregation.cumulative);
    accumulateArray(parent.exclusive, subaggregation.exclusive);
}

function processAggregation(aggregation: Map<any, ALM.ByCompound>) {
    for (const alm of aggregation.values()) {
        // Go over all bases for the given model
        for (const k of objKeys(alm.angles)) {
            const angles = alm.angles[k];
            const lengths = alm.lengths[k];

            // Go over all bond angles for the given base
            let haveAngles = false;
            for (const x of angles.byMetric.values()) {
                if (x.individual.angles.length === 0)
                    continue;

                haveAngles = true;
                const aggre = [];

                // Go over all values for the given bond angle
                for (const a of x.individual.angles)
                    aggre.push({ angle: a.angle, base: x.individual.base });

                // ProSco
                x.overallProSco = SummarizeProSco.angles(aggre);
                aggregateWithParent(angles.overallProSco, x.overallProSco);

                // Naval
                x.overallNaval = SummarizeNaval.angles(aggre);
                aggregateWithParent(angles.overallNaval, x.overallNaval);
            }

            // Go over all bond lengths for the given base
            let haveLengths = false;
            for (const x of lengths.byMetric.values()) {
                if (x.individual.lengths.length === 0)
                    continue;

                haveLengths = true;
                const aggre = [];

                if (x.individual.base !== k)
                    throw new Error(`Assertion falure ${x.individual.base} !== ${k}`);

                // Go over all values for the given bond angle
                for (const l of x.individual.lengths) {
                    aggre.push({ length: l.length, base: x.individual.base });
                }

                // ProSco
                x.overallProSco = SummarizeProSco.lengths(aggre);
                aggregateWithParent(lengths.overallProSco, x.overallProSco);
            }

            // Add counts for this "subaggregation" to its parent aggregation
            if (haveAngles) {
                aggregateWithParent(alm.overallAnglesProSco, angles.overallProSco);
                aggregateWithParent(alm.overallAnglesNaval, angles.overallNaval);
            }

            if (haveLengths) {
                aggregateWithParent(alm.overallLengthsProSco, lengths.overallProSco);
                aggregateWithParent(alm.overallLengthsNaval, lengths.overallNaval);
            }
        }
    }
}

function getBondAngle(tag: string, angles: Measurements.BondAngle[]) {
    for (const a of angles) {
        if (tag === a.tag)
            return a;
    }

    throw new Error(`No angle with tag "${tag}" in the given list of angles`);
}

function getBondLength(tag: string, lengths: Measurements.BondLength[]) {
    for (const l of lengths) {
        if (tag === l.tag)
            return l;
    }

    throw new Error(`No length with tag "${tag}" in the given list of lengths`);
}

export namespace ALM {
    export type AngleStats = {
        base: ElementaryResidue,
        angles: {
            angle: Measurements.BondAngle,
            residue: Measurements.Residue,
            pGroup?: AnglesLengths.PGroup,
            bin: MaybeBin,
            navalRankingClass: NavalRankingClass,
        }[],
    }
    function AngleStats(base: ElementaryResidue): AngleStats {
        return {
            base,
            angles: [],
        };
    }

    export type LengthStats = {
        base: ElementaryResidue,
        lengths: {
            length: Measurements.BondLength,
            residue: Measurements.Residue,
            pGroup?: AnglesLengths.PGroup,
            bin: MaybeBin,
            navalRankingClass: NavalRankingClass,
        }[],
    }
    function LengthStats(base: ElementaryResidue): LengthStats {
        return {
            base,
            lengths: [],
        };
    }

    export type ByCompound = {
        angles: Record<ElementaryResidue, ALM.CompoundStats<ALM.AngleStats>>,
        overallAnglesProSco: Summarize.Counts,
        overallAnglesNaval: Summarize.Counts,
        lengths: Record<ElementaryResidue, ALM.CompoundStats<ALM.LengthStats>>,
        overallLengthsProSco: Summarize.Counts,
        overallLengthsNaval: Summarize.Counts,
    }
    function ByCompound(): ByCompound {
        return {
            angles: {
                'A': CompoundStats(),
                'C': CompoundStats(),
                'G': CompoundStats(),
                'U': CompoundStats(),
                'DA': CompoundStats(),
                'DC': CompoundStats(),
                'DG': CompoundStats(),
                'DT': CompoundStats(),
                'DU': CompoundStats(),
            },
            overallAnglesProSco: { cumulative: [], exclusive: [] },
            overallAnglesNaval: { cumulative: [], exclusive: [] },
            lengths: {
                'A': CompoundStats(),
                'C': CompoundStats(),
                'G': CompoundStats(),
                'U': CompoundStats(),
                'DA': CompoundStats(),
                'DC': CompoundStats(),
                'DG': CompoundStats(),
                'DT': CompoundStats(),
                'DU': CompoundStats(),
            },
            overallLengthsProSco: { cumulative: [], exclusive: [] },
            overallLengthsNaval: { cumulative: [], exclusive: [] },
        };
    }

    export type CompoundStats<T extends AngleStats | LengthStats> = {
        byMetric: Map<string, MetricStats<T>>,
        overallProSco: Summarize.Counts,
        overallNaval: Summarize.Counts,
    }
    function CompoundStats<T extends AngleStats | LengthStats>() {
        return {
            overallProSco: { exclusive: [], cumulative: [] },
            overallNaval: { exclusive: [], cumulative: [] },
            byMetric: new Map(),
        };
    }

    export type MetricStats<T extends AngleStats | LengthStats> = {
        type: T extends AngleStats ? 'angle' : 'length';
        identifier: T extends AngleStats ? Triplet : Pair,
        overallProSco: Summarize.Counts,
        overallNaval: Summarize.Counts,
        individual: T,
    }
    function AngleMetricStats(base: ElementaryResidue, triplet: Triplet): MetricStats<AngleStats> {
        return {
            type: 'angle',
            identifier: triplet,
            overallProSco: { exclusive: [], cumulative: [] },
            overallNaval: { exclusive: [], cumulative: [] },
            individual: AngleStats(base ),
        };
    }
    function LengthMetricStats(base: ElementaryResidue, pair: Pair): MetricStats<LengthStats> {
        return {
            type: 'length',
            identifier: pair,
            overallProSco: { exclusive: [], cumulative: [] },
            overallNaval: { exclusive: [], cumulative: [] },
            individual: LengthStats(base),
        };
    }

    export type MaybeBin = (Bin & { binIndex: number }) | 'below' | 'above' | 'no-data';
    export type ResidueStats = {
        angles: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
        lengths: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
        summaryProSco: Summarize.Summary;
        summaryNaval: Summarize.Summary;
    }

    export function maybeBinHasValue(maybeBin: MaybeBin): maybeBin is (Bin & { binIndex: number }) {
        switch (maybeBin) {
            case 'above':
            case 'below':
            case 'no-data':
                return false;
            default:
                return true;
        }
    }

    export function emptyMappingByCompoundAngleLength() {
        return ByCompound();
    }

    export function mapByCompoundAngleLength(residues: Measurements.Residue[], naval: MappedNaval) {
        const models = new Map<number, ByCompound>(); // Stats grouped by angles/lengths for entire models
        const chains = new Map<number, Map<string, ByCompound>>(); // Stats grouped by angles/lengths, categorized by model and then by chain ID

        /*
         * We need to do this in multiple passes.
         * First we need to aggregate data by individual bond angles and lengths.
         * Once we have the data aggregated like this, we can calculate summary stats.
         */

        for (const r of residues) {
            let almOfModel;
            let almOfChain;

            // Create mapping if necessary
            if (models.has(r.modelNum))
                almOfModel = models.get(r.modelNum)!;
            else {
                almOfModel = ByCompound();
                models.set(r.modelNum, almOfModel);
                chains.set(r.modelNum, new Map());
            }

            if (chains.get(r.modelNum)!.has(r.chain))
                almOfChain = chains.get(r.modelNum)!.get(r.chain)!;
            else {
                almOfChain = ByCompound();
                chains.get(r.modelNum)!.set(r.chain, almOfChain);
            }

            const comp = r.compound;

            for (const angle of Angles[comp]) {
                const tag = tripletTag(angle);
                const a = getBondAngle(tag, r.bondAngles);

                const almM = almOfModel.angles[comp]
                const almC = almOfChain.angles[comp];

                let statsM;
                let statsC;

                if (!almM.byMetric.has(tag)) {
                    statsM = AngleMetricStats(comp, angle)
                    almM.byMetric.set(tag, statsM);
                } else
                    statsM = almM.byMetric.get(tag)!;

                if (!almC.byMetric.has(tag)) {
                    statsC = AngleMetricStats(comp, angle);
                    almC.byMetric.set(tag, statsC);
                } else
                    statsC = almC.byMetric.get(tag)!;

                // ProSco
                const pGroup = AnglesLengths.anglePGroup(comp, a);
                const binIndex = AnglesLengths.angleBinIndex(comp, a);
                const bin = AnglesLengths.angleBinFromIndex(comp, a, binIndex) ?? 'no-data';
                const maybeBin = asMaybeBin(bin, binIndex);
                // NAVAL
                const navalAngle = AnglesLengths.navalAngle(naval, r, angle);
                const navalRanking = AnglesLengths.angleNavalRanking(comp, a);
                const navalRankingClass = AnglesLengths.navalRankingClass(
                    a.angle,
                    navalRanking,
                    navalAngle.csdPreferredLeft,
                    navalAngle.csdPreferredRight,
                    pGroup
                );

                const ang = {
                    angle: a,
                    residue: r,
                    pGroup,
                    bin: maybeBin,
                    navalRankingClass,
                };
                statsM.individual.angles.push(ang);
                statsC.individual.angles.push(ang);
            }

            for (const length of Lengths[r.compound]) {
                const tag = pairTag(length);
                const l = getBondLength(tag, r.bondLengths);

                const almM = almOfModel.lengths[comp]
                const almC = almOfChain.lengths[comp];

                let statsM;
                let statsC;

                if (!almM.byMetric.has(tag)) {
                    statsM = LengthMetricStats(comp, length);
                    almM.byMetric.set(tag, statsM);
                } else
                    statsM = almM.byMetric.get(tag)!;

                if (!almC.byMetric.has(tag)) {
                    statsC = LengthMetricStats(comp, length);
                    almC.byMetric.set(tag, statsC);
                } else
                    statsC = almC.byMetric.get(tag)!;

                // ProSco
                const pGroup = AnglesLengths.lengthPGroup(comp, l);
                const binIndex = AnglesLengths.lengthBinIndex(comp, l);
                const bin = AnglesLengths.lengthBinFromIndex(comp, l, binIndex) ?? 'no-data';
                const maybeBin = asMaybeBin(bin, binIndex);
                // NAVAL
                const navalBond = AnglesLengths.navalBond(naval, r, length);
                const navalRanking = AnglesLengths.lengthNavalRanking(comp, l);
                const navalRankingClass = AnglesLengths.navalRankingClass(
                    l.length,
                    navalRanking,
                    navalBond.csdPreferredLeft,
                    navalBond.csdPreferredRight,
                    pGroup
                );

                const len = {
                    length: l,
                    residue: r,
                    pGroup,
                    bin: maybeBin,
                    navalRankingClass,
                };
                statsM.individual.lengths.push(len);
                statsC.individual.lengths.push(len);
            }
        }

        /*
         * Now we have aggregated the data by angles an lengths
         * so we can calculate summary stats.
         */

        processAggregation(models);
        for (const _chains of chains.values()) {
            // Chains are mapped by model nubmer on the top level so we need this indirection
            processAggregation(_chains);
        }

        /*
         * If there are multiple models, we need another "superaggregation" that combines data in all models.
         */
        if (models.size > 1) {
            const superAggre = ByCompound();
            for (const x of models.values()) {
                for (const k of objKeys(x.angles)) {
                    // Angles
                    for (const method of ['overallProSco', 'overallNaval'] as const) {
                        if (x.angles[k][method].cumulative.length > 0) {
                            accumulateArray(superAggre.angles[k][method].cumulative, x.angles[k][method].cumulative);
                            accumulateArray(superAggre.angles[k][method].exclusive, x.angles[k][method].exclusive);

                            for (const metric of x.angles[k].byMetric.keys()) {
                                const src = x.angles[k].byMetric.get(metric)!;

                                if (!superAggre.angles[k].byMetric.has(metric))
                                    superAggre.angles[k].byMetric.set(metric, AngleMetricStats(k, src.identifier));
                                const dst = superAggre.angles[k].byMetric.get(metric)!

                                accumulateArray(dst[method].cumulative, src[method].cumulative);
                                accumulateArray(dst[method].exclusive, src[method].exclusive);

                                dst.individual.angles = [ ...dst.individual.angles, ...src.individual.angles ];
                            }
                        }

                        // Lengths
                        if (x.lengths[k][method].cumulative.length > 0) {
                            accumulateArray(superAggre.lengths[k][method].cumulative, x.lengths[k][method].cumulative);
                            accumulateArray(superAggre.lengths[k][method].exclusive, x.lengths[k][method].exclusive);

                            for (const metric of x.lengths[k].byMetric.keys()) {
                                const src = x.lengths[k].byMetric.get(metric)!;

                                if (!superAggre.lengths[k].byMetric.has(metric))
                                    superAggre.lengths[k].byMetric.set(metric, LengthMetricStats(k, src.identifier));
                                const dst = superAggre.lengths[k].byMetric.get(metric)!

                                accumulateArray(dst[method].cumulative, src[method].cumulative);
                                accumulateArray(dst[method].exclusive, src[method].exclusive);

                                dst.individual.lengths = [ ...dst.individual.lengths, ...src.individual.lengths ];
                            }
                        }
                    }
                }

                aggregateWithParent(superAggre.overallAnglesProSco, x.overallAnglesProSco);
                aggregateWithParent(superAggre.overallAnglesNaval, x.overallAnglesNaval);
            }

            models.set(InvalidModelIndex, superAggre);
        }

        return { models, chains };
    }

    export function mapByResidue(residues: Measurements.Residue[]): ALMByResidue {
        const models = new Map<number, number[]>();
        const chains = new Map<number, Map<string, number[]>>();
        const stats = [] as ResidueStats[];

        for (let idx = 0; idx < residues.length; idx++) {
            const r = residues[idx];

            // Create mapping
            const m = r.modelNum;
            if (models.has(m))
                models.get(m)!.push(idx);
            else
                models.set(m, [idx]);

            if (chains.has(m)) {
                const cm = chains.get(m)!;
                if (cm.has(r.chain))
                    cm.get(r.chain)!.push(idx);
                else
                    cm.set(r.chain, [idx]);
            } else {
                const cm = new Map([[r.chain, [idx]]]);
                chains.set(m, cm);
            }

            // Precompute stats
            const angles = [];
            for (const a of r.bondAngles) {
                const pgrp = AnglesLengths.anglePGroup(r.compound, a);
                const binIndex = AnglesLengths.angleBinIndex(r.compound, a);
                const bin = AnglesLengths.angleBinFromIndex(r.compound, a, binIndex) ?? 'no-data';
                const maybeBin = asMaybeBin(bin, binIndex);

                angles.push({ pGroup: pgrp, bin: maybeBin });
            }

            const lengths = [];
            for (const l of r.bondLengths) {
                const pgrp = AnglesLengths.lengthPGroup(r.compound, l);
                const binIndex = AnglesLengths.lengthBinIndex(r.compound, l);
                const bin = AnglesLengths.lengthBinFromIndex(r.compound, l, binIndex) ?? 'no-data';
                const maybeBin = asMaybeBin(bin, binIndex);

                lengths.push({ pGroup: pgrp, bin: maybeBin });
            }

            stats.push({ angles, lengths, summaryProSco: SummarizeProSco.residue(r), summaryNaval: SummarizeNaval.residue(r) });
        }

        return { models, chains, residues, stats };
    }
}
