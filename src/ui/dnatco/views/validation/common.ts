import { Constants } from '../../constants';
import { makeStepSelection } from '../../util';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

export namespace Validation {
    export async function switchStep(stepId: number, d: Dnatcofication, vi: ViewerInterop) {
        const selection = makeStepSelection(d, stepId);

        const currNtC = StepsMapper.byId(d, selection.current.id).closestNtC;
        const prevNtC = selection.previous ? StepsMapper.byId(d, selection.previous.id).closestNtC : void 0;
        const nextNtC = selection.next ? StepsMapper.byId(d, selection.next.id).closestNtC : void 0;

        await vi.api.command(
            ViewerApi.Commands.SelectStep(
                ViewerApi.Payloads.StepSelection(selection.current.name, { NtC: currNtC, color: Constants.StepColor }),
                prevNtC ? ViewerApi.Payloads.StepSelection(selection.previous!.name, { NtC: prevNtC, color: Constants.PrevStepColor }) : void 0,
                nextNtC ? ViewerApi.Payloads.StepSelection(selection.next!.name, { NtC: nextNtC, color: Constants.NextStepColor }) : void 0
            )
        );
    }
}
