import * as React from 'react';
import { Icon } from './icon';
import { Tooltip } from './tooltip';
import { colorToHex, scrollIntoViewIfNeeded } from '../util';
import { GlobalConfig } from '../../global-config';
import { Downloader as _Downloader } from '../../util/downloader';
import { arraysAreSame } from '../../util';
import 'assets/imgs/data-transfer-download.svg';
import 'assets/imgs/sort.svg';
import 'assets/imgs/sorted-ascending.svg';
import 'assets/imgs/sorted-descending.svg';

const NotHighlighted = { background: 'none' };

interface Comparator<T> {
    (a: T, b: T): number;
}

function cellShouldUpdate(oldCell: DynamicTable.Cell<any>, newCell: DynamicTable.Cell<any>, oldHighlightedTag?: string, newHighlightedTag?: string) {
    const data = oldCell.data !== newCell.data;
    const elem = oldCell.elem !== newCell.elem;
    const tag = (
        (oldCell.tag !== newCell.tag) ||
        (oldHighlightedTag ? (newCell.tag === oldHighlightedTag) : true) ||
        (newHighlightedTag ? (newCell.tag === newHighlightedTag) : true)
    );
    const tooltip = oldCell.tooltip !== newCell.tooltip;

    return data || elem || tag || tooltip;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
    return getter ? getter(v) : {};
}

function modelsAreSame(a: DynamicTable.Model, b: DynamicTable.Model) {
    return (
        a.rows.length === b.rows.length &&
        a.columns.length === b.columns.length &&
        arraysAreSame(a.columnNames, b.columnNames)
    );
}

class DynamicTableCell extends React.Component<{
    item: DynamicTable.Cell<any>,
    col: DynamicTable.Column<any>,
    model: DynamicTable.Model,
    rowIdx: number,
    colIdx: number,
    highlightedTag?: string,
    highlightColor?: number,
    onCellClicked?: (data: DynamicTable.Cell<any>, row: DynamicTable.Cell<any>[], colName: string) => void,
}>  {
    shouldComponentUpdate(nextProps: Readonly<{item: DynamicTable.Cell<any>; col: DynamicTable.Column<any>; model: DynamicTable.Model; rowIdx: number; colIdx: number; highlightedTag?: string | undefined; onCellClicked?: ((data: DynamicTable.Cell<any>, row: DynamicTable.Cell<any>[], colName: string) => void) | undefined;}>): boolean {
        return cellShouldUpdate(this.props.item, nextProps.item, this.props.highlightedTag, nextProps.highlightedTag)
    }

    render() {
        const highlight = this.props.highlightedTag && this.props.highlightedTag === this.props.item.tag && this.props.highlightColor !== undefined;
        const hlStyle = highlight ? { backgroundColor: colorToHex(this.props.highlightColor!) } : NotHighlighted;

        return (
            <td
                className='rdo-data-table'
                id={this.props.item.tag ? `${this.props.item.tag}-${this.props.rowIdx}-${this.props.colIdx}` : undefined}
                style={{
                    ...hlStyle,
                    ...getCellStyle(this.props.item.data, this.props.col.cellStyle),
                    textAlign: this.props.model.columns[this.props.colIdx].alignment ?? 'left',
                }}
                onClick={() => {
                    if (this.props.onCellClicked)
                        this.props.onCellClicked(this.props.item.data, this.props.model.rows[this.props.rowIdx], this.props.col.name);
                }}
            >
                {this.props.item.tooltip
                    ? this.props.item.tooltip
                    : this.props.item.elem
                        ? this.props.item.elem
                        : this.props.item.data
                }
            </td>
        );
    }
}

class DynamicTableRow extends React.Component<{
    model: DynamicTable.Model,
    rowIdx: number,
    highlightedTag?: string,
    highlightColor?: number,
    children: React.ReactNode[]
}> {
    shouldComponentUpdate(nextProps: Readonly<{model: DynamicTable.Model; rowIdx: number; highlightedTag?: string; children: React.ReactNode[];}>, ): boolean {
        const oldModel = this.props.model;
        const newModel = nextProps.model;

        if (!modelsAreSame(oldModel, newModel))
            return true;

        for (let colIdx = 0; colIdx < oldModel.columns.length; colIdx++) {
            const oldCell = oldModel.columns[colIdx].cells[this.props.rowIdx];
            const newCell = newModel.columns[colIdx].cells[this.props.rowIdx];

            if (cellShouldUpdate(oldCell, newCell, this.props.highlightedTag, nextProps.highlightedTag))
                return true;
        }

        return false;
    }

    render() {
        return <tr>{...this.props.children}</tr>
    }
}

