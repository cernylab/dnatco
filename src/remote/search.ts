import { CANA } from '../dnatco/cana';
import { NtC } from '../dnatco/ntc';
import { Logger } from '../log/logger';
import { objKeys } from '../util';
import { EventsKeeper } from '../util/events-keeper';
import { WebApi } from '../web-api';
import { Requests } from '../web-api/requests';

export class Search {
    private ek = new EventsKeeper();
    private _results: Search.FoundStep[] = [];
    private _criteria = Search.Criteria;

    readonly events = {
        resultsChanged: this.ek.subject<Search.FoundStep[]>(),
    }

    haveResults() { return this._results.length > 0; }

    get criteria() {
        if (!this.haveResults())
            return Search.Criteria;
        return this._criteria;
    }

    get results() {
        return this._results;
    }

    setResults(results: Search.FoundStep[], criteria: Search.Criteria) {
        this._results = results;
        this._criteria = criteria;
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
        resolution: 0 as (number | null),
        numsteps: 0,
        rmsd: 0,
    }
    export type FoundStep = typeof FoundStep;
    export type FoundSteps = FoundStep[];

    export const Criteria = {
        NtC: 'AA00',
        maxCount: 200,
        redundant: false,
        largeStructures: false,
    }
    export type Criteria = typeof Criteria;

    function isFoundStep(obj: any): obj is FoundStep {
        if (obj === null || obj === undefined || typeof obj !== 'object')
            return false;

        const keys = objKeys(obj);
        for (const prop of objKeys(FoundStep)) {
            if (!keys.includes(prop))
                return false;

            if (prop === 'resolution' && obj[prop] === null)
                continue; // Having null for "resolution" is fine

            if (typeof obj[prop] !== typeof FoundStep[prop as keyof FoundStep]) {
                Logger.log(Logger.Severity.Warning, [prop, typeof obj[prop], typeof FoundStep[prop as keyof FoundStep], obj[prop]].join(', '));
                return false;
            }
        }

        const tObj = obj as FoundStep;
        if (!NtC.isNtCClass(tObj.NtC))
            return false;
        if (!NtC.isNtCClass(tObj.nearestNtC))
            return false;
        if (!CANA.Classes.includes(tObj.CANA))
            return false;

        return true;
    }

    function isFoundSteps(obj: unknown): obj is FoundSteps {
        if (!Array.isArray(obj))
            return false;

        for (const o of obj) {
            if (!isFoundStep(o))
                return false;
        }

        return true;
    }

    export function requestSearch(NtC: string, maxCount: number, redundant: boolean, large: boolean): WebApi.Pending {
        const req = Requests.Search(NtC, maxCount, redundant, large);

        return WebApi.request('/api/search', req);
    }

    export async function resolveSearch(pending: WebApi.Pending) {
        return await WebApi.resolve<FoundStep[]>(pending, isFoundSteps);
    }
}
