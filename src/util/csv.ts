export namespace Csv {
    type Mapping<Schema> = Record<keyof Schema, number>;

    function mapProp<Schema, Key extends keyof Schema>(obj: Partial<Schema>, key: Key, value: string, schema: Schema) {
        const type = typeof schema[key];
        if (type === 'number') {
            const n = parseFloat(value);;
            if (isNaN(n))
                throw new Error(`Expected a number, got "${value}"`);
            obj[key] = n as Schema[Key];
        } else if (type === 'boolean') {
            const tf = value.toLowerCase();
            if (tf === 'true')
                obj[key] = true as Schema[Key];
            else if (tf === 'false')
                obj[key] = false as Schema[Key];
            else
                throw new Error('Invalid boolean value')
        } else if (type === 'string')
            obj[key] = value as Schema[Key];
        else
            throw new Error(`Type ${type} is not representable in CSV text`);

        return obj;
    }

    function mapLine<Schema>(tokens: string[], mapping: Mapping<Schema>, schema: Schema): Schema {
        let out: Partial<Schema> = {};

        for (const prop in mapping) {
            const idx = mapping[prop];
            if (idx >= tokens.length)
                throw new Error('Line does not have enough fields');

            const value = tokens[idx];
            out = mapProp(out, prop, value, schema);
        }

        return out as Schema;
    }

    function mapSchema<Schema>(tokens: string[], schema: Schema): Mapping<Schema> {
        const mapping: Partial<Mapping<Schema>> = {};

        const seenKeys = new Set<string>();
        for (const tok of tokens) {
            if (seenKeys.has(tok))
                throw new Error(`Column "${tok}" is defined multiple times in input`);
            seenKeys.add(tok);
        }

        for (const prop in schema) {
            const key = prop.toString();
            const idx = tokens.findIndex(x => x === key);
            if (idx === -1)
                throw new Error(`Input does not contain field "${key}"`);

            mapping[prop] = idx;
        }

        return mapping as Mapping<Schema>;
    }

    function parseLine(line: string, delimiter: string, quote: string) {
        const toks = new Array<string>();

        let idx = 0;
        while (idx < line.length) {
            let fromIdx: number;
            let toIdx: number;

            const ch = line.charAt(idx);
            if (ch === quote) {
                let endQuoteIdx = line.indexOf(quote, idx + 1);
                if (endQuoteIdx === -1)
                    throw new Error('Unterminated quote');
                if (endQuoteIdx + 1 < line.length && line.charAt(endQuoteIdx + 1) !== delimiter)
                    throw new Error('End quote must be followed by delimiter');

                fromIdx = idx + 1;
                toIdx = endQuoteIdx;
                idx = endQuoteIdx + 2; // Skip the end quote and the delimiter
            } else {
                fromIdx = idx;

                let nextDelimIdx = line.indexOf(delimiter, idx);
                if (nextDelimIdx === -1) {
                    toIdx = line.length;
                    idx = toIdx;
                } else {
                    toIdx = nextDelimIdx;
                    idx = nextDelimIdx + 1;
                }
            }

            const tok = toIdx - fromIdx === 0 ? '' : line.substring(fromIdx, toIdx);
            toks.push(tok);
        }

        return toks;
    }

    export function read<Schema>(data: string, delimiter: string, quote: string, schema: Schema): Schema[] {
        // Assume that the file has a header.
        // Columns described by the header must have the same name as fields in the schema

        const lines = data.split('\n');
        if (lines.length === 0 || lines[0].length === 0)
            throw new Error('Empty input');

        const header = parseLine(lines[0], delimiter, quote);
        const mapping = mapSchema(header, schema);
        const toIdx = !lines[lines.length - 1] ? lines.length - 2 : lines.length - 1;

        const out = new Array<Schema>(toIdx);
        for (let idx = 1; idx <= toIdx; idx++) {
            const line = lines[idx];
            const toks = parseLine(line, delimiter, quote);
            out[idx - 1] = mapLine(toks, mapping, schema);
        }

        return out;
    }
}
