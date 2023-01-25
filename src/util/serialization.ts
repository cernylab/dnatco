import { inWorker } from './';
import { DynamicTable } from '../ui/common/dynamic-table';

const CSV_COL_SEP = ';';
const ChopUrlTag = /(^[a-zA-Z0-9:./-]+);base64,/;

export namespace Serialization {
    type Serializable = {
        tags: string[];     // Used as headers
        values: string[][]; // Values by column -> row
    }

    export type OutputType = 'csv'|'json';

    function toCsv(data: Serializable) {
        const NCols = data.tags.length;
        if (NCols === 0)
            return '';
        const NRows = data.values[0].length;

        let text = data.tags.join(CSV_COL_SEP) + CSV_COL_SEP + '\n';

        for (let row = 0; row < NRows; row++) {
            for (let col = 0; col < NCols; col++)
                text += data.values[col][row] + CSV_COL_SEP;
            text += '\n';
        }

        return text;
    }

    function toJson(data: Serializable) {
        const NCols = data.tags.length;

        let obj: Record<string, string[]> = {};
        for (let col = 0; col < NCols; col++)
            obj[data.tags[col]] = data.values[col];

        return JSON.stringify(obj);
    }

    export async function toBase64(file: File) {
        if (inWorker()) {
            // @ts-ignore
            const reader = new FileReaderSync();
            return reader.readAsDataURL(file).replace(ChopUrlTag, '');
        } else {
            return Buffer.from(await file.arrayBuffer()).toString('base64');
        }
    }

    export function dynamicTable(model: DynamicTable.Model, format: 'csv'|'json') {
        const tags = model.columns.filter(col => !col.noData).map(col => col.name);
        const N = tags.length;
        const values = new Array<string[]>(N);
        for (let idx = 0; idx < N; idx++)
            values[idx] = new Array<string>();

        for (const row of model.rows) {
            for (let idx = 0; idx < N; idx++) {
                if (model.columns[idx].noData)
                    continue;
                values[idx].push(row[idx].data.toString());
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
