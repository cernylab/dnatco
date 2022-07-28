import { TaskContext } from './task';
import { Tasks as DnatcoficationTasks } from '../dnatco/tasks';

export type TaskFunc = (ctx: TaskContext<any>, payload?: any) => any;

/*
 * This has to be done "backwards", meaning that instead of the modules
 * registering their task handlers the register needs to import all handlers
 * and put them in a list.
 * This is necessary because the handlers are accessed from Workers. Handlers registered
 * from the main thread at runtime would not be visible to the Workers.
 */
export const Register = {
    ...DnatcoficationTasks,
}
