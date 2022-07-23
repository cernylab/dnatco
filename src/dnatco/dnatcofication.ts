import * as ConnSimil from './connectivity-similarity';
import { Dnatcofier } from './dnatcofier';
import { ExtractInfo } from './extract-info';
import { Structure } from './structure';
import { Cif } from '../cif';
import { Category, Schema } from '../cif/categories';
import { AtomSite } from '../cif/categories/atom-site';
import { StepsMapper } from './steps-mapper';
import {
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStepSummary,
    NdbStructNtcStep, NdbStructSugarStepParameters,
} from '../cif/categories/ndb-struct-ntc';
import { EventsKeeper } from '../util/events-keeper';

const RequiredDnatcoCategories: Category<any>[] = [
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep,
    NdbStructNtcStepSummary, NdbStructSugarStepParameters,
];

export class Dnatcofication {
    private readonly ek = new EventsKeeper();
    private _cif?: Cif.Cif;
    _connectivities: ConnSimil.AllConnectivities = { backward: [], forward: [] };
    _nucleicAcidChains = new Array<string[]>();
    _similarities: ConnSimil.AllSimilarities = [];
    _steps = StepsMapper.Mapping();
    _structures = new Array<Structure>();

    readonly events = {
        structureChanged: this.ek.subject<boolean>(),
    };

    private isDnatcofied(cif: Cif.Cif) {
        for (let block = 0; block < cif.blockCount; block++) {
            for (const cat of RequiredDnatcoCategories) {
                if (!cif.hasTable(cat, block))
                    return false;
            }
        }

        return true;
    }

    constructor() {
    }

    haveStructure() {
        return !!this._cif;
    }

    hasTable<S extends Schema.Schema>(category: Category<S>) {
        if (!this._cif)
            return false;
        return this._cif.hasTable(category);
    }

    ingest(cif: string) {
        const tStart = performance.now();

        let prov = Cif.read(cif);
        if (!this.isDnatcofied(prov)) {
            // Got a CIF without DNATCO categories. Let's try to create them ourselves
            const maybeDnatcofiedCif = Dnatcofier.dnatcoify(cif);
            prov = Cif.read(maybeDnatcofiedCif);
            if (!this.isDnatcofied(prov))
                throw new Error('Input CIF file does not contain required DNATCO categories and ReDNATCO\'s automatic assignment process was unsuccessful. Sorry...');
        }

        const structs = new Array<Structure>();
        structs.push(new Structure(prov.table(AtomSite, 0))); // NOTE: We are explicitly ignoring any blocks except the first one

        const allNaChains = new Array<string[]>();
        for (const model of structs[0].models) {
            const naChains = ExtractInfo.countNucleicAcidChains(model);
            allNaChains.push(naChains);
        }

        this._cif = prov;
        this._structures = structs;
        this._nucleicAcidChains = allNaChains;
        this._steps = StepsMapper.map(this._cif.table(NdbStructNtcStep),this._cif.table(NdbStructNtcStepSummary), Dnatcofication.Structure.numberOfModels(this));

        const stepsAtoms = ConnSimil.getStepsAtoms(this._steps.steps, this._cif);
        this._connectivities = ConnSimil.getConnectivities(this._steps.steps, stepsAtoms, this._steps.previous, this._steps.next);
        this._similarities = ConnSimil.getSimilarities(this._steps.steps, stepsAtoms);
        stepsAtoms.delete();

        const tEnd = performance.now();

        console.log(`Dnatcofication process took ${((tEnd - tStart) / 1000.0).toFixed(3)} sec`);

        this.events.structureChanged.next(true);
    }

    rawCif() {
        return this._cif?.raw ?? '';
    }

    table<S extends Schema.Schema>(category: Category<S>) {
        if (!this._cif)
            throw new Error('No structure has been loaded');

        return this._cif.table(category);
    }
}

export namespace Dnatcofication {
    export namespace Structure {
        export function nucleicAcidChains(d: Dnatcofication, model = 1) {
            if (d._nucleicAcidChains.length === 0)
                return [];
            return d._nucleicAcidChains[model - 1];
        }

        export function numberOfModels(d: Dnatcofication) {
            if (d._structures.length === 0)
                return 0;
            return d._structures[0].models.length;
        }
    }
}
