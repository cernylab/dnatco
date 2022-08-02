export namespace ReDNATCOMspApi {
    export namespace Commands {
        export type Type = 'deselect-step'|'redraw'|'select-step'|'switch-model';

        export type Redraw = { type: 'redraw' }
        export function Redraw(): Redraw { return { type: 'redraw' }; }

        export type DeselectStep = { type: 'deselect-step' }
        export function DeselectStep() {
            return { type: 'deselect-step' };
        }

        export type SelectStep = {
            type: 'select-step';
            stepName: string;
            prevStepName: string|undefined;
            nextStepName: string|undefined;
            referenceNtC: string;
            references: ('sel'|'prev'|'next')[];
        }
        export function SelectStep(stepName: string, prevStepName: string|undefined, nextStepName: string|undefined, referenceNtC = '', references = ['sel', 'prev', 'next']): SelectStep {
            return {
                type: 'select-step',
                stepName,
                prevStepName,
                nextStepName,
                referenceNtC,
                references: references as ('sel'|'prev'|'next')[],
            };
        }

        export type SwitchModel = { type: 'switch-model', model: number };
        export function SwitchModel(model: number): SwitchModel { return { type: 'switch-model', model }; }
    }
    export type Command =
        Commands.DeselectStep |
        Commands.Redraw |
        Commands.SelectStep |
        Commands.SwitchModel;

    export namespace Events {
        export type Type = 'step-deselected'|'step-requested'|'step-selected';

        export type StepDeselected = { type: 'step-deselected' }
        export function StepDeselected(): StepDeselected {
            return { type: 'step-deselected' };
        }

        export type StepRequested = { type: 'step-requested', name: string }
        export function StepRequested(name: string): StepRequested {
            return { type: 'step-requested', name };
        }

        export type StepSelected = { type: 'step-selected', success: boolean, name: string, rmsd?: number }
        export function StepSelectedOk(name: string, rmsd?: number): StepSelected {
            return { type: 'step-selected', success: true, name, rmsd };
        }
        export function StepSelectedFail(): StepSelected {
            return { type: 'step-selected', success: false, name: '' };
        }

    }
    export type Event =
        Events.StepDeselected |
        Events.StepRequested |
        Events.StepSelected;

    export namespace Queries {
        export type Type = 'selected-step';

        export type SelectedStep = { type: 'selected-step', name: string, rmsd?: number }
        export function SelectedStep(name: string, rmsd?: number): SelectedStep {
            return { type: 'selected-step', name, rmsd };
        }
    }
    export type Response = Queries.SelectedStep;

    export interface Object {
        command: (cmd: Command) => void;
        event: (evt: Event) => void;
        init: (elemId: string, onEvent?: (evt: Event) => void, onInited?: () => void) => void;
        isReady: () => boolean;
        loadStructure: (data: string, type: 'cif'|'pdb') => void;
        query: (type: Queries.Type) => Response;
    }
}
