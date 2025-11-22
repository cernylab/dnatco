import { Payloads } from './payloads';

export namespace Api {
    export type ErrorResponse = {
        success: false;
        message: string;
    }
    export type OkResponse<T extends Payloads.Payload> = {
        success: true;
        payload: T;
    }
    export type Response<T extends Payloads.Payload> = ErrorResponse | OkResponse<T>;

    export function ErrorResponse(message: string): ErrorResponse {
        return { success: false, message };
    }
    export function OkResponse<T extends Payloads.Payload>(payload: T): OkResponse<T> {
        return { success: true, payload };
    }
}
