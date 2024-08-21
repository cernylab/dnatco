import React from "react";
import { useState, useEffect } from "react";
import { Annotation } from "./common";
import { View } from "../view";
import { Cif } from "../../../../cif";
import {
  NdbStructNtcStep,
  NdbStructNtcStepSummary,
} from "../../../../cif/categories/ndb-struct-ntc";
import { Dnatcofication } from "../../../../dnatco/dnatcofication";
import { Tooltip } from "../../../common/tooltip";
import { tooltipImg } from "../../../../assets/images";
import { EntityPoly } from "../../../../cif/categories/entity";

function mmCifName(d: Dnatcofication) {
  if (!d.hasTable(EntityPoly)) return "dnatco_structure.cif";
  const values = d.table(EntityPoly).pdbx_seq_one_letter_code.values;
  const type = d.table(EntityPoly).type.values;
  if (values && type) {
    const combinedArray = values.map((value, index) => ({
      type: type[index],
      sequence: value,
    }));

    // console.log(combinedArray, 'Combined array');

    const selectedSequences = combinedArray
      .filter(
        (item) =>
          item.type === "polyribonucleotide" ||
          item.type === "polydeoxyribonucleotide" ||
          item.type === "polydeoxyribonucleotide/polyribonucleotide hybrid"
      )
      .map((item) => item.sequence.replace(/,/g, ""));

    // console.log(selectedSequences, 'only polyribonuclotide sequences');

    return selectedSequences.join("");
  } else {
    console.log("Either col or identifier is null");
  }
}

export function NucleotideCounts({ d }: { d: Dnatcofication }) {
  const sequence = mmCifName(d);

  if (sequence) {
    const result = [];
    const regex = /\((.*?)\)/g;

    let match;
    while ((match = regex.exec(sequence)) !== null) {
      result.push(match[1]);
    }

    // console.log(sequence)

    let lastIndex = 0;
    let match2;
    while ((match2 = regex.exec(sequence)) !== null) {
      const nonParenthesized = sequence.substring(lastIndex, match2.index);
      if (nonParenthesized.length > 0) {
        result.push(...nonParenthesized.split(""));
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sequence.length) {
      result.push(...sequence.substring(lastIndex).split(""));
    }

    const nucleotideCounts: { [ntc: string]: number } = {};

    for (let i = 0; i < result.length; i++) {
      const substring = result[i];
      nucleotideCounts[substring] = (nucleotideCounts[substring] || 0) + 1;
    }

    return (
      <table className="mb-2">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
            >
              Counts of Nucleotide in polymer entity
            </th>
          </tr>
          <tr>
            <th className="py-2 border-primary-first border-[.1px]">
              Nucleotide
            </th>
            <th className="py-2 border-primary-first border-[.1px]">Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(nucleotideCounts).map(([ntc, count]) => (
            <tr key={ntc}>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {ntc}
              </td>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export function BasePairing({ d }: { d: Dnatcofication }) {
  const pdbId = d.pdbId; // is '' if not found in _struct, otherwise should be non-empty string
  //console.log('dnatcofication.pdbId "' + pdbId + '"');

  // TODO test that the structure came from known database (PDB or PDB-REDO) so we have the pairing precomputed for it, not from custom file. Also better use the db in the url, now it shows pairing data for the PDB deposited structure even for (potentially different) re-refined structure from other source, if the same pdbId exists on dnatco.
  if(pdbId !== '') {
    const pdbLc = pdbId.toLowerCase();

    const pdbMid = pdbLc.slice(1, 3);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const url = `/pairing/${pdbMid}/${pdbLc}_basepairs.json`;
          //console.log('trying url:', url)
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const jsonData = await response.json();
          setData(jsonData);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!data || !data.summary || Object.keys(data.summary).length === 0) {
      return;
    }

    const summaryData = data.summary;

    return (
      <table className="mb-2">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
            >
              <div>Number of paired bases</div>
              <div className="text-14px">Data provided by FR3D</div>
            </th>
          </tr>
          <tr>
            <th className="py-2 border-primary-first border-[.1px]">
              <div className="flex justify-center">
                <span>Type of BP</span>
                <Tooltip
                  tag={
                    <div className="cursor-pointer ml-4">
                      <img className="w-5" src={tooltipImg} />
                    </div>
                  }
                  delayMsec={300}
                >
                  The Leontis-Westhof nomenclature, for more see help (Link in
                  footer)
                </Tooltip>
              </div>
            </th>
            <th className="py-2 border-primary-first border-[.1px]">Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summaryData).map(([key, value]: [string, any]) => (
            <tr key={key}>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {key}
              </td>
              <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export class MainFeatures extends View<View.Props> {
  static readonly unscrollableContainer = true;

  render() {
    const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
    const { assigned_NtC, assigned_CANA } = summary;
    const steps = this.props.dnatcofication.table(NdbStructNtcStep);

    const ntCCounts: { [ntc: string]: number } = {};
    const canaCounts: { [ntc: string]: number } = {};

    for (let row = 0; row < steps._rowCount; row++) {
      const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
      ntCCounts[assignedNtC] = (ntCCounts[assignedNtC] || 0) + 1;
    }

    for (let row = 0; row < steps._rowCount; row++) {
      const assignedCANA = Cif.Column.value(assigned_CANA, row)!;
      canaCounts[assignedCANA] = (canaCounts[assignedCANA] || 0) + 1;
    }

    return (
      <div className="overflow-scroll h-full flex flex-col relative">
        <div className="font-700 mb-2 p-2 text-center border-b border-primary-first">
          Main features
        </div>

        <table className="mb-2">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
              >
                <div className="flex justify-center">
                  <span>Counts of NtC</span>
                  <Tooltip
                    tag={
                      <div className="cursor-pointer ml-3">
                        <img className="w-5 my-auto" src={tooltipImg} />
                      </div>
                    }
                    delayMsec={300}
                  >
                    diNucleotide Conformational classes, for more see help (Link
                    in footer)
                  </Tooltip>
                </div>
              </th>
            </tr>
            <tr>
              <th className="py-2 border-primary-first border-[.1px]">NtC</th>
              <th className="py-2 border-primary-first border-[.1px]">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ntCCounts).map(([ntc, count]) => (
              <tr key={ntc}>
                <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                  {ntc}
                </td>
                <td className="font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                  {count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mb-2">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
              >
                <div className="flex justify-center">
                  <span>Counts of CANA</span>
                  <Tooltip
                    tag={
                      <div className="cursor-pointer ml-3">
                        <img className="w-5 my-auto" src={tooltipImg} />
                      </div>
                    }
                    delayMsec={300}
                  >
                    Conformational Alphabet of Nucleic Acids, for more see help
                    (Link in footer)
                  </Tooltip>
                </div>
              </th>
            </tr>
            <tr>
              <th className="py-2 border-primary-first border-[.1px]">CANA</th>
              <th className="py-2 border-primary-first border-[.1px]">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(canaCounts).map(([cana, count]) => (
              <tr key={cana}>
                <td className="font-bold border-r-[.1px] py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]">
                  {cana}
                </td>
                <td className="font-bold border-primary-first py-1 px-7 border-[.1px] w-[7rem] text-center">
                  {count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <BasePairing d={this.props.dnatcofication} />

        <NucleotideCounts d={this.props.dnatcofication} />
      </div>
    );
  }
}

export namespace MainFeatures {
  export const SelectionDisplayer = Annotation.selectionDisplayer;
  export const SelectionMaker = Annotation.selectionMaker;
}
