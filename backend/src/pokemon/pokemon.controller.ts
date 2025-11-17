import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('api')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) { }

    @Get('pokemon')
    getPokemonList() {
        return this.pokemonService.getPokemonListWithDetails();
    };

    @Get('pokemon/:name')
    getPokemonDetails(@Param('name') name: string) {
        return this.pokemonService.getPokemonFullDetails(name);
    };

    @Get('favorites')
    getFavorites() {
        return this.pokemonService.getFavorites();
    };

    @Post('favorites')
    addFavorite(@Body('name') name: string) {
        return this.pokemonService.addFavorite(name);
    };

    @Delete('favorites/:name')
    removeFavorite(@Param('name') name: string) {
        return this.pokemonService.removeFavorite(name);
    };
};