import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { Api } from './api';
import { Payloads } from './api/payloads';
import { Requests } from './api/requests';
import { loadConfiguration, Configuration } from './config';
import { PhenixRsccCalc } from './phenix-rscc-calc';
import { Result } from './result';
import { Search } from './search';
import { checkInteger } from './util';
//import '../../node_modules/better-sqlite3/build/Release/better_sqlite3.node';

const CorsOptionsStructureResources = {
    origin: '*',
    methods: ['GET'],
};

const Fixuppers = {
    '.cif': fixupCoordinatesFileName,
    '.cif.gz': fixupCoordinatesFileName,
    '.pdb': fixupCoordinatesFileName,
    '.pdb.gz': fixupCoordinatesFileName,
    '.dsn6': fixupDensityFileName,
    '.mtz': fixupDensityFileName,
};

function fixupCoordinatesFileName(name: string) {
    const nameParts = name.split('.');
    const stemParts = nameParts[0].split('_');
    stemParts[0] = stemParts[0].toLowerCase();

    return stemParts.join('_') + '.' + nameParts.slice(1).join('.');
}

function fixupDensityFileName(name: string) {
    return name.toLowerCase();
}

function fixupStructureDataFilesUrl(url: string) {
    const parts = url.split('/');
    const lastIdx = parts.length - 1;
    const last = parts[lastIdx];

    for (const suffix in Fixuppers) {
        if (last.endsWith(suffix)) {
            parts[lastIdx] = Fixuppers[suffix as keyof typeof Fixuppers](last);
            return parts.join('/');
        }
    }

    return url;
}

function respond<T extends Payloads.Payload>(result: Result.Result<T>, resp: express.Response) {
    if (result.success) {
        resp.status(result.status).json(Api.OkResponse(result.payload));
    } else {
        resp.status(result.status).json(Api.ErrorResponse(result.message));
    }
}

function sendStructureResource(url: string, dir: string, resp: express.Response) {
    let path = structureResourcePath(url);
    if (path === '') {
        resp.status(404).send('File not found');
        return;
    }

    path = `${dir}/${path}`;
    try {
        fs.accessSync(path, fs.constants.R_OK);
        resp.sendFile(path);
    } catch (e) {
        resp.status(404).send('File not found');
    }
}

function structureResourcePath(url: string) {
    const toks = url.split('/');
    return toks.length < 4 ? '' : toks.slice(3).join('/');
}

function initApp(config: Configuration, dbhs: Search.DbHandles) {
    const app = express();

    app.use((req, res, next) => {
        req.url = fixupStructureDataFilesUrl(req.url);

        next();
    });
    app.use(express.json({ limit: `${config.maxPayloadKBytes}kb` }));
    app.use((req, resp, next) => {
        resp.set('Cache-Control', 'public');
        next();
    }).use(express.static(config.assets)); // Configuration loader will not allow null assets

    app.get('/db/coordinates/*', cors(CorsOptionsStructureResources), (req, resp) => {
        sendStructureResource(req.path, config.coordinates, resp); // Configuration loader will not allow null coordinates
    });
    app.get('/db/density_maps/*', cors(CorsOptionsStructureResources), (req, resp) => {
        if (config.densityMaps !== '')
            sendStructureResource(req.path, config.densityMaps, resp);
        else
            resp.status(503).send();
    });

    app.post('/api/rscc', (req, resp) => {
        if (config.phenixRscc.execRealSpace === '' && config.phenixRscc.execMapModelCc === '')
            respond(Result.Error(503, 'RSCC calculation service is not available'), resp);

        const apiReq = req.body;
        if (!Requests.check(apiReq, Requests.Rscc))
            respond(Result.Error(400, 'Invalid command'), resp);
        else {
            const r = PhenixRsccCalc.calculate(apiReq, config.phenixRscc);
            respond(r, resp);
        }
    });
    app.post('/api/search', (req, resp) => {
        const apiReq = req.body;
        if (!Requests.check(apiReq, Requests.Search, (v) => {
            return checkInteger(v.maxCount, { min: 1 });
        })) {
            respond(Result.Error(400, 'Invalid command'), resp);
        } else {
            const r = Search.search(apiReq, dbhs);
            respond(r, resp);
        }
    });

    app.get('/app', (req, resp) => {
        resp.set('Cache-Control', 'no-cache');
        resp.sendFile(config.assets + '/index.html');
    });
    app.get('/app/*', (req, resp) => {
        resp.set('Cache-Control', 'no-cache');
        resp.sendFile(config.assets + '/index.html');
    });

    return app;
}

async function main() {
    try {
        const config = loadConfiguration('./config.json');
        const dbh = Search.init(config.conformersDb, process.argv[2]);

        console.log(config);

        const app = initApp(config, dbh);

        app.listen(config.port, '', 0, () => console.log('Running...'));
    } catch (e) {
        console.error(e);
    }
}

main();
