const ClientError = require('../../exceptions/ClientError');
const InvariantError = require('../../exceptions/InvariantError'); // ADD THIS LINE

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
    const { cover } = request.payload;
    const { id } = request.params;

    if (!cover) {
      throw new InvariantError('File cover harus diunggah');
    }

    // Validate headers
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    // Write file
    const filename = await this._storageService.writeFile(cover, cover.hapi);

    // Update database
    await this._service.addAlbumCover(id, filename);

    return h
      .response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      })
      .code(201);
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
