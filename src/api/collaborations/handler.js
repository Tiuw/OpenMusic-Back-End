const AuthenticationError = require('../../exceptions/AuthenticationError');

class CollaborationsHandler {
  constructor(
    collaborationsService,
    playlistsService,
    validator,
    tokenManager
  ) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._validator = validator;
    this._tokenManager = tokenManager;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler =
      this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId: credentialId } =
      this._tokenManager.verifyAccessToken(token);

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    const collaborationId = await this._collaborationsService.addCollaboration(
      playlistId,
      userId
    );

    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.replace('Bearer ', '');
    const { userId: credentialId } =
      this._tokenManager.verifyAccessToken(token);

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
