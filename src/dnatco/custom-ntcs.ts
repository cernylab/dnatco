import { NtC } from './ntc';
import { EventsKeeper } from '../util/events-keeper';

type Sets = Map<string, Map<string, NtC.ValidClass>>;

export class CustomNtCs {
    private readonly ek = new EventsKeeper();
    private _sets: Sets = new Map<string, Map<string, NtC.ValidClass>>();

    readonly events = {
        setAdded: this.ek.subject<string>(),
        setChanged: this.ek.subject<{ set: string, step?: string }>(),
        setDeleted: this.ek.subject<string>(),
        setRenamed: this.ek.subject<{oldName: string, newName: string}>(),
        setsCleared: this.ek.subject<void>(),
    };

    addSet(name: string) {
        if (this._sets.has(name))
            throw new Error(`Set ${name} already exists`);

        this._sets.set(name, new Map<string, NtC.ValidClass>());

        this.events.setAdded.next(name);
    }

    clear() {
        this._sets.clear();
        this.events.setsCleared.next();
    }

    deleteCustomNtC(set: string, step: string) {
        const s = this._sets.get(set);
        if (!s)
            throw new Error(`Set ${set} does not exist`);

        s.delete(step);

        this.events.setChanged.next({ set, step });
    }

    deleteSet(name: string) {
        if (this._sets.has(name)) {
            this._sets.delete(name);
            this.events.setDeleted.next(name);
        }
    }

    exists(name: string) {
        return this._sets.has(name);
    }

    getCustomNtC(set: string, step: string) {
        const s = this._sets.get(set);
        return s ? s.get(step) : void 0;
    }

    isEmpty() {
        return this._sets.size === 0;
    }

    renameSet(name: string, newName: string) {
        const s = this._sets.get(name);
        if (!s)
            throw new Error(`Set {set} does not exist`);

        this._sets.delete(name);
        this._sets.set(newName, s);

        this.events.setRenamed.next({ oldName: name, newName });
    }

    setCustomNtC(set: string, step: string, NtC: NtC.ValidClass) {
        const s = this._sets.get(set);
        if (!s)
            throw new Error(`Set ${set} does not exist`);

        s.set(step, NtC);

        this.events.setChanged.next({ set, step });
    }

    sets() {
        return Array.from(this._sets.keys());
    }
}
