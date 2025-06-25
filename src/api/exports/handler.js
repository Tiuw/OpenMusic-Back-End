const AuthenticationError = require('../../exceptions/AuthenticationError');

class ExportsHandler {
  constructor(producerService, playlistsService, validator, tokenManager) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;
    this._tokenManager = tokenManager;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    // Check authentication FIRST before validation
    const { authorization } = request.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    // Only validate payload after authentication is confirmed
    this._validator.validateExportPlaylistPayload(request.payload);

    const { playlistId } = request.params;
    const { targetEmail } = request.payload;

    const token = authorization.replace('Bearer ', '');
    const { userId } = this._tokenManager.verifyAccessToken(token);

    // Verify playlist access (can be owner or collaborator)
    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);

    const message = {
      playlistId,
      targetEmail,
    };

    await this._producerService.sendMessage(
      'export:playlist',
      JSON.stringify(message)
    );

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
