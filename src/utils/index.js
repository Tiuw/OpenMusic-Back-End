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

module.exports = { mapDBToModel };
