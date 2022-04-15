/* BEWARE, BEWARE, the code below is terrible */

function _ln(data: string): { idx: number, line: string } {
    const idx = data.indexOf('\n');
    if (idx < 0)
        return { idx: -1, line: '' };
    return { idx, line: data.slice(0, idx) };
}

function _lnt(data: string): { idx: number, line: string } {
    const l = _ln(data);
    return { idx: l.idx, line: l.line.trim() };
}

function checkQuoted(s: string) {
    if (s.length < 2)
        return { isQuoted: false, quoteChar: '' };
    const ch = s[0];
    return {
        isQuoted: ch === '\'' || ch === '"',
        quoteChar: ch
    };
}

function replaceEvery(s: string, what: string, by: string) {
    let idx = s.indexOf(what);
    while(idx >= 0) {
        s = s.replace(what, by);
        idx = s.indexOf(what);
    }
    return s;
}

function parseBlock(line: string) {
    const toks = line.split('_');
    if (toks.length !== 2)
        throw new Error('Invalid data block line');
    if (toks[1].length < 1)
        throw new Error('Block name has no name');
    return toks[1];
}

function parseLoopBody(data: string, headers: string[]): { loop: Parser.Loop, tail: string } {
    let loop: Parser.Loop = {
        kind: 'loop',
        data: {},
    }

    for (const h of headers)
        loop.data[h] = [];

    while (data.length > 0) {
        let { idx, line } = _lnt(data);
        if (idx < 0)
            throw new Error('mmCif fle unexpectedly ended in the middle of a loop body');

        if (line.startsWith('#'))
            return { loop, tail: data.slice(idx + 1) };

        let content: string[] = [];

        while (content.length < headers.length) {
            if (data.length < 1)
                throw new Error('mmCif file unexpectedly ended in the middle of a loop body');

            if (line.length < 1) {
                data = data.slice(idx + 1);
                ({ idx, line } = _lnt(data));
            } else if (line[0] === ';') {
                const kdx = data.slice(1).search(/^;\n/gm);
                if (kdx < 0)
                    throw new Error('Multiline entry without terminating semicolon');
                const mline = data.slice(1, kdx);
                content.push(replaceEvery(mline, '\n', ''));
                data = data.slice(kdx + 2); // +2 because we need to skip the newline too
                ({ idx, line } = _lnt(data));
            } else {
                while (line.length > 0) {
                    const { isQuoted, quoteChar } = checkQuoted(line);
                    const isBlockEnd = isQuoted ? (ch: string) => ch === quoteChar : (ch: string) => ch === ' ' || ch === '\t';
                    let block = '';

                    let jdx = 0 + (isQuoted ? 1 : 0);
                    while (jdx < line.length && !isBlockEnd(line[jdx]))
                        block += line[jdx++];

                    if (jdx === line.length && isQuoted && line[jdx - 1] !== '\'')
                        throw new Error('Unterminated quoted block');

                    content.push(block);
                    line = line.slice(jdx + 1).trimStart();
                }

                data = data.slice(idx + 1);
                ({ idx, line } = _lnt(data));
            }
        }

        for (let cdx = 0; cdx < headers.length; cdx++) {
            const c = content[cdx];
            if (c === undefined)
                throw new Error('Undefined entry, this should never happen');
            else if (c === '?' || c === '.')
                loop.data[headers[cdx]].push(null);
            else
                loop.data[headers[cdx]].push(content[cdx]);
        }
    }

    throw new Error('mmCif file ended unexpectedly in the middle of a loop body');
}

function parseLoopHeader(data: string): { categoryName: string, headers: string[], tail: string } {
    let categoryName = '';
    let headers: string[] = [];

    while (data.length > 0) {
        let { idx, line } = _lnt(data);
        if (idx < 0)
            throw new Error('mmCif file ended unexpectedly in the middle of a loop header');
        if (line.length < 1)
            throw new Error('Zero line length in loop header');
        if (line[0] === ';')
            throw new Error('Multiline entry sign in loop header is not handled');
        if (line[0] !== '_')
            return { tail: data, categoryName, headers };

        const segs = line.split('.');
        if (segs.length !== 2)
            throw new Error('Loop header has invalid format');

        let [ cat, header ] = segs;
        cat = cat.slice(1);

        if (categoryName === '')
            categoryName = cat;
        else if (categoryName !== cat)
            throw new Error('Multiple categories in one loop are not allowed');

        if (headers.includes(header))
            throw new Error('Duplicit header name');

        headers.push(header);

        data = data.slice(idx + 1);
    }

    throw new Error('mmCif file ended unexpectedly in the moddle of a loop header');
}

