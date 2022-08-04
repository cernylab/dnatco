import { WebApi } from './web-api';
import { CANA } from '../dnatco/cana';
import { NtC } from '../dnatco/ntc';
import { EventsKeeper } from '../util/events-keeper';
import '../../assets/search.php';

export class Search {
    private ek = new EventsKeeper();
    private _results: Search.FoundStep[] = [];

    readonly events = {
        resultsChanged: this.ek.subject<Search.FoundStep[]>(),
    }

    haveResults() { return this._results.length > 0; }

    get results() {
        return this._results;
    }

    set results(results: Search.FoundStep[]) {
        this._results = results;
        this.events.resultsChanged.next(this._results);
    }
}

export namespace Search {
    const FoundStep = {
        name: '',
        NtC: 'AA00',
        nearestNtC: 'AA00',
        CANA: 'AAA',
        confal: 0,
        delta1: 0,
        epsilon1: 0,
        zeta1: 0,
        alpha2: 0,
        beta2: 0,
        gamma2: 0,
        delta2: 0,
        chi1: 0,
        chi2: 0,
        resolution: 0,
        numsteps: 0,
        rmsd: 0,
    }
    export type FoundStep = typeof FoundStep;

    function isFoundStep(obj: any): obj is FoundStep {
        if (obj === null || obj === undefined || typeof obj !== 'object')
            return false;

        const keys = Object.keys(obj);
        for (const prop in FoundStep) {
            if (!keys.includes(prop))
                return false;

            if (typeof obj[prop] !== typeof FoundStep[prop as keyof FoundStep])
                return false;
        }

        const tObj = obj as FoundStep;
        if (!NtC.Conformers.includes(tObj.NtC))
            return false;
        if (!NtC.Conformers.includes(tObj.nearestNtC))
            return false;
        if (!CANA.Classes.includes(tObj.CANA))
            return false;

        return true;
    }

    function isFoundStepList(obj: unknown): obj is FoundStep[] {
        if (!Array.isArray(obj))
            return false;

        for (const o of obj) {
            if (!isFoundStep(o))
                return false;
        }

        return true;
    }

    export function requestSearch(NtC: string, maxCount: number, redundant: boolean, large: boolean): WebApi.Pending {
        const req: WebApi.Requests.Search = {
            type: 'search',
            NtC,
            maxCount,
            redundant,
            large
        };

        return WebApi.request('./search.php', req);
    }

    export async function resolveSearch(pending: WebApi.Pending) {
        return await WebApi.resolve<FoundStep[]>(pending, isFoundStepList);
    }
}
