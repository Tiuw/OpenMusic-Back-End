const redis = require('redis');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER.split(':')[0],
        port: parseInt(process.env.REDIS_SERVER.split(':')[1], 10) || 6379,
      },
    });

    this._client.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 1800) { // 30 minutes default
    await this._client.setEx(key, expirationInSecond, value);
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache tidak ditemukan');
    return result;
  }

  async delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;