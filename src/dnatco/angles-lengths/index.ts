import { Bin, Bins, isWithin, isWireBin, toBins } from './bin';
import { Angles, Triplet, tripletTag } from './angles';
import { Grouping } from './grouping';
import { Lengths, Pair, pairTag } from './lengths';
import { Measurements } from './measurements';
import { Residues } from '../residues';
import { VoidResult, ErrorResult, Result } from '../';
import { GlobalConfig } from '../../global-config';
import { iterate, htmlColorAsNumber } from '../../util';

type Average = [base: Residues.ElementaryResidue, tag: string, bins: Bins];
type IntervalBins = Record<
    Residues.ElementaryResidue,
    Map<
        string, // Angle or length tag
        [threshold: number, bin: Bin][] // Array of cumulative probability intervals and the "cumulative" bins that cover them
    >
>;
type Resource = [base: Residues.ElementaryResidue, tag: string, file: string];

const AngleIntervalBins: IntervalBins = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const LengthIntervalBins: IntervalBins = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const Intervals = [] as { threshold: number, color: number }[];

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

        const wireBin = await resp.json();
        if (!isWireBin(wireBin))
            throw new Error('Invalid bond angle or length object type');

        averages.push([base, tag, toBins(wireBin)]);
    }

    return averages;
}

function fileName(base: Residues.ElementaryResidue, data: { kind: 'length', v: Pair } | { kind: 'angle', v: Triplet }) {
    return `${base}_${data.kind}_${data.v.map(x => x.replace("'", "p")).join('_')}_prosco.json`;
}

function getInterval(intervalBins: [threshold: number, bin: Bin][], value: number) {
    for (let idx = 0; idx < intervalBins.length; idx++) {
        const intvl = intervalBins[idx];
        if (isWithin(value, intvl[1]))
            return {
                threshold: intvl[0],
                bin: { ...intvl[1] },
                color: Intervals[idx].color,
                index: idx,
            };
    }

    return void 0; // Outlier
}

function setIntervals(intervals: typeof Intervals, intervalBins: IntervalBins, averages: Average[]) {
    for (const [base, tag, bins] of averages) {
        for (const cumul of intervals.map(x => x.threshold)) {
            const bin = Grouping.cumulative(bins, cumul / 100.0);
            const bond = intervalBins[base].get(tag) ?? [];
            bond.push([cumul, bin]);
            intervalBins[base].set(tag, bond);
        }
    }
}

export namespace AnglesLengths {
    export async function initialize(): Promise<Result<void>> {
        const prefix = `${GlobalConfig.data().pathPrefix}/angles_lengths`;

        for (const intvl of GlobalConfig.data().angleLengthIntervals) {
            const color = htmlColorAsNumber(intvl.color);
            if (!color)
                throw new Error(`${intvl.color} is not a valid HTML color string`);

            Intervals.push({ threshold: intvl.threshold, color });
        }
        if (Intervals.length === 0)
            throw new Error('No probability intervals');
        Intervals.sort((a, b) => a.threshold - b.threshold);

        try {
            const angleAverages = await fetchAverages(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as Resource)))
            );
            const lengthAverages = await fetchAverages(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as Resource)))
            );

            setIntervals(Intervals, AngleIntervalBins, angleAverages);
            setIntervals(Intervals, LengthIntervalBins, lengthAverages);

            return VoidResult();
        } catch (e) {
            return ErrorResult((e as Error).message);
        }
    }

    export function angleInterval(base: Residues.ElementaryResidue, angle: Measurements.BondAngle) {
        const tag = tripletTag(angle.triplet);
        const intervals = AngleIntervalBins[base].get(tag);

        if (!intervals) {
            console.warn(`Unknown bond angle tag ${tag}`);
            return void 0;
        }

        return getInterval(intervals, angle.angle);
    }

    export function lengthInterval(base: Residues.ElementaryResidue, length: Measurements.BondLength) {
        const tag = pairTag(length.pair);
        const intervalBins = LengthIntervalBins[base].get(tag);

        if (!intervalBins) {
            console.warn(`Unknown bond length tag ${tag}`);
            return void 0;
        }

        return getInterval(intervalBins, length.length);
    }

    export function intervalColor(idx: number) {
        return Intervals[idx].color ?? 0;
    }

    export function intervalCount() {
        return Intervals.length;
    }
}
