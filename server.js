require('dotenv').config();

const Hapi = require('@hapi/hapi');
const albums = require('./src/api/albums');
const songs = require('./src/api/songs');

// Use in-memory services for now to test
const AlbumsService = require('./src/services/inMemory/AlbumsService');
const SongsService = require('./src/services/inMemory/SongsService');

const AlbumsValidator = require('./src/validator/albums');
const SongsValidator = require('./src/validator/songs');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const server = Hapi.server({
    port: 5000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Add some debug logging
  console.log('Registering plugins...');

  try {
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

    console.log('Plugins registered successfully');

    // Log all registered routes
    console.log('Registered routes:');
    server.table().forEach((route) => {
      console.log(`${route.method.toUpperCase()} ${route.path}`);
    });
  } catch (error) {
    console.error('Error registering plugins:', error);
    process.exit(1);
  }

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      console.log('Error caught:', response.message);

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
