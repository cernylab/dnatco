import { AnglesLengths } from './angles-lengths';
import { tripletTag, Angles, Triplet } from './angles-lengths/angles';
import { Bin } from './angles-lengths/bin';
import { pairTag, Lengths, Pair } from './angles-lengths/lengths';
import { Measurements } from './angles-lengths/measurements';
import { Summarize } from './angles-lengths/summarize';
import { Residues } from './residues';
import { objKeys } from '../util';
import { InvalidModelIndex } from '../ui/dnatco/structure-selection';

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

                x.overall = Summarize.angles(aggre);

                // Add counts for this "subaggregation" to its parent aggregation
                accumulateArray(angles.overall.cumulative, x.overall.cumulative);
                accumulateArray(angles.overall.exclusive, x.overall.exclusive);
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
                x.overall = Summarize.lengths(aggre);

                // Add counts for this "subaggregation" to its parent aggregation
                accumulateArray(lengths.overall.cumulative, x.overall.cumulative);
                accumulateArray(lengths.overall.exclusive, x.overall.exclusive);
            }

            // Add counts for this "subaggregation" to its parent aggregation
            if (haveAngles) {
                accumulateArray(alm.overallAngles.cumulative, angles.overall.cumulative);
                accumulateArray(alm.overallAngles.exclusive, angles.overall.exclusive);
            }

            if (haveLengths) {
                accumulateArray(alm.overallLengths.cumulative, lengths.overall.cumulative);
                accumulateArray(alm.overallLengths.exclusive, lengths.overall.exclusive);
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
        base: Residues.ElementaryResidue,
        angles: {
            angle: Measurements.BondAngle,
            residue: Measurements.Residue,
            pGroup?: AnglesLengths.PGroup,
            bin: MaybeBin,
        }[],
    }
    function AngleStats(base: Residues.ElementaryResidue): AngleStats {
        return {
            base,
            angles: [],
        };
    }

    export type LengthStats = {
        base: Residues.ElementaryResidue,
        lengths: {
            length: Measurements.BondLength,
            residue: Measurements.Residue,
            pGroup?: AnglesLengths.PGroup,
            bin: MaybeBin,
        }[],
    }
    function LengthStats(base: Residues.ElementaryResidue): LengthStats {
        return {
            base,
            lengths: [],
        };
    }

    export type ByCompound = {
        angles: Record<Residues.ElementaryResidue, ALM.CompoundStats<ALM.AngleStats>>,
        overallAngles: Summarize.Counts,
        lengths: Record<Residues.ElementaryResidue, ALM.CompoundStats<ALM.LengthStats>>,
        overallLengths: Summarize.Counts,
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
            },
            overallAngles: { cumulative: [], exclusive: [] },
            lengths: {
                'A': CompoundStats(),
                'C': CompoundStats(),
                'G': CompoundStats(),
                'U': CompoundStats(),
                'DA': CompoundStats(),
                'DC': CompoundStats(),
                'DG': CompoundStats(),
                'DT': CompoundStats(),
            },
            overallLengths: { cumulative: [], exclusive: [] },
        };
    }

    export type CompoundStats<T extends AngleStats | LengthStats> = {
        byMetric: Map<string, MetricStats<T>>,
        overall: Summarize.Counts,
    }
    function CompoundStats<T extends AngleStats | LengthStats>() {
        return {
            overall: { exclusive: [], cumulative: [] },
            byMetric: new Map(),
        };
    }

    export type MetricStats<T extends AngleStats | LengthStats> = {
        type: T extends AngleStats ? 'angle' : 'length';
        identifier: T extends AngleStats ? Triplet : Pair,
        overall: Summarize.Counts,
        individual: T,
    }
    function AngleMetricStats(base: Residues.ElementaryResidue, triplet: Triplet): MetricStats<AngleStats> {
        return {
            type: 'angle',
            identifier: triplet,
            overall: { exclusive: [], cumulative: [] },
            individual: AngleStats(base ),
        };
    }
    function LengthMetricStats(base: Residues.ElementaryResidue, pair: Pair): MetricStats<LengthStats> {
        return {
            type: 'length',
            identifier: pair,
            overall: { exclusive: [], cumulative: [] },
            individual: LengthStats(base),
        };
    }

    export type MaybeBin = Bin | 'below' | 'above' | 'no-data';
    export type ResidueStats = {
        angles: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
        lengths: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
        summary: Summarize.Summary;
    }

    export function emptyMappingByCompoundAngleLength() {
        return ByCompound();
    }

    export function mapByCompoundAngleLength(residues: Measurements.Residue[]) {
        const models = new Map<number, ByCompound>(); // Stats grouped by angles/lengths for entire models
        const chains = new Map<number, Map<string, ByCompound>>(); // Stats grouped by angles/lengths, categorized by model and then by chain ID

        /*
         * We need to do this in multiple passes.
         * First we need to aggregate data by individual bond angles and lengths.
         * Once we have the data aggregated like this, we can calculate summary stats.
         * Sigh...
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

                const pGroup = AnglesLengths.anglePGroup(comp, a);
                const bin: MaybeBin = AnglesLengths.angleBin(comp, a) ?? 'no-data';

                const ang = {
                    angle: a,
                    residue: r,
                    pGroup,
                    bin
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

                const pGroup = AnglesLengths.lengthPGroup(comp, l);
                const bin: MaybeBin = AnglesLengths.lengthBin(comp, l) ?? 'no-data';

                const len = {
                    length: l,
                    residue: r,
                    pGroup,
                    bin
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
                    if (x.angles[k].overall.cumulative.length > 0) {
                        accumulateArray(superAggre.angles[k].overall.cumulative, x.angles[k].overall.cumulative);
                        accumulateArray(superAggre.angles[k].overall.exclusive, x.angles[k].overall.exclusive);

                        for (const metric of x.angles[k].byMetric.keys()) {
                            const src = x.angles[k].byMetric.get(metric)!;

                            if (!superAggre.angles[k].byMetric.has(metric))
                                superAggre.angles[k].byMetric.set(metric, AngleMetricStats(k, src.identifier));
                            const dst = superAggre.angles[k].byMetric.get(metric)!

                            accumulateArray(dst.overall.cumulative, src.overall.cumulative);
                            accumulateArray(dst.overall.exclusive, src.overall.exclusive);

                            dst.individual.angles = [ ...dst.individual.angles, ...src.individual.angles ];
                        }
                    }

                    // Lengths
                    if (x.lengths[k].overall.cumulative.length > 0) {
                        accumulateArray(superAggre.lengths[k].overall.cumulative, x.lengths[k].overall.cumulative);
                        accumulateArray(superAggre.lengths[k].overall.exclusive, x.lengths[k].overall.exclusive);

                        for (const metric of x.lengths[k].byMetric.keys()) {
                            const src = x.lengths[k].byMetric.get(metric)!;

                            if (!superAggre.lengths[k].byMetric.has(metric))
                                superAggre.lengths[k].byMetric.set(metric, LengthMetricStats(k, src.identifier));
                            const dst = superAggre.lengths[k].byMetric.get(metric)!

                            accumulateArray(dst.overall.cumulative, src.overall.cumulative);
                            accumulateArray(dst.overall.exclusive, src.overall.exclusive);

                            dst.individual.lengths = [ ...dst.individual.lengths, ...src.individual.lengths ];
                        }
                    }
                }

                accumulateArray(superAggre.overallAngles.cumulative, x.overallAngles.cumulative);
                accumulateArray(superAggre.overallAngles.exclusive, x.overallAngles.exclusive);

                accumulateArray(superAggre.overallLengths.cumulative, x.overallLengths.cumulative);
                accumulateArray(superAggre.overallLengths.exclusive, x.overallLengths.exclusive);
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
                const bin = AnglesLengths.angleBin(r.compound, a) ?? 'no-data' as MaybeBin;

                angles.push({ pGroup: pgrp, bin });
            }

            const lengths = [];
            for (const l of r.bondLengths) {
                const pgrp = AnglesLengths.lengthPGroup(r.compound, l);
                const bin = AnglesLengths.lengthBin(r.compound, l) ?? 'no-data' as MaybeBin;

                lengths.push({ pGroup: pgrp, bin });
            }

            stats.push({ angles, lengths, summary: Summarize.residue(r) });
        }

        return { models, chains, residues, stats };
    }
}
