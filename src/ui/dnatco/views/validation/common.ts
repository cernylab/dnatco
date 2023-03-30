import { Constants } from '../../constants';
import { SelectedPieces } from '../../structure-selection';
import { makeStepSelection } from '../../util';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

export namespace Validation {
    export async function selectionDisplayer(pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop) {
        if (pieces.reconstruct)
            await vi.api.command(ViewerApi.Commands.DeselectStructures());

        const selected = [];
        for (const sid of pieces.steps) {
            const selection = makeStepSelection(d, sid)
            const currNtC = StepsMapper.byId(d, selection.current.id).closestNtC;

            const step = ViewerApi.Commands.StepSelection(
                ViewerApi.Payloads.StepSelection(selection.current.name, { NtC: currNtC, color: Constants.StepColor }),
                void 0,
                void 0
            );
            selected.push(step);
        }

        await vi.api.command(ViewerApi.Commands.SelectStructures(selected));
    }

    export function selectionMaker(newStepId: number, newResidue: SelectedPieces['residues'][0], steps: number[], residues: SelectedPieces['residues']): SelectedPieces {
        return { steps: [newStepId], residues: [], reconstruct: !(steps[0] === newStepId && steps.length === 1) };
    }
}
