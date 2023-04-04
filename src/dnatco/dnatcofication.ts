import * as ConnSimil from './connectivity-similarity';
import { PdbParser } from 'tspdb';
import { MmCifConverter } from 'tspdb';
import { AnglesLengths, AnglesLengthsContext } from './angles-lengths';
import { Bin } from './angles-lengths/bin';
import { Measurements } from './angles-lengths/measurements';
import { Summarize } from './angles-lengths/summarize';
import { Coordinates } from './coordinates';
import { ClassificationResources } from './classification-resources';
import { CustomNtCs } from './custom-ntcs';
import { DensityMap } from './density-map';
import { Dnatcofier } from './dnatcofier';
import { ExtractInfo } from './extract-info';
import { NavalContext, NavalResult } from './naval';
import { GeometryReport } from './naval/geometry-report';
import { Validation } from './naval/validation';
import { StepsMapper } from './steps-mapper';
import { Chain, Structure as _Structure } from './structure';
import { Cif } from '../cif';
import { Category, Schema } from '../cif/categories';
import { AtomSite } from '../cif/categories/atom-site';
import { Rscc } from '../remote/rscc';
import { TaskContext } from '../tasks/task';
import {
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStepSummary,
    NdbStructNtcStep, NdbStructSugarStepParameters,
} from '../cif/categories/ndb-struct-ntc';
import { Struct } from '../cif/categories/struct';
import { objKeys } from '../util';
import { EventsKeeper } from '../util/events-keeper';

function mapALM(residues: Measurements.Residue[]): MappedALM {
    const models = new Map<number, number[]>();
    const chains = new Map<number, Map<string, number[]>>();
    const stats = [] as ALMResidueStats[];

    for (let idx = 0; idx < residues.length; idx++) {
        const r = residues[idx];

        // Create mapping
        const m = r.modelNum;
        if (models.has(m))
            models.get(m)!.push(idx);
        else
            models.set(m, [idx]);

        if (chains.has(m)) {
            const cm = chains.get(m)!;
            if (cm.has(r.chain))
                cm.get(r.chain)!.push(idx);
            else
                cm.set(r.chain, [idx]);
        } else {
            const cm = new Map([[r.chain, [idx]]]);
            chains.set(m, cm);
        }

        // Precompute stats
        const angles = [];
        for (const a of r.bondAngles) {
            const pgrp = AnglesLengths.anglePGroup(r.compound, a);
            const bin = AnglesLengths.angleBin(r.compound, a) ?? 'no-data' as MaybeBin;

            angles.push({ pGroup: pgrp, bin });
        }

        const lengths = [];
        for (const l of r.bondLengths) {
            const pgrp = AnglesLengths.lengthPGroup(r.compound, l);
            const bin = AnglesLengths.lengthBin(r.compound, l) ?? 'no-data' as MaybeBin;

            lengths.push({ pGroup: pgrp, bin });
        }

        stats.push({ angles, lengths, summary: Summarize.residue(r) });
    }

    return { models, chains, residues, stats };
}

type NavalValidationMapping = Map<number, Map<string,Map<number, number[]>>>;
function mapNaval(naval: NavalResult): MappedNaval {
    type Item<T extends Validation.AngleAtoms | Validation.BondAtoms> = Validation.ReportItem<T>;

    const anglesMapping: NavalValidationMapping = new Map();
    const bondsMapping: NavalValidationMapping = new Map();

    const mapOne = <T extends Validation.AngleAtoms | Validation.BondAtoms>(mapping: NavalValidationMapping, item: Item<T>, idx: number) => {
        if (!mapping.has(item.modelNum))
            mapping.set(item.modelNum, new Map());

        const m = mapping.get(item.modelNum)!;
        if (!m.has(item.chainId))
            m.set(item.chainId, new Map());

        const chain = m.get(item.chainId)!;
        // Make sure we use the higher seqId in case of cross-residue items
        const seqId = Math.max(...objKeys(item.atoms).map(k => (item.atoms[k] as Validation.Atom).seqId));

        if (!chain.has(seqId))
            chain.set(seqId, new Array());
        const residue = chain.get(seqId)!;
        residue.push(idx);
    };

    naval.angles.forEach((a, idx) => mapOne(anglesMapping, a, idx));
    naval.bonds.forEach((b, idx) => mapOne(bondsMapping, b, idx));

    return {
        angles: naval.angles,
        bonds: naval.bonds,
        geometry: naval.geometry,
        anglesMapping,
        bondsMapping,
    };
}

