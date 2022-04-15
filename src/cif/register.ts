import { AtomSite } from './categories/atom-site';
import { Citation } from './categories/citation';
import { CitationAuthor } from './categories/citation-author';
import { Entry } from './categories/entry';
import { Exptl, ExptlCrystal, ExptlCrystalGrow } from './categories/experimental';
import { NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep, NdbStructNtcStepSummary, NdbStructSugarStepParameters } from './categories/ndb-struct-ntc';
import { PdbxDatabaseStatus } from './categories/pdbx-database-status';
import { Refine } from './categories/refine';
import { Struct } from './categories/struct';

export const KnownCategories = [
    AtomSite,
    Citation,
    CitationAuthor,
    Entry,
    Exptl, ExptlCrystal, ExptlCrystalGrow,
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep, NdbStructNtcStepSummary, NdbStructSugarStepParameters,
    PdbxDatabaseStatus,
    Refine,
    Struct,
];
