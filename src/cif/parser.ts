export type Category = Record<string, (string|null)[]>;

export class Block {
    anonymousCategoriesCount = 0;
    categories: Record<string, Category> = {};

    constructor(public readonly name: string) {
        this.name = name;

        this.categories = {};
    }

    add(category: string|null, keyword: string, value: string) {
        if (category === null)
            category = this.nextAnonymousCategoryName();

        const actualValue = (value === '?' || value === '.') ? null : value;

        if (this.categories[category] === undefined)
            this.categories[category] = {};
        if (this.categories[category][keyword] === undefined)
            this.categories[category][keyword] = [actualValue];
        else
            this.categories[category][keyword].push(actualValue);
    }

    nextAnonymousCategoryName() {
        return `anonymous_${this.anonymousCategoriesCount++}`;
    }
}

const TabCharCode         =  9;
const NLCharCode          = 10;
const SpaceCharCode       = 32;
const DoubleQuoteCharCode = 34;
const HashCharCode        = 35;
const SingleQuoteCharCode = 39;
const SemicolonCharCode   = 59;
const UnderscoreCharCode  = 95;

type TokenKind = 'comment' | 'data-block' | 'loop' | 'multiline' | 'key' | 'value' | 'save-block';
type Token = { text: string, kind: TokenKind };

function Token(text: string, kind: TokenKind): Token {
    return { text, kind };
}

class Stream {
    private stream: string;
    private cursor: number;
    private length: number;
    lineCounter = 1;

    constructor(data: string) {
        this.stream = data;
        this.cursor = 0;
        this.length = data.length;
    }

    private getCifToken() {
        let charCode = this.stream.charCodeAt(this.cursor);
        const quote = (charCode === SingleQuoteCharCode || charCode === DoubleQuoteCharCode) ? charCode : undefined;

        const from = this.cursor;
        let idx = from + 1;
        for (; idx < this.length; idx++) {
            charCode = this.stream.charCodeAt(idx);
            if (quote) {
                if (charCode == NLCharCode)
                    throw new Error(`Quoted token that begins on line ${this.lineCounter} contains a new line`);
                else if (charCode === quote) {
                    // Jump one character ahead to get past the ending quote
                    // Note that we cannot dequote the string here because CIF names are allowed to be expressed as "Value"
                    // if they are quoted. Dequoting the string would therefore confuse the token kind detection
                    idx++;
                    break;
                }
            } else if (
                charCode === SpaceCharCode ||
                charCode === TabCharCode ||
                charCode === NLCharCode
            )
                break;
        }

        if (quote && idx === this.length)
            throw new Error(`Unterminated quoted token that begins on line ${this.lineCounter}`);
        const text = this.stream.substring(from, idx);
        const advance = text.length;
        return { text: text, advance: advance };
    }

    private tokenKind(text: string): TokenKind {
        const charCode = text.charCodeAt(0);

        if (charCode === UnderscoreCharCode)
            return 'key';
        else if (charCode === HashCharCode)
            return 'comment';
        else if (charCode === SemicolonCharCode && (this.cursor === 0 || this.stream.charCodeAt(this.cursor - 1) === NLCharCode))
            return 'multiline';
        else if (text.startsWith('data_'))
            return 'data-block';
        else if (text.startsWith('loop_'))
            return 'loop';
        else if (text.startsWith('save_'))
            return 'save-block';
        else
            return 'value';
    }

    eat() {
        const { text, advance } = this.getCifToken();

        // Move to the beginning of the next token
        this.cursor += advance;
        for (let idx = this.cursor; idx < this.length; idx++) {
            const charCode = this.stream.charCodeAt(idx);
            const isNewLine = charCode === NLCharCode;

            const isWhiteSpace = (charCode === SpaceCharCode) || (charCode === TabCharCode) || isNewLine;
            if (!isWhiteSpace)
                break;

            if (isNewLine)
                this.lineCounter++;
            this.cursor++;
        }

        const kind = this.tokenKind(text);
        return Token(text, kind);
    }

    eatLine() {
        let end = undefined;
        for (let idx = this.cursor; idx < this.length; idx++) {
            if (this.stream.charCodeAt(idx) === NLCharCode) {
                end = idx;
                this.lineCounter++;
                break;
            }
        }

        const line = this.stream.substring(this.cursor, end);

        if (end !== undefined)
            this.cursor = end + 1;
        else
            this.cursor = this.length;

        return line;
    }

    exhausted() { return this.cursor === this.length; }

    peek() {
        const { text } = this.getCifToken();
        const kind = this.tokenKind(text);

        return Token(text, kind);
    }
}

function keyToCategoryKeyword(key: string, lineNo: number): { category: string|null, keyword: string } {
    // CONFORMANCE: Check that there is only one dot
    let [ category, keyword ] = splitOnFirst(key, '.');

    if (category.length < 2)
        throw new Error(`Invalid name token on line ${lineNo}`);

    if (keyword === undefined)
        return { category: null, keyword: category.substring(1) }; // "Swap" keyword for category because we need to have anonymous categories to deal with non-mmCif data

    return { category: category.substring(1), keyword: keyword };
}

