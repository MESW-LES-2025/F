# Concordia

A modern NestJS REST API with JWT Authentication, Prisma ORM, and PostgreSQL database.

## 🚀 Features

- **JWT Authentication** with access & refresh tokens
- **Token Revocation** with logout endpoints
- **Refresh Token Rotation** for enhanced security
- **Database-backed Token Management** (tracks and revokes tokens)
- **Prisma ORM** for type-safe database access
- **PostgreSQL** database
- **Swagger/OpenAPI** documentation
- **TypeScript** for type safety
- **bcrypt** for secure password hashing
- **Comprehensive Test Coverage**

## 📋 Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) v24 or higher
- [PostgreSQL](https://www.postgresql.org/download/) v16 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd concordia
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL Database

#### Option A: Using psql CLI

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE concordia;

# Exit psql
\q
```

#### Option B: Using pgAdmin or other GUI tools

Create a new database named `concordia`

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/concordia"

# JWT Secret 
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server Port (optional)
PORT=3000
```

**Example with default PostgreSQL setup:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/concordia"
JWT_SECRET="my-secret-key-123"
```

### 5. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev
```

### 6. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: **http://localhost:3000**

### 7. Access API Documentation

Open your browser and navigate to:
**http://localhost:3000/api/docs**

## 📚 API Endpoints

All endpoints are prefixed with `/api/v1`

## 🔐 Authentication Flow

1. **Register/Login** → Receive `access_token` and `refresh_token`
2. **Use access_token** in Authorization header: `Bearer <token>`
3. **Access token expires** in 15 minutes (900 seconds)
4. **Refresh token** stored in database and expires in 30 days
5. **Before expiration** → Use `/refresh` endpoint to get new tokens (old token is revoked)
6. **Logout** → Use `/logout` to revoke refresh token
7. **After 30 days** → User must login again

### Security Features

- **Token Rotation**: New refresh token issued on every refresh (old one revoked)
- **Token Revocation**: Tokens can be invalidated via logout endpoints
- **Database Validation**: Refresh tokens validated against database
- **Automatic Cleanup**: Expired tokens cleaned up on new token creation
- **Cascade Delete**: All user tokens deleted when user is deleted

## 🗄️ Database Management

### View Database with Prisma Studio

```bash
npx prisma studio
```

Opens GUI at: **http://localhost:5555**

### Query Database with psql

```bash
# Connect to database
psql -U postgres -d concordia

# View all tables
\dt

# Query users
SELECT * FROM "User";

# Exit
\q
```

### Reset Database

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

## 🧪 Testing

### Run Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Format code
npm run format
```

### Test Results

The test suite includes:
- **AuthService**: Registration, login, token refresh, user validation
- **AuthController**: All API endpoints
- **Unit Tests**: Fast, isolated tests with mocked dependencies

## 🐳 Docker Setup

### Run with Docker Compose

```bash
# Start all services (PostgreSQL + API)
docker-compose up -d

# View logs
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **postgres** | 5432 | PostgreSQL 16 database |
| **api** | 3000 | NestJS application |

### Access the Application

After running `docker-compose up -d`:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432

### Environment Variables for Docker

Create a `.env` file (see `.env.example`):

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=concordia

# JWT
JWT_SECRET=your-super-secret-key

# Port
PORT=3000
```

### Docker Commands

```bash
# Check running containers
docker-compose ps

# Stop services
docker-compose stop

# Start stopped services
docker-compose start

# Remove everything (containers, networks, volumes)
docker-compose down -v

# View resource usage
docker stats
```

# Test coverage
npm run test:cov
```

## 🔧 Troubleshooting

### Cannot connect to database

- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Verify database exists: `psql -U postgres -l`

### Port already in use

- Change PORT in `.env` file
- Or kill the process using the port

### Prisma errors

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate dev
```
