export namespace CANA {
    export const Classes = [
        'AAA',
        'AAw',
        'AAu',
        'A-B',
        'B-A',
        'BBB',
        'BBw',
        'B12',
        'BB2',
        'miB',
        'ICL',
        'OPN',
        'SYN',
        'ZZZ',
    ] as const;
    export type ValidClass = typeof Classes[number];
    export type Class = typeof Classes[number] | 'NAN';

    export function isCanaClass(v: string): v is Class {
        return isCanaValidClass(v as any) || v === 'NAN';
    }

    export function isCanaValidClass(v: string): v is ValidClass {
        return Classes.includes(v as any);
    }
}
