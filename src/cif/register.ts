import { AtomSite } from './categories/atom-site';
import { ChemComp } from './categories/chem-comp';
import { Citation } from './categories/citation';
import { CitationAuthor } from './categories/citation-author';
import { Em3dReconstruction } from './categories/em-3d-reconstruction';
import { Entity, EntityPoly, EntityPolySeq } from './categories/entity';
import { Entry } from './categories/entry';
import { Exptl, ExptlCrystal, ExptlCrystalGrow } from './categories/experimental';
import { NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep, NdbStructNtcStepSummary, NdbStructSugarStepParameters } from './categories/ndb-struct-ntc';
import { NdbBasePairList, NdbBasePairAnnotation } from './categories/ndb-base-pair';
import { PdbxDatabaseStatus } from './categories/pdbx-database-status';
import { Refine } from './categories/refine';
import { Struct } from './categories/struct';

export const KnownCategories = [
    AtomSite,
    ChemComp,
    Citation,
    CitationAuthor,
    Em3dReconstruction,
    Entity, EntityPoly, EntityPolySeq,
    Entry,
    Exptl, ExptlCrystal, ExptlCrystalGrow,
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep, NdbStructNtcStepSummary, NdbStructSugarStepParameters,
    NdbBasePairList, NdbBasePairAnnotation,
    PdbxDatabaseStatus,
    Refine,
    Struct,
];
