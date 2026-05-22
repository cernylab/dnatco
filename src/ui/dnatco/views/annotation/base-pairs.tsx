import React from "react";
import { useLocation } from "react-router";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { BasePair, BasePairsMapper } from "../../../../dnatco/base-pairs-mapper";
import { Colors } from "../../colors";
import { SearchBox } from "../../search-box";
import { SelectedPieces } from "../../structure-selection";
import { ViewerInterop, ViewerApi } from "../../../../viewer/viewer-interop";
import { IconButton } from "../../../common/push-button";
import { MagnifyingGlassImg, SortImg, SortAscImg, SortDescImg } from "../../../../assets/images";
import { InvalidBasePairId } from "../../../../util/structure-selection";
import { parseIntStrict } from "../../../../util";
import { colorToHex } from '../../../../util/colors';
import { valueToSemaphore } from '../../../../util/semaphore';
import { Tooltip } from '../../../common/tooltip';
import { View } from "../view";

const CellBgAlpha = 0.5;

function bpRmsdToColor(rmsd: number): React.CSSProperties {
    const clr = valueToSemaphore(rmsd, 0.0, 0.5);
    return { backgroundColor: `rgba(${clr.r},${clr.g},${clr.b},${CellBgAlpha})` };
}

function napascoToColor(score: number): React.CSSProperties {
    const clr = valueToSemaphore(score, 100.0, 0.0);
    return { backgroundColor: `rgba(${clr.r},${clr.g},${clr.b},${CellBgAlpha})` };
}

