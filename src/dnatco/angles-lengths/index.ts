import { Bin, Bins, isWireBins, toBins, WireBins } from './bin';
import { Angles, Triplet, tripletTag } from './angles';
import { Grouping } from './grouping';
import { Lengths, Pair, pairTag } from './lengths';
import { Measurements } from './measurements';
import { Naval, ZPrime, isNavalZPrime } from './naval';
import { Residues } from '../residues';
import { VoidResult, ErrorResult, Result } from '../';
import { GlobalConfig } from '../../global-config';
import { Logger } from '../../log/logger';
import { htmlColorAsNumber, isWithin, isWithinTri, iterate, objKeys } from '../../util';

export type ElementaryResidue = Residues.ElementaryResidue | 'DU';
export function isAnglesLengthsElementaryResidue(name: string): name is ElementaryResidue {
    return Residues.isElementaryResidue(name) || name === 'DU';
}

/**
 * Averaged values of how probable is a particular bond angle or length of a particular base
 * to fall within a (narrow) range of values. These (narrow) ranges are expressed as an array of Bin objects.
 * Averages are obtained from an external resources.
 */
type Average = [base: ElementaryResidue, tag: string, bins: Bins];
/**
 * Averaged probability values mapped by residue and angle/length tag.
 */
type AverageData = Record<
    ElementaryResidue,
    Map<string, Bins>
>;

/**
 * Aggregated probabilities for a particular bond angle or lenght of a particular base
 * computed from the thresholds specified by PGroups.
 */
type PGroupData = Record<
    ElementaryResidue,
    Map<
        string, // Angle or length tag
        { pgroup: PGroup, groupedBins: Bin[] }[]
    >
>;
type Resource = [base: Residues.ElementaryResidue, tag: string, file: string];

export type NavalRankingData = {
    weightedMedian: number,
    scaleFactorLower: number,
    scaleFactorUpper: number,
    ofConcernLower: number,
    ofConcernUpper: number,
};
type NavalRanking = Record<
    ElementaryResidue,
    Map<
        string, // Angle or length tag
        NavalRankingData
    >
>;

const AngleAverageData: AverageData = {
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

const LengthAverageData: AverageData = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
    'DU': new Map(),
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
    'DU': new Map(),
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
    'DU': new Map(),
};