type Sorting = {
    columnIdx: number,
    order: 'asc' | 'desc' | 'none',
}
export class DynamicTable extends React.Component<DynamicTable.Props, { sorting: Sorting }> {
    constructor(props: DynamicTable.Props) {
        super(props);

        this.state = {
            sorting: {
                columnIdx: -1,
                order: 'none',
            },
        };
    }

    private changeSort(newColumnIdx: number) {
        const { columnIdx, order} = this.state.sorting;

        if (newColumnIdx === columnIdx) {
            if (order === 'asc')
                this.setState({ ...this.state, sorting: { columnIdx, order: 'desc' } });
            else
                this.setState({ ...this.state, sorting: { columnIdx: -1, order: 'none' } });
        } else
            this.setState({ ...this.state, sorting: { columnIdx: newColumnIdx, order: 'asc' } });
    }

    private findFirstTaggedCellId(tag: string) {
        for (let colIdx = 0; colIdx < this.props.model.columns.length; colIdx++) {
            const col = this.props.model.columns[colIdx];
            for (let rowIdx = 0; rowIdx < col.cells.length; rowIdx++) {
                const cell = col.cells[rowIdx];
                if (cell.tag && cell.tag.startsWith(tag))
                    return `${cell.tag}-${rowIdx}-${colIdx}`;
            }
        }

        return undefined;
    }

    private renderBody() {
        const sortedRows = this.props.model.sortedRows(this.state.sorting);
        const rowElems = new Array<JSX.Element>();

        for (let rowIdx = 0; rowIdx < sortedRows.length; rowIdx++) {
            const srow = sortedRows[rowIdx];
            rowElems.push(
                <DynamicTableRow
                    model={this.props.model}
                    rowIdx={srow.actualIndex}
                    highlightedTag={this.props.highlightedTag}
                    highlightColor={this.props.highlightColor}
                    key={`${srow.actualIndex}-${this.state.sorting.columnIdx}_${this.state.sorting.order}`}
                >
                    {
                        srow.row.map((item, colIdx) => {
                            const col = this.props.model.columns[colIdx];
                            return (
                                <DynamicTableCell
                                    item={item}
                                    col={col}
                                    model={this.props.model}
                                    rowIdx={srow.actualIndex}
                                    colIdx={colIdx}
                                    highlightedTag={this.props.highlightedTag}
                                    highlightColor={this.props.highlightColor}
                                    onCellClicked={this.props.onCellClicked}
                                    key={colIdx}
                                />
                            );
                        })
                    }
                </DynamicTableRow>
            );
        }

        return rowElems;
    }

    private renderColumnCaption(col: DynamicTable.Column<any>) {
        if (col.tooltip) {
            return (
                <Tooltip
                    tag={col.elem ? col.elem : col.name}
                    delayMsec={300}
                >
                    {col.tooltip}
                </Tooltip>
            );
        } else {
            return <>{col.elem ? col.elem : col.name}</>;
        }
    }

    private renderDownloadBar() {
        if (!this.props.download)
            return void 0;

        const prefix = GlobalConfig.data().pathPrefix;
        const buttons = new Array<JSX.Element>();
        const fileName = this.props.download.fileName;

        this.props.download.downloaders.forEach((dl, idx) => {
            buttons.push(
                <div
                    key={idx}
                    className='rdo-dynamic-table-download-button'
                    onClick={e => {
                        e.stopPropagation();
                        dl.download(fileName, this.props.model);
                    }}
                >
                    <Icon img={`${prefix}/imgs/data-transfer-download.svg`} size='text' />
                    {dl.caption}
                </div>
            );
        });

        return (
            <div className='rdo-dynamic-table-download-bar'>
                {buttons}
                <div className='rdo-dynamic-table-download-bar-padder' />
            </div>
        );
    }

