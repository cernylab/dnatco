export type Category = Record<string, (string|null)[]>;

export class Block {
    anonymousCategoriesCount = 0;
    categories: Record<string, Category> = {};

    constructor(public readonly name: string) {
        this.categories = {};
    }

    add(category: string|null, keyword: string, value: string) {
        this.addMultiple(category, keyword, [value]);
    }

    addMultiple(category: string|null, keyword: string, values: string[]) {
        if (category === null)
            category = this.nextAnonymousCategoryName();

        const vals = values.map(value => (value === '?' || value === '.') ? null : value);

        if (this.categories[category] === undefined)
            this.categories[category] = {};
        if (this.categories[category][keyword] === undefined)
            this.categories[category][keyword] = vals
        else
            this.categories[category][keyword].push(...vals);
    }

    nextAnonymousCategoryName() {
        return `anonymous_${this.anonymousCategoriesCount++}`;
    }
}

const TabCharCode         =  9;
const NLCharCode          = 10;
const CRCharCode          = 13;
const SpaceCharCode       = 32;
const DoubleQuoteCharCode = 34;
const HashCharCode        = 35;
const SingleQuoteCharCode = 39;
const SemicolonCharCode   = 59;
const UnderscoreCharCode  = 95;

type PrimingState = { isPrimed: boolean, quotesIgnored: boolean };
type Token = { text: string, kind: number };
namespace TokenKind {
    export const Value       = 0;
    export const Tag         = (1 << 0);
    export const Comment     = (1 << 1);
    export const Multiline   = (1 << 2);
    export const Loop        = (1 << 3);
    export const DataBlock   = (1 << 4);
    export const SaveBlock   = (1 << 5);
    export const Stop        = (1 << 6);
    export const GlobalBlock = (1 << 7);
    export const Empty       = (1 << 8);
}

function Token(text: string, kind: number): Token {
    return { text, kind };
}

class Stream {
    private stream: string;
    private cursor: number;
    private length: number;

    private primedText: string;
    private primedKind: number;
    private primingState: PrimingState;

    lineCounter = 1;

    constructor(data: string) {
        this.stream = data;
        this.cursor = 0;
        this.length = data.length;

        this.primedText = '';
        this.primedKind = -1;
        this.primingState = { isPrimed: false, quotesIgnored: false };
    }

    private getCifToken(ignoreQuotes: boolean) {
        let charCode = this.stream.charCodeAt(this.cursor);
        const quote = (!ignoreQuotes && (charCode === SingleQuoteCharCode || charCode === DoubleQuoteCharCode)) ? charCode : undefined;

        const from = this.cursor;
        let idx = from + 1;
        for (; idx < this.length; idx++) {
            charCode = this.stream.charCodeAt(idx);
            if (quote) {
                if (charCode === NLCharCode || charCode === CRCharCode)
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
                charCode === NLCharCode ||
                charCode === CRCharCode
            )
                break;
        }

        if (quote && idx === this.length)
            throw new Error(`Unterminated quoted token that begins on line ${this.lineCounter}`);
        return this.stream.substring(from, idx);
    }

    private isEmptyToken(text: string) {
        for (let idx = 0; idx < text.length; idx++) {
            const charCode = text.charCodeAt(idx);
            const whiteSpace =
                charCode === NLCharCode ||
                charCode === SpaceCharCode ||
                charCode === TabCharCode ||
                charCode === CRCharCode;
            if (!whiteSpace)
                return false;
        }

        return true;
    }

    private isPrimed(ignoreQuotes: boolean): boolean {
        return this.primingState.isPrimed === true && this.primingState.quotesIgnored === ignoreQuotes;
    }

    private skipWhiteSpaces() {
        while (this.cursor < this.length) {
            const charCode = this.stream.charCodeAt(this.cursor);
            const isNewLine = charCode === NLCharCode;

            const isWhiteSpace = (charCode === SpaceCharCode) || (charCode === TabCharCode) || (charCode == CRCharCode) || isNewLine;
            if (!isWhiteSpace)
                break;

            this.lineCounter += isNewLine ? 1 : 0;
            this.cursor++;
        }
    }

