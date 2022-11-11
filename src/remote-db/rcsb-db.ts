import { RemoteDatabase } from './';
import { OkResult, ErrorResult, Result } from '../dnatco';
import { Coordinates } from '../dnatco/coordinates';
import { DensityMap } from '../dnatco/density-map';
import { fromTemplate, isObj } from '../util/json';
import { ungzip } from '../zip/unzip';

type _Ok<T> = {
    type: 'ok';
    data: T;
}
type _Fail = {
    type: 'fail';
    message: string;
}
type _TryAnother = {
    type: 'try-another';
}
function _Ok<T>(data: T): _Ok<T> { return { type: 'ok', data: data }; }
function _Fail(message: string): _Fail { return { type: 'fail', message }; }
function _TryAnother(): _TryAnother { return { type: 'try-another' }; }

const EMDIdResponse = {
    rcsb_entry_container_identifiers: {
        emdb_ids: [""],
    },
}
type EMDIdResponse = typeof EMDIdResponse;


function isEMDIdResponse(v: unknown): v is EMDIdResponse {
    if (!isObj(v))
        return false;

    const resp = fromTemplate(v, EMDIdResponse);
    return resp !== undefined;
}

async function downloadDensityMapEM(pdbId: string) {
    // First we need to figure out the EMD ID for this structure.
    // We can query RCSB for that.

    let req = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
    if (!req.ok)
        return _Fail(req.statusText);

    try {
        // We should get a GraphQL return object
        const payload = await req.json();
        if (!isEMDIdResponse(payload))
            return _Fail('Unexpected GraphQL query response');

        const emdId = payload.rcsb_entry_container_identifiers.emdb_ids[0];
        if (!emdId)
            return _Fail('No EMB ID data');

        // We have na EMD ID - now get the actual density map
        req = await fetch(`https://files.rcsb.org/pub/emdb/structures/${emdId}/map/emd_3533.map.gz`);
        if (!req.ok)
            return _Fail(req.statusText);

        const data = new Uint8Array(await req.arrayBuffer());
        const ungzipped = await ungzip(data);
        return _Ok(ungzipped);
    } catch (e) {
        return _Fail((e as Error).message);
    }
}

async function downloadDensityMapXRay(pdbId: string) {
    // TODO: We should try to do both Fo-Fc and 2Fo-Fc
    const id = pdbId.toLowerCase();
    const req = await fetch(`https://edmaps.rcsb.org/maps/${id}_2fofc.dsn6`);
    if (req.status === 404)
        return _TryAnother();
    if (!req.ok)
        return _Fail(req.statusText);

    try {
        return _Ok(new Uint8Array(await req.arrayBuffer()));
    } catch (e) {
        return _Fail((e as Error).message);
    }
}

async function downloadDensityMap(pdbId: string, type: 'x-ray'|'em') {
    switch (type) {
    case 'x-ray':
        return downloadDensityMapXRay(pdbId);
    case 'em':
        return downloadDensityMapEM(pdbId);
    }
}

async function fetchCoordinates(pdbId: string): Promise<Result<Coordinates>> {
    const url = `https://models.rcsb.org/v1/${pdbId}/full?encoding=cif&copy_all_categories=true`;
    const req = await fetch(url);
    if (!req.ok)
        return ErrorResult(`Download failed: ${req.statusText}`);

    try {
        const text = await req.text();
        return OkResult({
            data: text,
            type: 'cif'
        });
    } catch (e) {
        return ErrorResult(`Coordinates data is not in the expected format`);
    }
}

async function fetchDensityMap(pdbId: string): Promise<Result<DensityMap>> {
    try {
        let r = await downloadDensityMap(pdbId, 'x-ray');
        if (r.type === 'ok')
            return OkResult({ data: r.data, type: 'dsn6' });
        else if (r.type === 'fail')
            return ErrorResult(`Download failure: ${r.message}`);

        r = await downloadDensityMap(pdbId, 'em');
        if (r.type === 'ok')
            return OkResult({ data: r.data, type: 'ccp4' });
        else if (r.type === 'fail')
            return ErrorResult(`Download failure: ${r.message}`);
        else
            return ErrorResult('No density map is provided for the structure');
    } catch (e) {
        return ErrorResult('Invalid VolumeServer API response');
    }
}

export function RcsbDb(): RemoteDatabase {
    return {
        name: 'RCSB',
        coordinates: fetchCoordinates,
        densityMap: fetchDensityMap,
    };
}