function pdbToCif(data: string) {
    const pdb = PdbParser.parse(data);
    const criticals = pdb.issues.filter(i => i.severity === 'critical');
    if (criticals.length > 0) {
        let msg = 'PDB file contains errors.\n';
        criticals.forEach(c => msg += `Line ${c.lineNo.toString().padStart(4)}: ${c.message}\n`);
        throw new Error(msg);
    }

    return MmCifConverter.convert(pdb.stru);
}

const RequiredDnatcoCategories: Category<any>[] = [
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep,
    NdbStructNtcStepSummary, NdbStructSugarStepParameters,
];

export type DnatcoficationTaskContext = TaskContext<DnatcoficationData>;
export type MaybeBin = Bin|'below'|'above'|'no-data';
export type ALMResidueStats = {
    angles: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
    lengths: { pGroup?: AnglesLengths.PGroup, bin: MaybeBin }[],
    summary: Summarize.Summary;
};
export type MappedALM = {
    models: Map<number, number[]>,
    chains: Map<number, Map<string, number[]>>,
    residues: Measurements.Residue[],
    stats: ALMResidueStats[],
};
export type MappedNaval = {
    angles: Validation.Report<Validation.AngleAtoms>,
    bonds: Validation.Report<Validation.BondAtoms>,
    geometry: GeometryReport.Report,
    anglesMapping: NavalValidationMapping,
    bondsMapping: NavalValidationMapping,
};
export type StepRmsdStats = { rmsdThreshold: number, count: number };

export const DnatcoficationData = {
    isCustomStructure: false,
    connectivities: {
        backward: [] as (ConnSimil.Connectivities|null|undefined)[], // null = no connectivity, undefined = connectivity not calculated yet
        forward: [] as (ConnSimil.Connectivities|null|undefined)[],
    },
    entityKinds: [] as Dnatcofication.EntityKinds[],
    similarities: [] as (ConnSimil.Similarities|null|undefined)[], // null = no similarity, undefined = similarity data not calculated yet
    steps: StepsMapper.Mapping(),
    structures: new Array<_Structure>(),
    cifData: null as (Cif.Data|null),

    sourceFileName: null as (string|null),
    densityMaps: null as DensityMap[]|null,

    averageConfals: new Array<number>(),
    stepRmsdStats: new Array<StepRmsdStats[]>(),

    alm: { models: new Map(), chains: new Map() } as MappedALM,
    naval: { angles: [], bonds: [], geometry: [], anglesMapping: new Map(), bondsMapping: new Map() } as MappedNaval,
    rscc: new Array<Rscc.Rscc>(),
};
export type DnatcoficationData = typeof DnatcoficationData;

export class Dnatcofication {
    private readonly ek = new EventsKeeper();
    private _customNtCs = new CustomNtCs();
    data = DnatcoficationData;

    readonly events = {
        structureChanged: this.ek.subject<boolean>(),
    };

    constructor() {
    }

    get customNtCs() {
        return this._customNtCs;
    }

    getConnectivities(stepId: number): { backward: ConnSimil.Connectivities|null, forward: ConnSimil.Connectivities|null } {
        const idx = StepsMapper.idToIndex(this, stepId);
        const steps = this.data.steps.steps;

        if (this.data.connectivities.backward[idx] === undefined) {
            const currStep = steps[idx];
            const prevStepIdx = this.data.steps.previous[idx];
            const nextStepIdx = this.data.steps.next[idx];

            const { backward, forward } = ConnSimil.calculateConnectivities(
                currStep,
                prevStepIdx !== -1 ? steps[prevStepIdx] : void 0,
                nextStepIdx !== -1 ? steps[nextStepIdx] : void 0,
                Cif.File.table(this.data.cifData!, AtomSite, 0)
            )

            this.data.connectivities.backward[idx] = backward;
            this.data.connectivities.forward[idx] = forward;
        }

        return { backward: this.data.connectivities.backward[idx]!, forward: this.data.connectivities.forward[idx]! };
    }

