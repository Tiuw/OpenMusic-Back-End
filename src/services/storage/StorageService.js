const fs = require('fs');
const path = require('path');

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const fullPath = `${this._folder}/${filename}`;

    const fileStream = fs.createWriteStream(fullPath);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => {
        console.error('File write error:', error);
        reject(error);
      });

      file.pipe(fileStream);

      file.on('end', () => {
        resolve(filename);
      });
    });
  }
}

module.exports = StorageService;
