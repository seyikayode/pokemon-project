import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PokemonList from './PokemonList';
import * as Api from '../api';
import * as FavoritesContext from '../context/FavoritesContext';
import * as IntersectionObserver from 'react-intersection-observer';

vi.mock('../api');
const mockedApi = vi.mocked(Api, true);

// Mock Favorites Context
vi.mock('../context/FavoritesContext');
const mockedUseFavorites = vi.mocked(FavoritesContext.useFavorites)

vi.mock('react-intersection-observer');
const mockedUseInView = vi.mocked(IntersectionObserver.useInView)

// Mock Data
const mockPokemonList = [
    { id: 1, name: 'bulbasaur', image: 'bulbasaur.png' },
    { id: 4, name: 'charmander', image: 'charmander.png' },
    { id: 7, name: 'squirtle', image: 'squirtle.png' }
];

// Helper to wrap component with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
};

describe('PokemonList', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockedApi.getPokemonList.mockResolvedValue(mockPokemonList);

        mockedUseFavorites.mockReturnValue({
            favorites: new Set(),
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
            isFavorite: () => false
        });

        mockedUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: false,
        } as any)
    });

    it('should render skeletons initially, then display Pokemon', async () => {
        render(<PokemonList />, { wrapper: createWrapper() })

        // Expect Skeletons initially (loading state)
        const skeletons = document.getElementsByClassName('skeleton-card');
        expect(skeletons.length).toBeGreaterThan(0)

        //  Wait for data to resolve
        await waitFor(() => {
            expect(screen.getByText('bulbasaur')).toBeInTheDocument()
        })
        expect(screen.getByText('charmander')).toBeInTheDocument()
        expect(screen.getByText('squirtle')).toBeInTheDocument()
    });

    it('should filter Pokemon by search term (debounced)', async () => {
        render(<PokemonList />, { wrapper: createWrapper() })
        await waitFor(() => expect(screen.getByText('bulbasaur')).toBeInTheDocument())

        // Type in search box
        const searchInput = screen.getByPlaceholderText('Search by name...')
        fireEvent.change(searchInput, { target: { value: 'char' } })

        // React Query will fetch again with the new search term
        // We need to mock the API returning the filtered result
        mockedApi.getPokemonList.mockResolvedValue([mockPokemonList[1]])
        await waitFor(() => {
            expect(mockedApi.getPokemonList).toHaveBeenCalledWith('char');
        }, { timeout: 2000 })

        expect(screen.getByText('charmander')).toBeInTheDocument()
        expect(screen.queryByText('bulbasaur')).not.toBeInTheDocument()
    })

    it('should show empty state when no pokemon found', async () => {
        mockedApi.getPokemonList.mockResolvedValue([]);

        render(<PokemonList />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText(/No Pokemon Found/i)).toBeInTheDocument();
        })
    })

    it('should filter by favorites on the client side', async () => {
        mockedUseFavorites.mockReturnValue({
            favorites: new Set(['squirtle']),
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
            isFavorite: (name) => name === 'squirtle'
        });

        render(<PokemonList />, { wrapper: createWrapper() })
        await waitFor(() => expect(screen.getByText('bulbasaur')).toBeInTheDocument())

        const checkbox = screen.getByLabelText('Show Favorites Only');
        fireEvent.click(checkbox)

        expect(screen.getByText('squirtle')).toBeInTheDocument();
        expect(screen.queryByText('bulbasaur')).not.toBeInTheDocument();
    })

    it('should display error state and retry button on failure', async () => {
        mockedApi.getPokemonList.mockRejectedValue(new Error('Network Error'))

        render(<PokemonList />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('Network Error')).toBeInTheDocument()
        })

        const retryBtn = screen.getByText('Try Again');
        expect(retryBtn).toBeInTheDocument()

        mockedApi.getPokemonList.mockResolvedValue(mockPokemonList)
        fireEvent.click(retryBtn)

        await waitFor(() => {
            expect(screen.getByText('bulbasaur')).toBeInTheDocument()
        })
    })
});