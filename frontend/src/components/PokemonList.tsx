import React, { useState, useEffect, useMemo } from 'react';
import { type SimplePokemon, getPokemonList } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import PokemonCard from './PokemonCard';
import PokemonDetailModal from './PokemonDetailModal';
import { useInView } from 'react-intersection-observer';
import './PokemonList.css';

const batchSize = import.meta.env.VITE_BATCH_SIZE;
const formatBatchSize = parseInt(batchSize);

const PokemonList: React.FC = () => {
    const [allPokemon, setAllPokemon] = useState<SimplePokemon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);

    // state for infinite scrolling 
    const [visibleCount, setVisibleCount] = useState(formatBatchSize);
    const { ref, inView } = useInView({
        threshold: 0
    });

    const { favorites } = useFavorites();

    useEffect(() => {
        const loadPokemon = async () => {
            try {
                setLoading(true);
                const data = await getPokemonList();
                setAllPokemon(data);
            } catch (err) {
                setError('Failed to fetch Pokemon');
            } finally {
                setLoading(false);
            }
        };
        loadPokemon();
    }, []);

    useEffect(() => {
        if (inView && !loading && !searchTerm && !showOnlyFavorites) {
            setVisibleCount((prevCount) => prevCount + formatBatchSize);
        }
    }, [inView, loading, searchTerm, showOnlyFavorites]);

    const filteredPokemon = useMemo(() => {
        let list = allPokemon;

        if (showOnlyFavorites) {
            list = list.filter(pokemon => favorites.has(pokemon.name));
        };

        if (searchTerm) {
            list = list.filter(pokemon =>
                pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        };

        return list;
    }, [allPokemon, favorites, showOnlyFavorites, searchTerm]);

    const isFiltering = searchTerm || showOnlyFavorites;
    const listToDisplay = isFiltering ? filteredPokemon : filteredPokemon.slice(0, visibleCount);
    const hasMore = !isFiltering && visibleCount < filteredPokemon.length;

    if (loading && allPokemon.length === 0) return <div>Loading Pokemon...</div>;
    if (error) return <div>Error: {error}</div>;

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
                    />
                    Show Favorites Only
                </label>
            </div>

            <div className="pokemon-grid">
                {listToDisplay.map((pokemon) => (
                    <PokemonCard
                        key={pokemon.name}
                        pokemon={pokemon}
                        onCardClick={() => setSelectedPokemon(pokemon.name)}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="loader" ref={ref}>
                    Loading more Pokemon...
                </div>
            )}

            {selectedPokemon && (
                <PokemonDetailModal
                    pokemonName={selectedPokemon}
                    onClose={() => setSelectedPokemon(null)}
                />
            )}
        </div>
    );
};

export default PokemonList;