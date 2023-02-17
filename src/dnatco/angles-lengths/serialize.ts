import { AnglesLengths } from '.';
import { Triplet } from './angles';
import { Pair } from './lengths';
import { Measurements } from './measurements';
import { Serialization } from '../../util/serialization';
import { Summarize } from './summarize';

const DetailsHeader = ['kind', 'model', 'chain', 'seqid', 'inscode', 'altid', 'auth_chain', 'auth_seqid', 'compound', 'percentile', 'name', 'value'];

export namespace Serialize {
    type Detail = { name: string, value: number, threshold: number|null };
    type Residue = {
        model: number,
        chain: string,
        seqId: number,
        insCode: string|null,
        altId: string|null,
        authChain: string,
        authSeqId: number,
        compound: string,
        details: Detail[]
    };

    function angleName(t: Triplet) {
        return t.join('-');
    }

    function anglesToSerializable(residues: Measurements.Residue[]): Serialization.Serializable {
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
        values.push(residues.flatMap(x => x.bondAngles.map(a => AnglesLengths.anglePGroup(x.compound, a)?.threshold ?? 'outlier')));
        values.push(residues.flatMap(x => x.bondAngles.map(a => angleName(a.triplet))));
        values.push(residues.flatMap(x => x.bondAngles.map(a => a.angle)));

        return { tags, values };
    }

    function lengthName(p: Pair) {
        return p.join('-');
    }

    function lengthsToSerializable(residues: Measurements.Residue[]): Serialization.Serializable {
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
        values.push(residues.flatMap(x => x.bondLengths.map(l => AnglesLengths.lengthPGroup(x.compound, l)?.threshold ?? 'outlier')));
        values.push(residues.flatMap(x => x.bondLengths.map(l => lengthName(l.pair))));
        values.push(residues.flatMap(x => x.bondLengths.map(l => l.length)));

        return { tags, values };
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

    function statsToSerializable(counts: Summarize.CountsInGroup[], kind: 'a'|'l'): Serialization.Serializable {
        const tags = ['kind', 'percentile', 'cumulative_count', 'exclusive_count'];
        const values = new Array<(number|string)[]>();

        values.push((new Array<string>(counts.length)).fill(kind));
        values.push(counts.map(x => x.threshold));
        values.push(counts.map(x => x.cumulative));
        values.push(counts.map(x => x.exclusive));

        return { tags, values };
    }

    export function toCsv(countsAngles: Summarize.CountsInGroup[], countsLengths: Summarize.CountsInGroup[], residues: Measurements.Residue[]) {
        const statsAngles = Serialization.toCsv(statsToSerializable(countsAngles, 'a'));
        const statsLengths = Serialization.toCsv(statsToSerializable(countsLengths, 'l'));
        const angles = Serialization.toCsv(anglesToSerializable(residues));
        const lengths = Serialization.toCsv(lengthsToSerializable(residues));

        return statsLengths + '\n' + statsAngles + '\n' + lengths + '\n' + angles;
    }

    export function toJson(countsAngles: Summarize.CountsInGroup[], countsLengths: Summarize.CountsInGroup[], residues: Measurements.Residue[]) {
        type Stats = { percentile: number|null, cumulativeCount: number, exclusiveCount: number };

        const anglesStats: Stats[] = countsAngles.map(x => ({ percentile: x.threshold, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));
        const lengthsStats: Stats[] = countsLengths.map(x => ({ percentile: x.threshold, cumulativeCount: x.cumulative, exclusiveCount: x.exclusive }));

        const angles = new Array<Residue>();
        const lengths = new Array<Residue>();
        for (const r of residues) {
            const anglesDetails: Detail[] = r.bondAngles.map(x => ({ name: angleName(x.triplet), value: x.angle, threshold: AnglesLengths.anglePGroup(r.compound, x)?.threshold ?? null }));
            const lengthsDetails: Detail[] = r.bondLengths.map(x => ({ name: lengthName(x.pair), value: x.length, threshold: AnglesLengths.lengthPGroup(r.compound, x)?.threshold ?? null }));

            angles.push(residueWithDetails(r, anglesDetails));
            lengths.push(residueWithDetails(r, lengthsDetails));
        }

        return JSON.stringify({
            anglesStats,
            lengthsStats,
            angles,
            lengths,
        });
    }
}
