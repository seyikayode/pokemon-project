PokeManager Backend API

The high-performance backend service for the PokéManager application. Built with NestJS, it provides a robust, cached, and rate-limited API for managing Pokémon data and user favorites.

#
#
Features

Read-Through Caching Strategy: Implements Redis to cache API responses from the external PokéAPI.

List Cache: Caches the main 150 Pokémon list for 1 hour.

Detail Cache: Caches individual Pokémon details for 1 hour.

Impact: Reduces response time from ~600ms (external API) to ~15ms (Redis hit).

Optimized Persistence: Uses SQLite with TypeORM for managing user favorites.

Includes database indexing on the name column for O(1) lookup speeds.

Security & Stability:

Rate Limiting: Limits users to 100 requests/minute via @nestjs/throttler.

Validation: Uses class-validator DTOs to sanitize all incoming payloads.

Error Handling: Catches external 404/500 errors and maps them to user-friendly NestJS exceptions.

Server-Side Search: Implements efficient filtering logic on the server to reduce payload size.

#
#
Tech Stack

Framework: NestJS (TypeScript)

Database: SQLite (TypeORM)

Caching: Redis (via Docker)

Testing: Jest (Unit & Integration), Supertest

Containerization: Docker & Docker Compose

#
#
Architecture

The backend follows a layered architecture:

Controller (PokemonController): Handles HTTP requests, validates DTOs, and manages Rate Limiting guards.

Service (PokemonService): Contains the business logic.

Checks Redis Cache first.

If cache miss, fetches from external API using HttpService.

Parses complex Evolution Chains into flat arrays.

Interacts with SQLite for Favorites.

Data Layer:

TypeORM: Manages the Favorite entity.

Redis: Stores temporary API responses.

#
#
Getting Started

Prerequisites

Node.js v18+

Docker Desktop (required for Redis)

1. Start Redis

Use the included Docker Compose file to spin up Redis (and the app in production). For local dev, you can just run Redis:

docker run -d -p 6379:6379 --name pokemanager-redis redis:6-alpine


2. Environment Variables

Create a .env file in the root directory:

# Application
PORT=3001
CLIENT_URL=http://localhost:3000

# Database
DATABASE_PATH=db/favorites.db

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
POKEMON_LIST_CACHE_KEY=pokemon_list_150

# External APIs
POKEAPI_URL=https://pokeapi.co/api/v2
POKEMON_IMAGE_URL=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon
POKEMON_OFFICIAL_IMAGE_URL=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork


3. Run the Application

npm install
npm run start:dev


The server will start on http://localhost:3001.

🧪 Testing

The project includes comprehensive testing strategies:

Unit Tests: Verify individual services and controllers.

npm run test