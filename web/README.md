# FAMS Web Application

## Setup Instructions

To deploy the web application:

1. Run `docker-compose up -d` to start all containers
2. Access the application at http://localhost

## Login Instructions

The default admin account credentials are:

- Username: `admin`
- Password: `1234`

## Troubleshooting Network Error

If you encounter "Network Error" in the frontend when trying to log in, this is typically a Docker networking issue. Here's how to fix it:

### Common Issues

1. **Docker Network Resolution**: Inside Docker containers, `localhost` refers to the container itself, not the host machine or other containers.

2. **API URL Configuration**: The frontend should be configured to access the API using Docker service names:
   ```
   http://nginx:80/api            # Preferred approach using nginx proxy
   http://api-nodejs:3000/api     # Direct to API container
   ```

3. **Environment Variables Setup**:
   - In `docker-compose.yml`, set:
     ```
     - REACT_APP_API_URL=http://nginx:80/api
     - REACT_APP_PYTHON_API_URL=http://nginx:80/api-python
     ```
   - In `frontend/Dockerfile.dev`, set:
     ```
     ENV REACT_APP_API_URL=http://nginx:80/api
     ```

### Fix Steps

1. Update the API URL in both `docker-compose.yml` and `Dockerfile.dev`
2. Update the frontend code to fall back to a working URL in `frontend/src/services/api.ts`:
   ```
   const DOCKER_FALLBACK_URL = 'http://nginx:80/api';
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL || DOCKER_FALLBACK_URL,
     ...
   });
   ```
3. Restart the containers: `docker-compose down && docker-compose up -d`

## Container Overview

- **Frontend**: React application accessible at http://localhost:3000
- **API-NodeJS**: Main backend API at http://localhost:3002/api
- **API-Python**: Python backend services at http://localhost:3001/api
- **MongoDB**: Database backend at mongodb://localhost:27017
- **Mongo-Express**: MongoDB admin panel at http://localhost:8081
- **Nginx**: Reverse proxy handling routing at http://localhost

## Overview

FAMS (Faculty Administration Management System) is a complete web application with frontend, Node.js backend, and Python services.

## Architecture

The application consists of:

- **Frontend**: React application built with TypeScript
- **Backend Node.js**: Express API service for core functionality
- **Backend Python**: FastAPI service for additional features
- **MongoDB**: NoSQL database for data storage
- **Nginx**: Reverse proxy for routing

## Prerequisites

- Docker and Docker Compose
- Git

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Configure environment variables:
   - Create `.env` files in both backend directories:
     - `backend/NodeJS-services/.env`
     - `backend/Python-services/.env`

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - http://localhost:8000

## SSL and Domain Configuration

For SSL certificates and domain configuration, see the [Nginx README](./nginx/README.md).

## Development

### Starting Development Environment

```bash
docker-compose up
```

### Stopping Development Environment

```bash
docker-compose down
```

### Accessing Service Logs

```bash
docker-compose logs -f <service-name>
```

Available services:
- `frontend`
- `backend-nodejs`
- `backend-python`
- `nginx`

### Testing API Connectivity

You can test API connectivity using the included test scripts:
```bash
docker exec -it fams_frontend sh -c "cd /app && node final-test.js"
```

## Production Deployment

For production deployment:

1. Update the Nginx configuration to use your domain and SSL certificates.

2. Configure your DNS to point to your server's IP address.

3. Deploy with production mode:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Troubleshooting

If you encounter issues:

1. Check the logs:
   ```bash
   docker-compose logs -f
   ```

2. Ensure all services are running:
   ```bash
   docker-compose ps
   ```

3. Restart a specific service:
   ```bash
   docker-compose restart <service-name>
   ```

## Domain Name Access

When accessing the application through a domain name (e.g., http://fams.io.vn), follow these guidelines:

### API URL Configuration

1. **Use Relative URLs in the Browser**
   - Set frontend API URLs to use relative paths:
     ```
     REACT_APP_API_URL=/api
     REACT_APP_PYTHON_API_URL=/api-python
     ```
   - This ensures that API requests are sent to the same domain that serves the frontend

2. **Configure the frontend API service to detect the environment**:
   ```javascript
   // In frontend/src/services/api.ts
   const getBaseUrl = () => {
     // When accessed through a domain, use relative path
     if (typeof window !== 'undefined' && window.location.host) {
       return '/api';
     }
     // Inside Docker container - fallback to nginx service name
     return 'http://nginx:80/api';
   };
   ```

3. **Nginx Configuration**
   - Make sure your nginx configuration includes the domain name in server_name:
     ```nginx
     server {
       listen 80;
       listen [::]:80;
       server_name localhost fams.io.vn;
       # ...
     }
     ```

### Common Domain Access Errors

1. **Network Error**: If you're getting "Network Error" in the browser console when accessing via a domain:
   - Check if you're using container names like `nginx` in URLs instead of relative paths
   - Ensure your API requests use relative paths when accessed from a browser

2. **CORS Issues**: If seeing CORS errors:
   - Verify the backend's CORS configuration allows your domain
   - Ensure your nginx configuration is passing the proper headers 