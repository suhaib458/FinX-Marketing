// FinX — Mock Storage Service
// This service wraps localStorage for prototype data persistence.
// Replace with real API calls to MySQL/backend when connecting a real server.

const PREFIX = 'finx-';

let currentUserId = null;

function getKey(key) {
  return currentUserId ? `${PREFIX}${currentUserId}-${key}` : `${PREFIX}${key}`;
}

function readArray(key) {
  const value = mockStorage.get(key, []);
  return Array.isArray(value) ? value : [];
}

export const mockStorage = {
  setUserId(id) {
    currentUserId = id || null;
  },

  getUserId() {
    return currentUserId;
  },

  getScopedKey(key, userId = currentUserId) {
    return userId ? `${PREFIX}${userId}-${key}` : `${PREFIX}${key}`;
  },
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(getKey(key));
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(getKey(key));
      return true;
    } catch {
      return false;
    }
  },

  // Append to an array stored at the given key
  append(key, item) {
    const arr = readArray(key);
    arr.push(item);
    return this.set(key, arr);
  },

  // Remove an item from an array by matching id
  removeById(key, id) {
    const arr = readArray(key);
    const filtered = arr.filter((item) => item.id !== id);
    return this.set(key, filtered);
  },

  // Update an item in an array by matching id
  updateById(key, id, updates) {
    const arr = readArray(key);
    const updated = arr.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    return this.set(key, updated);
  },

  // Get an item from an array by matching id
  getById(key, id) {
    const arr = readArray(key);
    return arr.find((item) => item.id === id) || null;
  },

  // Narrow, non-destructive migration for a known legacy user scope.
  migrateUserScope(fromUserId, toUserId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return false;
    try {
      const sourcePrefix = `${PREFIX}${fromUserId}-`;
      let copied = false;
      Object.keys(localStorage)
        .filter((key) => key.startsWith(sourcePrefix))
        .forEach((sourceKey) => {
          const suffix = sourceKey.slice(sourcePrefix.length);
          const targetKey = `${PREFIX}${toUserId}-${suffix}`;
          if (localStorage.getItem(targetKey) === null) {
            localStorage.setItem(targetKey, localStorage.getItem(sourceKey));
            copied = true;
          }
        });
      return copied;
    } catch {
      return false;
    }
  },
};

export default mockStorage;
