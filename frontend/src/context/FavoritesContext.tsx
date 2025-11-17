import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as api from '../api';

interface FavoritesContextType {
    favorites: Set<string>;
    addFavorite: (name: string) => void;
    removeFavorite: (name: string) => void;
    isFavorite: (name: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.getFavorites().then((faves) => {
            setFavorites(new Set(faves));
        });
    }, []);

    const handleAddFavorite = async (name: string) => {
        const updatedFavs = await api.addFavorite(name);
        setFavorites(new Set(updatedFavs));
    };

    const handleRemoveFavorite = async (name: string) => {
        const updatedFavs = await api.removeFavorite(name);
        setFavorites(new Set(updatedFavs));
    };

    const isFavorite = (name: string) => favorites.has(name);

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite: handleAddFavorite,
                removeFavorite: handleRemoveFavorite,
                isFavorite,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};