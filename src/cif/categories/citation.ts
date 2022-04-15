import { Category, Schema } from './';

export const Citation_Schema = {
    abstract: Schema.str,
    abstract_id_CAS: Schema.str,
    book_id_ISBN: Schema.str,
    book_publisher: Schema.str,
    book_publisher_city: Schema.str,
    book_title: Schema.str,
    coordinate_linkage: Schema.Enum<'no'|'n'|'yes'|'y'>(['no', 'n', 'yes', 'y']),
    country: Schema.str,
    database_id_Medline: Schema.int,
    details: Schema.str,
    id: Schema.strM,
    journal_abbrev: Schema.str,
    journal_id_ASTM: Schema.str,
    journal_id_CSD: Schema.str,
    journal_id_ISSN: Schema.str,
    journal_full: Schema.str,
    journal_issue: Schema.str,
    journal_volume: Schema.str,
    language: Schema.str,
    page_first: Schema.str,
    page_last: Schema.str,
    title: Schema.str,
    year: Schema.int,
    database_id_CSD: Schema.str,
    pdbx_database_id_DOI: Schema.str,
    pdbx_database_id_PubMed: Schema.int,
    pdbx_database_id_patent: Schema.str,
    unpublished_flag: Schema.Enum<'Y'|'N'>(['Y', 'N']),
};
export type Citation_Schema = typeof Citation_Schema;
export const Citation: Category<Citation_Schema> = {
    name: 'citation',
    schema: Citation_Schema,
};
