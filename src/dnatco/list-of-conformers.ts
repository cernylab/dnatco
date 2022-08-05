import { CANA } from './cana';
import { NtC } from './ntc';

export type ConformerInfo = {
    description: string,
    CANA: CANA.Class,
    NtC: NtC.Class,
    countInDNA: number;
    percentInDNA: number;
    countInRNA: number;
    percentInRNA: number;
    countGS: number;
    delta1: number;
    epsilon1: number;
    zeta1: number;
    alpha2: number;
    beta2: number;
    gamma2: number;
    delta2: number;
    chi1: number;
    mu: number;
    chi2: number;
    CC: number;
    NN: number;
    highlight: boolean;
}

function parseList(text: string): { list: ConformerInfo[], mapping: Map<NtC.Class, number> } {
    const lines = text.split('\n');

    const get = <T>(e: string, f: (v: string) => T) => { return f(e); };

    const list = new Array<ConformerInfo>();
    const mapping = new Map<NtC.Class, number>();

    // Skip the first line because it is the header and ignore any lines past line 98
    for (let idx = 1; idx < 98; idx++) {
        const elems = lines[idx].split(';');

        const info: ConformerInfo = {
            description: elems[0],
            CANA: get(elems[1], v => { if (!CANA.Classes.includes(v) && v !== 'NAN') throw new Error(`Invalid CANA class ${v}`); return v; }),
            NtC: get(elems[2], v => { if (!NtC.Classes.includes(v) && v !== 'NANT') throw new Error(`Invalid NtC class ${v}`); return v; }),
            countInDNA: get(elems[3], v => {
                const n = parseInt(v);
                if (isNaN(n))
                    throw new Error('Invalid RNA count');
                return n;
            }),
            percentInDNA: get(elems[4], v => {
                const n = parseFloat(v);
                if (isNaN(n))
                    throw new Error('Invalid RNA percent');
                return n;
            }),
            countInRNA: get(elems[5], v => {
                const n = parseInt(v);
                if (isNaN(n))
                    throw new Error('Invalid DNA count');
                return n;
            }),
            percentInRNA: get(elems[6], v => {
                const n = parseFloat(v);
                if (isNaN(n))
                    throw new Error('Invalid DNA percent');
                return n;
            }),
            countGS: get(elems[7], v => {
                const n = parseInt(v);
                if (isNaN(n))
                    throw new Error('Invalid total count');
                return n;
            }),
            delta1: parseFloat(elems[8]),
            epsilon1: parseFloat(elems[9]),
            zeta1: parseFloat(elems[10]),
            alpha2: parseFloat(elems[11]),
            beta2: parseFloat(elems[12]),
            gamma2: parseFloat(elems[13]),
            delta2: parseFloat(elems[14]),
            chi1: parseFloat(elems[15]),
            chi2: parseFloat(elems[16]),
            mu: parseFloat(elems[17]),
            CC: parseFloat(elems[18]),
            NN: parseFloat(elems[19]),
            highlight: elems[20] === 'y',
        };

        list.push(info);
        mapping.set(info.NtC, list.length - 1);
    }

    return { list, mapping };
}

export class _ListOfConformers {
    private _fail = '';
    private _list = new Array<ConformerInfo>();
    private _mapping = new Map<NtC.Class, number>();

    get fail() { return this._fail; }
    failed() { return this._fail.length > 0; }
    has() { return this._list.length > 0; }

    async load(url: string) {
        const resp = await fetch(url);
        if (!resp.ok) {
            console.warn(`Cannot fetch list of conformers: ${resp.statusText}`);
            this._fail = resp.statusText;
        } else {
            const text = await resp.text();

            try {
                const { list, mapping } = parseList(text);
                this._list = list;
                this._mapping = mapping;
            } catch (e) {
                console.warn(`Cannot parse list of conformers: ${e}`);
                this._fail = (e as Error).message;
            }
        }
    }

    get list() { return this._list; }
    stepByName(ntc: NtC.Class) {
        const idx = this._mapping.get(ntc);
        return idx !== undefined ? this._list[idx] : undefined;
    }
}

export const ListOfConformers = new _ListOfConformers();
