import { PdbRedoDb } from './pdb-redo';
import { RcsbDb } from './rcsb-db';
import { StaticDb } from './static-db';
import { objKeys } from '../../util';

const _UserRemoteDatabases = new Map<string, StaticDb>();

export namespace UserRemoteDatabases {
    export function add(db: StaticDb) {
        if (isBuiltIn(db.id))
            throw new Error(`"${db.id}" ID is reserved for a built-in database`);
        if (_UserRemoteDatabases.has(db.id))
            throw new Error(`User database ${db.id} already exists`);

        _UserRemoteDatabases.set(db.id, db);
    }

    export function exists(id: string) {
        return _UserRemoteDatabases.has(id);
    }

    export function get(id: string) {
        const db = _UserRemoteDatabases.get(id);
        if (!db)
            throw new Error(`User database ${id} does not exist`);

        return StaticDb(
            db.name,
            db.coords,
            db.densityMaps
        );
    }

    export function list() {
        return Array.from(_UserRemoteDatabases.entries()).map(([k, v]) => ({ id: k, name: v.name }));
    }

    export function _export(): StaticDb[] {
        return Array.from(_UserRemoteDatabases.values());
    }

    export function _import(dbs: StaticDb[]) {
        _UserRemoteDatabases.clear();
        dbs.forEach(x => _UserRemoteDatabases.set(x.id, x));
    }
}

export const BuiltInRemoteDatabases = {
    'rcsb': RcsbDb(),
    'pdb-redo': PdbRedoDb,
};

export function isBuiltIn(id: string) {
    return !!(objKeys(BuiltInRemoteDatabases).find((x) => (x as string) === id));
}
