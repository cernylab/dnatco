import { GlobalConfig } from '../../global-config';
import { htmlColorAsNumber } from '../../util';

let CurrentStepColor: number;
let NextStepColor: number;
let PreviousStepColor: number;

export namespace Colors {
    export function CurrentStep(): number {
        if (CurrentStepColor === undefined) {
            const clr = htmlColorAsNumber(GlobalConfig.data().currentStepColor);
            CurrentStepColor = clr === undefined ? htmlColorAsNumber(GlobalConfig.defaultValue('currentStepColor'))! : clr;
        }

        return CurrentStepColor;
    }

    export function NextStep(): number {
        if (NextStepColor === undefined) {
            const clr = htmlColorAsNumber(GlobalConfig.data().nextStepColor);
            NextStepColor = clr === undefined ? htmlColorAsNumber(GlobalConfig.defaultValue('nextStepColor'))! : clr;
        }

        return NextStepColor;
    }

    export function PreviousStep(): number {
        if (PreviousStepColor === undefined) {
            const clr = htmlColorAsNumber(GlobalConfig.data().previousStepColor);
            PreviousStepColor = clr === undefined ? htmlColorAsNumber(GlobalConfig.defaultValue('previousStepColor'))! : clr;
        }

        return PreviousStepColor;
    }
}
