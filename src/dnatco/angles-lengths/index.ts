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
type Intervals = Record<
    Residues.ElementaryResidue,
    Map<string, [interval: number, bin:Bin][]>
>;
type Resource = [base: Residues.ElementaryResidue, tag: string, file: string];

const AngleIntervals: Intervals = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const LengthIntervals: Intervals = {
    'A': new Map(),
    'C': new Map(),
    'G': new Map(),
    'U': new Map(),
    'DA': new Map(),
    'DC': new Map(),
    'DG': new Map(),
    'DT': new Map(),
};

const IntervalColors = [] as { threshold: number, color: number }[];

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

function setIntervals(intervals: Intervals, averages: Average[]) {
    for (const [base, tag, bins] of averages) {
        for (const cumul of [80, 95, 99.9]) {
            const bin = Grouping.cumulative(bins, cumul / 100.0);
            const bond = intervals[base].get(tag) ?? [];
            bond.push([cumul, bin]);
            intervals[base].set(tag, bond);
        }
    }
}

export namespace AnglesLengths {
    export async function initialize(): Promise<Result<void>> {
        const prefix = `${GlobalConfig.data().pathPrefix}/angles_lengths`;

        for (const blk of GlobalConfig.data().angleLengthIntervals) {
            const color = htmlColorAsNumber(blk.color);
            if (!color)
                throw new Error(`${blk.color} is not a valid HTML color string`);

            IntervalColors.push({ threshold: blk.threshold, color });
        }
        if (IntervalColors.length === 0)
            throw new Error('No probability intervals');
        IntervalColors.sort((a, b) => a.threshold - b.threshold);

        try {
            const angleAverages = await fetchAverages(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as Resource)))
            );
            const lengthAverages = await fetchAverages(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as Resource)))
            );

            setIntervals(AngleIntervals, angleAverages);
            setIntervals(LengthIntervals, lengthAverages);

            return VoidResult();
        } catch (e) {
            return ErrorResult((e as Error).message);
        }
    }

    export function angleInterval(base: Residues.ElementaryResidue, angle: Measurements.BondAngle) {
        const tag = tripletTag(angle.triplet);
        const bond = AngleIntervals[base].get(tag);

        if (!bond) {
            console.warn(`Unknown bond angle tag ${tag}`);
            return void 0;
        }

        for (let idx = 0; idx < bond.length; idx++) {
            const bi = bond[idx];
            if (isWithin(angle.angle, bi[1]))
                return { threshold: bi[0], bin: { ...bi[1] }, color: IntervalColors[idx].color };
        }

        return void 0; // Outlier
    }

    export function lengthInterval(base: Residues.ElementaryResidue, length: Measurements.BondLength) {
        const tag = pairTag(length.pair);
        const bond = LengthIntervals[base].get(tag);

        if (!bond) {
            console.warn(`Unknown bond length tag ${tag}`);
            return void 0;
        }

        for (let idx = 0; idx < bond.length; idx++) {
            const bi = bond[idx];
            if (isWithin(length.length, bi[1]))
                return { threshold: bi[0], bin: { ...bi[1] }, color: IntervalColors[idx].color };
        }

        return void 0; // Outlier
    }
}
