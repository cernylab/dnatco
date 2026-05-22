import { decomposePdbId, toPdbId } from '../util';
import { Logger } from '../log/logger';

export namespace Napair {
    /**
     * Fetch NAPAIR base pair annotation CIF for a given PDB ID.
     * Returns the raw CIF text, or null if not available.
     * The URL pattern mirrors the extended CIF structure but under /napair/.
     */
    export async function fetchFromDb(pdbId: string): Promise<string | null> {
        let url: string;
        try {
            const normalized = toPdbId(pdbId);
            const { prefix, subdir, code8 } = decomposePdbId(normalized);
            url = `/napair/${prefix}/${subdir}/${code8}.mmcif`;
        } catch (e) {
            Logger.log(Logger.Severity.Warning, `Failed to decompose PDB ID "${pdbId}" for NAPAIR, falling back to legacy path: ${e}`);
            url = `/napair/${pdbId}.mmcif`;
        }

        Logger.log(Logger.Severity.Debug, `Fetching NAPAIR data from: ${url}`);

        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                Logger.log(Logger.Severity.Debug, `NAPAIR data not available for ${pdbId} (${resp.status})`);
                return null;
            }
            return resp.text();
        } catch (e) {
            Logger.log(Logger.Severity.Warning, `Failed to fetch NAPAIR data for ${pdbId}: ${e}`);
            return null;
        }
    }
}
