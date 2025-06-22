require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

// albums
const albums = require('./src/api/albums');
const AlbumsService = require('./src/services/postgres/AlbumsService');
const AlbumsValidator = require('./src/validator/albums');

// songs
const songs = require('./src/api/songs');
const SongsService = require('./src/services/postgres/SongsService');
const SongsValidator = require('./src/validator/songs');

// users
const users = require('./src/api/users');
const UsersService = require('./src/services/postgres/UsersService');
const UsersValidator = require('./src/validator/users');

// authentications
const authentications = require('./src/api/authentications');
const AuthenticationsService = require('./src/services/postgres/AuthenticationsService');
const TokenManager = require('./src/services/TokenManager');
const AuthenticationsValidator = require('./src/validator/authentications');

// playlists
const playlists = require('./src/api/playlists');
const PlaylistsService = require('./src/services/postgres/PlaylistsService');
const PlaylistsValidator = require('./src/validator/playlists');

// collaborations
const collaborations = require('./src/api/collaborations');
const CollaborationsService = require('./src/services/postgres/CollaborationsService');
const CollaborationsValidator = require('./src/validator/collaborations');

// uploads
const StorageService = require('./src/services/storage/StorageService');
const UploadsValidator = require('./src/validator/uploads');

// cache
const CacheService = require('./src/services/redis/CacheService');

const ClientError = require('./src/exceptions/ClientError');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const storageService = new StorageService(
    path.resolve(__dirname, 'src/uploads/images')
  );

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  // serve static files
  server.route({
    method: 'GET',
    path: '/upload/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'src/uploads'),
      },
    },
  });

  // mendefinisikan strategy autentikasi jwt
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        userId: artifacts.decoded.payload.userId,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
        storageService,
        uploadsValidator: UploadsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
        tokenManager: TokenManager,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
        tokenManager: TokenManager,
      },
    },
    {
      plugin: require('./src/api/exports'),
      options: {
        producerService: require('./src/services/rabbitmq/ProducerService'),
        playlistsService,
        validator: require('./src/validator/exports'),
        tokenManager: require('./src/services/TokenManager'),
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      // Handle Hapi payload errors
      if (response.output && response.output.statusCode === 415) {
        const newResponse = h.response({
          status: 'fail',
          message: 'File harus berupa gambar',
        });
        newResponse.code(400);
        return newResponse;
      }

      if (response.output && response.output.statusCode === 413) {
        const newResponse = h.response({
          status: 'fail',
          message: 'File terlalu besar',
        });
        newResponse.code(413);
        return newResponse;
      }

      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      
      if (!response.isServer) {
        return h.continue;
      }
      
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      console.error(response);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
