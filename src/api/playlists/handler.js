const AuthenticationError = require('../../exceptions/AuthenticationError');

class PlaylistsHandler {
  constructor(service, validator, tokenManager) {
    this._service = service;
    this._validator = validator;
    this._tokenManager = tokenManager;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this);
    this.deleteSongFromPlaylistHandler =
      this.deleteSongFromPlaylistHandler.bind(this);
    this.getPlaylistActivitiesHandler =
      this.getPlaylistActivitiesHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    const playlistId = await this._service.addPlaylist({
      name,
      owner: userId,
    });

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    const playlists = await this._service.getPlaylists(userId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    await this._service.verifyPlaylistOwner(id, userId);
    await this._service.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    await this._service.verifyPlaylistAccess(id, userId);
    await this._service.addSongToPlaylist(id, songId, userId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request, h) {
    const { id } = request.params;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    await this._service.verifyPlaylistAccess(id, userId);
    const playlist = await this._service.getPlaylistById(id);

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongFromPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    await this._service.verifyPlaylistAccess(id, userId);
    await this._service.deleteSongFromPlaylist(id, songId, userId);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id } = request.params;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    await this._service.verifyPlaylistAccess(id, userId);
    const activities = await this._service.getPlaylistActivities(id);

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
