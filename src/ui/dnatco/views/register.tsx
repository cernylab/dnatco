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
import { BondsAngles } from './validation/bonds-angles';
import { ConfalsRmsds } from './validation/confals-rmsds';
import { RsccPlot } from './validation/rscc-plot';
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
        'bonds-angles': {
            render:(props: View.Props) => <BondsAngles {...props} />,
            stepSwitcher: void 0,
        },
        'change-ntcs': {
            render: (props: Refinement.Props) => <ChangeNtCs {...props} />,
            stepSwitcher: ChangeNtCs.StepSwitcher
        },
        'confals-rmsds': {
            render: (props: View.Props) => <ConfalsRmsds {...props} />,
            stepSwitcher: ConfalsRmsds.StepSwitcher
        },
        'connectivity-plot': {
            render: (props: Refinement.Props) => <ConnectivityPlot {...props} />,
            stepSwitcher: ConnectivityPlot.StepSwitcher
        },
        'downloads': {
            render: (props: View.Props) => <Downloads {...props} />,
            stepSwitcher: Downloads.StepSwitcher
        },
        'mmb-commands-file': {
            render: (props: Refinement.Props) => <MmbCommandsFile {...props} />,
            stepSwitcher: MmbCommandsFile.StepSwitcher
        },
        'phenix-restraints': {
            render: (props: Refinement.Props) => <PhenixRestraints {...props} />,
            stepSwitcher: PhenixRestraints.StepSwitcher
        },
        'refmac-restraints': {
            render: (props: Refinement.Props) => <RefmacRestraints {...props} />,
            stepSwitcher: RefmacRestraints.StepSwitcher
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
            stepSwitcher: StructureInfo.StepSwitcher
        },
    };
}
