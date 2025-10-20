import React from "react";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { BasePairsMapper } from "../../../../dnatco/base-pairs-mapper";
import { Colors } from "../../colors";
import { SelectedPieces } from "../../structure-selection";
import { ViewerInterop, ViewerApi } from "../../../../viewer/viewer-interop";
import { InvalidBasePairId } from "../../../../util/structure-selection";
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

    return (
      <table className="mb-2 w-full">
        <thead>
          <tr>
            <th
              colSpan={showModel ? 6 : 5}
              className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
            >
              <div>Base Pairs</div>
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
