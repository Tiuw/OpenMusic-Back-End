const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._songs = [];
  }

  addSong({
    title, year, performer, genre, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const newSong = {
      id,
      title,
      year,
      performer,
      genre,
      duration,
      albumId: albumId || null,
      createdAt,
      updatedAt,
    };

    this._songs.push(newSong);

    const isSuccess = this._songs.filter((song) => song.id === id).length > 0;

    if (!isSuccess) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return id;
  }

  getSongs({ title, performer }) {
    let songs = this._songs;

    if (title !== undefined) {
      songs = songs.filter((song) => song.title.toLowerCase().includes(title.toLowerCase()));
    }

    if (performer !== undefined) {
      songs = songs.filter((song) => song.performer.toLowerCase().includes(performer.toLowerCase()));
    }

    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
    }));
  }

  getSongById(id) {
    const song = this._songs.filter((n) => n.id === id)[0];
    if (!song) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return song;
  }

  editSongById(id, {
    title, year, performer, genre, duration, albumId,
  }) {
    const index = this._songs.findIndex((song) => song.id === id);

    if (index === -1) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    const updatedAt = new Date().toISOString();

    this._songs[index] = {
      ...this._songs[index],
      title,
      year,
      performer,
      genre,
      duration,
      albumId: albumId || null,
      updatedAt,
    };
  }

  deleteSongById(id) {
    const index = this._songs.findIndex((song) => song.id === id);

    if (index === -1) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }

    this._songs.splice(index, 1);
  }
}

module.exports = SongsService;
