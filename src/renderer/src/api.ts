// src/api.ts
const BASE_URL = "http://127.0.0.1:8000"; 

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
}
function toFormData(data: { [key: string]: string }): FormData {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    return formData;
  }


  async function apiRequest<T>(endpoint: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
    const { headers, body } = options;
    const token = localStorage.getItem('token');
    
    const isFormData = body instanceof FormData;
  
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        ...headers,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }), // Don't override 'Content-Type' if sending form data
      },
      body: isFormData ? body : JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status} response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    return await response.json();
  }
export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) => apiRequest<T>(endpoint, 'GET', { headers }),
  post: <T>(endpoint: string, body: any, headers?: Record<string, string>) => apiRequest<T>(endpoint, 'POST', { body, headers }),
  put: <T>(endpoint: string, body: any, headers?: Record<string, string>) => apiRequest<T>(endpoint, 'PUT', { body, headers }),
  delete: <T>(endpoint: string, headers?: Record<string, string>) => apiRequest<T>(endpoint, 'DELETE', { headers }),
};

export const auth = {
    login: (username: string, password: string) => {
      const formData = toFormData({ username, password });
      return apiRequest<{ access_token: string }>('/token', 'POST', {
        headers: {
          // Omitting 'Content-Type' header because the browser will automatically 
          // set 'Content-Type' to 'multipart/form-data' for FormData.
        },
        body: formData,
      });
    },
  };