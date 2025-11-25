/**
 * API Client for xapt backend
 * Handles all HTTP requests with proper error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        throw new APIError(
          data.message || `HTTP Error ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      throw new APIError(
        error.message || 'Network error',
        0,
        { error: error.toString() }
      );
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // =================
  // Specific API methods
  // =================

  /**
   * Test connection
   */
  async testConnection() {
    return this.get('/test/');
  }

  /**
   * Echo test
   */
  async echo(data) {
    return this.post('/echo/', data);
  }

  /**
   * Get all employees
   */
  async getEmployees() {
    return this.get('/employees/');
  }

  /**
   * Get single employee
   */
  async getEmployee(id) {
    return this.get(`/employees/${id}/`);
  }

  /**
   * Calculate operation
   */
  async calculate(operation, a, b) {
    return this.post('/calculate/', { operation, a, b });
  }

  /**
   * Execute SQL query
   */
  async executeSQL(query) {
    return this.post('/sql/execute/', { query });
  }

  /**
   * Get list of tables
   */
  async getTables() {
    return this.get('/sql/tables/');
  }

  /**
   * Get columns for a specific table
   */
  async getTableColumns(tableName) {
    return this.get(`/sql/tables/${tableName}/columns/`);
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;
export { APIError };