    private tokenKind(text: string) {
        const charCode = text.charCodeAt(0);

        const kind =
            ((charCode === UnderscoreCharCode ? 1 : 0) << 0) |
            ((charCode === HashCharCode ? 1 : 0)       << 1) |
            (((charCode === SemicolonCharCode && (
                (this.cursor === 0) ||
                (this.stream.charCodeAt(this.cursor - 1) === NLCharCode) ||
                (this.stream.charCodeAt(this.cursor - 1) === CRCharCode)
            )) ? 1 : 0) << 2);

        if (kind !== 0)
            return kind;
        if (text.length < 5)
            return this.isEmptyToken(text) ? TokenKind.Empty : TokenKind.Value;

        text = text.toLowerCase();

        if (text.startsWith('loop_'))
            return TokenKind.Loop;
        else if (text.startsWith('data_'))
            return TokenKind.DataBlock;
        else if (text.startsWith('save_'))
            return TokenKind.SaveBlock;
        else if (text.startsWith('stop_'))
            return TokenKind.Stop;
        else if (text.startsWith('global_'))
            return TokenKind.GlobalBlock;

        return this.isEmptyToken(text) ? TokenKind.Empty : TokenKind.Value;
    }

    eat(ignoreQuotes: boolean = false) {
        let token: Token|undefined = undefined;

        if (this.isPrimed(ignoreQuotes)) {
            this.primingState.isPrimed = false;
            token = Token(this.primedText, this.primedKind);
        } else {
            const text = this.getCifToken(ignoreQuotes);
            token = Token(text, this.tokenKind(text));
        }

        // Move to the beginning of the next token
        this.cursor += token.text.length;
        this.skipWhiteSpaces();

        return token;
    }

    eatLine() {
        this.primingState.isPrimed = false;

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

    peekKind(ignoreQuotes: boolean = false): number {
        if (this.isPrimed(ignoreQuotes))
            return this.primedKind;

        this.skipWhiteSpaces();
        if (this.exhausted())
            return TokenKind.Empty;

        this.primedText = this.getCifToken(ignoreQuotes);
        this.primedKind = this.tokenKind(this.primedText);

        this.primingState.isPrimed = true;
        this.primingState.quotesIgnored = ignoreQuotes;

        return this.primedKind;
    }
}

function doLoop(block: Block, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    let { text, kind } = stream.eat();
    if (kind !== TokenKind.Tag)
        throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);

    const { category, keyword } = tagToCategoryKeyword(text, stream.lineCounter);
    const loopCategory = category;
    const columns = [keyword];

    let columnData: string[][] = [];
    let columnIndex = 0;

    const allocateColumnData = () => {
        for (let idx = 0; idx < columns.length; idx++) columnData.push([]);
    }

    while (!stream.exhausted()) {
        const kind = stream.peekKind();

        if (kind === TokenKind.Comment)
            stream.eatLine();
        else if (kind == TokenKind.Empty)
            stream.eat();
        else if (kind === TokenKind.Value) {
            if (columns.length === 0)
                throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);
            else if (columnData.length === 0) // First value token. We now know how many columns we have so we can allocate column data
                allocateColumnData();

            const value = stream.eat().text;
            columnData[columnIndex].push(value);
            columnIndex = (columnIndex + 1) % columns.length;
        } else if (kind === TokenKind.Multiline) {
            if (columns.length === 0)
                throw new Error(`Loop on line ${stream.lineCounter} does not define any columns`);
            else if (columnData.length === 0) // First value token. We now know how many columns we have so we can allocate column data
                allocateColumnData();

            const value = doMultiline(stream.eat().text, stream);
            columnData[columnIndex].push(value);
            columnIndex = (columnIndex + 1) % columns.length;
        } else if (kind === TokenKind.Tag) {
            // If we have data that can make up a loop, assume that that loop ends here
            if (columnData.length > 0 && columnIndex === 0)
                break;

            const tok = stream.eat();
            const { category, keyword } = tagToCategoryKeyword(tok.text, stream.lineCounter);
            if (loopCategory !== category) {
                if (columnData.length === 0)
                    throw new Error(`Mismatching categories "${category}" vs. "${loopCategory}" in loop on line ${stream.lineCounter}`);
                else
                    throw new Error(`Malformed loop on line ${stream.lineCounter}`);
            }
            columns.push(keyword);
        } else {
            // If we have data that can make up a loop, assume that that loop ends here
            if (columnData.length > 0 && columnIndex === 0)
                break;

            throw new Error(`Malformed loop on line ${stream.lineCounter}`);
        }
    }

    if (!(columnData.length > 0 && columnIndex === 0))
        throw new Error('File ended in the middle of a loop');

    const actualCategory = loopCategory === null ? block.nextAnonymousCategoryName() : loopCategory;

    for (let colIdx = 0; colIdx < columnData.length; colIdx++)
        block.addMultiple(actualCategory ?? null, columns[colIdx], columnData[colIdx]);
}

