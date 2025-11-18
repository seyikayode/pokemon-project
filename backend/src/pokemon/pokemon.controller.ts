import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Controller('api')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) { }

    /**
   * GET /api/pokemon?search=pikachu
   * Fetches the list of 150 Pokémon.
   * Optional 'search' query param performs server-side filtering.
   */
    @Get('pokemon')
    getPokemonList(@Query('search') search?: string) {
        return this.pokemonService.getPokemonListWithDetails(search);
    }

    @Get('pokemon/:name')
    getPokemonDetails(@Param('name') name: string) {
        return this.pokemonService.getPokemonFullDetails(name)
    };

    @Get('favorites')
    getFavorites() {
        return this.pokemonService.getFavorites()
    };

    /**
   * POST /api/favorites
   * Adds a Pokemon to the user's favorites.
   * Uses CreateFavoriteDto for validation (must be string, not empty).
   */
    @Post('favorites')
    addFavorite(@Body() createFavoriteDto: CreateFavoriteDto) {
        return this.pokemonService.addFavorite(createFavoriteDto.name)
    };

    @Delete('favorites/:name')
    removeFavorite(@Param('name') name: string) {
        return this.pokemonService.removeFavorite(name)
    };
};