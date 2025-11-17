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

git clone https://github.com/seyikayode/pokemon-frontend.git
cd pokemon-frontend


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