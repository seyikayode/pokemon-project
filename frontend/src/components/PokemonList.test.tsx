import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PokemonList from './PokemonList';
import * as Api from '../api';
import * as FavoritesContext from '../context/FavoritesContext';
import * as IntersectionObserver from 'react-intersection-observer';

const mockPokemon = [
    { id: 25, name: 'pikachu', image: 'pikachu.png' },
    { id: 1, name: 'bulbasaur', image: 'bulbasaur.png' },
    { id: 4, name: 'charmander', image: 'charmander.png' },
];

vi.mock('../api');
const mockedApi = vi.mocked(Api, true);

vi.mock('../context/FavoritesContext');
const mockedUseFavorites = vi.mocked(FavoritesContext.useFavorites);

vi.mock('react-intersection-observer');
const mockedUseInView = vi.mocked(IntersectionObserver.useInView);

describe('PokemonList', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockedApi.getPokemonList.mockResolvedValue(mockPokemon);

        mockedUseFavorites.mockReturnValue({
            favorites: new Set(),
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
            isFavorite: () => false,
        });

        mockedUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: false,
        } as any);
    });

    it('should render loading state, then display Pokemon', async () => {
        render(<PokemonList />);

        expect(screen.getByText('Loading Pokemon...')).toBeInTheDocument();

        expect(await screen.findByText('pikachu')).toBeInTheDocument();
        expect(screen.getByText('bulbasaur')).toBeInTheDocument();
        expect(screen.getByText('charmander')).toBeInTheDocument();
    });

    it('should filter Pokemon by search term', async () => {
        render(<PokemonList />);
        await screen.findByText('pikachu');

        const searchInput = screen.getByPlaceholderText('Search by name...');
        fireEvent.change(searchInput, { target: { value: 'pika' } });

        expect(screen.getByText('pikachu')).toBeInTheDocument();
        expect(screen.queryByText('bulbasaur')).not.toBeInTheDocument();
        expect(screen.queryByText('charmander')).not.toBeInTheDocument();
    });

    it('should filter Pokemon by favorites', async () => {
        mockedUseFavorites.mockReturnValue({
            favorites: new Set(['charmander']),
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
            isFavorite: (name) => name === 'charmander',
        });

        render(<PokemonList />);
        await screen.findByText('pikachu');

        const favoriteCheckbox = screen.getByLabelText('Show Favorites Only');
        fireEvent.click(favoriteCheckbox);

        expect(screen.getByText('charmander')).toBeInTheDocument();
        expect(screen.queryByText('pikachu')).not.toBeInTheDocument();
        expect(screen.queryByText('bulbasaur')).not.toBeInTheDocument();
    });

    it('should load more Pokemon on scroll', async () => {
        const largeList = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            name: `pokemon-${i + 1}`,
            image: 'img.png',
        }));
        mockedApi.getPokemonList.mockResolvedValue(largeList);

        const mockInView = vi.fn();
        mockedUseInView.mockImplementation(mockInView as any);
        mockInView.mockReturnValue({ ref: vi.fn(), inView: false });

        const { rerender } = render(<PokemonList />);
        await screen.findByText('pokemon-1');

        expect(screen.getByText('pokemon-10')).toBeInTheDocument();
        expect(screen.queryByText('pokemon-11')).not.toBeInTheDocument();
        expect(screen.getByText('Loading more Pokemon...')).toBeInTheDocument();

        mockInView.mockReturnValue({ ref: vi.fn(), inView: true });
        rerender(<PokemonList />);

        await waitFor(() => {
            expect(screen.getByText('pokemon-11')).toBeInTheDocument();
        });
        expect(screen.getByText('pokemon-20')).toBeInTheDocument();
        expect(screen.queryByText('pokemon-21')).not.toBeInTheDocument();
    });
});