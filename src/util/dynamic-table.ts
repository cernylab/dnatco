import { FileType } from './file-type';

interface Comparator<T> {
    (a: T, b: T): number;
}

export namespace DynamicTable {
    export type Cell<T extends string|number> = { data: T, tag?: string, elem?: JSX.Element, tooltip?: React.ReactNode };
    export type Column<T extends string|number> = {
        name: string;
        cells: Cell<T>[];
        alignment?: 'left'|'center'|'right';
        comparator?: (a: T, b: T) => number;
        cellStyle?: (v: T) => React.CSSProperties;
        headerStyle?: React.CSSProperties;
        notSortable?: boolean;                 // Do not allow to sort by this column
        noData?: boolean;                      // This is only a utility column with no actual data
        tooltip?: React.ReactNode;             // Optional tooltip to display when a column header is hovered
        elem?: JSX.Element|React.ReactElement; // Optional element to show as column header.
    }
    export type Sorting = {
        columnIdx: number,
        order: 'asc' | 'desc' | 'none',
    }
    export type Style = 'normal' | 'wide';

    export class Model {
        private readonly _rows: Array<DynamicTable.Cell<any>[]>;
        private readonly _columnNames: string[];

        private initColumnNames() {
            return this.columns.map(col => col.name);
        }

        private initRows() {
            if (this.columns.length < 1)
                return [];

            const rows = new Array<DynamicTable.Cell<any>[]>();
            for (let idx = 0; idx < this.columns[0].cells.length; idx++) {
                const row = new Array<DynamicTable.Cell<any>>();
                for (const col of this.columns)
                    row.push(col.cells[idx]);
                rows.push(row);
            }

            return rows;
        }

        constructor(readonly columns: Column<any>[] = []) {
            this._rows = this.initRows();
            this._columnNames = this.initColumnNames();
        }

        get columnNames() {
            return this._columnNames;
        }

        get rows() {
            return this._rows;
        }

        sortedRows(sorting: Sorting) {
            const sortedRows = this._rows.map((row, idx) => ({ row: row, actualIndex: idx })); // actualIndex is the row index in unsorted data

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

    export type Downloader = {
        caption: string,
        download: (fileNameStem: string, data: Model, sorting?: Sorting) => void,
        fileType: FileType,
    }
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
        modelsAlwaysCompareFalse?: boolean,
    }
}
