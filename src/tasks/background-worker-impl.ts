import { globalObject } from './global-object';
import { Register } from './register';
import { FinishedTask, Task, TaskContext } from './task';
import { WorkerMessage } from './worker';

function transferablesOf(value: unknown) {
    if (!Array.isArray(value))
        return [];

    const buffers = new Set<ArrayBuffer>();
    for (const item of value) {
        const data = (item as { data?: unknown } | null)?.data;
        if (ArrayBuffer.isView(data) && data.buffer instanceof ArrayBuffer)
            buffers.add(data.buffer);
    }

    return Array.from(buffers);
}

function postFinished<T>(finished: FinishedTask<T>) {
    const data = finished.data;

    if (typeof data !== 'object' || data === null) {
        globalObject.postMessage({ type: 'finished', finished });
        return;
    }

    globalObject.postMessage({
        type: 'result-begin',
        state: finished.state,
        message: finished.message,
    });

    const fields = data as unknown as Record<string, unknown>;
    for (const key of Object.keys(fields)) {
        const value = fields[key];
        globalObject.postMessage({ type: 'result-chunk', key, value }, transferablesOf(value));
        delete fields[key];
    }

    globalObject.postMessage({ type: 'result-end' });
}

function startTask<T, P>(task: Task<P>) {
    const ctx = new TaskContext<T>(task.initialStatus);

    const statusSub = ctx.events.statusChanged.subscribe((status) => {
        globalObject.postMessage({ type: 'status-changed', status });
    });
    const finishedSub = ctx.events.finished.subscribe((finished) => {
        postFinished<T>(finished);
    });

    globalObject.onmessage = null;

    Register[task.taskFunc](ctx as TaskContext<any>, task.payload as any).finally(() => {
        statusSub.unsubscribe();
        finishedSub.unsubscribe();
        globalObject.close();
    });
}

globalObject.onmessage = function<T, P>(ev: MessageEvent<WorkerMessage.In<P>>) {
    const msg = ev.data;

    if (msg.type === 'start-task')
        startTask<T, P>(msg.task);
};

globalObject.postMessage({ type: 'worker-ready' });
