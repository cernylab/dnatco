import { Register } from './register';
import { EventsKeeper } from '../util/events-keeper';

export type FinishedTaskState = 'succeeded' | 'failed';

export type FinishedTask<T> = {
    state: FinishedTaskState,
    data?: T,
    message?: string,
}

export type Task<P> = {
    taskFunc: keyof typeof Register,
    payload: P,
    initialStatus: string,
}

export class TaskContext<T> {
    private readonly ek = new EventsKeeper();

    readonly events = {
        finished: this.ek.subject<FinishedTask<T>>(),
        statusChanged: this.ek.subject<string>(),
    }

    constructor(private _status: string) {
    }

    get status() {
        return this._status;
    }

    set status(status: string) {
        this._status = status;
        this.events.statusChanged.next(status);
    }
}
