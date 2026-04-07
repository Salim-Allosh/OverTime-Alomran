const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
    const token = localStorage.getItem('token'); // Assuming token is stored here or passed
    // Ideally token should be passed or retrieved from a context, but for a simple fetch wrapper:

    const headers = {
        'Accept': 'application/json',
        ...options.headers,
    };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const res = await fetch(`${API_BASE}${path}`, config);

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`API Error [${res.status}]:`, errorText);
            throw new Error(errorText || `HTTP ${res.status}`);
        }

        // Return null for 204 No Content
        if (res.status === 204) return null;

        return res.json();
    } catch (error) {
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error(`Network error: Cannot connect to ${API_BASE}${path}`);
            throw new Error(`Cannot connect to server. Make sure backend is running.`);
        }
        throw error;
    }
}

export const http = {
    get: (path, token) => {
        // Allow passing token explicitly if needed, otherwise rely on default logic (if implemented)
        // Current system passes token explicitly to api functions.
        // We will keep the signature somewhat compatible or expect headers to be passed.
        return request(path, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    },
    post: (path, body, token, isFormData = false) => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let requestBody;

        if (isFormData) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            if (body instanceof URLSearchParams) {
                requestBody = body.toString();
            } else {
                // manual conversion if needed, but usually caller prepares it for form-data
                requestBody = body;
            }
        } else {
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(body);
        }

        return request(path, { method: 'POST', headers, body: requestBody });
    },
    patch: (path, body, token) => {
        return request(path, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });
    },
    delete: (path, token) => {
        return request(path, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    }
};
