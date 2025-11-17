import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import type { Cache } from 'cache-manager';
import { Favorite } from './favorite.entity';
export interface EvolutionStep {
    name: string;
    id: number;
    image: string;
}
export declare class PokemonService {
    private readonly httpService;
    private favoriteRepository;
    private cacheManager;
    private readonly configService;
    private readonly POKEAPI_URL;
    private readonly POKEMON_LIST_CACHE_KEY;
    private readonly POKEMON_IMAGE_URL;
    private readonly POKEMON_OFFICIAL_IMAGE_URL;
    constructor(httpService: HttpService, favoriteRepository: Repository<Favorite>, cacheManager: Cache, configService: ConfigService);
    getFavorites(): Promise<string[]>;
    addFavorite(name: string): Promise<string[]>;
    removeFavorite(name: string): Promise<string[]>;
    fetchPokemonList(): Promise<any>;
    getPokemonListWithDetails(): Promise<any>;
    fetchPokemonDetails(name: string): Promise<any>;
    private parseEvolutionChain;
    fetchEvolutionChain(speciesUrl: string): Promise<EvolutionStep[]>;
    getPokemonFullDetails(name: string): Promise<any>;
}
