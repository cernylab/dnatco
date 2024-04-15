import React from 'react';
import { useState, useEffect } from 'react';
import { Annotation } from './common';
import { View } from '../view';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { getCifValue } from '../../../../util/dnatco';
import { Struct } from '../../../../cif/categories/struct';
import { Tooltip } from '../../../common/tooltip';
import { tooltipImg } from '../../../../assets/images';

export function BasePairing({ d }: { d: Dnatcofication }) {
    const pdbId = getCifValue(d, Struct, 'entry_id').toLowerCase();
    const pdbMid = pdbId.slice(1,3);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `/pairing/${pdbMid}/${pdbId}_basepairs.json`
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
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
        <table className='mb-2'>
            <thead>
                <tr>
                    <th colSpan={2} className='mb-4 p-4 text-20px border-primary-first border-[.1px]'>
                        Number of paired bases
                    </th>
                </tr>
                <tr>
                    <th className='py-2 border-primary-first border-[.1px]'>
                        <div className='flex justify-center'>
                            <span>Type of BP</span>
                            <Tooltip
                                tag={<div className='cursor-pointer ml-4'><img className='w-5' src={tooltipImg}/></div>}
                                delayMsec={300}
                            >
                                The Leontis-Westhof nomenclature, for more see help
                            </Tooltip>
                        </div>
                    </th>
                    <th className='py-2 border-primary-first border-[.1px]'>Count</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(summaryData).map(([key, value]: [string, any]) => (
                    <tr key={key}>
                        <td className='font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]'>{key}</td>
                        <td className='font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]'>{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export class MainFeatures extends View<View.Props> {
    static readonly unscrollableContainer = true;
    
    render() {

        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const { assigned_NtC, assigned_CANA } = summary;
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const { name } = steps;
        const nucleotideCounts: { [key: string]: number } = {};

        const stepsArray = name.values;
        console.log(stepsArray);

        let lastSteps: { [key: string]: string } = {};
        
        if (stepsArray) {
            const lastOccurrences: { [key: string]: string } = {};
        
            for (let i = stepsArray.length - 1; i >= 0; i--) {
                const step = stepsArray[i];
                const parts = step.split("_");
                const letter = parts[1]; // Extract the letter
        
                // Check if the letter is not already found and store the last occurrence
                if (!lastOccurrences[letter]) {
                    lastOccurrences[letter] = step;
                }
        
                // Check if we found the last occurrence for all unique letters
                if (Object.keys(lastOccurrences).length === 26) { // Assuming there are 26 letters in the alphabet
                    break;
                }
            }
        
            // Log the last occurrences for each letter
            Object.entries(lastOccurrences).forEach(([letter, lastStep]) => {
                console.log(`Last ${letter}: ${lastStep}`);
            });

            Object.entries(lastOccurrences).forEach(([letter, lastStep]) => {
                lastSteps[letter] = lastStep;
            });
        }

        console.log(lastSteps)

        let text: string[] = [];

        const lastRow = steps._rowCount - 1;
        const lastNucleotide:string = Cif.Column.value(name, lastRow)!;
        console.log('last nucleotide',lastNucleotide);

        const lastNucleotideSplit: string[] = [];
        for (const value of Object.values(lastSteps)) {
            const parts = value.split("_");
            const lastElement = parts[4];
            lastNucleotideSplit.push(lastElement);
        }

        console.log('Helloooooo',lastNucleotideSplit);

        text.push(...lastNucleotideSplit);

        for (let row = 0; row < steps._rowCount; row++) {
            const nucleotide:string = Cif.Column.value(name, row)!;

            const parts = nucleotide.split("_");
            if (parts.length >= 3) {
                const part = parts.slice(2, 3).join("_");
                text.push(part);
            }
        }

        console.log('teeeeeeext', text)

         text.forEach(element => {
            nucleotideCounts[element] = (nucleotideCounts[element] || 0) + 1;
        });

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
            <div className='overflow-scroll h-full flex flex-col relative'>
                <div className='font-700 mb-2 p-2 text-center border-b border-primary-first'>Main features</div>

                <table className='mb-2'>
                    <thead>
                        <tr>
                            <th colSpan={2} className='mb-4 p-4 text-20px border-primary-first border-[.1px]'>Counts of NtC</th>
                        </tr>
                        <tr>
                            <th className='py-2 border-primary-first border-[.1px]'>NtC</th>
                            <th className='py-2 border-primary-first border-[.1px]'>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(ntCCounts).map(([ntc, count]) => (
                            <tr key={ntc}>
                                <td className='font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]'>{ntc}</td>
                                <td className='font-bold py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]'>{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <BasePairing d={this.props.dnatcofication} />

                <table className='mb-2'>
                    <thead>
                        <tr>
                            <th colSpan={2} className='mb-4 p-4 text-20px border-primary-first border-[.1px]'>Counts of CANA</th>
                        </tr>
                        <tr>
                            <th className='py-2 border-primary-first border-[.1px]'>CANA</th>
                            <th className='py-2 border-primary-first border-[.1px]'>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(canaCounts).map(([cana, count]) => (
                            <tr key={cana}>
                                <td className='font-bold border-r-[.1px] py-1 px-7 w-[7rem] text-center border-primary-first border-[.1px]'>{cana}</td>
                                <td className='font-bold border-primary-first py-1 px-7 border-[.1px] w-[7rem] text-center'>{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <table className='mb-2'>
                    <thead>
                        <tr>
                            <th colSpan={2} className='mb-4 p-4 text-20px border-primary-first border-[.1px]'>Counts of nucleotide</th>
                        </tr>
                        <tr>
                            <th className='py-2 border-primary-first border-[.1px]'>Base</th>
                            <th className='py-2 border-primary-first border-[.1px]'>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(nucleotideCounts).map(([nucleotide, count], index, array) => (
                            <tr key={nucleotide}>
                                <td className='font-bold py-1 px-7 border-primary-first w-[7rem] text-center border-[.1px]'>{nucleotide}</td>
                                <td className='font-bold py-1 px-7 border-primary-first border-[.1px] w-[7rem] text-center'>{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}

export namespace MainFeatures {
    export const SelectionDisplayer = Annotation.selectionDisplayer;
    export const SelectionMaker = Annotation.selectionMaker;
}
