import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FavoritesProvider } from './context/FavoritesContext.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap App with Provider */}
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </QueryClientProvider>
  </React.StrictMode>
);