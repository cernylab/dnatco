export function doiLink(doi: string) {
    return `https://doi.org/${doi}`;
}

export function pubmedLink(id: number) {
    return `https://pubmed.ncbi.nlm.nih.gov/${id}`;
}

export function rcsbLink(pdbId: string) {
    return `https://www.rcsb.org/structure/${pdbId.toUpperCase()}`;
}
