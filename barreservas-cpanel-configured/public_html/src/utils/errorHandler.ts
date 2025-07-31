export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export const handleAPIError = (error: any): APIError => {
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR'
    };
  }

  if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<')) {
    return {
      message: 'Server configuration error. Please try again later.',
      status: error.response.status,
      code: 'HTML_RESPONSE'
    };
  }

  if (error.response.data?.error) {
    return {
      message: error.response.data.error,
      status: error.response.status,
      code: error.response.data.code
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    status: error.response?.status,
    code: 'UNKNOWN_ERROR'
  };
};