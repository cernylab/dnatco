import { Category, Schema } from './';

export const Entry_Schema = {
    id: Schema.str,
};

export interface Entry extends Category<typeof Entry_Schema> {}
export const Entry: Entry = {
    name: 'entry',
    schema: Entry_Schema,
};
