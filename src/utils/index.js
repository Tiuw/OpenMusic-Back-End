/* eslint-disable object-curly-newline */
const mapDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
  name,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
  name,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapAlbumDBToModel = ({ id, name, year, created_at, updated_at }) => ({
  id,
  name,
  year,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapDBToModel, mapAlbumDBToModel };
