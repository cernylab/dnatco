import { Constants } from '../../constants';
import { makeStepSelection } from '../../util';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

export namespace Refinement {
    export async function switchStep(stepId: number, d: Dnatcofication, vi: ViewerInterop) {
        const selection = makeStepSelection(d, stepId);

        const currNtC = StepsMapper.byId(d, selection.current.id).closestNtC;

        await vi.api.command(
            ViewerApi.Commands.SelectStep(
                ViewerApi.Payloads.StepSelection(selection.current.name, { NtC: currNtC, color: Constants.StepColor }),
                void 0,
                void 0
            )
        );
    }
}
