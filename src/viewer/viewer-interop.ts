import { Subject } from 'rxjs';
import { ReDNATCOMspApi as ViewerApi } from 'viewer-api';
import { DensityMap } from '../dnatco/density-map';
import { EventsKeeper } from '../util/events-keeper';
import { htmlColorAsNumber, sleep } from '../util';

export type ViewerEvents = {
    ready: Subject<void>,
    residueRequested: Subject<ViewerApi.Payloads.ResidueSelection>,
    residueSelected: Subject<ViewerApi.Payloads.ResidueSelection>,
    structuresDeselected: Subject<void>,
    stepRequested: Subject<string>,
    stepSelected: Subject<{ name: string }>,
    structureLoaded: Subject<void>,
}

export class ViewerInterop {
    private ek = new EventsKeeper();
    private _api: ViewerApi.Object|undefined = undefined;
    private _ready = false;

    readonly events: ViewerEvents = {
        ready: this.ek.subject<void>(),
        residueRequested: this.ek.subject<ViewerApi.Payloads.ResidueSelection>(),
        residueSelected: this.ek.subject<ViewerApi.Payloads.ResidueSelection>(),
        structuresDeselected: this.ek.subject<void>(),
        stepRequested: this.ek.subject<string>(),
        stepSelected: this.ek.subject<{ name: string, rmsd?: number }>(),
        structureLoaded: this.ek.subject(),
    };

    get api() {
        if (!this._api)
            throw new Error('Viewer is not initialized yet');
        return this._api;
    }
    async bind(viewerContainerId: string, options: { highlightColor: string, highlightThickness: number, hydogensInReferences: boolean }) {
        const highlightColor = options.highlightColor ? htmlColorAsNumber(options.highlightColor) : void 0;

        for (let attempt = 0; attempt < 5; attempt++) {
            //@ts-ignore
            if (!molstar || !molstar.ReDNATCOMspApi)
                await sleep(250);

            //@ts-ignore
            this._api = molstar.ReDNATCOMspApi.init(
                viewerContainerId,
                (ev: ViewerApi.Event) => {
                    if (ev.type === 'ready') {
                        this._ready = true;
                        this.events.ready.next();
                    } else if (ev.type === 'structures-selected') {
                        if (ev.success) {
                            for (const sel of ev.selections) {
                                if (sel.type === 'step')
                                    this.events.stepSelected.next({ name: sel.name });
                                else if (sel.type === 'residue')
                                    this.events.residueSelected.next(sel);
                                else if (sel.type === 'atom')
                                    console.log('"atom" selection type is currently not handled');
                            }
                        }
                    } else if (ev.type === 'structures-deselected')
                        this.events.structuresDeselected.next();
                    else if (ev.type === 'structure-requested') {
                        if (ev.selection.type === 'step')
                            this.events.stepRequested.next(ev.selection.name);
                        else if (ev.selection.type === 'residue')
                            this.events.residueRequested.next(ev.selection);
                        else if (ev.selection.type === 'atom')
                            console.log('"atom" request type is currently not handled');
                    } else if (ev.type === 'structure-loaded')
                        this.events.structureLoaded.next();
                },
                {
                    highlightColor,
                    highlightThickness: options.highlightThickness,
                    hydrogensInReferences: options.hydogensInReferences ?? false,
                }
            );
        }

        if (!this._api)
            throw new Error('Molstar plugin took too long to initialize');
    }

    loadStructure(cif: string, modelNumber: number, densityMaps: DensityMap[]|null) {
        //@ts-ignore
        molstar.ReDNATCOMspApi.loadStructure(
            { data: cif, type: 'cif', modelNumber },
            densityMaps
        );
    }

    ready() { return this._ready; }

    unbind() {
        this._api = undefined;
        this._ready = false;
    }
}

export { ViewerApi }
