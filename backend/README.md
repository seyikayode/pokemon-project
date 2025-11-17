PokéManager - Backend API

This is the backend service for the PokéManager application. It is a NestJS API that acts as a proxy to the public PokéAPI. It adds a persistent database layer for managing user favorites and a high-speed caching layer using Redis for improved performance.

This server is responsible for all data fetching, business logic, and persistence.

Features

PokéAPI Proxy: Provides clean endpoints for the frontend, abstracting away the public PokéAPI.

Favorite Management: Full CRUD (Create, Read, Delete) functionality for a user's favorite Pokémon.

Database Persistence: Uses a SQLite database (via TypeORM) to permanently store the list of favorites.

High-Speed Caching: Implements a Redis cache for two key areas:

The main list of 150 Pokémon to make the homepage load instantly.

Individual Pokémon details to make subsequent views instant.

Scalable Architecture: Built with Docker and Docker Compose for a reproducible and scalable production environment.

Unit Tested: Includes unit tests for the main service and controller to ensure logic is correct.

Tech Stack

Framework: NestJS

Language: TypeScript

Database: SQLite (managed with TypeORM)

Caching: Redis (managed with @nestjs/cache-manager)

Containerization: Docker & Docker Compose

Testing: Jest & @nestjs/testing

Architecture

This API is the single source of truth for the frontend.

A request comes in from the React client (e.g., GET /api/pokemon).

The PokemonController receives the request.

The PokemonController calls the PokemonService.

The PokemonService checks the Redis Cache first.

Cache Hit: If data is in the cache, it is returned instantly.

Cache Miss: The service makes an HTTP call to the public PokéAPI.

The data is processed (e.g., parsing evolutions, simplifying the list).

The processed data is saved to the Redis Cache for future requests.

The data is returned to the client.

For favorites, the service bypasses the cache and communicates directly with the SQLite database using TypeORM.

Local Setup and Testing

Prerequisites

Node.js (v18 or later)

NPM

Docker Desktop (must be running to use Redis)

1. Run Redis in Docker

Before starting the app, you must have a Redis instance running. The easiest way is with Docker:

docker run -d -p 6379:6379 --name pokemanager-redis redis:6-alpine


This will start a Redis container on port 6379.

2. Install and Run the App

Clone the repository:

git clone https://github.com/seyikayode/pokemon-backend.git
cd pokemon-backend


Install dependencies:

npm install


Create your environment file:
Copy the example file.

cp .env.example .env


Now, open the .env file and make sure the variables are correct for your local setup (the defaults in .env.example should work).

Run the application in development mode:

npm run start:dev


The API will now be running on http://localhost:3001.

How to Run Tests

Run the full Jest test suite to check all services and controllers.

npm run test


Environment Variables

These variables are required. Copy them from .env.example to a new .env file.

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



API Endpoints

GET /api/pokemon: Get the list of 150 Pokémon with basic details.

GET /api/pokemon/:name: Get full details for a single Pokémon (abilities, types, evolution).

GET /api/favorites: Get the list of all favorite Pokémon names.

POST /api/favorites: Add a Pokémon to favorites. (Body: { "name": "pikachu" })

DELETE /api/favorites/:name: Remove a Pokémon from favorites.