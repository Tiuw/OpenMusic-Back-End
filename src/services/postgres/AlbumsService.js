const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
    this._folder = path.resolve(__dirname, '../../uploads/images');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this._folder)) {
      fs.mkdirSync(this._folder, { recursive: true });
    }
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const albumResult = await this._pool.query(albumQuery);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // Get songs that belong to this album
    const songsQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songsResult = await this._pool.query(songsQuery);

    const album = albumResult.rows[0];
    return {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover_url || null, // Ensure null if no cover
      songs: songsResult.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async editAlbumCover(albumId, coverUrl) {
    // Check if album exists
    await this.getAlbumById(albumId);

    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2',
      values: [coverUrl, albumId],
    };

    await this._pool.query(query);
  }

  // Keep the old method for backward compatibility
  async addAlbumCover(albumId, coverFilename) {
    // Check if album exists first
    await this.getAlbumById(albumId);

    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${coverFilename}`;

    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2',
      values: [coverUrl, albumId],
    };

    await this._pool.query(query);
  }

  async likeAlbum(albumId, userId) {
    // Check if album exists
    await this.getAlbumById(albumId);

    // Check if user already liked this album
    const checkQuery = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const checkResult = await this._pool.query(checkQuery);
    if (checkResult.rows.length > 0) {
      throw new InvariantError('Album sudah disukai');
    }

    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menyukai album');
    }

    // Delete cache when likes change
    await this._cacheService.delete(`album:${albumId}:likes`);
  }

  async unlikeAlbum(albumId, userId) {
    // Check if album exists
    await this.getAlbumById(albumId);

    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal batal menyukai album');
    }

    // Delete cache when likes change
    await this._cacheService.delete(`album:${albumId}:likes`);
  }

  async getAlbumLikes(albumId) {
    try {
      // Try to get from cache first
      const result = await this._cacheService.get(`album:${albumId}:likes`);
      return {
        likes: parseInt(JSON.parse(result), 10),
        isCache: true,
      };
    } catch (error) {
      // If not in cache, get from database
      // Check if album exists first
      await this.getAlbumById(albumId);

      const query = {
        text: 'SELECT COUNT(*)::int as likes FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likes = result.rows[0].likes;

      // Store in cache for 30 minutes (1800 seconds)
      await this._cacheService.set(
        `album:${albumId}:likes`,
        JSON.stringify(likes),
        1800
      );

      return {
        likes,
        isCache: false,
      };
    }
  }
}

module.exports = AlbumsService;
