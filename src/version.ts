import { GlobalConfig } from './global-config';

export namespace Version {
    export const Major = 5;
    export const Minor = 0;
    export const Date = '20260109';

    export function tag() {
        const date = GlobalConfig.data().versionDate ?? Date;
        return `${Major}.${Minor}.${date}${GlobalConfig.data().isDevel ? '-devel' : ''}`;
    }
}
