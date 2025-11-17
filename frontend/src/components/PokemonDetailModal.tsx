import React, { useState, useEffect } from 'react';
import { type DetailedPokemon, getPokemonDetails } from '../api';
import './PokemonDetailModal.css';

interface Props {
    pokemonName: string;
    onClose: () => void;
};

const PokemonDetailModal: React.FC<Props> = ({ pokemonName, onClose }) => {
    const [details, setDetails] = useState<DetailedPokemon | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetails = async () => {
            setLoading(true);
            const data = await getPokemonDetails(pokemonName);
            setDetails(data);
            setLoading(false);
        };
        loadDetails();
    }, [pokemonName]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>X</button>
                {loading ? (
                    <div>Loading details...</div>
                ) : !details ? (
                    <div>No details found.</div>
                ) : (
                    <>
                        <h2>{details.name}</h2>
                        <img src={details.image} alt={details.name} />
                        <div className="details-section">
                            <h3>Types</h3>
                            <div className="tags">
                                {details.types.map(type => (
                                    <span key={type} className={`type ${type}`}>{type}</span>
                                ))}
                            </div>
                        </div>

                        <div className="details-section">
                            <h3>Abilities</h3>
                            <ul className="abilities-list">
                                {details.abilities.map(ability => (
                                    <li key={ability}>{ability}</li>
                                ))}
                            </ul>
                        </div>

                                {/* Only show if there is more than 1 evolution (e.g., not for Ditto) */}
                                {details.evolution && details.evolution.length > 1 && (
                                    <div className="details-section">
                                        <h3>Evolutions</h3>
                                        <div className="evolution-chain">
                                            {details.evolution.map((evo, index) => (
                                                <React.Fragment key={evo.id}>
                                                    <div className="evolution-step">
                                                        <img src={evo.image} alt={evo.name} />
                                                        <span>{evo.name}</span>
                                                    </div>
                                                    {/* Add an arrow between evolutions */}
                                                    {index < details.evolution.length - 1 && (
                                                        <span className="evolution-arrow">→</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PokemonDetailModal;