function doKeyValue(tok: Token, block: Block, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    const { category, keyword } = keyToCategoryKeyword(tok.text, stream.lineCounter);

    while (!stream.exhausted()) {
        const { kind } = stream.peek();

        if (kind === 'value') {
            block.add(category, keyword, stream.eat().text);
            return;
        } else if (kind === 'comment')
            stream.eatLine();
        else if (kind === 'multiline') {
            block.add(category, keyword, doMultiline(stream.eat(), stream));
            return;
        }
    }
}

function doLoop(block: Block, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    let { text, kind } = stream.eat();
    if (kind !== 'key')
        throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);

    const { category, keyword } = keyToCategoryKeyword(text, stream.lineCounter);
    const loopCategory = category;
    const columns = [keyword];
    const rows = [];
    let currentRow = [];
    while (!stream.exhausted()) {
        const { kind } = stream.peek();

        if (kind === 'comment')
            stream.eatLine();
        else if (kind === 'value') {
            if (columns.length === 0)
                throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);

            currentRow.push(stream.eat().text);
            if (currentRow.length === columns.length) {
                rows.push(currentRow);
                currentRow = [];
            }
        } else if (kind === 'multiline') {
            if (columns.length === 0)
                throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);

            const value = doMultiline(stream.eat(), stream);
            currentRow.push(value);
            if (currentRow.length === columns.length) {
                rows.push(currentRow);
                currentRow = [];
            }
        } else if (kind === 'key') {
            // If we have data that can make up a loop, assume that that loop ends here
            if (rows.length > 0 && currentRow.length === 0)
                break;

            const tok = stream.eat();
            const { category, keyword } = keyToCategoryKeyword(tok.text, stream.lineCounter);
            if (loopCategory !== category)
                throw new Error(`Mismatching categories "${category}" vs. "${loopCategory}" in loop on line ${stream.lineCounter}`);
            columns.push(keyword);
        } else {
            // If we have data that can make up a loop, assume that that loop ends here
            if (rows.length > 0 && currentRow.length === 0)
                break;

            throw new Error(`Malformed loop on line ${stream.lineCounter}`);
        }
    }

    const actualCategory = loopCategory === null ? block.nextAnonymousCategoryName() : loopCategory;

    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++)
            block.add(actualCategory ?? null, columns[colIdx], rows[rowIdx][colIdx]);
    }
}

function doMultiline(tok: Token, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    let multiline = tok.text.substring(1);
    while (!stream.exhausted()) {
        const { kind } = stream.peek();

        if (kind === 'value')
            multiline += (stream.eatLine() + " ");
        else if (kind === 'multiline') {
            stream.eat();
            return multiline;
        } else if (kind === 'comment')
            stream.eatLine();
        else
            throw new Error(`Unexpected token in inside a multiline entry on line ${stream.lineCounter}`);
    }

    throw new Error('Unterminated multiline entry');
}

function nextDataBlock(stream: Stream) {
    while (!stream.exhausted()) {
        const { kind } = stream.peek();
        if (kind === 'comment')
            stream.eatLine();
        else if (kind === 'data-block') {
            const [ _, name ] = splitOnFirst(stream.eat().text, '_');
            return new Block(name ?? '');
        } else
            stream.eat();
    }

    return null;
}

function splitOnFirst(text: string, delimiter: string): [string, string|undefined] {
    const idx = text.indexOf(delimiter);
    if (idx === -1)
        return [text, undefined];
    return [text.substring(0, idx), text.substring(idx + 1)];
}

export namespace Parser {
    export function parse(data: string) {
        const stream = new Stream(data);

        const blocks = [];

        let currentBlock = nextDataBlock(stream);
        if (currentBlock === null)
            throw new Error('File does not contain any data blocks');

        while (!stream.exhausted()) {
            const { kind } = stream.peek();

            if (kind === 'data-block') {
                const name  = splitOnFirst(stream.eat().text, '_')[1];
                blocks.push(currentBlock);
                currentBlock = new Block(name ?? '');
            } else if (kind === 'key')
                doKeyValue(stream.eat(), currentBlock, stream);
            else if (kind === 'loop') {
                stream.eat();
                doLoop(currentBlock, stream);
            } else if (kind === 'comment')
                stream.eatLine();
            else if (kind === 'multiline')
                throw new Error(`Unexpected multiline entry marker on line ${stream.lineCounter})`);
            else if (kind === 'value')
                throw new Error(`Unexpected value without name on line ${stream.lineCounter})`);
            else if (kind === 'save-block') {
                stream.eat();

                blocks.push(currentBlock);
                currentBlock = nextDataBlock(stream);

                if (currentBlock === null)
                    return blocks;
            } else
                throw new Error(`Unknown or unhandled token on line ${stream.lineCounter}`);
        }

        blocks.push(currentBlock);

        return blocks;
    }
}
