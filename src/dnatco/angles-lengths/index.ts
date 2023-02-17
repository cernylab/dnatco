import { Bin, Bins, isWithin, isWireBins, toBins, isWithinTri } from './bin';
import { Angles, Triplet, tripletTag } from './angles';
import { Grouping } from './grouping';
import { Lengths, Pair, pairTag } from './lengths';
import { Measurements } from './measurements';
import { Residues } from '../residues';
import { VoidResult, ErrorResult, Result } from '../';
import { GlobalConfig } from '../../global-config';
import { htmlColorAsNumber, iterate, objKeys } from '../../util';

/**
 * Averaged values of how probable is a particular bond angle or length of a particular base
 * to fall within a (narrow) range of values. These (narrow) ranges are expressed as an array of Bin objects.
 * Averages are obtained from an external resources.
 */
type Average = [base: Residues.ElementaryResidue, tag: string, bins: Bins];
/**
 * Averaged probability values mapped by residue and angle/length tag.
 */
type AverageData = Record<
    Residues.ElementaryResidue,
    Map<string, Bins>
>;

/**
 * Aggregated probabilities for a particular bond angle or lenght of a particular base
 * computed from the thresholds specified by PGroups.
 */
type PGroupData = Record<
    Residues.ElementaryResidue,
    Map<
        string, // Angle or length tag
        { pgroup: PGroup, groupedBins: Bin[] }[]
    >
>;
type Resource = [base: Residues.ElementaryResidue, tag: string, file: string];

const AngleAverageData: AverageData = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const LengthAverageData: AverageData = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
}

const AnglePGroupData: PGroupData = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const LengthPGroupData: PGroupData = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

export type AnglesLengthsContext = {
    angleData: AverageData;
    lengthData: AverageData;
    anglePGroupData: PGroupData;
    lengthPGroupData: PGroupData;
    pGroups: PGroup[];
    outlierColor: number;
}

type PGroup = { threshold: number, color: number };
const PGroups = new Array<PGroup>();
let OutlierColor = 0;

async function fetchAverages(prefix: string, resources: Resource[]) {
    const averages = [] as Average[];

    const requests = [] as [Residues.ElementaryResidue, string, Promise<Response>][];
    for (const [base, tag, file] of resources) {
        const req = fetch(`${prefix}/${file}`);
        requests.push([base, tag, req]);
    }

    for (const [base, tag, req] of requests) {
        const resp = await req;
        if (!resp.ok)
            throw new Error(`Bad server response: ${resp.statusText}`);

        const wireBins = await resp.json();
        if (!isWireBins(wireBins))
            throw new Error('Invalid bond angle or length object type');

        for (let idx = 0; idx < wireBins.from.length; idx++) {
            if (wireBins.from[idx] >= wireBins.to[idx])
                throw new Error('Bin has invalid range');

            if (wireBins.binprob[idx] < 0.0)
                throw new Error('Bin has invalid probability');
        }

        averages.push([base, tag, toBins(wireBins)]);
    }

    return averages;
}

function fileName(base: Residues.ElementaryResidue, data: { kind: 'length', v: Pair } | { kind: 'angle', v: Triplet }) {
    return `${base}_${data.kind}_${data.v.map(x => x.replace("'", "p")).join('_')}_prosco.json`;
}

function getBin(bins: Bins, value: number): Bin|'below'|'above' {
    let left = 0;
    let right = bins.length - 1;

    while (true) {
        const idx = Math.floor((right - left) / 2) + left;

        const b = bins[idx];
        const pos = isWithinTri(value, b);

        if (pos === 0) {
            return b;
        } else if (pos < 0) {
            if (idx === right)
                return 'below';
            right = idx;
        } else {
            if (idx === left)
                return 'above';
            left = idx;
        }
    }
}

function getPGroup(data: { pgroup: PGroup, groupedBins: Bins }[], value: number) {
    for (let idx = 0; idx < data.length; idx++) {
        const pgrp = data[idx];
        for (const b of pgrp.groupedBins) {
            if (isWithin(value, b)) {
                return {
                    ...pgrp.pgroup,
                    groupedBins: pgrp.groupedBins,
                    index: idx
                };
            }
        }
    }

    return void 0; // Outlier
}

function setAverages(data: AverageData, averages: Average[]) {
    for (const [base, tag, bins] of averages) {
        data[base].set(tag, bins);
    }
}

function setPGroupData(pgroups: typeof PGroups, data: PGroupData, averages: Average[]) {
    for (const [base, tag, bins] of averages) {
        for (const pgrp of pgroups) {
            const pgbins = Grouping.aggregate(bins, pgrp.threshold / 100.0);

            const bond = data[base].get(tag) ?? [];

            bond.push({ pgroup: pgrp, groupedBins: pgbins });
            data[base].set(tag, bond);
        }
    }
}

