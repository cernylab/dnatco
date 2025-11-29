import { Bin, Bins, isBinValid, isWireBins, toBins, WireBins } from './bin';
import { Angles, Triplet, tripletTag } from './angles';
import { isShiftedName, unshiftName } from './atoms';
import { Grouping } from './grouping';
import { Lengths, Pair, pairTag } from './lengths';
import { Measurements } from './measurements';
import { Naval, ZPrime, isNavalZPrime } from './naval';
import { isWireReferenceSets, References, WireReferenceSets } from './reference-sets';
import { type MappedNaval } from '../dnatcofication';
import { type Validation } from '../naval/validation';
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
 *  @nocheckin
 *  NO NO NO - Document what it actually is
 */
type PGroupData = Record<
    ElementaryResidue,
    Map<
        string, // Angle or length tag
        Record<ProScoGroup, Bin[]>
    >
>;
type Resource = [base: Residues.ElementaryResidue, tag: string, file: string];

export type NavalItem = {
    csdPreferredLeft: number;
    csdPreferredRight: number;
    value: number;
};
export function NavalItem(item: Validation.ReportItem<Validation.AngleAtoms | Validation.BondAtoms>): NavalItem {
    const threeSigma = 3 * item.target_sigma;

    return {
        csdPreferredLeft: item.target_value - threeSigma,
        csdPreferredRight: item.target_value + threeSigma,
        value: item.target_value,
    };
}
const EmptyNavalItem: NavalItem = {
    csdPreferredLeft: -1,
    csdPreferredRight: -1,
    value: -1,
};
function isInvalidNavalValue(v: number) {
    return v < 0;
}

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

type ReferenceSets = Record<
    ElementaryResidue,
    Map<
        string, // Angle or length tag
        References[]
    >
>;

export const ProScoCommonBottomThreshold = 0.05;

export const ProScoGroups = [ 'common', 'rare', 'ambiguous', 'unique' ] as const;
export type ProScoGroup = typeof ProScoGroups[number];

export const NavalRankingClasses = [ 'preferred', 'allowed', 'of-concern' ] as const;
export type NavalRankingClass = typeof NavalRankingClasses[number];

export const NavalPGroupCount = 2; // Preferred, Allowed, OfConcern is outlier

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

const LengthReferenceSets: ReferenceSets = {
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

const AngleReferenceSets: ReferenceSets = {
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
    pGroupColors: typeof PGroupColors;
    outlierColor: number;
    outlierName: string;
    angleNavalRankings: NavalRanking;
    lengthNavalRankings: NavalRanking;
    angleReferenceSets: ReferenceSets;
    lengthReferenceSets: ReferenceSets;
};

let OutlierColor = 0;
let OutlierName = 'Outlier';
let NavalPrefferedColor = 0x0000FF00;
let NavalAllowedColor   = 0x00FFFF00;
let NavalOfConcernColor = 0x00FF0000;
let PGroupColors: Record<ProScoGroup, number> = {
    unique: 0x00FF0000,
    ambiguous: 0x00CCCC00,
    rare: 0x00FFFF00,
    common: 0x0000FF00,
};

function checkReferenceData(data: object): asserts data is (WireBins & ZPrime & WireReferenceSets) {
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

    if (!isWireReferenceSets(data))
        throw new Error('Invalid Reference Sets object type');

    if (data.from.length !== data.rs.bins.length)
        throw new Error(`Mismatching number of ProSco bins and reference set Bins (${data.from.length} vs. ${data.rs.bins}`);
}

function compareNavalAtom(
    a: Validation.Atom,
    name: string,
    seqId: number,
    altId: string
) {
    const altIdMatch = a.altloc === "" || altId === "" || a.altloc === altId;
    const isShifted = isShiftedName(name);
    const _name = isShifted ? unshiftName(name) : name;
    const _seqId = isShifted ? seqId - 1 : seqId;

    return a.name === _name && a.seqId === _seqId && altIdMatch;
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
    const referenceSets = {
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

            referenceSets[base].set(tag, data.rs.bins);
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

            referenceSets[base].set(tag, data.rs.bins);
        }
    }

    return { averages, navalRankings, referenceSets };
}

function fileName(base: ElementaryResidue, data: { kind: 'length', v: Pair } | { kind: 'angle', v: Triplet }) {
    return `${base}_${data.kind}_${data.v.map(x => x.replace("'", "p")).join('_')}_prosco.json`;
}