function parsePairEntry(line: string, data: string): { categoryName: string, key: string, value: string|null, tail: string } {
    const dot = line.indexOf('.');
    if (dot === -1)
        throw new Error('Category name delimiter not found');
    else if (dot === 0)
        throw new Error('Empty category name');

    const categoryName = line.slice(1, dot);

    line = line.slice(dot + 1);
    const  space = line.indexOf(' ');
    if (space === -1)
        throw new Error('Pair has no value');

    const key = line.slice(0, space);
    let value: string|null = line.slice(space + 1).trim();
    if (value.length === 1 && value === '.' || value === '?')
        value = null;
    else if (value.length === 0) {
        let next = _ln(data);
        while (next.line.startsWith(';')) {
            value += next.line.slice(1);
            data = data.slice(next.idx + 1);
            next = _ln(data);
        }
    }

    return { categoryName, key, value, tail: data };

}

function parsePairs(firstLine: string, data: string): { categoryName: string, pairs: Parser.Pairs, tail: string } {
    let pairs: Parser.Pairs = {
        kind: 'pairs',
        data: {},
    };

    const first = parsePairEntry(firstLine, data);
    const catName = first.categoryName;

    pairs.data[first.key] = first.value;

    while (data.length > 0) {
        let { idx, line } = _ln(data);
        if (line.startsWith('#'))
            return { categoryName: catName, pairs, tail: data.slice(idx + 1) };

        data = data.slice(idx + 1);

        const { categoryName, key, value, tail } = parsePairEntry(line, data);
        if (categoryName !== catName)
            throw new Error(`Mismatching category names ${catName} vs. ${categoryName}`);
        pairs.data[key] = value;
        data = tail;
    }

    return { categoryName: catName, pairs, tail: data };
}

function toCif(data: string) {
    const cif: Parser.mmCif = [];

    let block: Parser.Block|undefined = undefined;

    while (data.length > 0) {
        const { idx, line } = _ln(data);
        if (idx < 0)
            return cif;

        if (line.startsWith('data_')) {
            if (block)
                cif.push(block);
            const name = parseBlock(line);
            block = { name, categories: {} };
            data = data.slice(idx + 1);

            const secondLine = _lnt(data);
            if (!secondLine.line.startsWith('#'))
                throw new Error('Block definition is not separated by #');
            data = data.slice(secondLine.idx + 1);
            continue;
        }
        if (!block)
            throw new Error('Data outside a block');

        if (line === 'loop_') {
            data = data.slice(idx + 1);
            let { tail, headers, categoryName } = parseLoopHeader(data);
            let loop; ({ tail, loop } = parseLoopBody(tail, headers));
            block.categories[categoryName] = loop;
            data = tail;
        } else if (line.startsWith('_')) {
            let { tail, pairs, categoryName } = parsePairs(line, data);
            block.categories[categoryName] = pairs;
            data = tail;
        } else
            data = data.slice(idx + 1);
    }

    if (block)
        cif.push(block);

    return cif;
}

export namespace Parser {
    export type Block = {
        name: string;
        categories: Categories;
    };
    export type Category = Pairs|Loop;
    export type Categories = Record<string, Category>;
    export type Loop = {
        kind: 'loop';
        data: Record<string, (string|null)[]>;
    };
    export type Pairs = {
        kind: 'pairs';
        data: Record<string, string|null>;
    };
    export type mmCif = Array<Block>;

    export function isLoop(cat: Category): cat is Loop { return cat.kind === 'loop'; }
    export function isPairs(cat: Category): cat is Pairs { return cat.kind === 'pairs'; }

    export function parse(data: string) {
        return toCif(data);
    }
}
