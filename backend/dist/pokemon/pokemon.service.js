"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const favorite_entity_1 = require("./favorite.entity");
let PokemonService = class PokemonService {
    httpService;
    favoriteRepository;
    cacheManager;
    configService;
    POKEAPI_URL;
    POKEMON_LIST_CACHE_KEY;
    POKEMON_IMAGE_URL;
    POKEMON_OFFICIAL_IMAGE_URL;
    constructor(httpService, favoriteRepository, cacheManager, configService) {
        this.httpService = httpService;
        this.favoriteRepository = favoriteRepository;
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.POKEAPI_URL = this.configService.get('POKEAPI_URL') || '';
        this.POKEMON_LIST_CACHE_KEY = this.configService.get('POKEMON_LIST_CACHE_KEY') || '';
        this.POKEMON_IMAGE_URL = this.configService.get('POKEMON_IMAGE_URL') || '';
        this.POKEMON_OFFICIAL_IMAGE_URL = this.configService.get('POKEMON_OFFICIAL_IMAGE_URL') || '';
    }
    async getFavorites() {
        const favorites = await this.favoriteRepository.find();
        return favorites.map((fav) => fav.name);
    }
    ;
    async addFavorite(name) {
        const existing = await this.favoriteRepository.findOne({ where: { name } });
        if (!existing) {
            const newFavorite = this.favoriteRepository.create({ name });
            await this.favoriteRepository.save(newFavorite);
        }
        ;
        return this.getFavorites();
    }
    ;
    async removeFavorite(name) {
        const result = await this.favoriteRepository.delete({ name });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Favorite '${name}' not found`);
        }
        ;
        return this.getFavorites();
    }
    ;
    async fetchPokemonList() {
        const url = `${this.POKEAPI_URL}/pokemon?limit=150`;
        const request = this.httpService
            .get(url)
            .pipe((0, rxjs_1.map)((response) => response.data.results));
        return (0, rxjs_1.firstValueFrom)(request);
    }
    ;
    async getPokemonListWithDetails() {
        try {
            const cachedData = await this.cacheManager.get(this.POKEMON_LIST_CACHE_KEY);
            if (cachedData) {
                console.log('Serving Pokémon list from cache!');
                return cachedData;
            }
            ;
        }
        catch (error) {
            console.error('Redis cache GET error:', error);
        }
        ;
        console.log('Cache miss - fetching Pokemon list from API.');
        const list = await this.fetchPokemonList();
        const detailedList = list.map((pokemon) => {
            const id = pokemon.url.split('/').filter(Boolean).pop();
            const numId = parseInt(`${id}`, 10);
            return {
                name: pokemon.name,
                id: numId,
                image: `${this.POKEMON_OFFICIAL_IMAGE_URL}/${id}.png`
            };
        });
        try {
            await this.cacheManager.set(this.POKEMON_LIST_CACHE_KEY, detailedList, 86400000);
        }
        catch (error) {
            console.error('Redis cache SET error:', error);
        }
        ;
        return detailedList;
    }
    ;
    async fetchPokemonDetails(name) {
        const url = `${this.POKEAPI_URL}/pokemon/${name.toLowerCase()}`;
        const request = this.httpService.get(url).pipe((0, rxjs_1.map)((response) => response.data), (0, rxjs_1.catchError)(() => {
            throw new common_1.NotFoundException(`Pokemon '${name}' not found`);
        }));
        return (0, rxjs_1.firstValueFrom)(request);
    }
    ;
    parseEvolutionChain(chainNode) {
        const evolutions = [];
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
            }
            else {
                currentNode = null;
            }
        }
        ;
        return evolutions;
    }
    ;
    async fetchEvolutionChain(speciesUrl) {
        const speciesData = await (0, rxjs_1.firstValueFrom)(this.httpService.get(speciesUrl).pipe((0, rxjs_1.map)((res) => res.data)));
        const evolutionChainUrl = speciesData.evolution_chain.url;
        const chainData = await (0, rxjs_1.firstValueFrom)(this.httpService.get(evolutionChainUrl).pipe((0, rxjs_1.map)((res) => res.data)));
        return this.parseEvolutionChain(chainData.chain);
    }
    ;
    async getPokemonFullDetails(name) {
        const cacheKey = `pokemon_detail_${name.toLowerCase()}`;
        try {
            const cachedData = await this.cacheManager.get(cacheKey);
            if (cachedData) {
                console.log(`Serving details for ${name} from cache!`);
                return cachedData;
            }
            ;
        }
        catch (error) {
            console.error('Redis cache GET error:', error);
        }
        ;
        console.log(`Cache miss - fetching details for ${name} from API.`);
        const details = await this.fetchPokemonDetails(name);
        const evolution = await this.fetchEvolutionChain(details.species.url);
        const fullDetails = {
            id: details.id,
            name: details.name,
            abilities: details.abilities.map((a) => a.ability.name),
            types: details.types.map((t) => t.type.name),
            image: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
            evolution: evolution
        };
        try {
            await this.cacheManager.set(cacheKey, fullDetails, 86400000);
        }
        catch (error) {
            console.error('Redis cache SET error:', error);
        }
        ;
        return fullDetails;
    }
    ;
};
exports.PokemonService = PokemonService;
exports.PokemonService = PokemonService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(favorite_entity_1.Favorite)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository, Object, config_1.ConfigService])
], PokemonService);
;
//# sourceMappingURL=pokemon.service.js.map