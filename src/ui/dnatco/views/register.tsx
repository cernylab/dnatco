import React from 'react';
import { View } from './view';
import { MainFeatures } from './annotation/main-features';
import { Downloads } from './annotation/downloads';
import { StructureInfo } from './annotation/structure-info';
import { Refinement } from './refinement/common';
import { ChangeNtCs } from './refinement/change-ntcs';
import { MmbCommandsFile } from './refinement/mmb-commands-file';
import { PhenixRestraints } from './refinement/phenix-restraints';
import { RefmacRestraints } from './refinement/refmac-restraints';
import { ConnectivityPlot } from './refinement/connectivity-plot';
import { AnglesLengthsUpper } from './validation/angles-lengths-upper';
import { BackboneQuality } from './validation/backbone-quality';
import { RsccPlot } from './validation/rscc-plot';
import { SimilarityPlot } from './validation/similarity-plot';
import { StepTorsions } from './validation/step-torsions';
import { SelectedPieces, SelectionDisplayer } from '../structure-selection';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { HelpAnnotation } from './annotation/help-annotation';
import { HelpRefinement } from './refinement/help-refinement';
import { HelpValidation } from './validation/help-validation';
import { OverallQuality } from './validation/overall-quality';
import { DownloadsValidation } from './validation/downloads-validation';

const NullDisplayer = async () => {};
const NullSelectionMaker = () => ({ steps: [], residues: [], atoms: [], reconstruct: true });

export namespace Register {
    export type PropsType = {
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
        visualizer: boolean,
        unscrollableContainer?: boolean,
    };

    export const Views = {
        'main-features': {
            render: (props: View.Props) => <MainFeatures {...props} />,
            selectionDisplayer: MainFeatures.SelectionDisplayer,
            selectionMaker: MainFeatures.SelectionMaker,
            unscrollableContainer: MainFeatures.unscrollableContainer,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'angles-lengths': {
            render:(props: View.Props) => <AnglesLengthsUpper {...props} />,
            selectionDisplayer: AnglesLengthsUpper.SelectionDisplayer,
            selectionMaker: AnglesLengthsUpper.SelectionMaker,
            unscrollableContainer: AnglesLengthsUpper.unscrollableContainer,
            granularity: 'residue' as View<any>['granularity'],
            visualizer: true,
        },
        'change-ntcs': {
            render: (props: Refinement.Props) => <ChangeNtCs {...props} />,
            selectionDisplayer: ChangeNtCs.SelectionDisplayer,
            selectionMaker: ChangeNtCs.SelectionMaker,
            unscrollableContainer: ChangeNtCs.unscrollableContainer,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'overall-quality': {
            render: (props: View.Props) => <OverallQuality {...props} />,
            selectionDisplayer: OverallQuality.SelectionDisplayer,
            selectionMaker: OverallQuality.SelectionMaker,
            unscrollableContainer: OverallQuality.unscrollableContainer,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'backbone-quality': {
            render: (props: View.Props) => <BackboneQuality {...props} />,
            selectionDisplayer: BackboneQuality.SelectionDisplayer,
            selectionMaker: BackboneQuality.SelectionMaker,
            unscrollableContainer: BackboneQuality.unscrollableContainer,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'connectivity-plot': {
            render: (props: Refinement.Props) => <ConnectivityPlot {...props} />,
            selectionDisplayer: ConnectivityPlot.SelectionDisplayer,
            selectionMaker: ConnectivityPlot.SelectionMaker,
            unscrollableContainer: false,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'downloads': {
            render: (props: View.Props) => <Downloads {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'mmb-commands-file': {
            render: (props: Refinement.Props) => <MmbCommandsFile {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'phenix-restraints': {
            render: (props: Refinement.Props) => <PhenixRestraints {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'refmac-restraints': {
            render: (props: Refinement.Props) => <RefmacRestraints {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'rscc-plot': {
            render: (props: View.Props) => <RsccPlot {...props} />,
            selectionDisplayer: RsccPlot.SelectionDisplayer,
            selectionMaker: RsccPlot.SelectionMaker,
            unscrollableContainer: false,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'step-torsions': {
            render: (props: View.Props) => <StepTorsions {...props} />,
            selectionDisplayer: StepTorsions.SelectionDisplayer,
            selectionMaker: StepTorsions.SelectionMaker,
            unscrollableContainer: false,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'similarity-plot': {
            render: (props: View.Props) => <SimilarityPlot {...props} />,
            selectionDisplayer: SimilarityPlot.SelectionDisplayer,
            selectionMaker: SimilarityPlot.SelectionMaker,
            unscrollableContainer: false,
            granularity: 'two-residues' as View<any>['granularity'],
            visualizer: true,
        },
        'structure-info': {
            render: (props: View.Props) => <StructureInfo {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'help-annotation': {
            render: (props: View.Props) => <HelpAnnotation {...props} />,
            selectionDisplayer: NullDisplayer,
            selectionMaker: NullSelectionMaker,
            unscrollableContainer: false,
            granularity: 'dont-care' as View<any>['granularity'],
            visualizer: false,
        },
        'help-refinement': {
           render: (props: View.Props) => <HelpRefinement {...props} />,
           selectionDisplayer: NullDisplayer,
           selectionMaker: NullSelectionMaker,
           unscrollableContainer: false,
           granularity: 'dont-care' as View<any>['granularity'],
           visualizer: false,
       },
       'help-validation': {
           render: (props: View.Props) => <HelpValidation {...props} />,
           selectionDisplayer: NullDisplayer,
           selectionMaker: NullSelectionMaker,
           unscrollableContainer: false,
           granularity: 'dont-care' as View<any>['granularity'],
           visualizer: false,
       },
       'downloads-validation': {
        render: (props: View.Props) => <DownloadsValidation {...props} />,
        selectionDisplayer: NullDisplayer,
        selectionMaker: NullSelectionMaker,
        unscrollableContainer: false,
        granularity: 'dont-care' as View<any>['granularity'],
        visualizer: false,
    },
    };
}
