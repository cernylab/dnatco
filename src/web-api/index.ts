import { Requests } from './requests';

function isErrorResponse(v: unknown): v is WebApi.ErrorResponse {
    if (typeof v !== 'object')
        return false;

    const vo = v as any;
    if (vo['success'] === undefined)
        return false;
    if (typeof vo['success'] !== 'boolean')
        return false;

    if (vo['message'] && typeof vo['message'] !== 'string')
        return false;

    return vo['success'] === false;
}

function isOkResponse<T>(v: unknown, checker: (v: unknown) => v is T): v is WebApi.OkResponse<T> {
    if (typeof v !== 'object')
        return false;

    const vo = v as any;
    if (vo['success'] === undefined || vo['payload'] === undefined)
        return false;
    if (typeof vo['success'] !== 'boolean')
        return false;

    return checker(vo['payload']);
}

export namespace WebApi {
    export type Request = Requests.Request;

    export type OkResponse<T> = {
        success: true;
        payload: T;
    }
    export function OkResponse<T>(payload: T): OkResponse<T> {
        return { success: true, payload };
    }

    export type ErrorResponse = {
        success: false;
        status: number;
        message?: string;
    }
    export function ErrorResponse(status: number, message?: string): ErrorResponse {
        return { success: false, status, message };
    }

    export type ApiResponse<T> = OkResponse<T>|ErrorResponse;

    export interface Pending {
        running: Promise<Response>;
        aborter: AbortController;
    }

    export function request(endpoint: string, req: Request): Pending {
        const url = './' + endpoint;

        const aborter = new AbortController();
        const running = fetch(
            url,
            {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'error',
                body: JSON.stringify(req),
                signal: aborter.signal,
            }
        );

        return { running, aborter };
    }

    export async function resolve<T>(pending: Pending, payloadChecker: (v: unknown) => v is T): Promise<ApiResponse<T>> {
        try {
            const resp = await pending.running;
            const json = await resp.json();

            if (isErrorResponse(json))
                return ErrorResponse(json.status, json.message);
            else if (isOkResponse<T>(json, payloadChecker))
                return json;

            return ErrorResponse(resp.status, 'Malformed response');
        } catch (e) {
            return ErrorResponse(500, (e as Error).message);
        }
    }
}
