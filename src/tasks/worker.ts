import { FinishedTask, FinishedTaskState, Task, TaskContext } from './task';
import { Register } from './register';

export namespace WorkerMessage {
    export namespace In {
        export type StartTask<P> = {
            type: 'start-task',
            task: Task<P>,
        }
    }
    export type In<P> = In.StartTask<P>;

    export namespace Out {
        export type Finished<T> = {
            type: 'finished',
            finished: FinishedTask<T>,
        };

        export type Ready = {
            type: 'worker-ready'
        };

        export type StatusChanged = {
            type: 'status-changed',
            status: string,
        };
        export type ResultBegin = {
            type: 'result-begin',
            state: FinishedTaskState,
            message?: string,
        };

        export type ResultChunk = {
            type: 'result-chunk',
            key: string,
            value: any,
        };

        export type ResultEnd = {
            type: 'result-end',
        };
    }
    export type Out<T> = Out.Finished<T> | Out.Ready | Out.StatusChanged;
    export type OutWire<T> = Out<T> | Out.ResultBegin | Out.ResultChunk | Out.ResultEnd;
}

export interface BackroundWorker<T, P> {
    onmessage: ((this: Worker, ev: MessageEvent<WorkerMessage.Out<T>>) => any) | null,
    postMessage: (msg: WorkerMessage.In<P>) => void,
    terminate: () => void,
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => void) | null,
}
export function BackgroundWorker<T, P>(): BackroundWorker<T, P> {
    const worker = new Worker(new URL('./background-worker-impl.js', import.meta.url));

    let assembled: Record<string, unknown>|null = null;
    let assembledState: FinishedTaskState = 'failed';
    let assembledMessage: string|undefined = void 0;

    const wrapper: BackroundWorker<T, P> = {
        onmessage: null,
        onerror: null,
        postMessage: (msg) => worker.postMessage(msg),
        terminate: () => {
            worker.onmessage = null;
            worker.onerror = null;
            assembled = null;
            worker.terminate();
        },
    };

    const deliver = (msg: WorkerMessage.Out<T>) => {
        wrapper.onmessage?.call(worker, new MessageEvent<WorkerMessage.Out<T>>('message', { data: msg }));
    };

    worker.onmessage = (ev: MessageEvent<WorkerMessage.OutWire<T>>) => {
        const msg = ev.data;

        switch (msg.type) {
            case 'result-begin':
                assembled = {};
                assembledState = msg.state;
                assembledMessage = msg.message;
                break;
            case 'result-chunk':
                if (assembled !== null)
                    assembled[msg.key] = msg.value;
                break;
            case 'result-end': {
                const data = (assembled ?? void 0) as unknown as T|undefined;
                assembled = null;

                deliver({
                    type: 'finished',
                    finished: { state: assembledState, data, message: assembledMessage },
                });
                break;
            }
            default:
                deliver(msg);
                break;
        }
    };

    worker.onerror = (ev) => {
        wrapper.onerror?.call(worker, ev);
    };

    return wrapper;
}

export async function MainThreadWorker<T, P>(task: Task<P>, ctx: TaskContext<T>) {
    Register[task.taskFunc](ctx as TaskContext<any>, task.payload as any);
}