    getSimilarities(stepId: number) {
        const idx = StepsMapper.idToIndex(this, stepId);
        const steps = this.data.steps.steps;

        if (this.data.similarities[idx] === undefined)
            this.data.similarities[idx] = ConnSimil.calculateSimilarities(steps[idx], Cif.File.table(this.data.cifData!, AtomSite, 0));

        return this.data.similarities[idx];
    }

    get identifyingName() {
        if (this.data.sourceFileName)
            return this.data.sourceFileName;

        if (!this.data.cifData)
            return void 0;

        const struct = Cif.File.table(this.data.cifData, Struct);
        return struct.entry_id.values ? struct.entry_id.values[0] : void 0;
    }

    get identifyingTitle() {
        if (!this.data.cifData || !this.hasTable(Struct))
            return undefined;

        const struct = Cif.File.table(this.data.cifData, Struct);
        return struct.title.values ? struct.title.values[0] : void 0;
    }

    haveStructure() {
        return !!this.data.cifData;
    }

    hasTable<S extends Schema.Schema>(category: Category<S>) {
        if (!this.data.cifData)
            return false;
        return Cif.File.hasTable(this.data.cifData, category);
    }

    nucleicAcidKind(modelIndex: number) {
        const eks = this.data.entityKinds[modelIndex];

        let dna = false;
        let rna = false;
        for (const ek of eks.values()) {
            if (ek === 'hybrid')
                return 'hybrid';
            dna = ek === 'DNA';
            rna = ek === 'RNA';
        }

        return dna
            ? rna
                ? 'hybrid' : 'DNA'
            : rna
                ? 'RNA' : 'unknown';
    }

    get pdbId() {
        if (!this.data.cifData)
            return '';

        const struct = Cif.File.table(this.data.cifData, Struct);
        return Cif.Column.value(struct.entry_id, 0) ?? '';
    }

    rawCif() {
        return this.data.cifData?.raw ?? '';
    }

    table<S extends Schema.Schema>(category: Category<S>) {
        if (!this.data.cifData)
            throw new Error('No structure has been loaded');

        return Cif.File.table(this.data.cifData, category);
    }

    setData(data: DnatcoficationData) {
        this.data = data;
        this._customNtCs = new CustomNtCs();
        this.events.structureChanged.next(true);
    }
}

export namespace Dnatcofication {
    export type EntityKinds = Map<string, Chain.Kind>;

    export namespace Structure {
        export function nucleicAcidChains(d: Dnatcofication, modelIndex = 0): { name: string, authName: string, kind: Chain.Kind }[] {
            const et = d.data.entityKinds[modelIndex];
            if (!et)
                return [];

            const naChains = new Array<{ name: string, authName: string, kind: Chain.Kind }>();
            const m = d.data.structures[0].models[modelIndex];
            for (const [id, ct] of et.entries()) {
                m.chains.forEach(ch => {
                    if (ch.entityId === id)
                        naChains.push({ name: ch.name, authName: ch.authName, kind: ct });
                });
            }

            return naChains;
        }

        export function numberOfModels(d: Dnatcofication) {
            if (d.data.structures.length === 0)
                return 0;
            return d.data.structures[0].models.length;
        }
    }

    export function addRscc(data: DnatcoficationData, rscc: DnatcoficationData['rscc']) {
        data.rscc = rscc;
    }

