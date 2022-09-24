export type ErrorResult = {
    success: 'error',
    message: string;
}

export type OkResult<T> = {
    success: 'ok';
    data: T;
}

export type Result<T> = OkResult<T>|ErrorResult;

export function isError<T>(r: Result<T>): r is ErrorResult {
    return r.success === 'error';
}

export function isOk<T>(r: Result<T>): r is OkResult<T> {
    return r.success === 'ok';
}

export function ErrorResult(message: string): ErrorResult {
    return { success: 'error', message };
}

export function OkResult<T>(data: T): OkResult<T> {
    return { success: 'ok', data };
}
