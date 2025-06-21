const CollaborationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (
    server,
    { collaborationsService, playlistsService, validator, tokenManager }
  ) => {
    const collaborationsHandler = new CollaborationsHandler(
      collaborationsService,
      playlistsService,
      validator,
      tokenManager
    );
    server.route(routes(collaborationsHandler));
  },
};