    private renderHeader() {
        const prefix = GlobalConfig.data().pathPrefix;
        const headers = new Array<JSX.Element>();
        const sorting = this.state.sorting;

        for (let idx = 0; idx < this.props.model.columns.length; idx++) {
            const col = this.props.model.columns[idx];

            const imgSrc = sorting.columnIdx  === idx
                ? sorting.order === 'asc' ? `${prefix}/imgs/sorted-ascending.svg` : `${prefix}/imgs/sorted-descending.svg`
                : `${prefix}/imgs/sort.svg`;

            headers.push(
                <th
                    className='rdo-data-table'
                    key={idx}
                >
                    {this.renderColumnCaption(col)}
                    {'\u00A0'}
                    {col.notSortable
                        ? undefined
                        : <img
                            className='column-sort-button'
                            src={imgSrc}
                            onClick={() => this.changeSort(idx)}
                        />
                    }
                </th>
            );
        }

        return headers;
    }

    componentDidUpdate(prevProps: DynamicTable.Props) {
        if (this.props.scrollTainer && this.props.highlightedTag && this.props.highlightedTag !== prevProps.highlightedTag) {
            const cellId = this.findFirstTaggedCellId(this.props.highlightedTag);
            if (cellId)
                scrollIntoViewIfNeeded(cellId, this.props.scrollTainer);
        }
    }

    render() {
        if (this.props.model.columns.length === 0)
            return <div></div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {this.renderDownloadBar()}
                <table className={`rdo-data-table ${this.props.style === 'wide' ? 'rdo-data-table-wide' : ''}`}>
                    <thead>
                        <tr>{this.renderHeader()}</tr>
                    </thead>
                    <tbody>
                        {this.renderBody()}
                    </tbody>
                </table>
            </div>
        );
    }
}

export namespace DynamicTable {
    export type Cell<T extends string|number> = { data: T, tag?: string, elem?: JSX.Element, tooltip?: React.ReactNode };
    export type Column<T extends string|number> = {
        name: string;
        cells: Cell<T>[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
        notSortable?: boolean;                 // Do not allow to sort by this column
        noData?: boolean;                      // This is only a utility column with no actual data
        tooltip?: React.ReactNode;             // Optional tooltip to display when a column header is hovered
        elem?: JSX.Element|React.ReactElement; // Optional element to show as column header.
    }
    export type Style = 'normal' | 'wide';

    export class Model {
        makeRows() {
            const _rows = new Array<DynamicTable.Cell<any>[]>();

            for (let idx = 0; idx < this.columns[0].cells.length; idx++) {
                const row = new Array<DynamicTable.Cell<any>>();
                for (const col of this.columns)
                    row.push(col.cells[idx]);
                _rows.push(row);
            }

            return _rows;
        }

        constructor(readonly columns: Column<any>[] = []) {
        }

        get columnNames() {
            return this.columns.map(col => col.name);
        }

        get rows() {
            return this.makeRows();
        }

        sortedRows(sorting: Sorting) {
            const sortedRows = this.makeRows().map((row, idx) => ({ row: row, actualIndex: idx })); // actualIndex is the row index in unsorted data

            if (sorting.order === 'none' || sortedRows.length === 0)
                return sortedRows;
            else {
                const sortIdx = sorting.columnIdx;
                const order = sorting.order;
                const mainColumn = this.columns[sortIdx];
                const comparator = mainColumn.comparator
                    ? mainColumn.comparator
                    : typeof mainColumn.cells[0].data === 'number'
                        ? (a: number, b: number) => a - b
                        : (a: string, b: string) => a.localeCompare(b);

                sortedRows.sort((a, b) => {
                    const eA = a.row[sortIdx].data;
                    const eB = b.row[sortIdx].data;
                    const invert = order === 'asc' ? 1 : -1;
                    return invert * (comparator as Comparator<typeof eA>)(eA, eB);
                });

                return sortedRows;
            }
        }
    }

    export type Downloader = _Downloader<Model>;
    export interface Props {
        model: Model;
        onCellClicked?: (data: any, row: Cell<any>[], columnName: string) => void;
        highlightedTag?: string;
        highlightColor?: number;
        scrollTainer?: string|HTMLElement; // This needs to be se to a reasonable element to make autoscrolling work reliably
        style?: Style;
        download?: {
            downloaders: Downloader[];
            fileName: string;
        };
    }
}
