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
import { AnglesLengths2 } from './validation/angles-lengths-2';
import { ConfalsRmsds } from './validation/confals-rmsds';
import { RsccPlot } from './validation/rscc-plot';
import { SimilarityPlot } from './validation/similarity-plot';
import { StepTorsions } from './validation/step-torsions';
import { SelectedPieces, SelectionDisplayer } from '../structure-selection';
import { Dnatcofication } from '../../../dnatco/dnatcofication';

const NullDisplayer = async () => {};
const NullMaker = () => ({ steps: [], residues: [], atoms: [], reconstruct: true });

export namespace Register {
    type PropsType = {
        annotation: View.Props,
        refinement: Refinement.Props,
        validation: View.Props,
    };

    export type View<Kind extends keyof PropsType> = {
        render: (props: PropsType[Kind]) => React.ReactNode,
        selectionDisplayer: SelectionDisplayer,
        selectionMaker: (
            newStepId: SelectedPieces['steps'][0], newResidue: SelectedPieces['residues'][0], newAtom: SelectedPieces['atoms'][0],
            steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'],
            d: Dnatcofication
        ) => SelectedPieces,
        granularity: 'dont-care' | 'two-residues' | 'residue',
        unscrollableContainer?: boolean,
    };

    export const Views: Record<string, View<any>> = {
        'assigned-ntcs': {
            render: (props: View.Props) => <AssignedNtCs {...props} />,
            selectionDisplayer: AssignedNtCs.SelectionDisplayer,
            selectionMaker: AssignedNtCs.SelectionMaker,
            granularity: 'two-residues',
        },
        'angles-lengths': {
            render:(props: View.Props) => <AnglesLengths {...props} />,
            selectionDisplayer: AnglesLengths.SelectionDisplayer,
            selectionMaker: AnglesLengths.SelectionMaker,
            unscrollableContainer: AnglesLengths.unscrollableContainer,
            granularity: 'residue',
        },
        'angles-lengths-2': {
            render:(props: View.Props) => <AnglesLengths2 {...props} />,
            selectionDisplayer: AnglesLengths2.SelectionDisplayer,
            selectionMaker: AnglesLengths2.SelectionMaker,
            unscrollableContainer: AnglesLengths2.unscrollableContainer,
            granularity: 'residue',
        },
        'change-ntcs': {
            render: (props: Refinement.Props) => <ChangeNtCs {...props} />,
            selectionDisplayer: ChangeNtCs.SelectionDisplayer,
            selectionMaker: ChangeNtCs.SelectionMaker,
            unscrollableContainer: ChangeNtCs.unscrollableContainer,
            granularity: 'two-residues',
        },
        'confals-rmsds': {
            render: (props: View.Props) => <ConfalsRmsds {...props} />,
            selectionDisplayer: ConfalsRmsds.SelectionDisplayer,
            selectionMaker: ConfalsRmsds.SelectionMaker,
            unscrollableContainer: ConfalsRmsds.unscrollableContainer,
            granularity: 'two-residues',
        },
        'connectivity-plot': {
            render: (props: Refinement.Props) => <ConnectivityPlot {...props} />,
            selectionDisplayer: ConnectivityPlot.SelectionDisplayer,
            selectionMaker: ConnectivityPlot.SelectionMaker,
            granularity: 'two-residues',
        },
        'downloads': {
            render: (props: View.Props) => <Downloads {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullMaker,
            granularity: 'dont-care',
        },
        'mmb-commands-file': {
            render: (props: Refinement.Props) => <MmbCommandsFile {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullMaker,
            granularity: 'dont-care',
        },
        'phenix-restraints': {
            render: (props: Refinement.Props) => <PhenixRestraints {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullMaker,
            granularity: 'dont-care',
        },
        'refmac-restraints': {
            render: (props: Refinement.Props) => <RefmacRestraints {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullMaker,
            granularity: 'dont-care',
        },
        'rscc-plot': {
            render: (props: View.Props) => <RsccPlot {...props} />,
            selectionDisplayer: RsccPlot.SelectionDisplayer,
            selectionMaker: RsccPlot.SelectionMaker,
            granularity: 'two-residues',
        },
        'step-torsions': {
            render: (props: View.Props) => <StepTorsions {...props} />,
            selectionDisplayer: StepTorsions.SelectionDisplayer,
            selectionMaker: StepTorsions.SelectionMaker,
            granularity: 'two-residues',
        },
        'similarity-plot': {
            render: (props: View.Props) => <SimilarityPlot {...props} />,
            selectionDisplayer: SimilarityPlot.SelectionDisplayer,
            selectionMaker: SimilarityPlot.SelectionMaker,
            granularity: 'two-residues',
        },
        'structure-info': {
            render: (props: View.Props) => <StructureInfo {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullMaker,
            granularity: 'dont-care',
        },
    };
}