export function BasePairing({ d, viewerInterop, switching, structureSelection }: {
  d: Dnatcofication,
  viewerInterop?: ViewerInterop,
  switching?: any,
  structureSelection?: any,
}) {
  // ── All hooks must be at the top level ────────────────────────────────────
  const pdbId = d.pdbId;
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);
  const tableTainerRef = React.useRef<HTMLTableElement>(null);
  const [searchBoxOpen, setSearchBoxOpen] = React.useState(false);

  const location = useLocation();
  const isValidationMode = location.pathname.includes('/validation/');

  const hasFr3d = d.data.basePairsFr3d.pairs.length > 0;
  const hasNapair = d.data.basePairsNapair.pairs.length > 0;
  const [pairingSource, setPairingSourceState] = React.useState<'fr3d' | 'napair'>(d.data.pairingSource);
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);

  const showMetrics = isValidationMode && pairingSource === 'napair';

  const handleSourceSwitch = React.useCallback((source: 'fr3d' | 'napair') => {
    Dnatcofication.setPairingSource(d.data, source);
    setPairingSourceState(source);
    if (switching)
      switching.changeSelection(SelectedPieces([], [], [], [], true), BasePairs.SelectionDisplayer);
    if (viewerInterop?.ready()) {
      const mapping = source === 'napair' ? d.data.basePairsNapair : null;
      viewerInterop.setExternalBasePairs(mapping);
    }
  }, [d, viewerInterop, switching]);

  const activePairs = Dnatcofication.activeBasePairs(d.data);

  const searching: SearchBox.Searching<BasePair> = React.useMemo(() => ({
    onRenderResult: (bp) => {
      const res1 = `${bp.compId1} ${bp.authSeqId1}${bp.insCode1 || ''}${bp.altId1 ? ' (alt. ' + bp.altId1 + ')' : ''}`;
      const res2 = `${bp.compId2} ${bp.authSeqId2}${bp.insCode2 || ''}${bp.altId2 ? ' (alt. ' + bp.altId2 + ')' : ''}`;
      return (
        <div>
          {bp.authAsymId1} {res1} - {bp.authAsymId2} {res2}
        </div>
      );
    },
    onSearch: (prompt) => {
      const toks = prompt.split(" ").filter(t => t.length > 0);
      if (toks.length === 0) return [];

      const lastTok = toks[toks.length - 1];
      const dotIdx = lastTok.indexOf('.');
      const resNoAuth = parseIntStrict(dotIdx > 0 ? lastTok.substring(0, dotIdx) : lastTok);
      const insCode = dotIdx > 0 ? lastTok.substring(dotIdx + 1) : void 0;
      const chainAuth = toks.length > 1 ? toks[0] : void 0;

      if (isNaN(resNoAuth)) return [];

      const results = [];
      for (const bp of activePairs.pairs) {
        const matchesChain1 = !chainAuth || chainAuth === bp.authAsymId1;
        const matchesChain2 = !chainAuth || chainAuth === bp.authAsymId2;
        const matchesRes1 = bp.authSeqId1 === resNoAuth;
        const matchesRes2 = bp.authSeqId2 === resNoAuth;
        const matchesIns1 = insCode === void 0 || bp.insCode1 === insCode;
        const matchesIns2 = insCode === void 0 || bp.insCode2 === insCode;
        if ((matchesChain1 && matchesRes1 && matchesIns1) || (matchesChain2 && matchesRes2 && matchesIns2))
          results.push(bp);
      }
      return results;
    },
    onUseResult: (bp) => {
      if (!switching) return;
      const sel = SelectedPieces([], [], [], [bp.id], true);
      switching.changeSelection(sel, BasePairs.SelectionDisplayer);
    },
  }), [d, switching, activePairs]);

  const searchBoxProps: SearchBox.Props<BasePair> = React.useMemo(() => ({
    anchor: "top-left" as const,
    xOffset: 32,
    yOffset: 32,
    caption: "Enter chain and residue no. \n(e.g. '2109' or 'B 2109')",
    onClose: () => setSearchBoxOpen(false),
    searching,
  }), [searching]);

  React.useEffect(() => {
    if (highlightedRowRef.current)
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [structureSelection?.basePairs?.[0]]);

  // Unpaired summary: always computed; shows derived count for both FR3D and NAPAIR,
  // plus explicit list comparison when NAPAIR validation is active.
  const unpairedSummary = React.useMemo(() => {
    const pairedKeys = new Set<string>();
    for (const bp of activePairs.pairs) {
      pairedKeys.add(`${bp.model}|${bp.asymId1}|${bp.seqId1}`);
      pairedKeys.add(`${bp.model}|${bp.asymId2}|${bp.seqId2}`);
    }

    let derivedCount = 0;
    const derivedDisplayMap = new Map<string, string>(); // label key → display string
    const structure = d.data.structures[0];
    if (structure) {
      for (let mi = 0; mi < structure.models.length; mi++) {
        const model = structure.models[mi];
        const entityKinds = d.data.entityKinds[mi];
        if (!entityKinds) continue;
        for (const chain of model.chains) {
          const kind = entityKinds.get(chain.entityId) ?? 'other';
          if (kind !== 'DNA' && kind !== 'RNA' && kind !== 'hybrid') continue;
          for (const residue of chain.residues) {
            const key = `${model.num}|${chain.name}|${residue.num}`;
            if (!pairedKeys.has(key)) {
              derivedDisplayMap.set(key, `${chain.authName}:${residue.authCompound}${residue.authNum}${residue.insCode ?? ''}`);
              derivedCount++;
            }
          }
        }
      }
    }

    // NAPAIR (any tab): explicit list + overlap and missing-in-both-directions checks
    let explicitCount: number | null = null;
    let discrepancies: string[] = [];
    let missingFromDerived: string[] = [];
    let missingFromExplicit: string[] = [];
    if (pairingSource === 'napair' && d.data.basePairsNapair.unpaired.length > 0) {
      explicitCount = d.data.basePairsNapair.unpaired.length;
      const explicitKeySet = new Set<string>();
      for (const ur of d.data.basePairsNapair.unpaired) {
        const key = `${ur.model}|${ur.asymId}|${ur.seqId}`;
        explicitKeySet.add(key);
        if (pairedKeys.has(key))
          discrepancies.push(`${ur.authAsymId}:${ur.compId}${ur.authSeqId}`);
        else if (!derivedDisplayMap.has(key))
          missingFromDerived.push(`${ur.authAsymId}:${ur.compId}${ur.authSeqId}`);
      }
      for (const [key, display] of derivedDisplayMap) {
        if (!explicitKeySet.has(key))
          missingFromExplicit.push(display);
      }
    }

    return { pairedCount: activePairs.pairs.length, pairedResidueCount: pairedKeys.size, derivedCount, explicitCount, discrepancies, missingFromDerived, missingFromExplicit };
  }, [activePairs, pairingSource, d.data.basePairsNapair, d.data.structures, d.data.entityKinds]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (pdbId !== '') {
    if (activePairs.pairs.length === 0) {
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

    const handleHeaderClick = (col: string) => {
      if (sortCol === col) setSortAsc(!sortAsc);
      else { setSortCol(col); setSortAsc(true); }
    };

    const sortIcon = (col: string) => {
      const src = sortCol === col ? (sortAsc ? SortAscImg : SortDescImg) : SortImg;
      return (
        <img
          className="column-sort-button cursor-pointer inline ml-1"
          src={src}
          onClick={(e) => { e.stopPropagation(); handleHeaderClick(col); }}
        />
      );
    };

    const rows = activePairs.pairs.map(bp => ({
      basePairId: bp.id,
      bp,
      model: String(bp.model),
      chain1: bp.authAsymId1,
      base1: `${bp.compId1} ${bp.authSeqId1}${bp.insCode1 || ''}${bp.altId1 ? ' (alt. ' + bp.altId1 + ')' : ''}`,
      chain2: bp.authAsymId2,
      base2: `${bp.compId2} ${bp.authSeqId2}${bp.insCode2 || ''}${bp.altId2 ? ' (alt. ' + bp.altId2 + ')' : ''}`,
      family: bp.family,
    }));

    const sortedRows = sortCol === null ? rows : [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'model':   cmp = a.bp.model - b.bp.model; break;
        case 'chain1':  cmp = a.chain1.localeCompare(b.chain1); break;
        case 'base1':   cmp = a.bp.authSeqId1 - b.bp.authSeqId1 || a.chain1.localeCompare(b.chain1); break;
        case 'family':  cmp = a.family.localeCompare(b.family); break;
        case 'chain2':  cmp = a.chain2.localeCompare(b.chain2); break;
        case 'base2':   cmp = a.bp.authSeqId2 - b.bp.authSeqId2 || a.chain2.localeCompare(b.chain2); break;
        case 'rmsd':    cmp = (a.bp.validation?.napairRmsd ?? 0) - (b.bp.validation?.napairRmsd ?? 0); break;
        case 'napasco': cmp = (a.bp.validation?.napascoMetric ?? 0) - (b.bp.validation?.napascoMetric ?? 0); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    const handleRowClick = (row: typeof rows[0]) => {
      if (!viewerInterop || !switching) return;
      switching.changeSelection(
        SelectedPieces([], [], [], [row.basePairId], true),
        BasePairs.SelectionDisplayer
      );
    };

    const models = new Set(rows.map(r => r.model));
    const showModel = models.size > 1;
    const numCols = (showModel ? 1 : 0) + 5 + (showMetrics ? 2 : 0);

    const selectedBpId = structureSelection?.basePairs?.[0];

    const colGroup = (
      <colgroup>
        {showModel && <col />}
        <col />
        <col />
        <col />
        <col />
        <col />
        {showMetrics && <col />}
        {showMetrics && <col />}
      </colgroup>
    );

    const thCls = "py-2 border-primary-first border-[.1px] cursor-pointer select-none";

    return (
      <div className="flex flex-col h-full" ref={tableTainerRef}>
        {/* Fixed header table */}
        <div className="base-pairs-header" style={{ overflowY: 'hidden', scrollbarGutter: 'stable', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent' }}>
          <style>{`.base-pairs-header::-webkit-scrollbar { width: 14px; }`}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className="mb-2 w-full" style={{ tableLayout: 'fixed' }}>
              {colGroup}
              <thead>
                <tr>
                  <th colSpan={numCols} className="mb-4 p-4 text-20px border-primary-first border-[.1px]">
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
                    <div className="text-14px flex items-center justify-center gap-2">
                      {hasFr3d && hasNapair ? (
                        <>
                          <span>Source:</span>
                          <button
                            className={`px-2 py-0.5 rounded text-12px border transition-colors ${pairingSource === 'fr3d' ? 'border-primary-first bg-primary-first text-white' : 'border-gray-500 text-gray-400 opacity-60'}`}
                            onClick={() => handleSourceSwitch('fr3d')}
                          >FR3D</button>
                          <button
                            className={`px-2 py-0.5 rounded text-12px border transition-colors ${pairingSource === 'napair' ? 'border-primary-first bg-primary-first text-white' : 'border-gray-500 text-gray-400 opacity-60'}`}
                            onClick={() => handleSourceSwitch('napair')}
                          >NAPAIR</button>
                        </>
                      ) : (
                        <span>Data provided by {hasFr3d ? 'FR3D' : 'NAPAIR'}</span>
                      )}
                    </div>
                    <div className="text-12px flex items-center justify-center gap-1 mt-1">
                      <span>{unpairedSummary.pairedResidueCount} residues in {unpairedSummary.pairedCount} pairs</span>
                      <span>|</span>
                      <span>{unpairedSummary.derivedCount} unpaired (derived)</span>
                      {unpairedSummary.explicitCount !== null && unpairedSummary.explicitCount !== unpairedSummary.derivedCount && (
                        <>
                          <span>/</span>
                          <Tooltip
                            tag={<span style={{ color: 'orange' }}>{unpairedSummary.explicitCount} explicit</span>}
                            delayMsec={300}
                          >
                            <>
                              {unpairedSummary.missingFromExplicit.length > 0 && (
                                <div>Derived but not in explicit list: {unpairedSummary.missingFromExplicit.join(', ')}</div>
                              )}
                              {unpairedSummary.missingFromDerived.length > 0 && (
                                <div>Explicit but not found in structure NA residues: {unpairedSummary.missingFromDerived.join(', ')}</div>
                              )}
                            </>
                          </Tooltip>
                        </>
                      )}
                      {unpairedSummary.discrepancies.length > 0 && (
                        <Tooltip
                          tag={<span style={{ color: 'red' }}>{unpairedSummary.discrepancies.length} overlap(s)</span>}
                          delayMsec={300}
                        >
                          Residues in both paired and unpaired lists: {unpairedSummary.discrepancies.join(', ')}
                        </Tooltip>
                      )}
                    </div>
                  </th>
                </tr>
                <tr>
                  {showModel && <th className={thCls} onClick={() => handleHeaderClick('model')}>Model{sortIcon('model')}</th>}
                  <th className={thCls} onClick={() => handleHeaderClick('chain1')}>Chain 1{sortIcon('chain1')}</th>
                  <th className={thCls} onClick={() => handleHeaderClick('base1')}>Base 1{sortIcon('base1')}</th>
                  <th className={thCls} onClick={() => handleHeaderClick('family')}>Family{sortIcon('family')}</th>
                  <th className={thCls} onClick={() => handleHeaderClick('chain2')}>Chain 2{sortIcon('chain2')}</th>
                  <th className={thCls} onClick={() => handleHeaderClick('base2')}>Base 2{sortIcon('base2')}</th>
                  {showMetrics && (
                    <th className={thCls} onClick={() => handleHeaderClick('rmsd')}>
                      <Tooltip tag={<span>RMSD{sortIcon('rmsd')}</span>} delayMsec={300}>
                        RMSD between the observed base pair and the nearest curated reference (Å); red ≥ 0.5
                      </Tooltip>
                    </th>
                  )}
                  {showMetrics && (
                    <th className={thCls} onClick={() => handleHeaderClick('napasco')}>
                      <Tooltip tag={<span>NAPASCO{sortIcon('napasco')}</span>} delayMsec={300}>
                        NAPASCO quality score (0–100, higher is better)
                      </Tooltip>
                    </th>
                  )}
                </tr>
              </thead>
            </table>
          </div>
        </div>
        {/* Scrollable body table */}
        <div
          className="flex-1 base-pairs-scroll"
          style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent', scrollbarGutter: 'stable' }}
        >
          <style>{`
            .base-pairs-scroll::-webkit-scrollbar { width: 14px; }
            .base-pairs-scroll::-webkit-scrollbar-track { background: transparent; }
            .base-pairs-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 7px; border: 4px solid transparent; background-clip: padding-box; }
            .base-pairs-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.4); border: 3px solid transparent; }
          `}</style>
          <div style={{ paddingRight: '2px' }}>
            <table className="mb-2 w-full" style={{ tableLayout: 'fixed' }}>
              {colGroup}
              <tbody>
                {sortedRows.map((r, i) => {
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
                      {showMetrics && (
                        <td className="py-2 border-primary-first border-[.1px] text-center"
                          style={r.bp.validation ? bpRmsdToColor(r.bp.validation.napairRmsd) : {}}>
                          {r.bp.validation ? r.bp.validation.napairRmsd.toFixed(3) : '–'}
                        </td>
                      )}
                      {showMetrics && (
                        <td className="py-2 border-primary-first border-[.1px] text-center"
                          style={r.bp.validation?.napascoMetric != null ? napascoToColor(r.bp.validation.napascoMetric) : {}}>
                          {r.bp.validation?.napascoMetric != null ? r.bp.validation.napascoMetric.toFixed(1) : 'N/A'}
                        </td>
                      )}
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
            const bp = BasePairsMapper.byId(Dnatcofication.activeBasePairs(d.data), bpId);

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
