# API Utilities

This folder contains utilities for making authenticated API requests with automatic token refresh.

## Usage

### Import the utilities

```javascript
import { fetchWithAuth, apiGet, apiPost, apiPatch, apiDelete, refreshAccessToken } from "../utils/api";
```

### Using fetchWithAuth (manual)

```javascript
// GET request
const response = await fetchWithAuth("http://localhost:3000/api/users/me");
const data = await response.json();

// POST request
const response = await fetchWithAuth("http://localhost:3000/api/message/send/123", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ content: "Hello!" }),
});
```

### Using convenience methods (recommended)

```javascript
// GET request
const response = await apiGet("/users/me");
const data = await response.json();

// POST request
const response = await apiPost("/message/send/123", { content: "Hello!" });

// PATCH request
const response = await apiPatch("/users/me/updateprofile", { firstName: "John" });

// DELETE request
const response = await apiDelete("/messages/123");
```

## How it works

1. **Automatic token refresh**: When a request returns 401 (Unauthorized), the utility automatically:

   - Calls `POST /api/auth/refresh-token` with the refresh token
   - Saves the new access token to localStorage
   - Retries the original request with the new token

2. **Concurrent request handling**: If multiple requests fail with 401 at the same time, only one refresh token request is made. Other requests wait and use the refreshed token.

3. **Automatic logout**: If refresh token fails or is missing, the user is automatically redirected to `/login` and tokens are cleared.

## Backend Requirements

Your backend must have this endpoint:

```javascript
POST /api/auth/refresh-token
Body: { refreshtoken: "your-refresh-token" }
Response: { message: "...", accesstoken: "new-access-token" }
```

## Example: Full Component

```javascript
import React, { useState, useEffect } from "react";
import { apiGet, apiPost } from "../utils/api";

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiGet("/users/me");
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      const response = await apiPost("/some/endpoint", formData);
      const json = await response.json();
      // Handle success
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  return <div>...</div>;
}
```

## Error Handling

The utility handles these scenarios:

- ✅ 401 (Unauthorized) - Automatically refreshes token and retries
- ✅ Invalid/expired refresh token - Redirects to login
- ✅ Network errors - Throws error for component to handle
- ✅ Concurrent 401s - Queues requests until token is refreshed
