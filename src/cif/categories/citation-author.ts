import { Category, Schema } from './';

export const CitationAuthor_Schema = {
    citation_id: Schema.strM,
    name: Schema.strM,
    ordinal: Schema.intM,
    identifier_ORCID: Schema.str,
};
export type CitationAuthor_Schema = typeof CitationAuthor_Schema;
export const CitationAuthor: Category<CitationAuthor_Schema> = {
    name: 'citation_author',
    schema: CitationAuthor_Schema,
}
