import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPokemonList } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import PokemonCard from './PokemonCard';
import PokemonDetailModal from './PokemonDetailModal';
import { useInView } from 'react-intersection-observer';
import './PokemonList.css';

const batchSize = import.meta.env.VITE_BATCH_SIZE;
const formatBatchSize = parseInt(batchSize);

const PokemonList: React.FC = () => {
    // --- UI State ---
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);

    // --- Infinite Scroll State ---
    const [visibleCount, setVisibleCount] = useState(formatBatchSize);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });
    const { favorites } = useFavorites();

    // Debounce Search Input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setVisibleCount(formatBatchSize);// Reset scroll position on new search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // REACT QUERY: Handles fetching, caching, and loading states
    const {
        data: allPokemon = [], // Default to empty array
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['pokemonList', debouncedSearch],
        queryFn: () => getPokemonList(debouncedSearch),

        // Keep previous data while fetching new search results to prevent flickering
        placeholderData: (previousData) => previousData
    });

    // Infinite Scroll Logic
    useEffect(() => {
        if (inView && !isLoading && !showOnlyFavorites && !isLoadingMore) {
            setIsLoadingMore(true)
        }
    }, [inView, isLoading, showOnlyFavorites, isLoadingMore])

    // Handle the artificial delay for smooth scrolling
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        if (isLoadingMore) {
            timeoutId = setTimeout(() => {
                setVisibleCount((prev) => prev + formatBatchSize);
                setIsLoadingMore(false)
            }, 1500)
        }
        return () => clearTimeout(timeoutId)
    }, [isLoadingMore])

    // Filter Logic (Favorites are filtered client-side)
    const filteredPokemon = useMemo(() => {
        if (showOnlyFavorites) {
            return allPokemon.filter(p => favorites.has(p.name));
        }
        return allPokemon;
    }, [allPokemon, favorites, showOnlyFavorites]);

    // Slice the list based on infinite scroll depth
    const listToDisplay = showOnlyFavorites
        ? filteredPokemon
        : filteredPokemon.slice(0, visibleCount);

    const hasMore = !showOnlyFavorites && visibleCount < filteredPokemon.length;

    // Error UI
    if (isError) {
        return (
            <div className="error-container">
                <p className="error-msg">
                    {error instanceof Error ? error.message : 'Failed to load Pokemon.'}
                </p>
                <button className="retry-btn" onClick={() => refetch()}>
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="pokemon-list-container">
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={showOnlyFavorites}
                        onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                        disabled={isLoading}
                    />
                    Show Favorites Only
                </label>
            </div>

            {/* Loading State: Show Skeletons */}
            {isLoading && allPokemon.length === 0 ? (
                <div className="pokemon-grid">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className="pokemon-card skeleton-card">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-line title"></div>
                            <div className="skeleton-line subtitle"></div>
                        </div>
                    ))}
                </div>
            ) : listToDisplay.length > 0 ? (
                // Success State: Show Cards
                <div className="pokemon-grid">
                    {listToDisplay.map((pokemon) => (
                        <PokemonCard
                            key={pokemon.name}
                            pokemon={pokemon}
                            onCardClick={() => setSelectedPokemon(pokemon.name)}
                        />
                    ))}
                </div>
            ) : (
                // Empty State: No Results
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No Pokemon Found</h3>
                    <p>
                        {showOnlyFavorites
                            ? "You haven't added any favorites yet"
                            : `No results matching "${searchTerm}"`}
                    </p>
                    {showOnlyFavorites && (
                        <button className="reset-btn" onClick={() => setShowOnlyFavorites(false)}>
                            View All Pokemon
                        </button>
                    )}
                </div>
            )}

            {/* Infinite Scroll Loader at Bottom */}
            {!isLoading && hasMore && listToDisplay.length > 0 && (
                <div className="loader-container" ref={ref}>
                    {isLoadingMore && (
                        <>
                            <div className="spinner"></div>
                            <span>Loading more Pokemon...</span>
                        </>
                    )}
                </div>
            )}

            {selectedPokemon && (
                <PokemonDetailModal
                    pokemonName={selectedPokemon}
                    onClose={() => setSelectedPokemon(null)}
                />
            )}
        </div>
    )
};

export default PokemonList;