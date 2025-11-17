import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Favorite]),
  ],
  controllers: [PokemonController],
  providers: [PokemonService]
})
export class PokemonModule {}
