import * as React from "react";
import { Icon } from "./icon";
import { Tooltip } from "./tooltip";
import { scrollIntoViewIfNeeded } from "../util";
import {
  DataTransferDownloadImg,
  SortImg,
  SortAscImg,
  SortDescImg,
} from "../../assets/images";
import { arraysAreSame } from "../../util";
import { colorToHex } from "../../util/colors";
import { DynamicTable as _DynamicTable } from "../../util/dynamic-table";

const NotHighlighted = { background: "none" };

function cellShouldUpdate(
  oldCell: _DynamicTable.Cell<any>,
  newCell: _DynamicTable.Cell<any>,
  oldHighlightedTag?: string,
  newHighlightedTag?: string
) {
  const data = oldCell.data !== newCell.data;
  const elem = oldCell.elem !== newCell.elem;
  const tag =
    oldCell.tag !== newCell.tag ||
    (oldHighlightedTag ? newCell.tag === oldHighlightedTag : true) ||
    (newHighlightedTag ? newCell.tag === newHighlightedTag : true);
  const tooltip = oldCell.tooltip !== newCell.tooltip;

  return data || elem || tag || tooltip;
}

function getCellStyle<T>(v: T, getter?: (v: T) => React.CSSProperties) {
  return getter ? getter(v) : {};
}

function modelsAreSame(a: _DynamicTable.Model, b: _DynamicTable.Model) {
  return (
    a.rows.length === b.rows.length &&
    a.columns.length === b.columns.length &&
    arraysAreSame(a.columnNames, b.columnNames)
  );
}

function sortingsAreSame(a: _DynamicTable.Sorting, b: _DynamicTable.Sorting) {
  return a.columnIdx === b.columnIdx && a.order === b.order;
}

class DynamicTableCell extends React.Component<{
  item: _DynamicTable.Cell<any>;
  col: _DynamicTable.Column<any>;
  model: _DynamicTable.Model;
  rowIdx: number;
  colIdx: number;
  highlightedTag?: string;
  highlightColor?: number;
  onCellClicked?: (
    data: _DynamicTable.Cell<any>,
    row: _DynamicTable.Cell<any>[],
    colName: string
  ) => void;
}> {
  shouldComponentUpdate(
    nextProps: Readonly<{
      item: _DynamicTable.Cell<any>;
      col: _DynamicTable.Column<any>;
      model: _DynamicTable.Model;
      rowIdx: number;
      colIdx: number;
      highlightedTag?: string | undefined;
      onCellClicked?:
        | ((
            data: _DynamicTable.Cell<any>,
            row: _DynamicTable.Cell<any>[],
            colName: string
          ) => void)
        | undefined;
    }>
  ): boolean {
    return cellShouldUpdate(
      this.props.item,
      nextProps.item,
      this.props.highlightedTag,
      nextProps.highlightedTag
    );
  }

  render() {
    const highlight =
      this.props.highlightedTag &&
      this.props.highlightedTag === this.props.item.tag &&
      this.props.highlightColor !== undefined;
    const hlStyle = highlight
      ? { backgroundColor: colorToHex(this.props.highlightColor!) }
      : NotHighlighted;

    return (
      <td
        className="rdo-data-table"
        id={
          this.props.item.tag
            ? `${this.props.item.tag}-${this.props.rowIdx}-${this.props.colIdx}`
            : undefined
        }
        style={{
          ...hlStyle,
          ...getCellStyle(this.props.item.data, this.props.col.cellStyle),
          textAlign:
            this.props.model.columns[this.props.colIdx].alignment ?? "left",
        }}
        onClick={() => {
          if (this.props.onCellClicked)
            this.props.onCellClicked(
              this.props.item.data,
              this.props.model.rows[this.props.rowIdx],
              this.props.col.name
            );
        }}
      >
        {this.props.item.tooltip
          ? this.props.item.tooltip
          : this.props.item.elem
          ? this.props.item.elem
          : this.props.item.data}
      </td>
    );
  }
}

