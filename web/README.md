# FAMS Project

## Overview

FAMS (Full-stack Application Management System) is a complete web application with frontend, Node.js backend, and Python services.

## Architecture

The application consists of:

- **Frontend**: React application
- **Backend Node.js**: API service
- **Backend Python**: ML/Data processing service
- **Nginx**: Reverse proxy handling all traffic on port 8000

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