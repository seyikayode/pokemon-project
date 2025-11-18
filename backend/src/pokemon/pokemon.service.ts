import { Injectable, NotFoundException, Inject, ServiceUnavailableException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, firstValueFrom, catchError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Favorite } from './entity/favorite.entity';
import { AxiosError } from 'axios';

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

    /**
   * Adds a favorite to the SQLite database.
   * Uses 'INSERT OR IGNORE' logic via findOne check to be idempotent.
   * @param name - The name of the Pokemon to favorite.
   */
    async getFavorites(): Promise<string[]> {
        const favorites = await this.favoriteRepository.find()
        return favorites.map((fav) => fav.name)
    };

    async addFavorite(name: string): Promise<string[]> {
        const lowerName = name.toLowerCase()
        const existing = await this.favoriteRepository.findOne({ where: { name: lowerName } })

        if (!existing) {
            const newFavorite = this.favoriteRepository.create({ name })
            await this.favoriteRepository.save(newFavorite)
        }

        return this.getFavorites()
    };

    async removeFavorite(name: string): Promise<string[]> {
        const result = await this.favoriteRepository.delete({ name })
        if (result.affected === 0) {
            throw new NotFoundException(`Favorite '${name}' not found`)
        }

        return this.getFavorites()
    };


    /**
   * Fetches the raw list of 150 Pokemon from the external API.
   * Includes error handling to translate Axios errors into NestJS exceptions.
   */
    async fetchPokemonList() {
        const url = `${this.POKEAPI_URL}/pokemon?limit=150`;
        const request = this.httpService.get(url).pipe(
            map((response) => response.data.results),
            catchError((error: AxiosError) => {
                console.error('Error fetching Pokemon list:', error.message)
                throw new ServiceUnavailableException(
                    'External PokeAPI is currently unavailable'
                )
            })
        )
        return firstValueFrom(request)
    };


    /**
   * Main entry point for the list view.
   * Implements "Read-Through Caching":
   * 1. Check Redis.
   * 2. If missing, fetch from API, transform, and write to Redis.
   * 3. Perform Server-Side Filtering if 'search' param is present.
   */
    async getPokemonListWithDetails(search?: string) {
        let detailedList: any[] = []

        try {
            const cachedData = await this.cacheManager.get<any[]>(
                this.POKEMON_LIST_CACHE_KEY
            )
            if (cachedData) {
                console.log('Serving Pokemon list from cache!')
                detailedList = cachedData
            }
        } catch (error) {
            console.error('Redis cache GET error:', error)
        }

        if (detailedList.length === 0) {
            console.log('Cache miss - fetching Pokemon list from API.')
            const list = await this.fetchPokemonList()

            detailedList = list.map((pokemon: { url: string, name: string }) => {
                const id = pokemon.url.split('/').filter(Boolean).pop()
                const numId = parseInt(`${id}`, 10)

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
                    3600000
                )
            } catch (error) {
                console.error('Redis cache SET error:', error)
            }
        }

        if (search) {
            const lowerSearch = search.toLowerCase()
            return detailedList.filter(pokemon =>
                pokemon.name.toLowerCase().includes(lowerSearch)
            )
        }

        return detailedList
    };

    async fetchPokemonDetails(name: string) {
        const url = `${this.POKEAPI_URL}/pokemon/${name.toLowerCase()}`;
        const request = this.httpService.get(url).pipe(
            map((response) => response.data),
            catchError((error: AxiosError) => {
                if (error.response?.status === 404) {
                    throw new NotFoundException(
                        `Pokemon '${name}' not found in external API`
                    )
                }
                console.error(`Error fetching details for ${name}:`, error.message)
                throw new ServiceUnavailableException(
                    'Failed to fetch Pokemon details from external API'
                )
            })
        )
        return firstValueFrom(request)
    };

    private parseEvolutionChain(chainNode: any): EvolutionStep[] {
        const evolutions: EvolutionStep[] = []
        let currentNode = chainNode

        while (currentNode) {
            if (currentNode.species?.url) {
                const id = currentNode.species.url.split('/').filter(Boolean).pop()
                if (id) {
                    evolutions.push({
                        name: currentNode.species.name,
                        id: parseInt(id, 10),
                        image: `${this.POKEMON_IMAGE_URL}/${id}.png`
                    })
                }
            }

            if (currentNode.evolves_to && currentNode.evolves_to.length > 0) {
                currentNode = currentNode.evolves_to[0]
            } else {
                currentNode = null
            }
        }

        return evolutions;
    };

    async fetchEvolutionChain(speciesUrl: string) {
        const speciesData = await firstValueFrom(
            this.httpService.get(speciesUrl).pipe(
                map((res) => res.data),
                catchError(() => {
                    throw new InternalServerErrorException('Failed to fetch species data');
                })
            )
        )
        const evolutionChainUrl = speciesData.evolution_chain?.url
        if (!evolutionChainUrl) {
            return []
        }

        const chainData = await firstValueFrom(
            this.httpService.get(evolutionChainUrl).pipe(
                map((res) => res.data),
                catchError(() => {
                    throw new InternalServerErrorException('Failed to fetch evolution chain')
                })
            )
        )
        return this.parseEvolutionChain(chainData.chain)
    };

    async getPokemonFullDetails(name: string) {
        const cacheKey = `pokemon_detail_${name.toLowerCase()}`

        try {
            const cachedData = await this.cacheManager.get<any>(cacheKey);
            if (cachedData) {
                console.log(`Serving details for ${name} from cache!`);
                return cachedData;
            }
        } catch (error) {
            console.error('Redis cache GET error:', error);
        }
        console.log(`Cache miss - fetching details for ${name} from API.`)

        const details = await this.fetchPokemonDetails(name)
        const evolution = await this.fetchEvolutionChain(details.species.url)

        const fullDetails = {
            id: details.id,
            name: details.name,
            abilities: details.abilities.map((a: { ability: { name: string } }) => a.ability.name),
            types: details.types.map((t: { type: { name: string } }) => t.type.name),
            image: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
            evolution: evolution
        }

        try {
            await this.cacheManager.set(cacheKey, fullDetails, 3600000)
        } catch (error) {
            console.error('Redis cache SET error:', error)
        }

        return fullDetails
    };
};