export namespace AnglesLengths {
    export type PGroup = ReturnType<typeof getPGroup>;
    export type PGroupData = NonNullable<ReturnType<typeof lengthPGroupData>>;

    export function context(): AnglesLengthsContext {
        return {
            angleData: { ...AngleAverageData },
            lengthData: { ...LengthAverageData },
            anglePGroupData: { ...AnglePGroupData },
            lengthPGroupData: { ...LengthPGroupData },
            pGroups: [...PGroups],
            outlierColor: OutlierColor,
        }
    }

    export async function initialize(): Promise<Result<void>> {
        const prefix = `${GlobalConfig.data().pathPrefix}/angles_lengths`;

        for (const pgrp of GlobalConfig.data().anglesLengths.pGroups) {
            const threshold = pgrp.threshold;
            if (threshold <= 0.0 || threshold >= 100.0)
                throw new Error(`Threshold value ${threshold} is not in the expected range (0 - 100)`);

            const color = htmlColorAsNumber(pgrp.color);
            if (!color)
                throw new Error(`${pgrp.color} is not a valid HTML color string`);

            PGroups.push({ threshold, color });
        }
        if (PGroups.length === 0)
            throw new Error('No probability intervals');

        PGroups.sort((a, b) => a.threshold - b.threshold);
        OutlierColor = htmlColorAsNumber(GlobalConfig.data().anglesLengths.outlierColor) ?? 0;

        try {
            const angleAverages = await fetchAverages(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as Resource)))
            );
            const lengthAverages = await fetchAverages(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as Resource)))
            );

            setAverages(AngleAverageData, angleAverages);
            setAverages(LengthAverageData, lengthAverages);

            setPGroupData(PGroups, AnglePGroupData, angleAverages);
            setPGroupData(PGroups, LengthPGroupData, lengthAverages);

            return VoidResult();
        } catch (e) {
            return ErrorResult((e as Error).message);
        }
    }

    export function initializeFromContext(ctx: AnglesLengthsContext) {
        objKeys(ctx.angleData).map((k) => AngleAverageData[k] = ctx.angleData[k]);
        objKeys(ctx.lengthData).map((k) => LengthAverageData[k] = ctx.lengthData[k]);
        objKeys(ctx.anglePGroupData).map((k) => AnglePGroupData[k] = ctx.anglePGroupData[k]);
        objKeys(ctx.lengthPGroupData).map((k) => LengthPGroupData[k] = ctx.lengthPGroupData[k]);
        ctx.pGroups.map((x, idx) => PGroups[idx] = x);
        OutlierColor = ctx.outlierColor;
    }

    export function angleAverages(base: Residues.ElementaryResidue, triplet: Triplet) {
        const tag = tripletTag(triplet);
        return AngleAverageData[base].get(tag);
    }

    export function angleBin(base: Residues.ElementaryResidue, angle: Measurements.BondAngle) {
        const bins = AngleAverageData[base].get(tripletTag(angle.triplet));
        if (!bins)
            return void 0;

        return getBin(bins, angle.angle);
    }

    export function anglePGroup(base: Residues.ElementaryResidue, angle: Measurements.BondAngle) {
        const tag = tripletTag(angle.triplet);
        const pgrps = AnglePGroupData[base].get(tag);

        if (!pgrps) {
            console.warn(`Unknown bond angle tag ${tag}`);
            return void 0;
        }

        return getPGroup(pgrps, angle.angle);
    }

    export function lengthBin(base: Residues.ElementaryResidue, length: Measurements.BondLength) {
        const bins = LengthAverageData[base].get(pairTag(length.pair));
        if (!bins)
            return void 0;

        return getBin(bins, length.length);
    }

    export function anglePGroupData(idx: number, base: Residues.ElementaryResidue, triplet: Triplet) {
        const tag = tripletTag(triplet);
        return AnglePGroupData[base].get(tag)?.[idx];
    }

    export function lengthPGroup(base: Residues.ElementaryResidue, length: Measurements.BondLength) {
        const tag = pairTag(length.pair);
        const pgrps = LengthPGroupData[base].get(tag);

        if (!pgrps) {
            console.warn(`Unknown bond length tag ${tag}`);
            return void 0;
        }

        return getPGroup(pgrps, length.length);
    }

    export function lengthAverages(base: Residues.ElementaryResidue, pair: Pair) {
        const tag = pairTag(pair);
        return LengthAverageData[base].get(tag);
    }

    export function lengthPGroupData(idx: number, base: Residues.ElementaryResidue, pair: Pair) {
        const tag = pairTag(pair);
        return LengthPGroupData[base].get(tag)?.[idx];
    }

    export function outlierColor() {
        return OutlierColor;
    }

    export function pGroupColor(idx: number) {
        return PGroups[idx]?.color;
    }

    export function pGroupCount() {
        return PGroups.length;
    }

    export function pGroupThresholds() {
        return PGroups.map(x => x.threshold);
    }
}
