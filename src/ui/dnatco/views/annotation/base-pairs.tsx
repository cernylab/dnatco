import React, { useEffect, useState } from "react";
import { Dnatcofication } from "src/dnatco/dnatcofication";
import { Annotation } from "./common";

export function BasePairing({ d }: { d: Dnatcofication }) {
  const pdbId = d.pdbId; // is '' if not found in _struct, otherwise should be non-empty string
  //console.log('dnatcofication.pdbId "' + pdbId + '"');

  // TODO test that the structure came from known database (PDB or PDB-REDO)
  // so we have the pairing precomputed for it, not from custom file. 
  // Also better use the db in the url, now it shows pairing data 
  // for the PDB deposited structure even for (potentially different)
  // re-refined structure from other source, if the same pdbId exists on dnatco.
  
  if(pdbId !== '') {
    const pdbLc = pdbId.toLowerCase();

    const pdbMid = pdbLc.slice(1, 3);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const url = `/pairing/${pdbMid}/${pdbLc}_basepairs.json`;
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

    if(!data) {
      return <div>No data available</div>;
    }

    const sortedData = [...data.details]
      .filter(([ , interaction ]) => !['cHW', 'cSW', 'cSH', 'tHW', 'tSW', 'tSH'].includes(interaction))
      .map(([base1, interaction, base2, score]) => {
        const cleanedBase1 = base1.split('|').slice(0, 5).join('|');
        const cleanedBase2 = base2.split('|').slice(0, 5).join('|');
        return [cleanedBase1, interaction, cleanedBase2];
    }).sort((a, b) => {
      const cleanA = a[0].split('|');
      const cleanB = b[0].split('|');

      const [ , modelA, chainA, , numberA ] = cleanA;
      const [ , modelB, chainB, , numberB ] = cleanB;

      const mA = Number(modelA);
      const mB = Number(modelB);

      if (mA !== mB) return mA - mB;
      const chainCmp = chainA.localeCompare(chainB);
      if (chainCmp !== 0) return chainCmp;

      return Number(numberA) - Number(numberB);
    });

    const seenPairs = new Set();

    const finalData = sortedData.filter(([base1, interaction, base2]) => {
      const key = [base1, base2].sort().join('|');

      if (seenPairs.has(key)) {
        return false;
      }

      seenPairs.add(key);
      return true;
    });
    
    const modelSet = new Set(finalData.map(([base1]) => base1.split('|')[1]));
    const isSingleModel = modelSet.size === 1;

    return (
      <table className="mb-2 w-full">
        <thead>
          <tr>
            <th
              colSpan={isSingleModel ? 5 : 6}
              className="mb-4 p-4 text-20px border-primary-first border-[.1px]"
            >
              <div>Base pairs</div>
              <div className="text-14px">Data provided by FR3D</div>
            </th>
          </tr>
          <tr>
            {!isSingleModel && (
                <th className="py-2 border-primary-first border-[.1px]">Model</th>
            )}
            <th className="py-2 border-primary-first border-[.1px]">Chain 1</th>
            <th className="py-2 border-primary-first border-[.1px]">Base 1</th>
            <th className="py-2 border-primary-first border-[.1px]">Family</th>
            <th className="py-2 border-primary-first border-[.1px]">Chain 2</th>
            <th className="py-2 border-primary-first border-[.1px]">Base 2</th>
          </tr>
        </thead>
        <tbody>
          {finalData.map(([base1, interaction, base2], index) => {
            const [ , model, chain1, baseType1, baseNum1 ] = base1.split('|');
            const [ , , chain2, baseType2, baseNum2 ] = base2.split('|');
            return (
              <tr key={index}>
                {!isSingleModel && (
                    <td className="border-primary-first border-[.1px] text-center py-1 px-2">{model}</td>
                )}
                <td className="border-primary-first border-[.1px] text-center py-1 px-2">{chain1}</td>
                <td className="border-primary-first border-[.1px] text-center py-1 px-2">{`${baseType1} ${baseNum1}`}</td>
                <td className="border-primary-first border-[.1px] text-center py-1 px-2">{interaction}</td>
                <td className="border-primary-first border-[.1px] text-center py-1 px-2">{chain2}</td>
                <td className="border-primary-first border-[.1px] text-center py-1 px-2">{`${baseType2} ${baseNum2}`}</td>
              </tr>
            );
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