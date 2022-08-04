// TODO: It will make much more sense to have this elsewhere
// but since we currently do not have any other use for this
// we define it here

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

    return true;
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
    export namespace Requests {
        export type Search = {
            type: 'search',
            NtC: string;
            maxCount: number;
            redundant: boolean;
            large: boolean;
        }
    }
    export type Request = Requests.Search;

    export type OkResponse<T> = {
        success: true;
        payload: T;
    }
    export function OkResponse<T>(payload: T): OkResponse<T> {
        return { success: true, payload };
    }

    export type ErrorResponse = {
        success: false;
        message?: string;
    }
    export function ErrorResponse(message?: string): ErrorResponse {
        return { success: false, message };
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
            if (!resp.ok)
                return ErrorResponse(resp.statusText);
            const json = await resp.json();

            if (isErrorResponse(json))
                return json;
            else if (isOkResponse<T>(json, payloadChecker))
                return json;
            return ErrorResponse('Unknown response');
        } catch (e) {
            return ErrorResponse((e as Error).message);
        }
    }
}