const LengthNavalRankings: NavalRanking = {
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

const AngleNavalRankings: NavalRanking = {
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



export type AnglesLengthsContext = {
    angleData: AverageData;
    lengthData: AverageData;
    anglePGroupData: PGroupData;
    lengthPGroupData: PGroupData;
    pGroups: PGroup[];
    outlierColor: number;
    angleNavalRankings: NavalRanking,
    lengthNavalRankings: NavalRanking,
}

type PGroup = { threshold: number, color: number };
const PGroups = new Array<PGroup>();
let OutlierColor = 0;

function checkReferenceData(data: object): asserts data is (WireBins & ZPrime) {
    if (!isWireBins(data))
        throw new Error('Invalid bond angle or length object type');

    for (let idx = 0; idx < data.from.length; idx++) {
        if (data.from[idx] >= data.to[idx])
            throw new Error('Bin has invalid range');

        if (data.binprob[idx] < 0.0)
            throw new Error('Bin has invalid probability');
    }

    if (!isNavalZPrime(data))
        throw new Error('Invalid Naval classification object type');
}

async function fetchReferenceData(prefix: string, resources: Resource[], loaderFunc?: (subpath: string) => string) {
    const averages = [] as Average[];
    const navalRankings = {
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

    if (loaderFunc) {
        for (const [base, tag, file] of resources) {
            const text = loaderFunc(`${prefix}/${file}`);

            const data = JSON.parse(text);
            checkReferenceData(data);

            averages.push([base, tag, toBins(data)]);

            const z = data.zprime;
            const naval = Naval(z.weightedMedian, z.scaleFactorLower, z.scaleFactorUpper, z.ofConcernLower, z.ofConcernUpper);
            navalRankings[base].set(tag, naval);
        }
    } else {
        const requests = [] as [Residues.ElementaryResidue, string, Promise<Response>][];
        for (const [base, tag, file] of resources) {
            const req = fetch(`${prefix}/${file}`);
            requests.push([base, tag, req]);
        }

        for (const [base, tag, req] of requests) {
            const resp = await req;
            if (!resp.ok)
                throw new Error(`Bad server response: ${resp.statusText}`);

            const data = await resp.json();
            checkReferenceData(data);

            averages.push([base, tag, toBins(data)]);

            const z = data.zprime;
            const naval = Naval(z.weightedMedian, z.scaleFactorLower, z.scaleFactorUpper, z.ofConcernLower, z.ofConcernUpper);
            navalRankings[base].set(tag, naval);
        }
    }

    return { averages, navalRankings };
}

function fileName(base: ElementaryResidue, data: { kind: 'length', v: Pair } | { kind: 'angle', v: Triplet }) {
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

function setNavalRankings(target: NavalRanking, source: NavalRanking) {
    for (const base of  objKeys(source)) {
        target[base] = source[base];
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
            angleNavalRankings: { ...AngleNavalRankings },
            lengthNavalRankings: { ...LengthNavalRankings },
        }
    }

    export async function initialize(loaderFunc?: (subpath: string) => string): Promise<Result<void>> {
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
            const { averages: angleAverages, navalRankings: angleNavalRankings } = await fetchReferenceData(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as Resource))),
                loaderFunc
            );
            const { averages: lengthAverages, navalRankings: lengthNavalRankings } = await fetchReferenceData(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as Resource))),
                loaderFunc
            );

            setAverages(AngleAverageData, angleAverages);
            setAverages(LengthAverageData, lengthAverages);

            setPGroupData(PGroups, AnglePGroupData, angleAverages);
            setPGroupData(PGroups, LengthPGroupData, lengthAverages);

            setNavalRankings(AngleNavalRankings, angleNavalRankings);
            setNavalRankings(LengthNavalRankings, lengthNavalRankings);

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

    export function angleAverages(base: ElementaryResidue, triplet: Triplet) {
        const tag = tripletTag(triplet);
        return AngleAverageData[base].get(tag);
    }

    export function angleBin(base: ElementaryResidue, angle: Measurements.BondAngle) {
        const bins = AngleAverageData[base].get(tripletTag(angle.triplet));
        if (!bins)
            return void 0;

        return getBin(bins, angle.angle);
    }

    export function angleNavalRanking(base: ElementaryResidue, angle: Measurements.BondAngle) {
        const n = AngleNavalRankings[base].get(tripletTag(angle.triplet));
        if (!n) throw new Error(`No Naval ranking for angle of ${base} - ${angle.triplet}`);

        return n;
    }

    export function anglePGroup(base: ElementaryResidue, angle: Measurements.BondAngle) {
        const tag = tripletTag(angle.triplet);
        const pgrps = AnglePGroupData[base].get(tag);

        if (!pgrps) {
            Logger.log(Logger.Severity.Warning, `Unknown bond angle tag ${tag}`);
            return void 0;
        }

        return getPGroup(pgrps, angle.angle);
    }

    export function lengthBin(base: ElementaryResidue, length: Measurements.BondLength) {
        const bins = LengthAverageData[base].get(pairTag(length.pair));
        if (!bins)
            return void 0;

        return getBin(bins, length.length);
    }

    export function anglePGroupData(idx: number, base: ElementaryResidue, triplet: Triplet) {
        const tag = tripletTag(triplet);
        return AnglePGroupData[base].get(tag)?.[idx];
    }

    export function lengthPGroup(base: ElementaryResidue, length: Measurements.BondLength) {
        const tag = pairTag(length.pair);
        const pgrps = LengthPGroupData[base].get(tag);

        if (!pgrps) {
            Logger.log(Logger.Severity.Warning, `Unknown bond length tag ${tag}`);
            return void 0;
        }

        return getPGroup(pgrps, length.length);
    }

    export function lengthAverages(base: ElementaryResidue, pair: Pair) {
        const tag = pairTag(pair);
        return LengthAverageData[base].get(tag);
    }

    export function lengthNavalRanking(base: ElementaryResidue, length: Measurements.BondLength) {
        const n = LengthNavalRankings[base].get(pairTag(length.pair));
        if (!n) throw new Error(`No Naval data for length of ${base} - ${length.pair}`);

        return n;
    }

    export function lengthPGroupData(idx: number, base: ElementaryResidue, pair: Pair) {
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
