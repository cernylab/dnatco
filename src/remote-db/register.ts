import { RedoPdbDb } from './redo-pdb';
import { RcsbDb } from './rcsb-db';

export const RemoteDatabases = {
    'rcsb': RcsbDb(),
    'redo-pdb': RedoPdbDb,
}
export type SupportedRemoteDatabases = keyof typeof RemoteDatabases;
