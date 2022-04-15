import { ViewerApi } from '../viewer-api';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { WithSubscriptions } from '../../service/with-subscriptions';
import { Empty } from '../../../util';

export class View<P extends View.Props = View.Props, S = Empty> extends WithSubscriptions<P, S> {
}

export namespace View {
    export interface Props {
        dnatcofication: Dnatcofication;
        viewerApi: ViewerApi.Api;
    }
}
