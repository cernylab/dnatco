import { RemoteDatabase } from './';
import { OkResult, ErrorResult, Result } from '../../dnatco';
import { Coordinates } from '../../dnatco/coordinates';
import { DensityMap } from '../../dnatco/density-map';
//import { isObj } from '../../util/json';
//import { ungzip } from '../../zip/unzip';

{/*
type PdbeEntryResponse = {
    [pdbId: string]: {
        related_structures?: {
            emdb?: string[];
        };
    };
};

function isPdbeEntryResponse(v: unknown): v is PdbeEntryResponse {
    return isObj(v);
}
*/}

async function fetchCoordinates(pdbId: string): Promise<Result<Coordinates>> {
    const url = `https://www.ebi.ac.uk/pdbe/entry-files/download/${pdbId}_updated.cif`;
    const req = await fetch(url);
    if (!req.ok) {
        let errorMessage = req.statusText;
        if (req.status === 404) {
            errorMessage += `. Structure ${pdbId} might not be present in the database`;
        }
        return ErrorResult(`Download failed: ${errorMessage}`);
    }

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

async function fetchDensityMaps(pdbId: string): Promise<Result<DensityMap[]>> {
    //const id = pdbId.toLowerCase();
    const maps: DensityMap[] = [];

    // We are getting "CORS Missing Allow Origin" for all fetches
    // For xray structures the fetch works if maps exist, 
    // but the api call fails every time, consider "proxy"?
    {/*
    // Try 2Fo-Fc map
    try {
        const req = await fetch(`https://www.ebi.ac.uk/pdbe/entry-files/${id}.ccp4`);
        if (req.ok) {
            try {
                const data = new Uint8Array(await req.arrayBuffer());
                maps.push({ data, type: 'ccp4', kind: '2fo-fc' });
            } catch (e) {
                // Continue to try other maps
            }
        }
    } catch (e) {
        // Continue to try other maps
    }

    // Try Fo-Fc difference map
    try {
        const req = await fetch(`https://www.ebi.ac.uk/pdbe/entry-files/${id}_diff.ccp4`);
        if (req.ok) {
            try {
                const data = new Uint8Array(await req.arrayBuffer());
                maps.push({ data, type: 'ccp4', kind: 'fo-fc' });
            } catch (e) {
                // Continue
            }
        }
    } catch (e) {
        // Continue
    }

    // If no X-ray maps found, try EMDB maps
    if (maps.length === 0) {
        try {
            // Query PDBe API for EMDB ID
            const req = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/pdb/entry/summary/${id}`);
            if (req.ok) {
                try {
                    const payload = await req.json();
                    if (isPdbeEntryResponse(payload)) {
                        const entry = payload[id];
                        const emdbIds = entry?.related_structures?.emdb;
                        if (emdbIds && emdbIds.length > 0) {
                            const emdId = emdbIds[0]; // Use first EMDB entry
                            // Get the actual density map from EMDB
                            const idNum = emdId.split('-')[1];
                            const mapReq = await fetch(`https://ftp.ebi.ac.uk/pub/databases/emdb/structures/${emdId}/map/emd_${idNum}.map.gz`);
                            if (mapReq.ok) {
                                const data = new Uint8Array(await mapReq.arrayBuffer());
                                const ungzipped = await ungzip(data);
                                maps.push({ data: ungzipped, type: 'ccp4', kind: 'em' });
                            }
                        }
                    }
                } catch (e) {
                    // Continue - EMDB map not critical
                }
            }
        } catch (e) {
            // Continue - EMDB map not critical
        }
    }
    */}

    if (maps.length > 0) {
        return OkResult(maps);
    } else {
        return ErrorResult('No density maps available for this structure');
    }
}

export function PdbeDb(): RemoteDatabase {
    return {
        name: 'PDBe',
        coordinates: fetchCoordinates,
        densityMaps: fetchDensityMaps,
    };
}
