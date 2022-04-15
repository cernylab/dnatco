import { Subject, BehaviorSubject } from 'rxjs';

export class EventsKeeper {
    private evts: Subject<any>[] = [];

    destroy() {
        for (const e of this.evts)
            e.complete();
        this.evts.length = 0;
    }

    behavior<T>(v: T) {
        const s = new BehaviorSubject<T>(v);
        this.evts.push(s);
        return s;
    }

    subject<T>() {
        const s = new Subject<T>();
        this.evts.push(s);
        return s;
    }
}
