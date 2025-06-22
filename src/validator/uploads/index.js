const InvariantError = require('../../exceptions/InvariantError');
const { ImageHeadersSchema } = require('./schema');

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    const validationResult = ImageHeadersSchema.validate(headers);

    if (validationResult.error) {
      // Return 400 status code for invalid file types
      throw new InvariantError('File harus berupa gambar');
    }
  },
};

module.exports = UploadsValidator;
