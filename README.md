# Legal System API

A Node.js/Express REST API for a legal management system with user authentication.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Input validation
- CORS and security headers (Helmet)
- MongoDB database integration with Mongoose
- Error handling middleware
- Request logging with Morgan

## Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware (auth, etc.)
├── models/          # Mongoose models
├── routes/          # API routes
├── validators/      # Input validation
└── server.js        # Application entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

| Method | Endpoint       | Description           |
|--------|---------------|-----------------------|
| POST   | /api/auth/register | Register a new user |
| POST   | /api/auth/login    | Login user          |
| GET    | /               | Health check         |

### Example Requests

**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

## License

ISC
