import * as jsLLKA from 'jsllka';
import { ClassificationContext } from './classification-context';
import { ClassificationResources } from './classification-resources';
import { Dnatcofication, DnatcoficationData, DnatcoficationTaskContext } from './dnatcofication';
import { AnglesLengths, AnglesLengthsContext } from './angles-lengths';
import { Measurements } from './angles-lengths/measurements';
import { Naval, NavalContext } from './naval';
import { Model } from './structure';
import { Cif } from '../cif';
import { EntityPoly } from '../cif/categories/entity';
import { stringAsCharArray } from '../util';

const NonNucleotideSequenceTypes = [
    "polyribonucleotide",
    "polydeoxyribonucleotide",
    "polydeoxyribonucleotide/polyribonucleotide hybrid"
];
const ParenthesizedRegex = /\((.*?)\)/g;
function countNucleotidesFromCifData(cif: Cif.Data) {
    if (!Cif.File.hasTable(cif, EntityPoly)) return void 0;

    const entityPoly = Cif.File.table(cif, EntityPoly);
    const singleLetterSequences = entityPoly.pdbx_seq_one_letter_code.values;
    const sequenceType = entityPoly.type.values;
    const strandId = entityPoly.pdbx_strand_id.values;

    if (!singleLetterSequences || !sequenceType || !strandId) return void 0;

    let totalNucleotideSequence = '';
    for (let idx = 0; idx < singleLetterSequences.length; idx++) {
        const seqType = sequenceType[idx];
        const strands = strandId[idx];

        if (!seqType || !strands) {
            console.warn(`${EntityPoly.name} table contains mismatching number of values for sequences, sequence types and strand IDs. Disregarding.`);
            return void 0;
        }

        if (!NonNucleotideSequenceTypes.includes(seqType)) continue;

        const strandCount = strands.split(',').length;

        // Any antiparallel structure parts are likely to specify the nucleotide sequence only once
        // and use the 'pdbx_strand_id' values to indicate all chains with the same sequence.
        for (let jdx = 0; jdx < strandCount; jdx++) {
            totalNucleotideSequence += singleLetterSequences[idx];
        }
    }

    // Why are we doing this?
    totalNucleotideSequence = totalNucleotideSequence.replace(/,/g, '');

    // Extract individual nucleotides from the total sequence so that we can count their number
    // of occurences. Mind that "one_letter_code" does not really mean one letter but rather a one symbol.
    // Some nucledotides (like all the deoxy- ones) are represented as a two-letter symbol enclosed
    // in parentheses. eg. (DG)(DA).
    const nucleotides = [
        ...[...totalNucleotideSequence.matchAll(ParenthesizedRegex)].map((v) => v[1]),
        ...stringAsCharArray(totalNucleotideSequence.replace(ParenthesizedRegex, ''))
    ];

    const counts = new Map<string, number>();
    for (const nuc of nucleotides) {
        if (counts.has(nuc)) {
            counts.set(nuc, counts.get(nuc)! + 1)
        } else {
            counts.set(nuc, 1);
        }
    }

    return counts;
}

const NAKinds = ['DNA', 'RNA', 'hybrid'];
function countNucleotidesFromModel(model: Model, entityKinds: Dnatcofication.EntityKinds ) {
    const counts = new Map<string, number>();
    for (const chain of model.chains) {
        const et = entityKinds.get(chain.entityId) ?? '';
        if (!NAKinds.includes(et)) continue;

        for (const r of chain.residues) {
            if (counts.has(r.compound)) {
                counts.set(r.compound, counts.get(r.compound)! + 1)
            } else {
                counts.set(r.compound, 1);
            }
        }
    }

    return counts;
}

export namespace Dnatcofier {
    export function countNucleotides(model: Model, entityKinds: Dnatcofication.EntityKinds, cif: Cif.Data, ctx: DnatcoficationTaskContext): DnatcoficationData['nucleotideCounts'] {
        ctx.status = 'Counting nucleotides';

        const counts = countNucleotidesFromCifData(cif);
        return counts
            ? { counts, source: 'entity-poly' }
            : { counts: countNucleotidesFromModel(model, entityKinds), source: 'model' };
    }

    export function destroyImported(imported: jsLLKA.LLKAImportedStructure) {
        imported.structure.delete();
        imported.cifData.blocks.delete();
    }

    export function dnatcoify(steps: jsLLKA.LLKAStructures, imported: jsLLKA.LLKAImportedStructure, clsfCtxData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Initializing classification context';
        const clsfCtx = ClassificationContext.initializeContext(clsfCtxData);

        ctx.status = 'Classifying dinucleotide steps';
        const res = jsLLKA.classifySteps(steps, clsfCtx);
        if (!res.isSuccess()) {
            clsfCtx.delete();
            const fail = res.failure();
            res.delete();

            throw new Error(`Failed to classify steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const attemptedSteps = res.success();
        res.delete();

        const avgConfal = jsLLKA.LLKA.averageConfalAttempted(attemptedSteps, clsfCtx);

        ctx.status = 'Adding DNATCO categories to mmCIF';
        const cifDataDNATCO = jsLLKA.addDNATCOCategoriesToCif(imported.cifData, attemptedSteps, avgConfal, steps, imported.id);
        attemptedSteps.delete();
        clsfCtx.delete();

        ctx.status = 'Writing out extended mmCIF file';
        const res2 = jsLLKA.cifDataToString(cifDataDNATCO, true);
        if (!res2.isSuccess()) {
            const fail = res2.failure();
            res2.delete();

            throw new Error(`Failed to write out extended mmCIF: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const extendedCif = res2.success();
        res2.delete();

        return extendedCif;
    }

    export function importStructure(cif: string, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Reading mmCIF data';
        const res = jsLLKA.cifToStructure(cif, jsLLKA.MINICIF_GET_CIFDATA);
        if (!res.isSuccess()) {
            const fail = res.failure();
            res.delete();

            throw new Error(`${jsLLKA.LLKA.errorToString(fail.tRet)} ${fail.error ?? ''}`);
        }

        const imported = res.success();
        res.delete();

        return imported;
    }

    export function measureAnglesAndLengths(steps: jsLLKA.LLKAStructures, alCtx: AnglesLengthsContext, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Measuring bond angles and lengths';

        AnglesLengths.initializeFromContext(alCtx);

        return Measurements.allSteps(steps);
    }

    export function makeNavalValidation(imported: jsLLKA.LLKAImportedStructure, nvCtx: NavalContext, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Preparing NA-VAL validation report';

        return Naval.validate(imported.structure, imported.id, nvCtx.angles, nvCtx.bonds)
    }

    export function steps(stru: jsLLKA.LLKAStructure, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Splitting structrure to dinucleotide steps';
        const res = jsLLKA.splitStructureToDinucleotideSteps(stru);
        if (!res.isSuccess()) {
            const fail = res.failure();
            res.delete();
            throw new Error(jsLLKA.LLKA.errorToString(fail));
        }

        const steps = res.success();
        res.delete();

        return steps;
    }
}
