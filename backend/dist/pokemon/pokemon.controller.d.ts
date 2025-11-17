import { PokemonService } from './pokemon.service';
export declare class PokemonController {
    private readonly pokemonService;
    constructor(pokemonService: PokemonService);
    getPokemonList(): Promise<any>;
    getPokemonDetails(name: string): Promise<any>;
    getFavorites(): Promise<string[]>;
    addFavorite(name: string): Promise<string[]>;
    removeFavorite(name: string): Promise<string[]>;
}