    export function ingest(
        coordinates: Coordinates,
        densityMaps: DensityMap[]|null,
        sourceFileName: string|null,
        clsfResData: ClassificationResources.Data,
        alCtx: AnglesLengthsContext,
        nvCtx: NavalContext,
        isCustomStructure: boolean,
        ctx: DnatcoficationTaskContext
    ) {
        const tStart = performance.now();

        try {
            ctx.status = 'Reading input coordinates';

            const cifCoordinates = coordinates.type === 'cif'
                ? coordinates.data : pdbToCif(coordinates.data);

            ctx.status = 'Reading CIF file';

            // This is "our" CIF representation
            let cifData = Cif.read(cifCoordinates);

            let llkaImported;
            try {
                llkaImported = Dnatcofier.importStructure(cifCoordinates, ctx);
            } catch (e) {
                throw new Error(`Failed to import CIF data: ${e}`);
            }

            let llkaSteps;
            try {
                llkaSteps = Dnatcofier.steps(llkaImported.structure, ctx);
            } catch (e) {
                Dnatcofier.destroyImported(llkaImported);

                throw new Error(`Failed to split structure to steps: ${e}`);
            }

            if (!isDnatcofied(cifData)) {
                // Got a CIF without DNATCO categories. Let's try to create them ourselves
                const maybeDnatcofiedCif = Dnatcofier.dnatcoify(llkaSteps, llkaImported, clsfResData, ctx);
                cifData = Cif.read(maybeDnatcofiedCif);
                if (!isDnatcofied(cifData)) {
                    llkaSteps.delete();
                    Dnatcofier.destroyImported(llkaImported);

                    throw new Error('Input CIF file does not contain required DNATCO categories and the automatic assignment procedure was unsuccessful. Sorry...');
                }
            }

            let alm;
            try {
                alm = Dnatcofier.measureAnglesAndLengths(llkaSteps, alCtx, ctx);
            } catch (e) {
                llkaSteps.delete();
                Dnatcofier.destroyImported(llkaImported);

                throw new Error(`Failed to measure bond lengths and angles: ${e}`);
            }

            let naval;
            try {
                naval = Dnatcofier.makeNavalValidation(llkaImported, nvCtx, ctx);
            } catch (e) {
                llkaSteps.delete();
                Dnatcofier.destroyImported(llkaImported);

                throw new Error(`Failed to calculate Naval validation: ${e}`);
            }

            // We are deleting llkaSteps here to free up WASM memory.
            // Larger structures can hit the 2 GiB limit if we hold on
            // to this vector and also try to gather step atoms
            // for connectivity/similarity calculations.
            llkaSteps.delete();

            const atoms = Cif.File.table(cifData, AtomSite, 0);
            const structures = new Array<_Structure>();
            structures.push(new _Structure(atoms)); // NOTE: We are explicitly ignoring any blocks except the first one

            const entityKinds = [];
            for (const model of structures[0].models) {
                const et = ExtractInfo.entityKinds(model, cifData);
                entityKinds.push(et);
            }

            ctx.status = 'Mapping dinucleotide steps';

            const steps = StepsMapper.map(
                Cif.File.table(cifData, NdbStructNtcStep),
                Cif.File.table(cifData, NdbStructNtcStepSummary),
                structures[0],
            );

            // TODO: We should add an option to calculate all connectivities beforehand
            const precalculateConnsSimils = false;
            let connectivities;
            let similarities;
            if (precalculateConnsSimils) {
                ctx.status = 'Gathering step atoms';
                const stepsAtoms = ConnSimil.getStepsAtoms(steps.steps, cifData);

                ctx.status = 'Calculating connectivities';
                connectivities = ConnSimil.calculateAllConnectivities(steps.steps, stepsAtoms, steps.previous, steps.next);

                ctx.status = 'Calculating similarities';
                similarities = ConnSimil.calculateAllSimilarities(steps.steps, stepsAtoms);

                stepsAtoms.delete();
            } else {
                connectivities = {
                    backward: new Array(steps.steps.length),
                    forward: new Array(steps.steps.length),
                };
                similarities = new Array(steps.steps.length);
            }

            const tEnd = performance.now();

            console.log(`Dnatcofication process took ${((tEnd - tStart) / 1000.0).toFixed(3)} sec`);

            Dnatcofier.destroyImported(llkaImported);

            const data: DnatcoficationData = {
                isCustomStructure,
                connectivities,
                entityKinds,
                similarities,
                steps,
                structures,
                cifData,
                sourceFileName,
                densityMaps,
                averageConfals: ExtractInfo.averageConfals(steps),
                stepRmsdStats: ExtractInfo.stepRmsdStats([0.5, 1.0], steps),
                alm: mapALM(alm),
                naval: mapNaval(naval),
                rscc: [],
            };

            const tEnd2 = performance.now();
            console.log(`Dnatcofication process with finalization overhead took ${((tEnd2 - tStart) / 1000.0).toFixed(3)} sec`);

            return data;
        } catch (e) {
            ctx.events.finished.next({ state: 'failed', message: (e as Error).toString() });

            return void 0;
        }
    }

    export function isDnatcofied(cif: Cif.Data) {
        for (let block = 0; block < Cif.File.blockCount(cif); block++) {
            for (const cat of RequiredDnatcoCategories) {
                if (!Cif.File.hasTable(cif, cat, block))
                    return false;
            }
        }

        return true;
    }
}