class DynamicTableRow extends React.Component<{
  model: _DynamicTable.Model;
  rowIdx: number;
  highlightedTag?: string;
  highlightColor?: number;
  children: React.ReactNode[];
}> {
  shouldComponentUpdate(
    nextProps: Readonly<{
      model: _DynamicTable.Model;
      rowIdx: number;
      highlightedTag?: string;
      children: React.ReactNode[];
    }>
  ): boolean {
    const oldModel = this.props.model;
    const newModel = nextProps.model;

    for (let colIdx = 0; colIdx < oldModel.columns.length; colIdx++) {
      const oldCell = oldModel.columns[colIdx].cells[this.props.rowIdx];
      const newCell = newModel.columns[colIdx].cells[this.props.rowIdx];

      if (
        cellShouldUpdate(
          oldCell,
          newCell,
          this.props.highlightedTag,
          nextProps.highlightedTag
        )
      )
        return true;
    }

    return false;
  }

  render() {
    return <tr className="">{...this.props.children}</tr>;
  }
}

export class DynamicTable extends React.Component<
  _DynamicTable.Props,
  { sorting: _DynamicTable.Sorting }
> {
  constructor(props: _DynamicTable.Props) {
    super(props);

    this.state = {
      sorting: {
        columnIdx: -1,
        order: "none",
      },
    };
  }

  private changeSort(newColumnIdx: number) {
    const { columnIdx, order } = this.state.sorting;

    if (newColumnIdx === columnIdx) {
      if (order === "asc")
        this.setState({ ...this.state, sorting: { columnIdx, order: "desc" } });
      else
        this.setState({
          ...this.state,
          sorting: { columnIdx: -1, order: "none" },
        });
    } else
      this.setState({
        ...this.state,
        sorting: { columnIdx: newColumnIdx, order: "asc" },
      });
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
          key={srow.actualIndex}
        >
          {srow.row.map((item, colIdx) => {
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
          })}
        </DynamicTableRow>
      );
    }

    return rowElems;
  }

  private renderColumnCaption(col: _DynamicTable.Column<any>) {
    if (col.tooltip) {
      return (
        <Tooltip tag={col.elem ? col.elem : col.name} delayMsec={300}>
          {col.tooltip}
        </Tooltip>
      );
    } else {
      return <>{col.elem ? col.elem : col.name}</>;
    }
  }

  private renderDownloadBar() {
    if (!this.props.download) return void 0;

    const buttons = new Array<JSX.Element>();
    const fileName = this.props.download.fileName;

    this.props.download.downloaders.forEach((dl, idx) => {
      buttons.push(
        <div
          key={idx}
          className="flex bg-primary-first ml-2 px-4 py-2 rounded-smaller items-center h-fit text-white hover:bg-secondary-second hover:text-primary-first transition-all"
          onClick={(e) => {
            e.stopPropagation();
            dl.download(fileName, this.props.model, this.state.sorting);
          }}
        >
          <Icon img={DataTransferDownloadImg} size="text" />
          {dl.caption}
        </div>
      );
    });

    return <div className="flex flex-row gap-1">{buttons}</div>;
  }

  private renderHeader() {
    const headers = new Array<JSX.Element>();
    const sorting = this.state.sorting;

    for (let idx = 0; idx < this.props.model.columns.length; idx++) {
      const col = this.props.model.columns[idx];

      const imgSrc =
        sorting.columnIdx === idx
          ? sorting.order === "asc"
            ? SortAscImg
            : SortDescImg
          : SortImg;

      headers.push(
        <th
          className="data-table border-primary-first border-[.1px]"
          style={col.headerStyle}
          key={idx}
        >
          <div className="flex items-center justify-center">
            {this.renderColumnCaption(col)}
            {"\u00A0"}
            {col.notSortable ? undefined : (
              <img
                className="column-sort-button cursor-pointer"
                src={imgSrc}
                onClick={() => this.changeSort(idx)}
              />
            )}
          </div>
        </th>
      );
    }

    return headers;
  }

  shouldComponentUpdate(
    nextProps: Readonly<_DynamicTable.Props>,
    nextState: Readonly<{ sorting: _DynamicTable.Sorting }>
  ): boolean {
    if (this.props.modelsAlwaysCompareFalse) return true;

    const oldModel = this.props.model;
    const newModel = nextProps.model;

    if (!modelsAreSame(oldModel, newModel)) return true;

    if (nextProps.highlightedTag !== this.props.highlightedTag) return true;

    return !sortingsAreSame(nextState.sorting, this.state.sorting);
  }

  private scrollToHighlighted() {
    if (!this.props.scrollTainer || !this.props.highlightedTag) return;

    const cellId = this.findFirstTaggedCellId(this.props.highlightedTag);
    if (!cellId) return;

    // Check if element exists before scrolling
    const element = document.getElementById(cellId);
    if (element) {
      scrollIntoViewIfNeeded(cellId, this.props.scrollTainer);
    } else {
      // Element not rendered yet, wait for next animation frame and try again
      // This will retry once per frame until the element appears
      requestAnimationFrame(() => this.scrollToHighlighted());
    }
  }

  componentDidMount() {
    // Scroll to highlighted row on initial mount
    if (this.props.scrollTainer && this.props.highlightedTag) {
      // Use requestAnimationFrame to wait for React to commit the render
      requestAnimationFrame(() => {
        this.scrollToHighlighted();
      });
    }
  }

  componentDidUpdate(prevProps: _DynamicTable.Props) {
    const highlightedTagChanged = this.props.highlightedTag !== prevProps.highlightedTag;
    const scrollTainerBecameAvailable = this.props.scrollTainer && !prevProps.scrollTainer;

    // Scroll if highlighted tag changed OR if scrollTainer became available
    if (this.props.scrollTainer && this.props.highlightedTag) {
      if (highlightedTagChanged) {
        // Scroll when tag changes (component already mounted)
        requestAnimationFrame(() => this.scrollToHighlighted());
      } else if (scrollTainerBecameAvailable) {
        // ScrollTainer just became available (was null/undefined, now defined)
        // Wait for next frame to ensure the container is rendered
        requestAnimationFrame(() => this.scrollToHighlighted());
      }
    }
  }

  private renderColGroup() {
    return (
      <colgroup>
        {this.props.model.columns.map((col, idx) => (
          <col key={idx} style={col.headerStyle} />
        ))}
      </colgroup>
    );
  }

  render() {
    if (this.props.model.columns.length === 0) return <div></div>;

    const tableClassName = `rdo-data-table ${
      this.props.style === "wide" ? "rdo-data-table-wide w-full" : ""
    }`;

    const scrollContainerStyle: React.CSSProperties = {
      overflowY: 'auto',
      scrollbarWidth: 'thin', // Firefox - thin scrollbar
      scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent', // Firefox - thumb and track colors
      scrollbarGutter: 'stable', // Reserve space for scrollbar to prevent layout shift
    };

    return (
        <div className="rdo-horizontal-wrapper h-full" style={{ overflowX: 'auto', scrollbarGutter: 'stable', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent' }}>
      <div className="flex flex-col h-full" style={{ minWidth: '100%', width:'min-content' }}>
        {this.renderDownloadBar()}
        {/* Fixed header table */}
        <div className="dynamic-table-header" style={{ overflowY: 'hidden', overflowX: 'hidden',scrollbarGutter: 'stable', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent' }}>
          <style>{`
            .dynamic-table-header::-webkit-scrollbar {
              width: 14px;
            }
          `}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className={tableClassName} style={{ tableLayout: 'fixed', minWidth: '100%' }}>
              {this.renderColGroup()}
              <thead>
                <tr>{this.renderHeader()}</tr>
              </thead>
            </table>
          </div>
        </div>
        {/* Scrollable body table */}
        <div className="flex-1 dynamic-table-scroll" style={{ ...scrollContainerStyle, overflowX: 'hidden' }}>
          <style>{`
            .dynamic-table-scroll::-webkit-scrollbar {
              width: 14px;
            }
            .dynamic-table-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .dynamic-table-scroll::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 7px;
              border: 4px solid transparent;
              background-clip: padding-box;
            }
            .dynamic-table-scroll::-webkit-scrollbar-thumb:hover {
              background-color: rgba(0, 0, 0, 0.4);
              border: 3px solid transparent;
            }
          `}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className={tableClassName} style={{ tableLayout: 'fixed', minWidth: '100%' }}>
              {this.renderColGroup()}
              <tbody>{this.renderBody()}</tbody>
            </table>
          </div>
        </div>
      </div>
        </div>
    );
  }
}
