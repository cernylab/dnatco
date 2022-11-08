import { NtC } from './ntc';
import { EventsKeeper } from '../util/events-keeper';

type Sets = Map<string, Map<string, NtC.ValidClass>>;

export class CustomNtCs {
    private readonly ek = new EventsKeeper();
    private _sets: Sets = new Map<string, Map<string, NtC.ValidClass>>();

    readonly events = {
        changed: this.ek.subject<{ set: string, step?: string }>(),
    };

    addSet(name: string) {
        if (this._sets.has(name))
            throw new Error(`Set ${name} already exists`);

        this._sets.set(name, new Map<string, NtC.ValidClass>());

        this.events.changed.next({ set: name });
    }

    clear() {
        this._sets.clear();
        this.events.changed.next({ set: '' });
    }

    deleteCustomNtC(set: string, step: string) {
        const s = this._sets.get(set);
        if (!s)
            throw new Error(`Set ${set} does not exist`);

        s.delete(step);

        this.events.changed.next({ set, step });
    }

    deleteSet(name: string) {
        if (this._sets.has(name)) {
            this._sets.delete(name);
            this.events.changed.next({ set: name });
        }
    }

    empty() {
        return this._sets.size === 0;
    }

    exists(name: string) {
        return this._sets.has(name);
    }

    getCustomNtC(set: string, step: string) {
        const s = this._sets.get(set);
        return s ? s.get(step) : void 0;
    }

    renameSet(name: string, newName: string) {
        const s = this._sets.get(name);
        if (!s)
            throw new Error(`Set {set} does not exist`);

        this._sets.delete(name);
        this._sets.set(newName, s);

        this.events.changed.next({ set: newName });
    }

    setCustomNtC(set: string, step: string, NtC: NtC.ValidClass) {
        const s = this._sets.get(set);
        if (!s)
            throw new Error(`Set ${set} does not exist`);

        s.set(step, NtC);

        this.events.changed.next({ set, step });
    }

    sets() {
        return Array.from(this._sets.keys());
    }
}
