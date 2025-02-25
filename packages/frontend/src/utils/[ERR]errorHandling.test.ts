import { handleError, isNetworkError, formatErrorMessage } from '../../utils/[ERR]errorHandling'

describe('Error Handling Utils', () => {
  describe('handleError', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Failed to fetch data')
      const result = handleError(networkError)
      expect(result).toEqual({
        message: 'Network error occurred. Please check your connection.',
        type: 'network',
        severity: 'error'
      })
    })

    it('should handle validation errors', () => {
      const validationError = new Error('Invalid input')
      validationError.name = 'ValidationError'
      const result = handleError(validationError)
      expect(result).toEqual({
        message: 'Invalid input',
        type: 'validation',
        severity: 'warning'
      })
    })

    it('should handle auth errors', () => {
      const authError = new Error('Authentication failed')
      authError.name = 'AuthError'
      const result = handleError(authError)
      expect(result).toEqual({
        message: 'Authentication failed. Please log in again.',
        type: 'auth',
        severity: 'error'
      })
    })

    it('should handle unknown errors', () => {
      const unknownError = new Error('Some error')
      const result = handleError(unknownError)
      expect(result).toEqual({
        message: 'An unexpected error occurred.',
        type: 'unknown',
        severity: 'error'
      })
    })
  })

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      const networkError = new Error('Failed to fetch data')
      expect(isNetworkError(networkError)).toBe(true)
    })

    it('should identify offline errors', () => {
      const offlineError = new Error('Network offline')
      expect(isNetworkError(offlineError)).toBe(true)
    })

    it('should return false for non-network errors', () => {
      const otherError = new Error('Some other error')
      expect(isNetworkError(otherError)).toBe(false)
    })
  })

  describe('formatErrorMessage', () => {
    it('should format error messages for display', () => {
      const error = new Error('Test error')
      expect(formatErrorMessage(error)).toBe('Error: Test error')
    })

    it('should handle errors without messages', () => {
      const error = new Error()
      expect(formatErrorMessage(error)).toBe('An unknown error occurred')
    })
  })
}) 