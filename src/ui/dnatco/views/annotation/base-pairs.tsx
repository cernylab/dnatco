import React from "react";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { BasePair, BasePairsMapper } from "../../../../dnatco/base-pairs-mapper";
import { Colors } from "../../colors";
import { SearchBox } from "../../search-box";
import { SelectedPieces } from "../../structure-selection";
import { ViewerInterop, ViewerApi } from "../../../../viewer/viewer-interop";
import { IconButton } from "../../../common/push-button";
import { MagnifyingGlassImg } from "../../../../assets/images";
import { InvalidBasePairId } from "../../../../util/structure-selection";
import { parseIntStrict } from "../../../../util";
import { Cif } from '../../../../cif';
import { colorToHex } from '../../../../util/colors';
import { View } from "../view";

export function BasePairing({ d, viewerInterop, switching, structureSelection }: {
  d: Dnatcofication,
  viewerInterop?: ViewerInterop,
  switching?: any,
  structureSelection?: any,
}) {
  const pdbId = d.pdbId;
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);
  const tableTainerRef = React.useRef<HTMLTableElement>(null);
  const [searchBoxOpen, setSearchBoxOpen] = React.useState(false);

  const searching: SearchBox.Searching<BasePair> = React.useMemo(() => ({
    onRenderResult: (bp) => (
      <div>
        {bp.authAsymId1} {bp.compId1} {bp.authSeqId1} - {bp.authAsymId2} {bp.compId2} {bp.authSeqId2}
      </div>
    ),
    onSearch: (prompt) => {
      const toks = prompt.split(" ").filter(t => t.length > 0);
      if (toks.length === 0) return [];

      const resNoAuth = parseIntStrict(toks[toks.length - 1]);
      const chainAuth = toks.length > 1 ? toks[0] : void 0;

      if (isNaN(resNoAuth)) return [];

      const results = [];
      for (const bp of d.data.basePairs.pairs) {
        const matchesChain1 = !chainAuth || chainAuth === bp.authAsymId1;
        const matchesChain2 = !chainAuth || chainAuth === bp.authAsymId2;
        const matchesRes1 = bp.authSeqId1 === resNoAuth;
        const matchesRes2 = bp.authSeqId2 === resNoAuth;

        if ((matchesChain1 && matchesRes1) || (matchesChain2 && matchesRes2)) {
          results.push(bp);
        }
      }

      return results;
    },
    onUseResult: (bp) => {
      if (!switching) return;
      const sel = SelectedPieces([], [], [], [bp.id], true);
      switching.changeSelection(sel, BasePairs.SelectionDisplayer);
    },
  }), [d, switching]);

  const searchBoxProps: SearchBox.Props<BasePair> = React.useMemo(() => ({
    anchor: "top-left" as const,
    xOffset: 32,
    yOffset: 32,
    caption: "Enter chain and residue no. \n(e.g. \'2109\' or \'B 2109\')",
    onClose: () => setSearchBoxOpen(false),
    searching,
  }), [searching]);

  // Scroll to highlighted row when selection changes
  React.useEffect(() => {
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [structureSelection?.basePairs?.[0]]);

  if(pdbId !== '') {
    const tables = d.data.cifData?.blocks[0].tables;
    const bpList = tables?.get('ndb_base_pair_list');

    if(!bpList) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="text-18px mb-2">Base Pairing Data Not Available</div>
            <div className="text-14px text-gray-400">
              This structure does not contain base pairing information.
            </div>
          </div>
        </div>
      );
    }

    // Build rows with full data from BasePairsMapper
    const rows = Array.from({ length: bpList._rowCount }, (_, i) => {
      const r = Cif.Row(bpList, i);
      const bpId = r.base_pair_id;
      const bp = BasePairsMapper.byId(d, bpId);

      if (!bp) {
        return null;
      }

      return {
        basePairId: bpId,
        bp: bp,
        model: String(bp.model),
        chain1: bp.authAsymId1,
        base1: `${bp.compId1} ${bp.authSeqId1}`,
        chain2: bp.authAsymId2,
        base2: `${bp.compId2} ${bp.authSeqId2}`,
        family: bp.family,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    const handleRowClick = (row: typeof rows[0]) => {
      if (!viewerInterop || !switching) {
        return;
      }

      const sel = SelectedPieces(
        [],  // no steps
        [],  // no individual residues
        [],  // no atoms
        [row.basePairId],  // base pair id
        true
      );

      switching.changeSelection(sel, BasePairs.SelectionDisplayer);
    };

    const models = new Set(rows.map(r => r.model));
    const showModel = models.size > 1;

    // Get currently selected base pair for highlighting
    const selectedBpId = structureSelection?.basePairs?.[0];

    const colGroup = (
      <colgroup>
        {showModel && <col />}
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
    );

    return (
      <div className="flex flex-col h-full" ref={tableTainerRef}>
        {/* Fixed header table */}
        <div className="base-pairs-header" style={{ overflowY: 'hidden', scrollbarGutter: 'stable', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent' }}>
          <style>{`
            .base-pairs-header::-webkit-scrollbar {
              width: 14px;
            }
          `}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className="mb-2 w-full" style={{ tableLayout: 'fixed' }}>
              {colGroup}
              <thead>
                <tr>
                  <th
                    colSpan={showModel ? 6 : 5}
                    className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Base Pairs</span>
                      <IconButton
                        src={MagnifyingGlassImg}
                        className="rdo-pushbutton h-6 w-6"
                        onClick={() => {
                          const tainer = tableTainerRef.current;
                          if (!tainer || searchBoxOpen) return;

                          setSearchBoxOpen(true);
                          SearchBox.create(tainer, searchBoxProps);
                        }}
                      />
                    </div>
                    <div className="text-14px">Data provided by FR3D</div>
                  </th>
                </tr>
                <tr>
                  {showModel && <th className="py-2 border-primary-first border-[.1px]">Model</th>}
                  <th className="py-2 border-primary-first border-[.1px]">Chain 1</th>
                  <th className="py-2 border-primary-first border-[.1px]">Base 1</th>
                  <th className="py-2 border-primary-first border-[.1px]">Family</th>
                  <th className="py-2 border-primary-first border-[.1px]">Chain 2</th>
                  <th className="py-2 border-primary-first border-[.1px]">Base 2</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
        {/* Scrollable body table */}
        <div
          className="flex-1 base-pairs-scroll"
          style={{
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent',
            scrollbarGutter: 'stable',
          }}
        >
          <style>{`
            .base-pairs-scroll::-webkit-scrollbar {
              width: 14px;
            }
            .base-pairs-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .base-pairs-scroll::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 7px;
              border: 4px solid transparent;
              background-clip: padding-box;
            }
            .base-pairs-scroll::-webkit-scrollbar-thumb:hover {
              background-color: rgba(0, 0, 0, 0.4);
              border: 3px solid transparent;
            }
          `}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className="mb-2 w-full" style={{ tableLayout: 'fixed' }}>
              {colGroup}
              <tbody>
                {rows.map((r, i) => {
                  const isHighlighted = selectedBpId === r.basePairId;
                  const highlightStyle = isHighlighted ? { backgroundColor: colorToHex(Colors.CurrentStep()) } : {};

                  return (
                    <tr
                      key={i}
                      ref={isHighlighted ? highlightedRowRef : null}
                      onClick={() => handleRowClick(r)}
                      className="cursor-pointer hover:bg-primary-hover"
                      style={highlightStyle}
                    >
                      {showModel && <td className="py-2 border-primary-first border-[.1px] text-center">{r.model}</td>}
                      <td className="py-2 border-primary-first border-[.1px] text-center">{r.chain1}</td>
                      <td className="py-2 border-primary-first border-[.1px] text-center">{r.base1}</td>
                      <td className="py-2 border-primary-first border-[.1px] text-center">{r.family}</td>
                      <td className="py-2 border-primary-first border-[.1px] text-center">{r.chain2}</td>
                      <td className="py-2 border-primary-first border-[.1px] text-center">{r.base2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return <div>No PDB ID available</div>;
}

export class BasePairs extends View<View.Props> {
    static readonly unscrollableContainer = true;

    componentDidMount() {
        this.subscribe(this.props.switching.events.selectionChanged, () => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <div className="overflow-scroll h-full flex flex-col relative">
                <BasePairing
                  d={this.props.dnatcofication}
                  viewerInterop={this.props.viewerInterop}
                  switching={this.props.switching}
                  structureSelection={this.props.structureSelection}
                />
            </div>
        );
    }
}

export namespace BasePairs {
    export const SelectionDisplayer = selectionDisplayer;
    export const SelectionMaker = selectionMaker;

    export async function selectionDisplayer(pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop, customNtCSet: string) {
        // Switch to two-residues granularity
        vi.api.command(ViewerApi.Commands.SwitchSelectionGranularity('two-residues'));

        if (pieces.reconstruct)
            await vi.api.command(ViewerApi.Commands.DeselectStructures());

        const selected = [];
        for (const bpId of pieces.basePairs) {
            const bp = BasePairsMapper.byId(d, bpId);

            if (bp) {
                // Use label (cif) identifiers for Molstar
                const payload = ViewerApi.Payloads.BasePairSelection(
                    bp.model,
                    bp.asymId1, bp.seqId1, bp.insCode1, bp.altId1, bp.authSeqId1,
                    bp.asymId2, bp.seqId2, bp.insCode2, bp.altId2, bp.authSeqId2,
                    Colors.CurrentStep()
                );

                const selection = ViewerApi.Commands.BasePairSelection(payload);
                selected.push(selection);
            }
        }

        await vi.api.command(ViewerApi.Commands.SelectStructures(selected));
    }

    export function selectionMaker(
        newStepId: SelectedPieces['steps'][0],
        newResidue: SelectedPieces['residues'][0],
        newAtom: SelectedPieces['atoms'][0],
        steps: number[],
        residues: SelectedPieces['residues'],
        atoms: SelectedPieces['atoms'],
        d: Dnatcofication
    ): SelectedPieces {
        // For base pairs view, we treat newStepId as basePairId
        return {
            steps: [],
            residues: [],
            atoms: [],
            basePairs: newStepId === InvalidBasePairId ? [] : [newStepId],
            reconstruct: true
        };
    }
}
