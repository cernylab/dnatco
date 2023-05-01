import { inWorker } from './';
import { DynamicTable } from '../ui/common/dynamic-table';

const CSV_COL_SEP = ';';
const ChopUrlTag = /(^[a-zA-Z0-9:./-]+);base64,/;

export namespace Serialization {
    export type Item = number|string|boolean;
    export type Column = Item[];
    export type Values = Column[];
    export type Serializable = {
        tags: string[];     // Used as headers
        values: Values; // Values by column -> row
    }

    export type OutputType = 'csv' | 'json';

    export async function toBase64(file: File) {
        if (inWorker()) {
            // @ts-ignore
            const reader = new FileReaderSync();
            return reader.readAsDataURL(file).replace(ChopUrlTag, '');
        } else {
            return Buffer.from(await file.arrayBuffer()).toString('base64');
        }
    }

    export function toCsv(data: Serializable) {
        const NCols = data.tags.length;
        if (NCols === 0)
            return '';
        const NRows = Math.max(...data.values.map(x => x.length));

        let text = data.tags.join(CSV_COL_SEP) + CSV_COL_SEP + '\n';

        for (let row = 0; row < NRows; row++) {
            for (let col = 0; col < NCols; col++) {
                const v = data.values[col]?.[row] ?? '';
                const tv = typeof v === 'number' ? v.toString() : v;
                text += tv + CSV_COL_SEP;
            }
            text += '\n';
        }

        return text;
    }

    export function toJson(data: Serializable) {
        const NCols = data.tags.length;

        let obj: Record<string, (number|string|boolean)[]> = {};
        for (let col = 0; col < NCols; col++)
            obj[data.tags[col]] = data.values[col];

        return JSON.stringify(obj);
    }

    export function dynamicTable(model: DynamicTable.Model, format: 'csv'|'json', sorting?: DynamicTable.Sorting) {
        const tags = model.columns.filter(col => !col.noData).map(col => col.name);
        const N = tags.length;
        const values = new Array<Column>(N);
        for (let idx = 0; idx < N; idx++)
            values[idx] = new Array<Item>();

        const rows = sorting ? model.sortedRows(sorting).map((sr) => sr.row) : model.rows;

        for (const row of rows) {
            for (let idx = 0; idx < N; idx++) {
                if (model.columns[idx].noData)
                    continue;
                values[idx].push(row[idx].data);
            }
        }

        const s: Serializable = { tags, values };
        return format === 'csv' ? toCsv(s) : toJson(s);
    }

    export function table(data: { name: string, values: string[] }[], format: OutputType) {
        const tags = data.map(x => x.name);
        const values = data.map(x => x.values);

        const s: Serializable = { tags, values };
        return format === 'csv' ? toCsv(s) : toJson(s);
    }
}
