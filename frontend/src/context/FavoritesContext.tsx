import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as api from '../api';

interface FavoritesContextType {
    favorites: Set<string>
    addFavorite: (name: string) => void
    removeFavorite: (name: string) => void
    isFavorite: (name: string) => boolean
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.getFavorites().then((faves) => {
            setFavorites(new Set(faves))
        })
    }, []);


    /**
   * Optimistic Update Implementation:
   * 1. Update UI immediately (instant feedback for user).
   * 2. Perform API call in background.
   * 3. If API fails, rollback UI state to previous value.
   */
    const handleAddFavorite = async (name: string) => {
        const previousFavorites = new Set(favorites)
        // Optimistic Update
        setFavorites((prev) => new Set(prev).add(name))

        try {
            const updatedFavs = await api.addFavorite(name)
            setFavorites(new Set(updatedFavs))
        } catch (error) {
            console.error("Failed to add favorite", error)
            setFavorites(previousFavorites)
        }
    };

    const handleRemoveFavorite = async (name: string) => {
        const previousFavorites = new Set(favorites)
        // Optimistic Update
        setFavorites((prev) => {
            const newSet = new Set(prev)
            newSet.delete(name)
            return newSet
        });

        try {
            const updatedFavs = await api.removeFavorite(name)
            setFavorites(new Set(updatedFavs));
        } catch (error) {
            console.error("Failed to remove favorite", error)
            setFavorites(previousFavorites)
        }
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
    )
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context;
};