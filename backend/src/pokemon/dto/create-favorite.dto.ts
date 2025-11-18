import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateFavoriteDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Pokemon name is too short' })
    name: string;
}