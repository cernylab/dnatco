import { Subject } from 'rxjs';
import { ReDNATCOMspApi as ViewerApi } from '../viewer-api';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { WithSubscriptions } from '../../service/with-subscriptions';
import { Empty } from '../../../util';

export class View<P extends View.Props = View.Props, S = Empty> extends WithSubscriptions<P, S> {
}

export type ViewerEvents = {
    stepDeselected: Subject<void>;
    stepSelected: Subject<{ name: string, rmsd?: number }>;
}

export namespace View {
    export interface Props {
        dnatcofication: Dnatcofication;
        viewerApi: ViewerApi.Object;
        viewerEvents: ViewerEvents;
    }
}
