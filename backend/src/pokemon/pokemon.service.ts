import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, firstValueFrom, catchError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Favorite } from './favorite.entity';

export interface EvolutionStep {
    name: string;
    id: number;
    image: string;
}

@Injectable()
export class PokemonService {
    private readonly POKEAPI_URL: string;
    private readonly POKEMON_LIST_CACHE_KEY: string;
    private readonly POKEMON_IMAGE_URL: string;
    private readonly POKEMON_OFFICIAL_IMAGE_URL: string;

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Favorite)
        private favoriteRepository: Repository<Favorite>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly configService: ConfigService,
    ) {
        this.POKEAPI_URL = this.configService.get<string>('POKEAPI_URL') || '';
        this.POKEMON_LIST_CACHE_KEY = this.configService.get<string>('POKEMON_LIST_CACHE_KEY') || '';
        this.POKEMON_IMAGE_URL = this.configService.get<string>('POKEMON_IMAGE_URL') || '';
        this.POKEMON_OFFICIAL_IMAGE_URL = this.configService.get<string>('POKEMON_OFFICIAL_IMAGE_URL') || '';
    }

    async getFavorites(): Promise<string[]> {
        const favorites = await this.favoriteRepository.find();
        return favorites.map((fav) => fav.name);
    };

    async addFavorite(name: string): Promise<string[]> {
        const existing = await this.favoriteRepository.findOne({ where: { name } });

        if (!existing) {
            const newFavorite = this.favoriteRepository.create({ name });
            await this.favoriteRepository.save(newFavorite);
        };

        return this.getFavorites();
    };

    async removeFavorite(name: string): Promise<string[]> {
        const result = await this.favoriteRepository.delete({ name });
        if (result.affected === 0) {
            throw new NotFoundException(`Favorite '${name}' not found`);
        };

        return this.getFavorites();
    };

    async fetchPokemonList() {
        const url = `${this.POKEAPI_URL}/pokemon?limit=150`;
        const request = this.httpService
            .get(url)
            .pipe(map((response) => response.data.results));
        return firstValueFrom(request);
    };

    async getPokemonListWithDetails() {
        try {
            const cachedData = await this.cacheManager.get<any[]>(
                this.POKEMON_LIST_CACHE_KEY
            );
            if (cachedData) {
                console.log('Serving Pokémon list from cache!');
                return cachedData;
            };
        } catch (error) {
            console.error('Redis cache GET error:', error);
        };

        console.log('Cache miss - fetching Pokemon list from API.');
        const list = await this.fetchPokemonList();

        const detailedList = list.map((pokemon: { url: string; name: string }) => {
            const id = pokemon.url.split('/').filter(Boolean).pop();
            const numId = parseInt(`${id}`, 10);

            return {
                name: pokemon.name,
                id: numId,
                image: `${this.POKEMON_OFFICIAL_IMAGE_URL}/${id}.png`
            };
        });

        try {
            await this.cacheManager.set(
                this.POKEMON_LIST_CACHE_KEY,
                detailedList,
                86400000
            );
        } catch (error) {
            console.error('Redis cache SET error:', error);
        };

        return detailedList;
    };

    async fetchPokemonDetails(name: string) {
        const url = `${this.POKEAPI_URL}/pokemon/${name.toLowerCase()}`;
        const request = this.httpService.get(url).pipe(
            map((response) => response.data),
            catchError(() => {
                throw new NotFoundException(`Pokemon '${name}' not found`);
            })
        );
        return firstValueFrom(request);
    };

    private parseEvolutionChain(chainNode: any): EvolutionStep[] {
        const evolutions: EvolutionStep[] = [];

        let currentNode = chainNode;

        while (currentNode) {
            const id = currentNode.species.url.split('/').filter(Boolean).pop();
            evolutions.push({
                name: currentNode.species.name,
                id: parseInt(id, 10),
                image: `${this.POKEMON_IMAGE_URL}/${id}.png`
            });

            if (currentNode.evolves_to && currentNode.evolves_to.length > 0) {
                currentNode = currentNode.evolves_to[0];
            } else {
                currentNode = null;
            }
        };

        return evolutions;
    };

    async fetchEvolutionChain(speciesUrl: string) {
        const speciesData = await firstValueFrom(
            this.httpService.get(speciesUrl).pipe(map((res) => res.data)),
        );

        const evolutionChainUrl = speciesData.evolution_chain.url;
        const chainData = await firstValueFrom(
            this.httpService.get(evolutionChainUrl).pipe(map((res) => res.data)),
        );

        return this.parseEvolutionChain(chainData.chain);
    };

    async getPokemonFullDetails(name: string) {
        const cacheKey = `pokemon_detail_${name.toLowerCase()}`;

        try {
            const cachedData = await this.cacheManager.get<any>(cacheKey);
            if (cachedData) {
                console.log(`Serving details for ${name} from cache!`);
                return cachedData;
            };
        } catch (error) {
            console.error('Redis cache GET error:', error);
        };
        console.log(`Cache miss - fetching details for ${name} from API.`);

        const details = await this.fetchPokemonDetails(name);
        const evolution = await this.fetchEvolutionChain(details.species.url);

        const fullDetails = {
            id: details.id,
            name: details.name,
            abilities: details.abilities.map((a: { ability: { name: string } }) => a.ability.name),
            types: details.types.map((t: { type: { name: string } }) => t.type.name),
            image: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
            evolution: evolution
        };

        try {
            await this.cacheManager.set(cacheKey, fullDetails, 86400000);
        } catch (error) {
            console.error('Redis cache SET error:', error);
        };

        return fullDetails;
    };
};