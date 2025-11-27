/**
 * API Client for xapt backend
 * Handles all HTTP requests with proper error handling
 * Automatically detects the best available API endpoint
 */

// Possible API base URLs to try (in order of preference)
const POSSIBLE_API_URLS = [
  'http://127.0.0.1:8000/api',
  'http://127.0.0.1:8001/api',
  'https://orange-giggle-4j6x7rr4gg5gcjx5r-8000.app.github.dev/api',
];

let detectedBaseURL = null;

/**
 * Test if an API URL is accessible
 */
async function testAPIURL(baseURL) {
  try {
    const response = await fetch(`${baseURL}/test/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Detect the best working API URL
 */
async function detectBestAPIURL() {
  if (detectedBaseURL) {
    return detectedBaseURL;
  }

  // Try from .env first if available
  const envURL = process.env.REACT_APP_API_URL;
  if (envURL) {
    const works = await testAPIURL(envURL);
    if (works) {
      detectedBaseURL = envURL;
      console.log(`✓ Using API URL from env: ${envURL}`);
      return detectedBaseURL;
    }
  }

  // Try each URL in order
  for (const url of POSSIBLE_API_URLS) {
    const works = await testAPIURL(url);
    if (works) {
      detectedBaseURL = url;
      console.log(`✓ Detected working API URL: ${url}`);
      return detectedBaseURL;
    }
  }

  // Fallback to first URL if none work
  detectedBaseURL = POSSIBLE_API_URLS[0];
  console.warn(`⚠ No working API URL detected, using fallback: ${detectedBaseURL}`);
  return detectedBaseURL;
}

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

class APIClient {
  constructor(baseURL = null) {
    this.baseURL = baseURL;
    this.initialized = false;
  }

  /**
   * Ensure API URL is detected before making requests
   */
  async ensureInitialized() {
    if (!this.initialized) {
      this.baseURL = await detectBestAPIURL();
      this.initialized = true;
    }
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    await this.ensureInitialized();
    
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
   * @param {string} query - SQL query to execute
   * @param {string} database - Database to query ('sqlite', 'postgres', 'trino', 'athena')
   */
  async executeSQL(query, database = 'trino') {
    return this.post('/sql/execute/', { query, database });
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

  // =================
  // Query & View Management
  // =================

  /**
   * Get all queries
   */
  async getQueries() {
    return this.get('/queries/');
  }

  /**
   * Get single query
   */
  async getQuery(id) {
    return this.get(`/queries/${id}/`);
  }

  /**
   * Create query
   */
  async createQuery(data) {
    return this.post('/queries/', data);
  }

  /**
   * Update query
   */
  async updateQuery(id, data) {
    return this.put(`/queries/${id}/`, data);
  }

  /**
   * Delete query
   */
  async deleteQuery(id) {
    return this.delete(`/queries/${id}/`);
  }

  /**
   * Get all query views
   */
  async getQueryViews() {
    return this.get('/query-views/');
  }

  /**
   * Get single query view
   */
  async getQueryView(id) {
    return this.get(`/query-views/${id}/`);
  }

  /**
   * Get query view by name
   */
  async getQueryViewByName(name) {
    return this.get('/query-views/by_name/', { name });
  }

  /**
   * Create query view
   */
  async createQueryView(data) {
    return this.post('/query-views/', data);
  }

  /**
   * Update query view
   */
  async updateQueryView(id, data) {
    return this.put(`/query-views/${id}/`, data);
  }

  /**
   * Delete query view
   */
  async deleteQueryView(id) {
    return this.delete(`/query-views/${id}/`);
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;
export { APIError };
