import React from 'react';
import { type SimplePokemon } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import './PokemonCard.css';

interface Props {
    pokemon: SimplePokemon;
    onCardClick: () => void;
};

const PokemonCard: React.FC<Props> = ({ pokemon, onCardClick }) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const isFav = isFavorite(pokemon.name);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFav) {
            removeFavorite(pokemon.name);
        } else {
            addFavorite(pokemon.name);
        };
    };

    return (
        <div className="pokemon-card" onClick={onCardClick}>
            <button
                className={`favorite-btn ${isFav ? 'active' : ''}`}
                onClick={handleFavoriteClick}
            >
                {isFav ? '★' : '☆'}
            </button>
            <img src={pokemon.image} alt={pokemon.name} />
            <h3>{pokemon.name}</h3>
            <span className="pokemon-id">#{pokemon.id.toString().padStart(3, '0')}</span>
        </div>
    );
};

export default PokemonCard;