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
            name: 'PDB-NA_Reference_Set_DNA.csv',
            url: '/reference-sets/na-val/PDB-NA_Reference_Set_DNA.csv',
            caption: 'PDB-NA Reference Set DNA residues',
        },
        {
            name: 'PDB-NA_Reference_Set_RNA.csv',
            url: '/reference-sets/na-val/PDB-NA_Reference_Set_RNA.csv',
            caption: 'PDB-NA Reference Set RNA residues',
        },
    ];

    const generalReferenceSetFiles = [
        {
            name: 'RS25_DNA_c2.csv',
            url: '/reference-sets/general/RS25_DNA_c2.csv',
            caption: 'DNA chains with resolution ≤ 2.5 Å',
        },
        {
            name: 'RS35_DNA_c2.csv',
            url: '/reference-sets/general/RS35_DNA_c2.csv',
            caption: 'DNA chains with resolution ≤ 3.5 Å',
        },
        {
            name: 'RS25_DNA_c2_contacts.csv',
            url: '/reference-sets/general/RS25_DNA_c2_contacts.csv',
            caption: 'DNA chains with resolution ≤ 2.5 Å with contacts',
        },
        {
            name: 'RS35_DNA_c2_contacts.csv',
            url: '/reference-sets/general/RS35_DNA_c2_contacts.csv',
            caption: 'DNA chains with resolution ≤ 3.5 Å with contacts',
        },
        {
            name: 'RS25_RNA_c2.csv',
            url: '/reference-sets/general/RS25_RNA_c2.csv',
            caption: 'RNA chains with resolution ≤ 2.5 Å',
        },
        {
            name: 'RS35_RNA_c2.csv',
            url: '/reference-sets/general/RS35_RNA_c2.csv',
            caption: 'RNA chains with resolution ≤ 3.5 Å',
        },
        {
            name: 'RS25_RNA_c2_contacts.csv',
            url: '/reference-sets/general/RS25_RNA_c2_contacts.csv',
            caption: 'RNA chains with resolution ≤ 2.5 Å with contacts',
        },
        {
            name: 'RS35_RNA_c2_contacts.csv',
            url: '/reference-sets/general/RS35_RNA_c2_contacts.csv',
            caption: 'RNA chains with resolution ≤ 3.5 Å with contacts',
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
                                These reference sets contain non-redundant list of the best-scoring nucleic acid chains in given resolution ranges.
                            </p>
                            <p>
                                Each dataset includes chains filtered according to the Composite Quality Score (CQS) within
                                the specified resolution range. The selection criteria include:
                            </p>
                            <ul className='list-disc ml-6 mt-2'>
                                <li>X-ray crystallography structures only</li>
                                <li>Complete nucleic acid chains with CQS &lt; 15</li>
                                <li>CQS integrates resolution, R_free, clashscore, RSCC, RSR, and model completeness</li>
                                <li>Up to two best chains from each 90% sequence identity cluster are included</li>
                                <li>NAs in protein complexes and naked are considered different</li>
                            </ul>
                        </>
                    }
                    files={generalReferenceSetFiles}
                />
            </div>
        </div>
    );
}
