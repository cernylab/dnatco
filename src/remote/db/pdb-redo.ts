import { StaticDb } from "./static-db";

export const PdbRedoDb = StaticDb(
    'PDB-REDO',
    { link: 'https://pdb-redo.eu/db/${pdbId}/${pdbId}_final.cif', type: 'cif', gzipped: false }
);


