import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

export interface SimplePokemon {
    name: string
    id: number
    image: string
}

export interface EvolutionStep {
    name: string
    id: number
    image: string
}

export interface DetailedPokemon {
    id: number
    name: string
    abilities: string[]
    types: string[]
    image: string
    evolution: EvolutionStep[]
}

export const getPokemonList = async (search?: string): Promise<SimplePokemon[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get('/pokemon', { params })
    return response.data
};

export const getPokemonDetails = async (name: string): Promise<DetailedPokemon> => {
    const response = await apiClient.get(`/pokemon/${name}`)
    return response.data
};

export const getFavorites = async (): Promise<string[]> => {
    const response = await apiClient.get('/favorites')
    return response.data
};

export const addFavorite = async (name: string): Promise<string[]> => {
    const response = await apiClient.post('/favorites', { name })
    return response.data
};

export const removeFavorite = async (name: string): Promise<string[]> => {
    const response = await apiClient.delete(`/favorites/${name}`)
    return response.data
};