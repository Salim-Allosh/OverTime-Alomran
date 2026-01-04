const API_BASE = "http://localhost:8000";

export async function apiPost(path, body, token) {
  // Special handling for login endpoint - it requires form-data
  const isLogin = path === "/auth/login";

  const headers = {
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  let requestBody;
  if (isLogin) {
    // For login, send as form-data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("username", body.username);
    formData.append("password", body.password);
    requestBody = formData.toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    // For other endpoints, send as JSON
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: requestBody
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Error [${res.status}]:`, errorText);
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function apiGet(path, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error [${res.status}]:`, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return res.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`Network error: Cannot connect to ${API_BASE}${path}`);
      console.error('Make sure the backend server is running on port 8000');
      throw new Error(`Cannot connect to server. Make sure backend is running on ${API_BASE}`);
    }
    throw error;
  }
}

export async function apiDelete(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

export async function apiPatch(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

