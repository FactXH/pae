import React, { useState } from 'react';
import apiClient, { APIError } from '../services/apiClient';
import './ApiTestComponent.css';

const ApiTestComponent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRequest = async (requestFn, label) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await requestFn();
      setResult({ label, data, success: true });
    } catch (err) {
      if (err instanceof APIError) {
        setError({
          label,
          message: err.message,
          status: err.status,
          data: err.data,
        });
      } else {
        setError({
          label,
          message: err.message,
          status: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      label: 'Test Connection',
      fn: () => apiClient.testConnection(),
    },
    {
      label: 'Echo Test (POST)',
      fn: () => apiClient.echo({ message: 'Hello from React!', timestamp: new Date().toISOString() }),
    },
    {
      label: 'Get Employees',
      fn: () => apiClient.getEmployees(),
    },
    {
      label: 'Calculate (Add)',
      fn: () => apiClient.calculate('add', 15, 7),
    },
    {
      label: 'Calculate (Divide)',
      fn: () => apiClient.calculate('divide', 20, 4),
    },
  ];

  return (
    <div className="api-test-container">
      <h2>API Test Panel</h2>
      <p className="description">
        Test the connection between React frontend and Django backend
      </p>

      <div className="test-buttons">
        {tests.map((test, index) => (
          <button
            key={index}
            onClick={() => handleRequest(test.fn, test.label)}
            disabled={loading}
            className="test-button"
          >
            {test.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {result && (
        <div className="result success">
          <h3>✅ Success: {result.label}</h3>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="result error">
          <h3>❌ Error: {error.label}</h3>
          <p><strong>Status:</strong> {error.status}</p>
          <p><strong>Message:</strong> {error.message}</p>
          {error.data && (
            <pre>{JSON.stringify(error.data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTestComponent;
