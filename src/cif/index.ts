import { Category, Schema } from './categories';
import { Parser } from './parser';
import { KnownCategories } from './register';

function toArray<T>(list: (string|null)[], conv: (v: string) => T) {
    const array = new Array<T|null>(list.length);
    for (let idx = 0; idx < list.length; idx++) {
        const v = list[idx];
        if (v === null)
            array[idx] = null;
        else
            array[idx] = conv(v);
    }

    return array;
}

export namespace Cif {
    export type Data = {
        blocks: Block[],
        raw: string,
    };

    export type Block = {
        name: string;
        tables: Map<string, Table<any>>;
    }

    export type Column<T> = {
        values: T[]|null,
        cifType: Schema.CifType,
    }
    export function Column<T>(values: T[]|null, cifType: Schema.CifType): Column<T> {
        return { values, cifType };
    }

    export namespace Column {
        export function hasValues<T>(c: Column<T>) {
            return c.values !== null;
        }

        export function value<T>(c: Column<T>, row: number): T|null {
            if (c.values === null)
                throw new Error('Column has no values');
            return c.values[row];
        }
    }

    export type Row<S extends Schema.Schema> = {
        [K in keyof S]: S[K]['T']|null;
    }

    export function Row<S extends Schema.Schema>(table: Table<S>, row: number): Row<S> {
        const r: Partial<Row<S>> = {};
        const schema = TableAsSchema(table);

        for (const key in schema) {
            const col = table[key];
            r[key as keyof Row<S>] = Column.hasValues(col) ? Column.value(col, row) : null;
        }

        return r as Row<S>;
    }

    const TableBase = {
        _rowCount: 0,
    };
    export type TableBase = typeof TableBase;
    export type Table<S extends Schema.Schema> = {
        [K in keyof S]: Column<S[K]['T']>;
    } & TableBase;

    export function TableAsSchema<S extends Schema.Schema, T = any>(table: Table<S>) {
        const schema: Record<string, Schema.CifType<T>> = {};

        for (const key in table) {
            if (!(key in TableBase))
                schema[key] = table[key].cifType;
        }

        return schema as S;
    }

    function handleRecord<S extends Schema.Schema>(data: Record<string, (string|null)[]>, schema: S, name: string): Table<S> {
        const accum: Record<string, Column<any>> = {};

        let rowCount = 0;
        for (const column in data) {
            if (rowCount === 0)
                rowCount = data[column].length;
            else if (rowCount !== data[column].length)
                throw new Error(`Mismatching number of columns in category ${name}, expected ${rowCount}, got ${data[column].length}`);
        }

        for (const column in schema) {
            const col = schema[column];
            const columnLwr = column.toLowerCase();

            if (!(columnLwr in data)) {
                if (col.mandatory)
                    throw new Error(`Column ${column} is mandatory but not present in ${name}`);
                else
                    accum[column] = Column(null, col);
            } else {
                const list = data[columnLwr];

                try {
                    if (Schema.isDate(col)) {
                        accum[column] = Column(toArray(list, Schema.toDate), col);
                    } else if (Schema.isEnum(col)) {
                        accum[column] = Column(toArray(list, x => Schema.toEnum(x, col)), col);
                    } else {
                        switch (col.cifType) {
                        case 'float':
                            accum[column] = Column(toArray(list, Schema.toFloat), col);
                            break;
                        case 'int':
                            accum[column] = Column(toArray(list, Schema.toInt), col);
                            break;
                        case 'str':
                            accum[column] = Column(toArray(list, Schema.toStr), col);
                            break;
                        case 'time':
                            accum[column] = Column(toArray(list, Schema.toTime), col);
                            break;
                        }
                    }
                } catch (e) {
                    throw new Error(`Cannot process category ${name}, field ${column} is invalid: ${e}`);
                }
            }
        }

        return { _rowCount: rowCount, ...accum } as Table<S>;
    }

    export namespace File {
        export function blockCount(data: Data) {
            return data.blocks.length;
        }

        export function hasTable<S extends Schema.Schema>(data: Data, category: Category<S>, block = 0) {
            return data.blocks[block].tables.has(category.name.toLowerCase());
        }

        export function table<S extends Schema.Schema>(data: Data, category: Category<S>, block = 0): Table<S> {
            const tbl = data.blocks[block].tables.get(category.name.toLowerCase());
            if (!tbl)
                throw new Error(`No table ${category.name} in cif file`);
            return tbl as Table<S>;
        }
    }

    export function read(data: string): Data {
        const cif = Parser.parse(data);

        const blocks = new Array<Block>();

        for (const block of cif) {
            const tables = new Map<string, any>();

            for (const name in block.categories) {
                const cat = block.categories[name];

                const template = KnownCategories.find(x => x.name.toLowerCase() === name);
                if (template) {
                    const table = handleRecord(cat, template.schema, template.name.toLowerCase());
                    tables.set(name, table);
                }
            }

            blocks.push({ name: block.name, tables });
        }

        return { blocks, raw: data };
    }
}
