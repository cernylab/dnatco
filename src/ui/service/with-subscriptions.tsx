import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

export class WithSubscriptions<P, S> extends React.Component<P, S> {
    private subscriptions: Subscription[] = [];

    protected subscribe<T>(obs: Observable<T>, h: (v: T) => void) {
        this.subscriptions.push(obs.subscribe(h));
    }

    protected unsubscribeAll() {
        for (const s of this.subscriptions)
            s.unsubscribe();
    }
}
