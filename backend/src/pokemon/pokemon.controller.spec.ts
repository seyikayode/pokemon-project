import { Test, TestingModule } from '@nestjs/testing';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';

const mockPokemonService = {
  getPokemonListWithDetails: jest.fn(() => Promise.resolve([{ name: 'pikachu' }])),
  getPokemonFullDetails: jest.fn((name) =>
    Promise.resolve({ id: 25, name, abilities: [], types: [], image: '', evolution: [] }),
  ),
  getFavorites: jest.fn(() => Promise.resolve(['pikachu'])),
  addFavorite: jest.fn((name) => Promise.resolve(['pikachu', name])),
  removeFavorite: jest.fn((name) => Promise.resolve(['pikachu'])),
};

describe('PokemonController', () => {
  let controller: PokemonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokemonController],
      providers: [
        {
          provide: PokemonService,
          useValue: mockPokemonService,
        },
      ],
    }).compile();

    controller = module.get<PokemonController>(PokemonController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the pokemon list', async () => {
    await controller.getPokemonList();
    expect(mockPokemonService.getPokemonListWithDetails).toHaveBeenCalled();
  });

  it('should get pokemon details', async () => {
    const name = 'pikachu';
    await controller.getPokemonDetails(name);
    expect(mockPokemonService.getPokemonFullDetails).toHaveBeenCalledWith(name);
  });

  it('should get favorites', async () => {
    await controller.getFavorites();
    expect(mockPokemonService.getFavorites).toHaveBeenCalled();
  });

  it('should add a favorite', async () => {
    const name = 'bulbasaur';
    await controller.addFavorite(name);
    expect(mockPokemonService.addFavorite).toHaveBeenCalledWith(name);
  });

  it('should remove a favorite', async () => {
    const name = 'pikachu';
    await controller.removeFavorite(name);
    expect(mockPokemonService.removeFavorite).toHaveBeenCalledWith(name);
  });
});