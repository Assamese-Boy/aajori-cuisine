/**
 * Persistent Client Data Cache & Serverless Desync Resolver
 *
 * In serverless environments (like Vercel Functions), individual lambda instances
 * are stateless and cold-start independently. When multiple containers handle requests,
 * newly created in-memory entities can flicker or temporarily disappear if a request
 * lands on a freshly booted container with only default seed data.
 *
 * This persistence layer acts as an authoritative client overlay:
 * 1. Tracks newly created / updated restaurants, riders, and users.
 * 2. Tracks deleted entity IDs so deleted items never ghost back.
 * 3. Seamlessly merges backend responses with local additions.
 */

const STORAGE_KEYS = {
  RESTAURANTS: 'aajori_cache_restaurants',
  DELETED_RESTAURANTS: 'aajori_deleted_restaurant_ids',
  RIDERS: 'aajori_cache_riders',
  DELETED_RIDERS: 'aajori_deleted_rider_ids',
  USERS: 'aajori_cache_users',
  DELETED_USERS: 'aajori_deleted_user_ids',
  ORDER_STATUSES: 'aajori_order_status_overrides',
};

function safeGetJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetJson(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Aajori Cache] Failed to persist ${key}`, e);
  }
}

// ============================================================================
// RESTAURANTS
// ============================================================================

export function recordCreatedRestaurant(restaurant: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RESTAURANTS, []);
  const filtered = list.filter((r) => r.id !== restaurant.id);
  filtered.unshift(restaurant);
  safeSetJson(STORAGE_KEYS.RESTAURANTS, filtered);

  // Remove from deleted set if re-created
  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_RESTAURANTS, []);
  safeSetJson(
    STORAGE_KEYS.DELETED_RESTAURANTS,
    deletedIds.filter((id) => id !== restaurant.id)
  );
}

export function recordUpdatedRestaurant(restaurantId: string, updates: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RESTAURANTS, []);
  const idx = list.findIndex((r) => r.id === restaurantId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
  } else {
    list.unshift({ id: restaurantId, ...updates });
  }
  safeSetJson(STORAGE_KEYS.RESTAURANTS, list);
}

export function recordDeletedRestaurant(restaurantId: string) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RESTAURANTS, []);
  safeSetJson(
    STORAGE_KEYS.RESTAURANTS,
    list.filter((r) => r.id !== restaurantId)
  );

  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_RESTAURANTS, []);
  if (!deletedIds.includes(restaurantId)) {
    deletedIds.push(restaurantId);
    safeSetJson(STORAGE_KEYS.DELETED_RESTAURANTS, deletedIds);
  }
}

export function mergeRestaurants(backendRestaurants: any[] = []): any[] {
  const customList = safeGetJson<any[]>(STORAGE_KEYS.RESTAURANTS, []);
  const deletedIds = new Set(safeGetJson<string[]>(STORAGE_KEYS.DELETED_RESTAURANTS, []));

  // Map backend items
  const map = new Map<string, any>();
  for (const r of backendRestaurants) {
    if (!deletedIds.has(r.id)) {
      map.set(r.id, r);
    }
  }

  // Overlay custom items (takes precedence)
  for (const r of customList) {
    if (!deletedIds.has(r.id)) {
      const existing = map.get(r.id);
      map.set(r.id, existing ? { ...existing, ...r } : r);
    }
  }

  return Array.from(map.values());
}

// ============================================================================
// DELIVERY FLEET
// ============================================================================

export function recordCreatedRider(rider: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RIDERS, []);
  const filtered = list.filter((r) => r.id !== rider.id);
  filtered.unshift(rider);
  safeSetJson(STORAGE_KEYS.RIDERS, filtered);

  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_RIDERS, []);
  safeSetJson(
    STORAGE_KEYS.DELETED_RIDERS,
    deletedIds.filter((id) => id !== rider.id)
  );
}

export function recordUpdatedRider(riderId: string, updates: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RIDERS, []);
  const idx = list.findIndex((r) => r.id === riderId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
  } else {
    list.unshift({ id: riderId, ...updates });
  }
  safeSetJson(STORAGE_KEYS.RIDERS, list);
}

export function recordDeletedRider(riderId: string) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.RIDERS, []);
  safeSetJson(
    STORAGE_KEYS.RIDERS,
    list.filter((r) => r.id !== riderId)
  );

  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_RIDERS, []);
  if (!deletedIds.includes(riderId)) {
    deletedIds.push(riderId);
    safeSetJson(STORAGE_KEYS.DELETED_RIDERS, deletedIds);
  }
}

export function mergeRiders(backendRiders: any[] = []): any[] {
  const customList = safeGetJson<any[]>(STORAGE_KEYS.RIDERS, []);
  const deletedIds = new Set(safeGetJson<string[]>(STORAGE_KEYS.DELETED_RIDERS, []));

  const map = new Map<string, any>();
  for (const r of backendRiders) {
    if (!deletedIds.has(r.id)) {
      map.set(r.id, r);
    }
  }

  for (const r of customList) {
    if (!deletedIds.has(r.id)) {
      const existing = map.get(r.id);
      map.set(r.id, existing ? { ...existing, ...r } : r);
    }
  }

  return Array.from(map.values());
}

// ============================================================================
// USERS
// ============================================================================

export function recordCreatedUser(user: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.USERS, []);
  const filtered = list.filter((u) => u.id !== user.id);
  filtered.unshift(user);
  safeSetJson(STORAGE_KEYS.USERS, filtered);

  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_USERS, []);
  safeSetJson(
    STORAGE_KEYS.DELETED_USERS,
    deletedIds.filter((id) => id !== user.id)
  );
}

export function recordUpdatedUser(userId: string, updates: any) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.USERS, []);
  const idx = list.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
  } else {
    list.unshift({ id: userId, ...updates });
  }
  safeSetJson(STORAGE_KEYS.USERS, list);
}

export function recordDeletedUser(userId: string) {
  const list = safeGetJson<any[]>(STORAGE_KEYS.USERS, []);
  safeSetJson(
    STORAGE_KEYS.USERS,
    list.filter((u) => u.id !== userId)
  );

  const deletedIds = safeGetJson<string[]>(STORAGE_KEYS.DELETED_USERS, []);
  if (!deletedIds.includes(userId)) {
    deletedIds.push(userId);
    safeSetJson(STORAGE_KEYS.DELETED_USERS, deletedIds);
  }
}

export function mergeUsers(backendUsers: any[] = []): any[] {
  const customList = safeGetJson<any[]>(STORAGE_KEYS.USERS, []);
  const deletedIds = new Set(safeGetJson<string[]>(STORAGE_KEYS.DELETED_USERS, []));

  const map = new Map<string, any>();
  for (const u of backendUsers) {
    if (!deletedIds.has(u.id)) {
      map.set(u.id, u);
    }
  }

  for (const u of customList) {
    if (!deletedIds.has(u.id)) {
      const existing = map.get(u.id);
      map.set(u.id, existing ? { ...existing, ...u } : u);
    }
  }

  return Array.from(map.values());
}