function doMultiline(text: string, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    let multiline = text.substring(1);
    while (!stream.exhausted()) {
        const kind = stream.peekKind(true);

        if (kind === TokenKind.Multiline) {
            stream.eat(true);
            return multiline.substring(0, multiline.length - 1);
        } else if (kind === TokenKind.Comment)
            stream.eatLine();
        else {
            const line = stream.eatLine();
            if (line.length > 0 && line.charCodeAt(line.length - 1) === CRCharCode)
                multiline += line.substring(0, line.length - 1);
            else
                multiline += line;
        }
    }

    throw new Error('Unterminated multiline entry');
}

function doTagValue(text: string, block: Block, stream: Stream) {
    if (stream.exhausted())
        throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);

    const { category, keyword } = tagToCategoryKeyword(text, stream.lineCounter);

    while (!stream.exhausted()) {
        const kind = stream.peekKind();

        if (kind === TokenKind.Value) {
            block.add(category, keyword, stream.eat().text);
            return;
        } else if (kind === TokenKind.Comment)
            stream.eatLine();
        else if (kind === TokenKind.Multiline) {
            block.add(category, keyword, doMultiline(stream.eat().text, stream));
            return;
        } else
            throw new Error(`Unexpected token kind ${kind} in tag-value entry on line ${stream.lineCounter}`);
    }

    throw new Error(`Unexpected end of file on line ${stream.lineCounter}`);
}

function nextDataBlock(stream: Stream) {
    while (!stream.exhausted()) {
        const kind = stream.peekKind();
        if (kind === TokenKind.Comment)
            stream.eatLine();
        else if (kind === TokenKind.DataBlock) {
            const name = splitOnFirst(stream.eat().text, '_')[1] ?? '';
            return new Block(name);
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

function tagToCategoryKeyword(key: string, lineNo: number): { category: string|null, keyword: string } {
    // CONFORMANCE: Check that there is only one dot
    let [ category, keyword ] = splitOnFirst(key, '.');

    if (category.length < 2)
        throw new Error(`Invalid name token on line ${lineNo}`);

    if (keyword === undefined)
        return { category: null, keyword: category.substring(1).toLowerCase() }; // "Swap" keyword for category because we need to have anonymous categories to deal with non-mmCif data

    return { category: category.substring(1).toLowerCase(), keyword: keyword.toLowerCase() };
}

export namespace Parser {
    export function parse(data: string) {
        const stream = new Stream(data);

        const blocks = [];

        let currentBlock = nextDataBlock(stream);
        if (currentBlock === null)
            throw new Error('File does not contain any data blocks');

        while (!stream.exhausted()) {
            const kind = stream.peekKind();

            if (kind === TokenKind.DataBlock) {
                const name = splitOnFirst(stream.eat().text, '_')[1] ?? '';
                blocks.push(currentBlock);
                currentBlock = new Block(name);
            } else if (kind === TokenKind.Tag)
                doTagValue(stream.eat().text, currentBlock, stream);
            else if (kind === TokenKind.Loop) {
                stream.eat();
                doLoop(currentBlock, stream);
            } else if (kind === TokenKind.Comment)
                stream.eatLine();
            else if (kind === TokenKind.Multiline)
                throw new Error(`Unexpected multiline entry marker on line ${stream.lineCounter})`);
            else if (kind === TokenKind.Value)
                throw new Error(`Unexpected value without name on line ${stream.lineCounter})`);
            else if (kind === TokenKind.Empty)
                stream.eat();
            else if (kind === TokenKind.SaveBlock || kind === TokenKind.Stop || kind === TokenKind.GlobalBlock) {
                console.warn(`Skipping unhandled block type ${kind}`);
                stream.eat();

                blocks.push(currentBlock);
                currentBlock = nextDataBlock(stream);

                if (currentBlock === null)
                    return blocks;
            } else
                throw new Error(`Unknown or unhandled token ${kind} on line ${stream.lineCounter}`);
        }

        blocks.push(currentBlock);

        return blocks;
    }

    export function toString(cif: Block[]) {
        let str = '';

        for (const block of cif) {
            str += `Data frame ${block.name}` + '\n';
            for (const name in block.categories) {
                str += name + '\n';
                const cat = block.categories[name];
                for (const entry in cat) {
                    const values = cat[entry];
                    str += '\t' + entry + ' ' + values.join(' ') + '\n';
                }
                str += '\n';
            }
        }

        return str;
    }
}
