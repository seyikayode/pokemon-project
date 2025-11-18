import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Favorite } from '../src/pokemon/entity/favorite.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpService: HttpService;
  let favoriteRepository;

  // Mock Data for External API
  const mockPokemonResponse = {
    data: {
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
      ]
    }
  };

  beforeAll(async () => {
    // 1. Set Env vars for testing (In-Memory DB)
    process.env.DATABASE_PATH = 'testdb/favorites.db';
    process.env.POKEAPI_URL = 'https://fake-api.com';
    process.env.POKEMON_LIST_CACHE_KEY = 'test_cache_key';

    // Mock Redis to avoid needing a running instance for tests
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(HttpService)
      .useValue({
        get: jest.fn().mockImplementation((url) => {
          if (url.includes('pokemon?limit=150')) {
            return of(mockPokemonResponse);
          }
          if (url.includes('pokemon/bulbasaur')) {
            return of({
              data: {
                id: 1,
                name: 'bulbasaur',
                abilities: [],
                types: [],
                sprites: { front_default: 'img.png' },
                species: { url: 'species/url' },
              },
            });
          }
          return of({ data: {} });
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );

    await app.init();

    // Get repo to clear DB if needed
    favoriteRepository = moduleFixture.get(getRepositoryToken(Favorite));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear database between tests
    await favoriteRepository.clear();
  });

  describe('/api/pokemon (GET)', () => {
    it('should return a list of pokemon', () => {
      return request(app.getHttpServer())
        .get('/api/pokemon')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0].name).toBe('bulbasaur');
          expect(res.body[0].image).toBeDefined();
        });
    });
  });

  describe('/api/favorites (Favorites Flow)', () => {
    it('should start with empty favorites', () => {
      return request(app.getHttpServer())
        .get('/api/favorites')
        .expect(200)
        .expect([]);
    });

    it('should add a favorite', () => {
      return request(app.getHttpServer())
        .post('/api/favorites')
        .send({ name: 'pikachu' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(['pikachu']);
        });
    });

    it('should validate input (reject empty name)', () => {
      return request(app.getHttpServer())
        .post('/api/favorites')
        .send({ name: '' })
        .expect(400);
    });

    it('should remove a favorite', async () => {
      // Seed
      await request(app.getHttpServer())
        .post('/api/favorites')
        .send({ name: 'charmander' });

      return request(app.getHttpServer())
        .delete('/api/favorites/charmander')
        .expect(200)
        .expect([]);
    });
  });
});
