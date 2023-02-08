import { Bin, Bins, isWireBin, toBins } from './bin';
import { Angles, Triplet, tripletTag } from './angles';
import { Grouping } from './grouping';
import { Lengths, Pair, pairTag } from './lengths';
import { Residues } from '../residues';
import { VoidResult, ErrorResult, Result } from '../';
import { GlobalConfig } from '../../global-config';
import { iterate } from '../../util';

type Intervals = Record<
    Residues.ElementaryResidue,
    Map<string, Map<number, Bin>>
>;

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

function fileName(base: Residues.ElementaryResidue, data: { kind: 'length', v: Pair } | { kind: 'angle', v: Triplet }) {
    return `${base}_${data.kind}_${data.v.map(x => x.replace("'", "p")).join('_')}_prosco.json`;
}

async function fetchAverages(prefix: string, resources: [base: Residues.ElementaryResidue, tag: string, file: string][]) {
    const averages = [] as [Residues.ElementaryResidue, string, Bins][];

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

export namespace AnglesLengths {
    export async function initialize(): Promise<Result<void>> {
        const prefix = `${GlobalConfig.data().pathPrefix}/angles_lengths`;

        try {
            const angleAverages = await fetchAverages(
                prefix,
                iterate(Angles).flatMap(([base, triplets]) => triplets.map(t => ([base, tripletTag(t), fileName(base, { kind: 'angle', v: t })] as [Residues.ElementaryResidue, string, string])))
            );
            const lengthAverages = await fetchAverages(
                prefix,
                iterate(Lengths).flatMap(([base, pairs]) => pairs.map(p => ([base, pairTag(p), fileName(base, { kind: 'length', v: p })] as [Residues.ElementaryResidue, string, string])))
            );

            for (const [base, tag, bins] of angleAverages) {
                for (const cumul of [80, 95, 99.9]) {
                    const bin = Grouping.cumulative(bins, cumul / 100.0);
                    const innerMap = AngleIntervals[base].get(tag) ?? new Map();
                    innerMap.set(cumul, bin);
                    AngleIntervals[base].set(tag, innerMap);
                }
            }

            for (const [base, tag, bins] of lengthAverages) {
                for (const cumul of [80, 95, 99.9]) {
                    const bin = Grouping.cumulative(bins, cumul / 100.0);
                    const innerMap = LengthIntervals[base].get(tag) ?? new Map();
                    innerMap.set(cumul, bin);
                    LengthIntervals[base].set(tag, innerMap);
                }
            }

            // @nocheckin
            console.log(AngleIntervals);
            console.log(LengthIntervals);

            return VoidResult();
        } catch (e) {
            return ErrorResult((e as Error).message);
        }
    }
}
