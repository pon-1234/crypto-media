import { describe, it, expect } from 'vitest'
import {
  MicroCMSApiError,
  isMicroCMS404Error,
  isMicroCMSError,
  parseMicroCMSError,
} from './errors'

describe('MicroCMSApiError', () => {
  it('should create error with status and message', () => {
    const error = new MicroCMSApiError('Not found', 404, 'CONTENT_NOT_FOUND')

    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.code).toBe('CONTENT_NOT_FOUND')
    expect(error.name).toBe('MicroCMSApiError')
  })
})

describe('isMicroCMS404Error', () => {
  it('should return true for MicroCMSApiError with 404 status', () => {
    const error = new MicroCMSApiError('Not found', 404)
    expect(isMicroCMS404Error(error)).toBe(true)
  })

  it('should return false for MicroCMSApiError with non-404 status', () => {
    const error = new MicroCMSApiError('Server error', 500)
    expect(isMicroCMS404Error(error)).toBe(false)
  })

  it('should return true for Error with 404 in message', () => {
    const error = new Error('404 Not Found')
    expect(isMicroCMS404Error(error)).toBe(true)
  })

  it('should return true for Error with "not found" in message', () => {
    const error = new Error('Content not found')
    expect(isMicroCMS404Error(error)).toBe(true)
  })

  it('should return false for Error without 404 indicators', () => {
    const error = new Error('Server error')
    expect(isMicroCMS404Error(error)).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(isMicroCMS404Error(null)).toBe(false)
    expect(isMicroCMS404Error(undefined)).toBe(false)
    expect(isMicroCMS404Error('error')).toBe(false)
    expect(isMicroCMS404Error(404)).toBe(false)
  })
})

describe('isMicroCMSError', () => {
  it('should return true for MicroCMSApiError instances', () => {
    const error = new MicroCMSApiError('Error', 500)
    expect(isMicroCMSError(error)).toBe(true)
  })

  it('should return false for regular Error instances', () => {
    const error = new Error('Error')
    expect(isMicroCMSError(error)).toBe(false)
  })

  it('should return false for non-error values', () => {
    expect(isMicroCMSError(null)).toBe(false)
    expect(isMicroCMSError(undefined)).toBe(false)
    expect(isMicroCMSError('error')).toBe(false)
  })
})

describe('parseMicroCMSError', () => {
  it('should return MicroCMSApiError as-is', () => {
    const error = new MicroCMSApiError('Not found', 404, 'CONTENT_NOT_FOUND')
    const parsed = parseMicroCMSError(error)

    expect(parsed).toBe(error) // Should be the exact same instance
    expect(parsed.message).toBe('Not found')
    expect(parsed.status).toBe(404)
    expect(parsed.code).toBe('CONTENT_NOT_FOUND')
  })

  it('should parse Axios-like error with response', () => {
    const axiosError = {
      response: {
        status: 404,
        data: { message: 'Content not found' },
      },
    }

    const parsed = parseMicroCMSError(axiosError)
    expect(parsed).toBeInstanceOf(MicroCMSApiError)
    expect(parsed.status).toBe(404)
    expect(parsed.message).toBe('Content not found')
  })

  it('should handle Axios error without message', () => {
    const axiosError = {
      response: {
        status: 500,
      },
    }

    const parsed = parseMicroCMSError(axiosError)
    expect(parsed.status).toBe(500)
    expect(parsed.message).toBe('API Error')
  })

  it('should parse standard Error with status in message', () => {
    const error = new Error('404 Not Found')
    const parsed = parseMicroCMSError(error)

    expect(parsed).toBeInstanceOf(MicroCMSApiError)
    expect(parsed.status).toBe(404)
    expect(parsed.message).toBe('404 Not Found')
  })

  it('should default to 500 for Error without status', () => {
    const error = new Error('Something went wrong')
    const parsed = parseMicroCMSError(error)

    expect(parsed.status).toBe(500)
    expect(parsed.message).toBe('Something went wrong')
  })

  it('should handle unknown error types', () => {
    const parsed = parseMicroCMSError('string error')

    expect(parsed).toBeInstanceOf(MicroCMSApiError)
    expect(parsed.status).toBe(500)
    expect(parsed.message).toBe('Unknown error occurred')
  })
})
