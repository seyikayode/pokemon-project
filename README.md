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

<!-- git clone https://github.com/seyikayode/pokemon-backend.git
cd pokemon-backend -->
git clone https://github.com/seyikayode/pokemon-project.git
cd pokemon-project/pokemon-backend


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




#
#
#
#
#
#
#

PokéManager - Frontend

This is the frontend client for the PokéManager application. It is a responsive single-page application built with React and Vite that allows users to browse and manage their favorite Pokémon.

This application is purely a client. It is 100% stateless and relies on the backend API for all data fetching and persistence.

Features

Virtual Infinite Scrolling: Fetches all 150 Pokémon at once (from the fast backend cache) but renders only the visible ones, allowing for smooth scrolling without pagination.

Detailed Modals: Users can click any Pokémon to view a modal with its types, abilities, and full evolution chain.

Client-Side Search: A live search bar filters the Pokémon list instantly.

Favorite Filtering: A checkbox allows users to see only their favorited Pokémon.

Persistent Favorites: Users can add or remove Pokémon from their favorites. This state is managed through React Context and synced with the backend API, so it persists between sessions.

Responsive Design: The application is usable on all devices, from mobile phones to desktops.

Unit Tested: Includes unit tests for the main PokemonList component to verify filtering and API mocking.

Tech Stack

Framework: React 18

Bundler: Vite

Language: TypeScript

Styling: CSS Modules (plain CSS)

State Management: React Context

API Client: Axios

Infinite Scroll: react-intersection-observer

Testing: Vitest & React Testing Library

Architecture

This application is built around a central PokemonList component which handles all major logic:

Data Fetching: On load, it calls the getPokemonList function from src/api.ts to fetch the main list.

Filtering: useMemo hooks are used to create the list of Pokémon to display. This list is derived from the main list and filtered by the searchTerm and showOnlyFavorites states.

State Management: The global list of favorites is managed in FavoritesContext. When a user clicks a "favorite" button, the context calls the backend API and updates its own state, causing the app to re-render.

Virtual Scrolling: The useInView hook tracks a "loader" element at the bottom of the list. When it becomes visible, the component increases the visibleCount state, which slices a larger portion of the main list to be rendered.

API Abstraction: All axios calls are kept in a single src/api.ts file. This file reads its base URL from the environment variables, making it easy to switch between local and production backends.

Local Setup and Testing

Prerequisites

Node.js (v18 or later)

NPM

The backend API must be running locally (on http://localhost:3001) before starting the frontend.

1. Install and Run the App

Clone the repository:

<!-- git clone https://github.com/seyikayode/pokemon-frontend.git
cd pokemon-frontend -->
git clone https://github.com/seyikayode/pokemon-project.git
cd pokemon-project/pokemon-frontend


Install dependencies:

npm install


Create your environment file:
Copy the example file.

cp .env.example .env


The default VITE_API_URL points to http://localhost:3001/api, which is correct for local development.

Run the application in development mode:

npm run dev


The application will now be running on http://localhost:5137.

How to Run Tests

Run the full Vitest test suite to check all components.

npm run test


Environment Variables

These variables are required. Copy them from .env.example to a new .env file.

# The full URL to the backend API
VITE_API_URL=http://localhost:3001/api
VITE_BATCH_SIZE=10