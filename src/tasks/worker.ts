import { FinishedTask, Task, TaskContext } from './task';
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
    }
    export type Out<T> = Out.Finished<T> | Out.Ready | Out.StatusChanged;
}

export interface BackroundWorker<T, P> {
    onmessage: ((this: Worker, ev: MessageEvent<WorkerMessage.Out<T>>) => any) | null,
    postMessage: (msg: WorkerMessage.In<P>) => void,
    terminate: () => void,
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => void) | null,
}
export function BackgroundWorker<T, P>(): BackroundWorker<T, P> {
    return new Worker(new URL('./background-worker-impl.js', import.meta.url));
}

export async function MainThreadWorker<T, P>(task: Task<P>, ctx: TaskContext<T>) {
    Register[task.taskFunc](ctx as TaskContext<any>, task.payload as any);
}
