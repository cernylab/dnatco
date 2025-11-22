import Database from 'better-sqlite3'
import { ConformersDb } from './config';
import { Result } from './result';
import { Payloads } from './api/payloads';
import { Requests } from './api/requests';

const Columns = 'step_ID,NtC,nearest_NtC,CANA,confalH,d1,e1,z1,a2,b2,g2,d2,ch1,ch2,resolutions.resolution,resolutions.numsteps,rmsd';

interface MyTableRow {
    step_ID: string;
    NtC: string;
    nearest_NtC: string;
    CANA: string;
    confalH: number;
    d1: number;
    e1: number;
    z1: number;
    a2: number;
    b2: number;
    g2: number;
    d2: number;
    ch1: number;
    ch2: number;
    resolution: string;
    numsteps: number;
    rmsd: number;
}

function runQuery(query: Requests.Search, dbhs: Search.DbHandles): Result.Result<Payloads.FoundSteps> {
    const dbh = query.redundant ? dbhs.redundant : dbhs.nonRedundant;

    try {
        const stmt = dbh.prepare(
            `SELECT  ${Columns} FROM results INNER JOIN resolutions ON results.pdb_ID = resolutions.pdb_ID WHERE NtC=? ${!query.large ? 'AND resolutions.numsteps < 400' : ''}`,
        );

        const rows = stmt.all(query.NtC) as MyTableRow[];
        const result = new Array<Payloads.FoundStep>();

        let counter = 0;
        for (const r of rows) {
            result.push({
                name: r['step_ID'],
                NtC: r['NtC'],
                nearestNtC: r['nearest_NtC'],
                CANA: r['CANA'],
                confal: r['confalH'],
                delta1: r['d1'],
                epsilon1: r['e1'],
                zeta1: r['z1'],
                alpha2: r['a2'],
                beta2: r['b2'],
                gamma2: r['g2'],
                delta2: r['d2'],
                chi1: r['ch1'],
                chi2: r['ch2'],
                resolution: parseFloat(r['resolution']),
                numsteps: r['numsteps'],
                rmsd: r['rmsd'],
            });

            if (++counter >= query.maxCount)
                break;
        }

        return Result.Ok(result);
    } catch (e) {
        return Result.Error(500, (e as Error).message);
    }
}

export namespace Search {
    export type DbHandles = {
        redundant: Database.Database,
        nonRedundant: Database.Database,
    };

    export function init(config: ConformersDb, nativeBinding?: string): DbHandles {
        const redundant = new Database(config.results, { fileMustExist: true, readonly: true, nativeBinding });
        redundant.exec(`ATTACH DATABASE "${config.resolutions}" as RESOLUTIONS`);

        const nonRedundant = new Database(config.nonredundantResults, { fileMustExist: true, readonly: true, nativeBinding });
        nonRedundant.exec(`ATTACH DATABASE "${config.resolutions}" as RESOLUTIONS`);

        return { redundant, nonRedundant };
    }

    export function search(query: any, dbhs: DbHandles): Result.Result<Payloads.FoundSteps> {
        return runQuery(query, dbhs);
    }
}
