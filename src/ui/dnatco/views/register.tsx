import React from 'react';
import { View } from './view';
import { AssignedNtCs } from './annotation/assigned-ntcs';
import { Downloads } from './annotation/downloads';
import { StructureInfo } from './annotation/structure-info';
import { Refinement } from './refinement/common';
import { ChangeNtCs } from './refinement/change-ntcs';
import { MmbCommandsFile } from './refinement/mmb-commands-file';
import { PhenixRestraints } from './refinement/phenix-restraints';
import { RefmacRestraints } from './refinement/refmac-restraints';
import { ConnectivityPlot } from './refinement/connectivity-plot';
import { AnglesLengths } from './validation/angles-lengths';
import { ConfalsRmsds } from './validation/confals-rmsds';
import { RsccPlot } from './validation/rscc-plot';
import { SimilarityPlots } from './validation/similarity-plot';
import { StepTorsions } from './validation/step-torsions';
import { StepSwitcher } from '../structure-selection';

export namespace Register {
    type PropsType = {
        annotation: View.Props,
        refinement: Refinement.Props,
        validation: View.Props,
    };

    export type View<Kind extends keyof PropsType> = {
        render: (props: PropsType[Kind]) => React.ReactNode;
        stepSwitcher?: StepSwitcher;
        unscrollableContainer?: boolean;
    };

    export const Views: Record<string, View<any>> = {
        'assigned-ntcs': {
            render: (props: View.Props) => <AssignedNtCs {...props} />,
            stepSwitcher: AssignedNtCs.StepSwitcher,
        },
        'angles-lengths': {
            render:(props: View.Props) => <AnglesLengths {...props} />,
            stepSwitcher: void 0,
            unscrollableContainer: AnglesLengths.unscrollableContainer,
        },
        'change-ntcs': {
            render: (props: Refinement.Props) => <ChangeNtCs {...props} />,
            stepSwitcher: ChangeNtCs.StepSwitcher,
            unscrollableContainer: ChangeNtCs.unscrollableContainer,
        },
        'confals-rmsds': {
            render: (props: View.Props) => <ConfalsRmsds {...props} />,
            stepSwitcher: ConfalsRmsds.StepSwitcher,
            unscrollableContainer: ConfalsRmsds.unscrollableContainer,
        },
        'connectivity-plot': {
            render: (props: Refinement.Props) => <ConnectivityPlot {...props} />,
            stepSwitcher: ConnectivityPlot.StepSwitcher
        },
        'downloads': {
            render: (props: View.Props) => <Downloads {...props} />,
            stepSwitcher: void 0,
        },
        'mmb-commands-file': {
            render: (props: Refinement.Props) => <MmbCommandsFile {...props} />,
            stepSwitcher: void 0,
        },
        'phenix-restraints': {
            render: (props: Refinement.Props) => <PhenixRestraints {...props} />,
            stepSwitcher: void 0,
        },
        'refmac-restraints': {
            render: (props: Refinement.Props) => <RefmacRestraints {...props} />,
            stepSwitcher: void 0,
        },
        'rscc-plot': {
            render: (props: View.Props) => <RsccPlot {...props} />,
            stepSwitcher: RsccPlot.StepSwitcher
        },
        'step-torsions': {
            render: (props: View.Props) => <StepTorsions {...props} />,
            stepSwitcher: StepTorsions.StepSwitcher
        },
        'similarity-plot': {
            render: (props: View.Props) => <SimilarityPlots {...props} />,
            stepSwitcher: SimilarityPlots.StepSwitcher
        },
        'structure-info': {
            render: (props: View.Props) => <StructureInfo {...props} />,
            stepSwitcher: void 0,
        },
    };
}
