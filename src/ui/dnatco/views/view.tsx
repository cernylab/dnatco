import { StructureSelection, StructureSelectionSwitching } from '../structure-selection';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { WithSubscriptions } from '../../service/with-subscriptions';
import { ViewerInterop } from '../../../viewer/viewer-interop';
import { Empty } from '../../../util';

export class View<P extends View.Props = View.Props, S = Empty> extends WithSubscriptions<P, S> {
}

export namespace View {
    export interface Props {
        dnatcofication: Dnatcofication;
        viewerInterop: ViewerInterop;
        structureSelection: StructureSelection;
        switching: StructureSelectionSwitching;
    }
}
