/**
 * API Helper Utilities
 * Centralized HTTP request methods for making API calls
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
import { startLoading, stopLoading } from "@/contexts/LoadingStore";

// Request deduplication: track in-flight requests to prevent duplicate calls
const pendingRequests = new Map();

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token
 */
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Create a unique key for request deduplication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {string} Unique key
 */
const getRequestKey = (url, options = {}) => {
  const method = options.method || 'GET';
  // For GET requests, body is typically empty, so we just use method and URL
  // For other methods, we'd include body but deduplication is disabled for non-GET anyway
  return `${method}:${url}`;
};

/**
 * Build headers for API requests
 * @param {Object} customHeaders - Custom headers to merge
 * @param {boolean} includeAuth - Whether to include authentication token
 * @returns {Object} Headers object
 */
const buildHeaders = (customHeaders = {}, includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch API response
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} API error with message
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  // Parse response body
  const data = isJson ? await response.json() : await response.text();

  // Handle successful responses
  if (response.ok) {
    return data;
  }

  // Handle error responses
  const errorMessage = isJson && data.message
    ? data.message
    : `HTTP Error ${response.status}: ${response.statusText}`;

  const error = new Error(errorMessage);
  error.status = response.status;
  error.data = data;
  throw error;
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Check for request deduplication (only for GET requests to avoid side effects)
  const requestKey = getRequestKey(url, options);
  const skipDeduplication = options.skipDeduplication || options.method !== 'GET';
  
  if (!skipDeduplication && pendingRequests.has(requestKey)) {
    // Return the existing promise instead of making a duplicate request
    return pendingRequests.get(requestKey);
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const showLoader = options.showLoader !== false;
      if (showLoader && typeof window !== 'undefined') startLoading();
      
      const response = await fetch(url, {
        ...options,
        headers: buildHeaders(options.headers, options.includeAuth !== false),
      });
      
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      // Network errors or other fetch failures
      if (!error.status) {
        error.message = 'Network error. Please check your connection.';
      }
      throw error;
    } finally {
      if (typeof window !== 'undefined') stopLoading();
      // Remove from pending requests after completion
      if (!skipDeduplication) {
        pendingRequests.delete(requestKey);
      }
    }
  })();

  // Store the promise for deduplication
  if (!skipDeduplication) {
    pendingRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiPost = async (endpoint, data = {}, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiPut = async (endpoint, data = {}, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiPatch = async (endpoint, data = {}, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Upload file with FormData
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - FormData object with file
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response data
 */
export const apiUpload = async (endpoint, formData, options = {}) => {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
      ...options,
    });

    return await handleResponse(response);
  } catch (error) {
    if (!error.status) {
      error.message = 'Network error. Please check your connection.';
    }
    throw error;
  }
};

// Default export
export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
  upload: apiUpload,
};
