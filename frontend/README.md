PokeManager Frontend

A production-grade, responsive Single Page Application (SPA) for browsing and managing Pokémon. Built with React 18, TypeScript, and Vite, designed to demonstrate modern frontend architecture, optimistic UI patterns, and robust error handling.

Table of Contents

Features & Optimizations

Architecture & State Management

Tech Stack

Project Structure

Getting Started

Testing Strategy

Deployment

Features & Optimizations
#
#

1. Intelligent Data Fetching (TanStack Query)

The application moves away from manual useEffect fetching to a robust server-state management library.

Automatic Caching: Data is cached in memory for 5 minutes (staleTime). Navigating between views or searching for a previously loaded term is instant (0ms latency).

Background Refetching: Keeps data fresh without blocking the user interface.

Deduplication: Multiple components requesting the same data triggers only one network request.

2. Virtualized Infinite Scroll

Instead of traditional pagination, we use a high-performance infinite scroll.

Client-Side Windowing: The app fetches larger batches of data but only renders a subset to the DOM.

Intersection Observer: Uses a lightweight observer to detect when the user reaches the bottom of the viewport.

UX Smoothing: Includes an artificial delay (800ms) and a skeleton loader to provide visual feedback during rapid scrolling.

3. Optimistic UI Updates

We prioritize perceived performance for user interactions.

Instant Feedback: When a user clicks "Favorite", the UI updates immediately (changing the star icon) before the server responds.

Automatic Rollback: If the API call fails (e.g., network error), the UI automatically reverts to its previous state and displays an error toast.

4. Robust Error Handling

Graceful Degradation: Network failures trigger specific error UI components with "Retry" buttons, rather than crashing the app.

Empty States: Dedicated views for zero search results or empty favorite lists to guide the user.

5. Performance Tuning

Debounced Search: Input is debounced by 500ms to prevent API flooding while typing.

Skeleton Screens: Layout shift is minimized by reserving space for content before it loads.

#
#
Architecture & State Management

The application splits state into two distinct categories:

Server State (React Query)

Responsibility: Handling lists of Pokémon and individual details.

Why: This data is owned by the server (PokéAPI/Backend). It is asynchronous and potentially stale.

Implementation: useQuery hooks in PokemonList.tsx.

Client State (React Context)

Responsibility: Managing the user's list of Favorites.

Why: This is user-specific preference data that needs to be accessible globally across the component tree (Cards, Modals, Lists) to ensure UI consistency.

Implementation: FavoritesContext.tsx provides addFavorite, removeFavorite, and isFavorite methods.

#
#
Tech Stack

Category

Technology

Description

Core

React 18

Functional components & Hooks

Language

TypeScript

Strict type safety & Interfaces

Build Tool

Vite

HMR & Optimized Production Builds

Data Fetching

TanStack Query v5

Caching & Server State

HTTP Client

Axios

Promise-based HTTP requests

Routing

React Router

Client-side navigation

Styling

CSS Variables

Native, responsive styling without heavy CSS-in-JS libs

Testing

Vitest

Unit Testing

#
#
Project Structure

src/
├── api.ts                  # Centralized Axios instance & types
├── App.tsx                 # Root layout
├── main.tsx                # Entry point & Context Providers
├── components/
│   ├── PokemonList.tsx     # Main container: Search, Filter, Scroll logic
│   ├── PokemonCard.tsx     # Presentational component for grid items
│   ├── PokemonDetailModal.tsx # Overlay with full details
│   └── ...                 # CSS files per component
├── context/
    └── FavoritesContext.tsx # Global state for favorites & Optimistic UI

#
#
Getting Started

Prerequisites

Node.js v18+

Backend API running on port 3001 (See Backend README)

1. Configuration

Create a .env file in the root directory.

# Local Development
VITE_API_URL=http://localhost:3001/api
VITE_BATCH_SIZE=13


2. Installation

npm install


3. Development Server

npm run dev


The app will open at http://localhost:5173.

#
#
Testing Strategy

We use a "Testing Trophy" approach, balancing Unit and E2E tests.

Unit Tests (Vitest)

Focus on component logic and state interactions in isolation.

Mocking: We mock API responses and Context to test filtering logic and rendering states without a backend.

Run: npm run test

#
#