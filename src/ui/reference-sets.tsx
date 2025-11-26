import React from 'react';
import { DownloadButtonComponent } from './dnatco/common';
import { arrowDown, arrowDownHover } from '../assets/images';

function DownloadSection(props: {
    title: string;
    description: React.ReactNode;
    files: Array<{ name: string; url: string; caption: string }>;
}) {
    return (
        <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
            <div className='w-[40%]'>
                <h3 className='font-700 text-18px mb-2 uppercase'>
                    {props.title}
                </h3>
                <div className='text-16px mb-2'>
                    {props.description}
                </div>
            </div>
            <div className='w-[60%] flex flex-col gap-3'>
                {props.files.map((file, idx) => (
                    <div key={idx} className='flex justify-between items-center'>
                        <div className='text-16px'>{file.caption}</div>
                        <DownloadButtonComponent
                            title='Download'
                            defaultImage={arrowDown as string}
                            hoverImage={arrowDownHover as string}
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ReferenceSets() {
    const pdbNaReferenceSetFiles = [
        {
            name: 'dna_naked.csv',
            url: '/reference-sets/na-val/dna_naked.csv',
            caption: 'DNA (naked)',
        },
        {
            name: 'dna_protein_complexes.csv',
            url: '/reference-sets/na-val/dna_protein_complexes.csv',
            caption: 'Protein-DNA complexes',
        },
        {
            name: 'rna_naked.csv',
            url: '/reference-sets/na-val/rna_naked.csv',
            caption: 'RNA (naked)',
        },
        {
            name: 'rna_protein_complexes.csv',
            url: '/reference-sets/na-val/rna_protein_complexes.csv',
            caption: 'Protein-RNA complexes',
        },
    ];

    const generalReferenceSetFiles = [
        {
            name: 'resolution_1.0_1.5.csv',
            url: '/reference-sets/general/resolution_1.0_1.5.csv',
            caption: 'Resolution 1.0-1.5 Å',
        },
        {
            name: 'resolution_1.5_2.0.csv',
            url: '/reference-sets/general/resolution_1.5_2.0.csv',
            caption: 'Resolution 1.5-2.0 Å',
        },
        {
            name: 'resolution_2.0_2.5.csv',
            url: '/reference-sets/general/resolution_2.0_2.5.csv',
            caption: 'Resolution 2.0-2.5 Å',
        },
        {
            name: 'resolution_2.5_3.0.csv',
            url: '/reference-sets/general/resolution_2.5_3.0.csv',
            caption: 'Resolution 2.5-3.0 Å',
        },
    ];

    return (
        <div className='h-full overflow-hidden flex flex-col'>
            <div className='rdo-scroll-vertically'>
                <DownloadSection
                    title='PDB NA Reference Set'
                    description={
                        <>
                            <p className='mb-2'>
                                This reference set was produced for the NA-VAL validation tool and contains
                                residue-level filtered data with better than 1.8 Å resolution.
                            </p>
                            <p>
                                The data has been carefully curated to ensure high-quality structural information
                                for nucleic acid validation purposes.
                            </p>
                        </>
                    }
                    files={pdbNaReferenceSetFiles}
                />

                <DownloadSection
                    title='General Reference Sets'
                    description={
                        <>
                            <p className='mb-2'>
                                These reference sets contain nucleic acid structures grouped by resolution ranges.
                            </p>
                            <p>
                                Each dataset includes structures filtered according to quality criteria within
                                the specified resolution range. The selection criteria include:
                            </p>
                            <ul className='list-disc ml-6 mt-2'>
                                <li>X-ray crystallography structures only</li>
                                <li>R-factor and R-free values within acceptable ranges</li>
                                <li>Complete nucleic acid chains</li>
                                <li>Standard nucleotide composition</li>
                            </ul>
                        </>
                    }
                    files={generalReferenceSetFiles}
                />
            </div>
        </div>
    );
}
