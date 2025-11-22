export namespace Result {
    export type Error = {
        success: false;
        status: number;
        message: string;
    }
    export type Ok<T> = {
        success: true;
        status: number;
        payload: T;
    }
    export type Result<T> = Error | Ok<T>;

    export function Error(status: number, message: string): Error {
        return { success: false, status, message };
    }
    export function Ok<T>(payload: T, status = 200): Ok<T> {
        return { success: true, status, payload };
    }
}
