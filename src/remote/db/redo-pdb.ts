import { StaticDb } from "./static-db";

export const RedoPdbDb = StaticDb(
    'REDO-PDB',
    { link: 'https://pdb-redo.eu/db/${id}/${id}_final.cif', type: 'cif', gzipped: false }
);


