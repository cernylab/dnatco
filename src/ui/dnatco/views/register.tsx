import React from 'react';
import { View } from './view';
import { AssignedNtCs } from './annotation/assigned-ntcs';
import { Downloads } from './annotation/downloads';
import { StructureInfo } from './annotation/structure-info';
import { MmbCommandsFile } from './refinement/mmb-commands-file';
import { PhenixRestraints } from './refinement/phenix-restraints';
import { RefmacRestraints } from './refinement/refmac-restraints';
import { ConnectivityPlot } from './refinement/connectivity-plot';
import { ConfalsRmsds } from './validation/confals-rmsds';
import { SimilarityPlots } from './validation/similarity-plot';
import { StepTorsions } from './validation/step-torsions';
import { StepSwitcher } from '../structure-selection';

export namespace Register {
    export type View = {
        render: (props: View.Props) => React.ReactNode;
        stepSwitcher: StepSwitcher;
    };

    export const Views = {
        'assigned-ntcs': {
            render: (props: View.Props) => <AssignedNtCs {...props} />,
            stepSwitcher: AssignedNtCs.StepSwitcher
        },
        'confals-rmsds': {
            render: (props: View.Props) => <ConfalsRmsds {...props} />,
            stepSwitcher: ConfalsRmsds.StepSwitcher
        },
        'connectivity-plot': {
            render: (props: View.Props) => <ConnectivityPlot {...props} />,
            stepSwitcher: ConnectivityPlot.StepSwitcher
        },
        'downloads': {
            render: (props: View.Props) => <Downloads {...props} />,
            stepSwitcher: Downloads.StepSwitcher
        },
        'mmb-commands-file': {
            render: (props: View.Props) => <MmbCommandsFile {...props} />,
            stepSwitcher: MmbCommandsFile.StepSwitcher
        },
        'phenix-restraints': {
            render: (props: View.Props) => <PhenixRestraints {...props} />,
            stepSwitcher: PhenixRestraints.StepSwitcher
        },
        'refmac-restraints': {
            render: (props: View.Props) => <RefmacRestraints {...props} />,
            stepSwitcher: RefmacRestraints.StepSwitcher
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
            stepSwitcher: StructureInfo.StepSwitcher
        },
    };
}