function getBinIndex(bins: Bins, value: number): number|'below'|'above' {
    let left = 0;
    let right = bins.length - 1;

    while (true) {
        const idx = Math.floor((right - left) / 2) + left;

        const b = bins[idx];
        const pos = isWithinTri(value, b);

        if (pos === 0) {
            return idx;
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

function getBin(bins: Bins, value: number): Bin|'below'|'above' {
    const v = getBinIndex(bins, value);
    switch (v) {
        case 'above':
        case 'below':
            return v;
        default:
            return bins[v];
    }
}

function getPGroup(data: Record<ProScoGroup, Bin[]>, value: number) {
    for (const k of ProScoGroups) {
        const groupedBins = data[k];

        for (const b of groupedBins) {
            if (isWithin(value, b)) {
                return {
                    pGroup: k,
                    groupedBins,
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

function setPGroupData(data: PGroupData, averages: Average[], referenceSets: ReferenceSets) {
    for (const [base, tag, bins] of averages) {
        const rs = referenceSets[base].get(tag)!;
        const nReferences = rs.reduce((p, c) => p + c.length, 0);
        const rareBottomThreshold = 1.0 / nReferences;

        if (GlobalConfig.data().anglesLengths.debugProScoGrouping) {
            console.log(base, tag, rareBottomThreshold, nReferences);
        }

        const {
            lowerUnique,
            upperUnique,
            ambiguous,
            rare,
            common
        } = Grouping.aggregate(bins, rareBottomThreshold);

        const unique = [];
        if (isBinValid(lowerUnique)) unique.push(lowerUnique);
        if (isBinValid(upperUnique)) unique.push(upperUnique);

        data[base].set(tag, {
            unique,
            ambiguous,
            rare,
            common
        });
    }
}

function setNavalRankings(target: NavalRanking, source: NavalRanking) {
    for (const base of objKeys(source)) {
        target[base] = source[base];
    }
}

function setReferenceSets(target: ReferenceSets, source: ReferenceSets) {
    for (const base of objKeys(source)) {
        target[base] = source[base];
    }
}

export namespace AnglesLengths {
    export type PGroup = ReturnType<typeof getPGroup>;
    export type PGroupData = NonNullable<ReturnType<typeof lengthPGroupData>>;

    export const NavalRankingClassToIndex: Record<NavalRankingClass, 0 | 1 | 2> = {
        'preferred': 0,
        'allowed': 1,
        'of-concern': 2,
    };
    export const IndexToNavalRankingClass: Record<
        typeof NavalRankingClassToIndex[keyof typeof NavalRankingClassToIndex],
        NavalRankingClass
    > = {
        0: 'preferred',
        1: 'allowed',
        2: 'of-concern',
    };

    export function context(): AnglesLengthsContext {
        return {
            angleData: { ...AngleAverageData },
            lengthData: { ...LengthAverageData },
            anglePGroupData: { ...AnglePGroupData },
            lengthPGroupData: { ...LengthPGroupData },
            pGroupColors: { ...PGroupColors },
            outlierColor: OutlierColor,
            outlierName: OutlierName,
            angleNavalRankings: { ...AngleNavalRankings },
            lengthNavalRankings: { ...LengthNavalRankings },
            angleReferenceSets: { ...AngleReferenceSets },
            lengthReferenceSets: { ...LengthReferenceSets },
        };
    }

    export async function initialize(loaderFunc?: (subpath: string) => string): Promise<Result<void>> {
        const prefix = `${GlobalConfig.data().pathPrefix}/angles_lengths`;

        for (const pgrp of GlobalConfig.data().anglesLengths.pGroups) {
            if (!ProScoGroups.includes(pgrp.name as ProScoGroup))
                throw new Error(`${pgrp.name} is not a valid ProSco group name`);
            const color = htmlColorAsNumber(pgrp.color);
            if (!color)
                throw new Error(`${pgrp.color} is not a valid HTML color string`);

            PGroupColors[pgrp.name as ProScoGroup] = color;
        }

        OutlierColor = htmlColorAsNumber(GlobalConfig.data().anglesLengths.outlierColor) ?? 0;
        OutlierName = GlobalConfig.data().anglesLengths.outlierName;

        const tryColor = (color: number | undefined) => {
            if (!color)
                throw new Error(`${color} is not a valid HTML color string`);
            return color
        };
        NavalPrefferedColor = tryColor(htmlColorAsNumber(GlobalConfig.data().anglesLengths.navalPreferredColor));
        NavalAllowedColor = tryColor(htmlColorAsNumber(GlobalConfig.data().anglesLengths.navalAllowedColor));
        NavalOfConcernColor = tryColor(htmlColorAsNumber(GlobalConfig.data().anglesLengths.navalOfConcernColor));

        try {
            const {
                averages: angleAverages,
                navalRankings: angleNavalRankings,
                referenceSets: angleReferenceSets
            } = await fetchReferenceData(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as Resource))),
                loaderFunc
            );
            const {
                averages: lengthAverages,
                navalRankings: lengthNavalRankings,
                referenceSets: lengthReferenceSets
            } = await fetchReferenceData(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as Resource))),
                loaderFunc
            );

            setAverages(AngleAverageData, angleAverages);
            setAverages(LengthAverageData, lengthAverages);

            setPGroupData(AnglePGroupData, angleAverages, angleReferenceSets);
            setPGroupData(LengthPGroupData, lengthAverages, lengthReferenceSets);

            setNavalRankings(AngleNavalRankings, angleNavalRankings);
            setNavalRankings(LengthNavalRankings, lengthNavalRankings);

            setReferenceSets(AngleReferenceSets, angleReferenceSets);
            setReferenceSets(LengthReferenceSets, lengthReferenceSets);

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
        objKeys(ctx.angleNavalRankings).map((k) => AngleNavalRankings[k] = ctx.angleNavalRankings[k]);
        objKeys(ctx.lengthNavalRankings).map((k) => LengthNavalRankings[k] = ctx.lengthNavalRankings[k]);
        objKeys(ctx.angleReferenceSets).map((k) => AngleReferenceSets[k] = ctx.angleReferenceSets[k]);
        objKeys(ctx.lengthReferenceSets).map((k) => LengthReferenceSets[k] = ctx.lengthReferenceSets[k]);
        ctx.pGroupColors = { ...ctx.pGroupColors };
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

    export function angleBinIndex(base: ElementaryResidue, angle: Measurements.BondAngle) {
        const bins = AngleAverageData[base].get(tripletTag(angle.triplet));
        if (!bins)
            return -1

        return getBinIndex(bins, angle.angle);
    }

    export function angleBinFromIndex(base: ElementaryResidue, angle: Measurements.BondAngle, binIndex: number | 'above' | 'below') {
        if (binIndex === 'above' || binIndex === 'below') return binIndex;

        const bins = AngleAverageData[base].get(tripletTag(angle.triplet));
        if (!bins)
            return void 0;

        return bins[binIndex];
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

    export function lengthBinIndex(base: ElementaryResidue, length: Measurements.BondLength) {
        const bins = LengthAverageData[base].get(pairTag(length.pair));
        if (!bins)
            return -1

        return getBinIndex(bins, length.length);
    }

    export function lengthBinFromIndex(base: ElementaryResidue, length: Measurements.BondLength, binIndex: number | 'above' | 'below') {
        if (binIndex === 'above' || binIndex === 'below') return binIndex;

        const bins = LengthAverageData[base].get(pairTag(length.pair));
        if (!bins)
            return void 0;

        return bins[binIndex];
    }

    export function anglePGroupData(group: ProScoGroup, base: ElementaryResidue, triplet: Triplet) {
        const tag = tripletTag(triplet);
        return AnglePGroupData[base].get(tag)?.[group];
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

    export function lengthPGroupData(group: ProScoGroup, base: ElementaryResidue, pair: Pair) {
        const tag = pairTag(pair);
        return LengthPGroupData[base].get(tag)?.[group]
    }

    export function outlierColor() {
        return OutlierColor;
    }

    export function outlierName() {
        return OutlierName;
    }

    export function pGroupColor(group: ProScoGroup | 'outlier') {
        if (group === 'outlier') return outlierColor();
        return PGroupColors[group];
    }

    export function navalAngle(naval: MappedNaval, r: Measurements.Residue, triplet: Triplet) {
        const [na, nb, nc] = triplet;
        const niIdx = naval.anglesMapping
            .get(r.modelNum)
            ?.get(r.chain)
            ?.get(r.seqId)
            ?.find((idx) => {
                const { a, b, c } = naval.angles[idx].atoms;
                return (
                    (compareNavalAtom(a, na, r.seqId, r.altId) || compareNavalAtom(a, nc, r.seqId, r.altId)) &&
                    compareNavalAtom(b, nb, r.seqId, r.altId) &&
                    (compareNavalAtom(c, na, r.seqId, r.altId) || compareNavalAtom(c, nc, r.seqId, r.altId))
                );
        }) ?? -1;

        return niIdx === -1 ? EmptyNavalItem : NavalItem(naval.angles[niIdx]);
    }

    export function navalBond(naval: MappedNaval, r: Measurements.Residue, pair: Pair) {
        const [na, nb] = pair;
        const niIdx = naval.bondsMapping
            .get(r.modelNum)
            ?.get(r.chain)
            ?.get(r.seqId)
            ?.find((idx) => {
                const rr = naval.bonds[idx];
                const { a, b } = rr.atoms;

                return (
                    (compareNavalAtom(a, na, r.seqId, r.altId) || compareNavalAtom(a, nb, r.seqId, r.altId)) &&
                    (compareNavalAtom(b, na, r.seqId, r.altId) || compareNavalAtom(b, nb, r.seqId, r.altId))
                );
            }) ?? -1;

        return niIdx === -1 ? EmptyNavalItem : NavalItem(naval.bonds[niIdx]);
    }

    export function navalPreferredLowerBound(navalValue: number, bins?: Bins) {
        if (!bins && isInvalidNavalValue(navalValue)) {
            console.error('Requested NA-VAL preferred upper bound but neither NA-VAL nor ProSco data is available to calculate it');
            return 0;
        }

        if (!bins) return navalValue;
        // This assumes that the bins are sorted and they should be
        if (isInvalidNavalValue(navalValue)) return bins[0].from;

        for (const bin of bins) {
            if (bin.from > navalValue) {
                // Naval value is more permissive than ProSco
                return navalValue;
            }

            if (bin.prosco >= ProScoCommonBottomThreshold) {
                // ProSco value is more permissive than Naval
                return bin.from;
            }
        }

        // We should not get here
        return navalValue;
    }

    export function navalPreferredUpperBound(navalValue: number, bins?: Bins) {
        if (!bins && isInvalidNavalValue(navalValue)) {
            console.error('Requested NA-VAL preferred upper bound but neither NA-VAL nor ProSco data is available to calculate it');
            return 0;
        }

        if (!bins) return navalValue;
        // This assumes that the bins are sorted and they should be
        if (isInvalidNavalValue(navalValue)) return bins[bins.length - 1].to;

        for (let idx = bins.length - 1; idx >= 0; idx--) {
            const bin = bins[idx];

            if (bin.to < navalValue) {
                // Naval value is more permissive than ProSco
                return navalValue;
            }

            if (bin.prosco >= ProScoCommonBottomThreshold) {
                // ProSco value is more permissive than Naval
                return bin.to;
            }
        }

        // We should not get here
        return navalValue;
    }

    export function navalRankingClass(
        value: number,
        navalRanking: NavalRankingData,
        navalValueLower: number,
        navalValueUpper: number,
        bins?: Bins,
    ): NavalRankingClass {
        const preferredLower = navalPreferredLowerBound(navalValueLower, bins);
        const preferredUpper = navalPreferredUpperBound(navalValueUpper, bins);

        if (value <= navalRanking.ofConcernLower) return 'of-concern';
        else if (value >= navalRanking.ofConcernUpper) return 'of-concern';
        else if (value <= preferredLower || value >= preferredUpper) return 'allowed';

        return 'preferred';
    }

    export function navalRankingClassColor(cls: NavalRankingClass) {
        switch (cls) {
            case 'of-concern': return NavalOfConcernColor;
            case 'allowed': return NavalAllowedColor;
            case 'preferred': return NavalPrefferedColor;
        }
    }

    export function nearestAngleReferenceLower(binIndex: number, base: ElementaryResidue, triplet: Triplet) {
        if (binIndex < 0) return void 0;

        const refs = AngleReferenceSets[base].get(tripletTag(triplet));
        if (!refs) return void 0;

        for (let idx = binIndex; idx >= 0; idx--) {
            const candidate = refs[idx][0];
            if (candidate) return candidate;
        }

        return void 0;
    }

    export function nearestAngleReferenceUpper(binIndex: number, base: ElementaryResidue, triplet: Triplet) {
        if (binIndex < 0) return void 0;

        const refs = AngleReferenceSets[base].get(tripletTag(triplet));
        if (!refs) return void 0;

        for (let idx = binIndex; idx < refs.length; idx++) {
            const candidate = refs[idx][0];
            if (candidate) return candidate;
        }

        return void 0;
    }

    export function nearestLengthReferenceLower(binIndex: number, base: ElementaryResidue, pair: Pair) {
        if (binIndex < 0) return void 0;

        const refs = LengthReferenceSets[base].get(pairTag(pair));
        if (!refs) return void 0;

        for (let idx = binIndex; idx >= 0; idx--) {
            const candidate = refs[idx][0];
            if (candidate) return candidate;
        }

        return void 0;
    }

    export function nearestLengthReferenceUpper(binIndex: number, base: ElementaryResidue, pair: Pair) {
        if (binIndex < 0) return void 0;

        const refs = LengthReferenceSets[base].get(pairTag(pair));
        if (!refs) return void 0;

        for (let idx = binIndex; idx < refs.length; idx++) {
            const candidate = refs[idx][0];
            if (candidate) return candidate;
        }

        return void 0;
    }
}
