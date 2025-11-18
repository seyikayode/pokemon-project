import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';
import { PokemonService } from './pokemon.service';
import { Favorite } from './entity/favorite.entity';
import {
  NotFoundException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';

// Define mock data
const mockPokemonList = [
  { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
  { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }
];

const mockPikachuDetails = {
  id: 25,
  name: 'pikachu',
  abilities: [{ ability: { name: 'static' } }],
  types: [{ type: { name: 'electric' } }],
  sprites: {
    front_default: 'pikachu.png',
    other: { 'official-artwork': { front_default: 'pikachu-official.png' } }
  },
  species: { url: 'species/25/' }
};

// Create mock providers
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn()
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'POKEAPI_URL') return 'https://fake-pokeapi.co/api/v2';
    if (key === 'POKEMON_LIST_CACHE_KEY') return 'test_pokemon_list';
    return null;
  })
};

const mockHttpService = {
  get: jest.fn()
};

describe('PokemonService', () => {
  let service: PokemonService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockRepository
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: HttpService,
          useValue: mockHttpService
        },
      ],
    }).compile();

    service = module.get<PokemonService>(PokemonService)

    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPokemonListWithDetails', () => {
    it('should return cached data if available', async () => {
      const cachedData = [{ name: 'cached-pika', id: 25, image: '...' }];
      mockCacheManager.get.mockResolvedValue(cachedData)

      const result = await service.getPokemonListWithDetails()

      expect(result).toBe(cachedData)
      expect(mockCacheManager.get).toHaveBeenCalledWith('test_pokemon_list')
      expect(mockHttpService.get).not.toHaveBeenCalled()
    })

    it('should fetch from API, cache, and return data if cache is empty', async () => {
      mockCacheManager.get.mockResolvedValue(null)
      mockHttpService.get.mockReturnValue(of({ data: { results: mockPokemonList } }))

      const result = await service.getPokemonListWithDetails()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('pikachu')
      expect(result[0].id).toBe(25)
      expect(result[0].image).toContain('/25.png')

      expect(mockCacheManager.get).toHaveBeenCalledTimes(1)
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://fake-pokeapi.co/api/v2/pokemon?limit=150'
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test_pokemon_list',
        expect.any(Array),
        3600000
      )
    })

    it('should propagate ServiceUnavailableException if API fails', async () => {
      mockCacheManager.get.mockResolvedValue(null)
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network Error'))
      );

      await expect(service.getPokemonListWithDetails()).rejects.toThrow(
        ServiceUnavailableException
      )
    })
  });

  describe('getPokemonFullDetails', () => {
    it('should fetch from API and cache if cache is empty', async () => {
      const pokemonName = 'pikachu';
      const cacheKey = `pokemon_detail_${pokemonName}`

      mockCacheManager.get.mockResolvedValue(null)
      jest
        .spyOn(service, 'fetchPokemonDetails')
        .mockResolvedValue(mockPikachuDetails as any)
      jest
        .spyOn(service, 'fetchEvolutionChain')
        .mockResolvedValue([{ name: 'pichu', id: 172, image: '...' }])

      const result = await service.getPokemonFullDetails(pokemonName)

      expect(result.name).toBe('pikachu')
      expect(result.id).toBe(25)
      expect(result.abilities).toEqual(['static'])
      expect(result.evolution).toHaveLength(1)

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey)
      expect(service.fetchPokemonDetails).toHaveBeenCalledWith(pokemonName)
      expect(service.fetchEvolutionChain).toHaveBeenCalledWith('species/25/')
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(Object),
        3600000,
      )
    })
  });

  describe('External API Error Handling', () => {
    it('fetchPokemonList should throw ServiceUnavailableException on API failure', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network Error'))
      );

      await expect(service.fetchPokemonList()).rejects.toThrow(
        ServiceUnavailableException
      )
    })

    it('fetchPokemonDetails should throw NotFoundException on 404', async () => {
      const error = { response: { status: 404 } }
      mockHttpService.get.mockReturnValue(throwError(() => error))

      await expect(service.fetchPokemonDetails('unknown')).rejects.toThrow(
        NotFoundException
      )
    })

    it('fetchPokemonDetails should throw ServiceUnavailableException on other errors', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network Error'))
      )

      await expect(service.fetchPokemonDetails('pikachu')).rejects.toThrow(
        ServiceUnavailableException
      )
    })

    it('fetchEvolutionChain should throw InternalServerErrorException if species fetch fails', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network Error'))
      )

      await expect(service.fetchEvolutionChain('species-url')).rejects.toThrow(
        InternalServerErrorException
      )
    })
  });

  describe('addFavorite', () => {
    it('should add a new favorite and return the list', async () => {
      const pokemonName = 'pikachu';
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ name: pokemonName })
      mockRepository.save.mockResolvedValue({ name: pokemonName })
      mockRepository.find.mockResolvedValue([{ name: pokemonName }]);

      const result = await service.addFavorite(pokemonName);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: pokemonName }
      })
      expect(mockRepository.create).toHaveBeenCalledWith({ name: pokemonName })
      expect(mockRepository.save).toHaveBeenCalled()
      expect(result).toEqual(['pikachu'])
    });

    it('should not add a favorite if it already exists', async () => {
      const pokemonName = 'pikachu'
      // Mock DB calls
      mockRepository.findOne.mockResolvedValue({ name: pokemonName })
      mockRepository.find.mockResolvedValue([{ name: pokemonName }])

      const result = await service.addFavorite(pokemonName)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: pokemonName }
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(mockRepository.save).not.toHaveBeenCalled()
      expect(result).toEqual(['pikachu'])
    })
  });

  describe('removeFavorite', () => {
    it('should remove a favorite', async () => {
      const pokemonName = 'pikachu';
      mockRepository.delete.mockResolvedValue({ affected: 1 })
      mockRepository.find.mockResolvedValue([])

      const result = await service.removeFavorite(pokemonName);

      expect(mockRepository.delete).toHaveBeenCalledWith({ name: pokemonName });
      expect(result).toEqual([])
    })

    it('should throw NotFoundException if favorite does not exist', async () => {
      const pokemonName = 'mew';
      mockRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.removeFavorite(pokemonName)).rejects.toThrow(
        NotFoundException
      )
      await expect(service.removeFavorite(pokemonName)).rejects.toThrow(
        "Favorite 'mew' not found"
      )
    })
  })
});