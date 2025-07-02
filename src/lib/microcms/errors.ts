/**
 * @doc microCMS error handling utilities
 * @issue Gemini review recommendation - Better error handling
 */

/**
 * microCMS API error class
 */
export class MicroCMSApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'MicroCMSApiError'
  }
}

/**
 * Check if error is a microCMS 404 error
 */
export function isMicroCMS404Error(error: unknown): boolean {
  if (error instanceof MicroCMSApiError) {
    return error.status === 404
  }
  
  // Fallback for microCMS SDK errors
  if (error instanceof Error) {
    // Check for common 404 patterns in error messages
    const message = error.message.toLowerCase()
    return (
      message.includes('404') ||
      message.includes('not found') ||
      message.includes('content not found')
    )
  }
  
  return false
}

/**
 * Check if error is a microCMS API error
 */
export function isMicroCMSError(error: unknown): error is MicroCMSApiError {
  return error instanceof MicroCMSApiError
}

/**
 * Parse microCMS error response
 */
export function parseMicroCMSError(error: unknown): MicroCMSApiError {
  // If it's already a MicroCMSApiError, return it as-is
  if (error instanceof MicroCMSApiError) {
    return error
  }
  
  // Handle Axios-like errors with response property
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response
  ) {
    const response = error.response as { status: number; data?: { message?: string } }
    return new MicroCMSApiError(
      response.data?.message || 'API Error',
      response.status
    )
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Try to extract status from error message
    const statusMatch = error.message.match(/(\d{3})/)
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 500
    
    return new MicroCMSApiError(error.message, status)
  }

  // Fallback for unknown errors
  return new MicroCMSApiError('Unknown error occurred', 500)
}