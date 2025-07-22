import React from "react";
import { Dnatcofication } from "src/dnatco/dnatcofication";
import { Annotation } from "./common";
import { Cif } from '../../../../cif';

export function BasePairing({ d }: { d: Dnatcofication }) {
  const pdbId = d.pdbId; // is '' if not found in _struct, otherwise should be non-empty string
  //console.log('dnatcofication.pdbId "' + pdbId + '"');

  // TODO test that the structure came from known database (PDB or PDB-REDO)
  // so we have the pairing precomputed for it, not from custom file. 
  // Also better use the db in the url, now it shows pairing data 
  // for the PDB deposited structure even for (potentially different)
  // re-refined structure from other source, if the same pdbId exists on dnatco.
  
  if(pdbId !== '') {
    const tables = d.data.cifData?.blocks[0].tables;
    const bpList = tables?.get('ndb_base_pair_list');
    const bpAnn = tables?.get('ndb_base_pair_annotation');

    if(!bpList) {
      return <div>No data available</div>;
    }

    const rows = Array.from({ length: bpList._rowCount }, (_, i) => {
      const r = Cif.Row(bpList, i);
      return {
        id:        String(r.base_pair_id),
        model:     String(r.PDB_model_number),
        chain1:    r.auth_asym_id_1,
        base1:     `${r.comp_id_1} ${r.auth_seq_id_1}`,
        chain2:    r.auth_asym_id_2,
        base2:     `${r.comp_id_2} ${r.auth_seq_id_2}`,
      };
    });

    const annMap = new Map<string,string>();
    if (bpAnn) {
      for (let i = 0; i < bpAnn._rowCount; i++) {
        const a = Cif.Row(bpAnn, i);
        annMap.set(String(a.base_pair_id), a['class']);
      }
    }

    const models = new Set(rows.map(r => r.model));
    const showModel = models.size > 1;
    
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
            return (
              <tr key={i}>
                {showModel && <th className="py-2 border-primary-first border-[.1px]">{r.model}</th>}
                <th className="py-2 border-primary-first border-[.1px]">{r.chain1}</th>
                <th className="py-2 border-primary-first border-[.1px]">{r.base1}</th>
                
                <th className="py-2 border-primary-first border-[.1px]">{annMap.get(r.id) ?? '-'}</th>
  
                <th className="py-2 border-primary-first border-[.1px]">{r.chain2}</th>
                <th className="py-2 border-primary-first border-[.1px]">{r.base2}</th>
              </tr>
            )
          })}
        </tbody>
      </table>
    );
  }
}

export function BasePairs(props: { dnatcofication: any }) {
    return (
        <div className="overflow-scroll h-full flex flex-col relative">
            <BasePairing d={props.dnatcofication} />
        </div>
    )
}

export namespace BasePairs {
    export const unscrollableContainer = true;
    export const SelectionDisplayer = Annotation.selectionDisplayer;
    export const SelectionMaker = Annotation.selectionMaker;
}