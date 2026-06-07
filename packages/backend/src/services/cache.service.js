const NodeCache = require('node-cache');
// Standard TTL de 5 minutos (300 segundos) por defecto
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

const getCache = (key) => {
  return cache.get(key);
};

const setCache = (key, value, ttl = 300) => {
  return cache.set(key, value, ttl);
};

const deleteCache = (key) => {
  return cache.del(key);
};

const clearCache = () => {
  cache.flushAll();
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCache
};
