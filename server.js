require('dotenv').config();

const Hapi = require('@hapi/hapi');
const albums = require('./src/api/albums');
const songs = require('./src/api/songs');

// PostgreSQL Services
const AlbumsService = require('./src/services/postgres/AlbumsService');
const SongsService = require('./src/services/postgres/SongsService');

// In-Memory Services (for fallback)
// const AlbumsService = require('./src/services/inMemory/AlbumsService');
// const SongsService = require('./src/services/inMemory/SongsService');

const AlbumsValidator = require('./src/validator/albums');
const SongsValidator = require('./src/validator/songs');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response.statusCode === 400) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(400);
        return newResponse;
      }

      if (response.statusCode === 404) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(404);
        return newResponse;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      newResponse.code(500);
      console.error(response);
      return newResponse;
    }

    return response.continue || response;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
