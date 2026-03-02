import { $ZodIssue } from 'zod/v4/core'

export type ApiOkResponse<T> = {
  success: true
  data: T
  ts: number
}

export type ApiNokResponse = {
  success: false
  errors: { code: string; message: string; details?: unknown }[]
  ts: number
}

export type ApiResponse = ApiOkResponse<any> | ApiNokResponse

export class ApiError extends Error {
  constructor(
    public errors: ApiNokResponse['errors'],
    public code: number,
  ) {
    super(errors[0].message)
  }
}

export const createOkResponse = <T>(data: T): ApiOkResponse<T> => {
  return {
    success: true,
    data,
    ts: Date.now(),
  }
}

export const createNokResponse = (errors: ApiNokResponse['errors']): ApiNokResponse => {
  return {
    success: false,
    errors,
    ts: Date.now(),
  }
}

export const createNotFoundError = (message: string = 'Not found') => {
  return createNokResponse([{ code: 'not_found', message }])
}

export const createZodErrorResponse = (issues: $ZodIssue[]): ApiNokResponse => {
  return {
    success: false,
    errors: issues.map((issue) => ({
      code: 'validation_error',
      message: issue.message,
      details: {
        path: issue.path,
        code: issue.code,
      },
    })),
    ts: Date.now(),
  }
}
