import { getCifValue, Common } from './dnatco';
import { Cif } from '../cif';
import { Citation } from '../cif/categories/citation';
import { CitationAuthor } from '../cif/categories/citation-author';
import { Em3dReconstruction } from '../cif/categories/em-3d-reconstruction';
import { Exptl } from '../cif/categories/experimental';
import { Refine } from '../cif/categories/refine';
import { Dnatcofication } from '../dnatco/dnatcofication';

export function listAuthors(d: Dnatcofication) {
    if (!d.hasTable(CitationAuthor))
        return '';

    const authors = [];
    const { name, _rowCount } = d.table(CitationAuthor);
    for (let idx = 0; idx < _rowCount; idx++) {
        const n = Cif.Column.value(name, idx);
        if (n)
            authors.push(n);
    }
    return authors.join(', ');
}

export function primaryPublication(d: Dnatcofication) {
    if (!d.hasTable(Citation))
        return undefined;

    const { id, title, pdbx_database_id_PubMed, pdbx_database_id_DOI } = d.table(Citation);
    if (!id.values)
        return undefined;

    let priIdx = id.values.indexOf('primary');
    if (priIdx === -1)
        priIdx = 0;

    return {
        title: Cif.Column.value(title, priIdx),
        pdbx_database_id_PubMed: Cif.Column.value(pdbx_database_id_PubMed, priIdx),
        pdbx_database_id_DOI: Cif.Column.value(pdbx_database_id_DOI, priIdx),
    }
}

export function resolution(d: Dnatcofication) {
    const method = getCifValue(d, Exptl, 'method');
    if (Common.MethodsWithCommonResolution.includes(method)) {
        return `Low: ${getCifValue(d, Refine, 'ls_d_res_low')?.toFixed(3) ?? Common.NA}, High: ${getCifValue(d, Refine, 'ls_d_res_high')?.toFixed(3) ?? Common.NA}`;
    } else if (method === 'electron microscopy') {
        return `${getCifValue(d, Em3dReconstruction, 'resolution')?.toFixed(3) ?? Common.NA} (${getCifValue(d, Em3dReconstruction, 'resolution_method')})`;
    } else
        return Common.NA;
}
