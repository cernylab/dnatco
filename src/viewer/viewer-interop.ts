import { Subject } from 'rxjs';
import { ReDNATCOMspApi as ViewerApi } from 'viewer-api';
import { EventsKeeper } from '../util/events-keeper';
import { sleep } from '../util';

export type ViewerEvents = {
    ready: Subject<void>,
    stepDeselected: Subject<void>,
    stepRequested: Subject<string>,
    stepSelected: Subject<{ name: string, rmsd?: number }>,
    structureLoaded: Subject<void>,
}

export class ViewerInterop {
    private ek = new EventsKeeper();
    private _api: ViewerApi.Object|undefined = undefined;
    private _ready = false;

    readonly events: ViewerEvents = {
        ready: this.ek.subject<void>(),
        stepDeselected: this.ek.subject<void>(),
        stepRequested: this.ek.subject<string>(),
        stepSelected: this.ek.subject<{ name: string, rmsd?: number }>(),
        structureLoaded: this.ek.subject(),
    };

    get api() {
        if (!this._api)
            throw new Error('Viewer is not initialized yet');
        return this._api;
    }

    async bind(viewerContainerId: string) {
        for (let attempt = 0; attempt < 5; attempt++) {
            //@ts-ignore
            if (!molstar || !molstar.ReDNATCOMspApi)
                await sleep(250);

            //@ts-ignore
            this._api = molstar.ReDNATCOMspApi.init(
                viewerContainerId,
                (evt: ViewerApi.Event) => {
                    if (evt.type === 'ready') {
                        this._ready = true;
                        this.events.ready.next();
                    } else if (evt.type === 'step-selected') {
                        if (evt.success)
                            this.events.stepSelected.next({ name: evt.name });
                    } else if (evt.type === 'step-deselected')
                        this.events.stepDeselected.next();
                    else if (evt.type === 'step-requested')
                        this.events.stepRequested.next(evt.name);
                    else if (evt.type === 'structure-loaded')
                        this.events.structureLoaded.next();
                }
            );
        }

        if (!this._api)
            throw new Error('Molstar plugin took too long to initialize');
    }

    loadStructure(cif: string) {
        //@ts-ignore
        molstar.ReDNATCOMspApi.loadStructure(cif);
    }

    ready() { return this._ready; }

    unbind() {
        this._api = undefined;
        this._ready = false;
    }
}

export { ViewerApi }
