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
exports.PokemonController = void 0;
const common_1 = require("@nestjs/common");
const pokemon_service_1 = require("./pokemon.service");
let PokemonController = class PokemonController {
    pokemonService;
    constructor(pokemonService) {
        this.pokemonService = pokemonService;
    }
    getPokemonList() {
        return this.pokemonService.getPokemonListWithDetails();
    }
    ;
    getPokemonDetails(name) {
        return this.pokemonService.getPokemonFullDetails(name);
    }
    ;
    getFavorites() {
        return this.pokemonService.getFavorites();
    }
    ;
    addFavorite(name) {
        return this.pokemonService.addFavorite(name);
    }
    ;
    removeFavorite(name) {
        return this.pokemonService.removeFavorite(name);
    }
    ;
};
exports.PokemonController = PokemonController;
__decorate([
    (0, common_1.Get)('pokemon'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PokemonController.prototype, "getPokemonList", null);
__decorate([
    (0, common_1.Get)('pokemon/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PokemonController.prototype, "getPokemonDetails", null);
__decorate([
    (0, common_1.Get)('favorites'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PokemonController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Post)('favorites'),
    __param(0, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PokemonController.prototype, "addFavorite", null);
__decorate([
    (0, common_1.Delete)('favorites/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PokemonController.prototype, "removeFavorite", null);
exports.PokemonController = PokemonController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [pokemon_service_1.PokemonService])
], PokemonController);
;
//# sourceMappingURL=pokemon.controller.js.map