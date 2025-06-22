const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(service, validator, storageService, uploadsValidator) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.deleteAlbumLikeHandler = this.deleteAlbumLikeHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    try {
      const { cover } = request.payload;
      const { id } = request.params;

      // Check if file exists
      if (!cover || !cover.hapi || !cover.hapi.headers) {
        const response = h.response({
          status: 'fail',
          message: 'File tidak ditemukan',
        });
        response.code(400);
        return response;
      }

      // Validate image headers using validator FIRST
      try {
        this._uploadsValidator.validateImageHeaders(cover.hapi.headers);
      } catch (error) {
        const response = h.response({
          status: 'fail',
          message: 'File harus berupa gambar',
        });
        response.code(400);
        return response;
      }

      // Upload file and get filename
      const filename = await this._storageService.writeFile(cover, cover.hapi);

      // Add cover to album
      await this._service.addAlbumCover(id, filename);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { userId } = request.auth.credentials;

    await this._service.likeAlbum(id, userId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil disukai',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { userId } = request.auth.credentials;

    await this._service.unlikeAlbum(id, userId);

    return {
      status: 'success',
      message: 'Album berhasil batal disukai',
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const result = await this._service.getAlbumLikes(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: result.likes,
      },
    });

    // Add cache header if data comes from cache
    if (result.isCache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = AlbumsHandler;
