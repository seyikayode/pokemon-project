import { Test, TestingModule } from '@nestjs/testing';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

describe('PokemonController', () => {
  let controller: PokemonController
  let service: PokemonService

  // Mock Data
  const mockPokemonList = [
    { name: 'pikachu', id: 25, image: 'img.png' },
    { name: 'bulbasaur', id: 1, image: 'img.png' }
  ];

  const mockPokemonDetails = {
    id: 25,
    name: 'pikachu',
    abilities: ['static'],
    types: ['electric'],
    image: 'img.png',
    evolution: []
  };

  beforeEach(async () => {
    const mockPokemonService = {
      getPokemonListWithDetails: jest.fn(),
      getPokemonFullDetails: jest.fn(),
      getFavorites: jest.fn(),
      addFavorite: jest.fn(),
      removeFavorite: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokemonController],
      providers: [
        {
          provide: PokemonService,
          useValue: mockPokemonService
        },
      ],
    }).compile();

    controller = module.get<PokemonController>(PokemonController)
    service = module.get<PokemonService>(PokemonService)

    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(controller).toBeDefined()
  });

  describe('getPokemonList', () => {
    it('should return a list of pokemon without search query', async () => {
      (service.getPokemonListWithDetails as jest.Mock).mockResolvedValue(mockPokemonList)
      const result = await controller.getPokemonList()
      expect(result).toEqual(mockPokemonList)
      expect(service.getPokemonListWithDetails).toHaveBeenCalledWith(undefined)
    })

    it('should pass search query to service when provided', async () => {
      const searchTerm = 'pika';
      const filteredList = [mockPokemonList[0]];
      (service.getPokemonListWithDetails as jest.Mock).mockResolvedValue(filteredList);
      const result = await controller.getPokemonList(searchTerm)
      expect(result).toEqual(filteredList);
      expect(service.getPokemonListWithDetails).toHaveBeenCalledWith(searchTerm)
    })
  });

  describe('getPokemonDetails', () => {
    it('should return full details for a specific pokemon', async () => {
      const name = 'pikachu';
      (service.getPokemonFullDetails as jest.Mock).mockResolvedValue(mockPokemonDetails);
      const result = await controller.getPokemonDetails(name)
      expect(result).toEqual(mockPokemonDetails)
      expect(service.getPokemonFullDetails).toHaveBeenCalledWith(name)
    })
  });

  describe('getFavorites', () => {
    it('should return the list of favorites', async () => {
      await controller.getFavorites()
      expect(service.getFavorites).toHaveBeenCalled()
    })
  });

  describe('addFavorite', () => {
    it('should extract name from DTO and call service', async () => {
      const dto: CreateFavoriteDto = { name: 'mewtwo' };
      const updatedFavorites = ['pikachu', 'charizard', 'mewtwo'];
        (service.addFavorite as jest.Mock).mockResolvedValue(updatedFavorites)
      const result = await controller.addFavorite(dto)
      expect(result).toEqual(updatedFavorites)
      expect(service.addFavorite).toHaveBeenCalledWith(dto.name)
    })
  });

  describe('removeFavorite', () => {
    it('should call service with the correct name', async () => {
      const name = 'charizard';
      const updatedFavorites = ['pikachu'];
      (service.removeFavorite as jest.Mock).mockResolvedValue(updatedFavorites)
      const result = await controller.removeFavorite(name)
      expect(result).toEqual(updatedFavorites)
      expect(service.removeFavorite).toHaveBeenCalledWith(name)
    })
  });
});