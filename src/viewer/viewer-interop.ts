import { Subject } from 'rxjs';
import { ReDNATCOMspApi as ViewerApi } from 'viewer-api';
import { DensityMap } from '../dnatco/density-map';
import { BasePairsMapper } from '../dnatco/base-pairs-mapper';
import { Logger } from '../log/logger';
import { EventsKeeper } from '../util/events-keeper';
import { htmlColorAsNumber, sleep } from '../util';

export type ViewerEvents = {
    ready: Subject<void>,
    residueRequested: Subject<ViewerApi.Payloads.ResidueSelection>,
    residueSelected: Subject<ViewerApi.Payloads.ResidueSelection>,
    structuresDeselected: Subject<void>,
    stepRequested: Subject<string>,
    stepSelected: Subject<{ name: string }>,
    basePairRequested: Subject<ViewerApi.Payloads.BasePairSelection>,
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
        basePairRequested: this.ek.subject<ViewerApi.Payloads.BasePairSelection>(),
        structureLoaded: this.ek.subject(),
    };

    get api() {
        if (!this._api)
            throw new Error('Viewer is not initialized yet');
        return this._api;
    }
    async bind(viewerContainerId: string, options: {
        highlightColor: string,
        highlightThickness: number,
        hydogensInReferences: boolean,
        basePairsLadder?: ViewerApi.Options['basePairsLadder'],
        ntcTubeAlpha?: number,
        pyramidAlpha?: number,
        pairingLadderAlpha?: number,
        puckerSphereAlpha?: number,
        showNtcTubeSegmentForSelectedResidues?: boolean,
        cameraRadiusFactor?: number,
        cameraClippingRadius?: number,
        cameraClippingFar?: boolean,
        cameraClippingMinNear?: number,
        puckerSpheres?: {
            colors?: { N?: string, NE?: string, E?: string, SE?: string, S?: string, W?: string },
            radius?: number,
        },
    }) {
        const highlightColor = options.highlightColor ? htmlColorAsNumber(options.highlightColor) : void 0;

        for (let attempt = 0; attempt < 5; attempt++) {
            //@ts-ignore
            if (!molstar || !molstar.ReDNATCOMspApi) {
                await sleep(250);
                continue;
            }

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
                                    Logger.log(Logger.Severity.Debug, '"atom" selection type is currently not handled');
                            }
                        }
                    } else if (ev.type === 'structures-deselected')
                        this.events.structuresDeselected.next();
                    else if (ev.type === 'structure-requested') {
                        if (ev.selection.type === 'step')
                            this.events.stepRequested.next(ev.selection.name);
                        else if (ev.selection.type === 'residue')
                            this.events.residueRequested.next(ev.selection);
                        else if (ev.selection.type === 'base-pair')
                            this.events.basePairRequested.next(ev.selection);
                        else if (ev.selection.type === 'atom')
                            Logger.log(Logger.Severity.Debug, '"atom" request type is currently not handled');
                    } else if (ev.type === 'structure-loaded')
                        this.events.structureLoaded.next();
                },
                {
                    highlightColor,
                    highlightThickness: options.highlightThickness,
                    hydrogensInReferences: options.hydogensInReferences ?? false,
                    ...(options.basePairsLadder && { basePairsLadder: options.basePairsLadder }),
                    ...(options.ntcTubeAlpha !== undefined && { ntcTubeAlpha: options.ntcTubeAlpha }),
                    ...(options.pyramidAlpha !== undefined && { pyramidAlpha: options.pyramidAlpha }),
                    ...(options.pairingLadderAlpha !== undefined && { pairingLadderAlpha: options.pairingLadderAlpha }),
                    ...(options.puckerSphereAlpha !== undefined && { puckerSphereAlpha: options.puckerSphereAlpha }),
                    ...(options.showNtcTubeSegmentForSelectedResidues !== undefined && { showNtcTubeSegmentForSelectedResidues: options.showNtcTubeSegmentForSelectedResidues }),
                    ...(options.cameraRadiusFactor !== undefined && { cameraRadiusFactor: options.cameraRadiusFactor }),
                    ...(options.cameraClippingRadius !== undefined && { cameraClippingRadius: options.cameraClippingRadius }),
                    ...(options.cameraClippingFar !== undefined && { cameraClippingFar: options.cameraClippingFar }),
                    ...(options.cameraClippingMinNear !== undefined && { cameraClippingMinNear: options.cameraClippingMinNear }),
                    ...(options.puckerSpheres && {
                        puckerSpheres: {
                            colorN:  options.puckerSpheres.colors?.N  ? htmlColorAsNumber(options.puckerSpheres.colors.N)  : 0xffff00,
                            colorNE: options.puckerSpheres.colors?.NE ? htmlColorAsNumber(options.puckerSpheres.colors.NE) : 0xffa500,
                            colorE:  options.puckerSpheres.colors?.E  ? htmlColorAsNumber(options.puckerSpheres.colors.E)  : 0xff0000,
                            colorSE: options.puckerSpheres.colors?.SE ? htmlColorAsNumber(options.puckerSpheres.colors.SE) : 0x008b8b,
                            colorS:  options.puckerSpheres.colors?.S  ? htmlColorAsNumber(options.puckerSpheres.colors.S)  : 0x0000ff,
                            colorW:  options.puckerSpheres.colors?.W  ? htmlColorAsNumber(options.puckerSpheres.colors.W)  : 0x808080,
                            radius: options.puckerSpheres.radius ?? 1.5,
                        },
                    }),
                }
            );

            // If we get here, the Viewer can be assumed to be initialized
            break;
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

    /**
     * Send NAPAIR base pair data to Molstar for ladder rendering.
     * Pass null to revert to reading pairs from the loaded CIF (FR3D).
     */
    async setExternalBasePairs(mapping: BasePairsMapper.Mapping | null) {
        if (!this._api) return;

        const data: ViewerApi.Payloads.ExternalBasePairsData | null = mapping === null ? null : {
            pairs: mapping.pairs.map(bp => ({
                model: bp.model,
                asymId1: bp.asymId1, seqId1: bp.seqId1, insCode1: bp.insCode1, altId1: bp.altId1, authSeqId1: bp.authSeqId1, compId1: bp.compId1,
                asymId2: bp.asymId2, seqId2: bp.seqId2, insCode2: bp.insCode2, altId2: bp.altId2, authSeqId2: bp.authSeqId2, compId2: bp.compId2,
                orientation: bp.orientation,
                base1Edge: bp.base1Edge,
                base2Edge: bp.base2Edge,
                napascoMetric: bp.validation?.napascoMetric ?? null,
                napairRmsd: bp.validation?.napairRmsd ?? null,
            })),
            unpaired: mapping.unpaired.map(ur => ({
                model: ur.model,
                asymId: ur.asymId, seqId: ur.seqId, insCode: ur.insCode, altId: ur.altId, authSeqId: ur.authSeqId, compId: ur.compId,
            })),
        };

        await this._api.command(ViewerApi.Commands.SetExternalBasePairs(data));
    }

    ready() { return this._ready; }

    unbind() {
        this._api = undefined;
        this._ready = false;
    }
}

export { ViewerApi }
