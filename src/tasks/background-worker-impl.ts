import { globalObject } from './global-object';
import { Register } from './register';
import { Task, TaskContext } from './task';
import { WorkerMessage } from './worker';

function startTask<T, P>(task: Task<P>) {
    const ctx = new TaskContext<T>(task.initialStatus);

    ctx.events.statusChanged.subscribe((status) => {
        globalObject.postMessage({ type: 'status-changed', status });
    });
    ctx.events.finished.subscribe((finished) => {
        globalObject.postMessage({ type: 'finished', finished });
    });

    Register[task.taskFunc](ctx as TaskContext<any>, task.payload as any).finally(() => {
        globalObject.close();
    });
}

globalObject.onmessage = function<T, P>(ev: MessageEvent<WorkerMessage.In<P>>) {
    const msg = ev.data;

    if (msg.type === 'start-task')
        startTask<T, P>(msg.task);
};

globalObject.postMessage({ type: 'worker-ready' });
