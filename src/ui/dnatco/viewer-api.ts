// TODO: We shall work out how to not have to copy this from the ReDNATCOMsp code

export namespace ViewerApi {
    export namespace Commands {
        export type Type = 'redraw'|'select-step'|'switch-model';

        export type Redraw = { type: 'redraw' }
        export function Redraw(): Redraw { return { type: 'redraw' }; }

        export type SelectStep = {
            type: 'select-step';
            stepName: string;
            referenceNtC: string;
            references: ('sel'|'prev'|'next')[];
        }
        export function SelectStep(stepName: string, referenceNtC = '', references = ['sel', 'prev', 'next']): SelectStep {
            return {
                type: 'select-step',
                stepName,
                referenceNtC,
                references: references as ('sel'|'prev'|'next')[],
            };
        }

        export type SwitchModel = { type: 'switch-model', model: number };
        export function SwitchModel(model: number): SwitchModel { return { type: 'switch-model', model }; }

        export type Cmd = Redraw|SelectStep|SwitchModel;
    }

    export type Api = {
        command: (cmd: Commands.Cmd) => void;
    }
}
