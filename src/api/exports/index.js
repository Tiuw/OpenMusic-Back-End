const ExportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'exports',
  version: '1.0.0',
  register: async (
    server,
    { producerService, playlistsService, validator, tokenManager }
  ) => {
    const exportsHandler = new ExportsHandler(
      producerService,
      playlistsService,
      validator,
      tokenManager
    );
    server.route(routes(exportsHandler));
  },
};
