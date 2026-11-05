// API клиент для взаимодействия с FastAPI бэкендом

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Вспомогательная функция для формирования правильного URL картинки
 * В базе пути хранятся как "image/items/common-1.png" или "image/cases/..."
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Обработка ответа сервера с детальным извлечением текста ошибки
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Ошибка запроса';
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
      }
    } catch {
      errorDetail = `Ошибка HTTP ${response.status}: ${response.statusText}`;
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * Получить список стартовых аватарок и рамок для регистрации
 */
export async function getStarterItems() {
  const res = await fetch(`${API_BASE}/auth/starter-items`);
  return handleResponse(res);
}

/**
 * Регистрация нового пользователя
 */
export async function registerUser({ username, password, avatarId, frameId }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      avatar_id: avatarId,
      frame_id: frameId,
    }),
  });
  return handleResponse(res);
}

/**
 * Вход пользователя
 */
export async function loginUser({ username, password }) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  return handleResponse(res);
}

/**
 * Получение профиля текущего пользователя
 */
export async function getCurrentUserProfile(token) {
  const res = await fetch(`${API_BASE}/main/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Получение инвентаря пользователя
 */
export async function getUserInventory(token) {
  const res = await fetch(`${API_BASE}/main/inventory`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Смена активной аватарки
 */
export async function equipAvatar(shopItemId, token) {
  const res = await fetch(`${API_BASE}/main/avatar/${shopItemId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Смена активной рамки
 */
export async function equipFrame(shopItemId, token) {
  const res = await fetch(`${API_BASE}/main/frame/${shopItemId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Продажа предмета из инвентаря
 */
export async function sellInventoryItem(inventoryItemId, token) {
  const res = await fetch(`${API_BASE}/shop/sell/${inventoryItemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Получение заданий пользователя
 */
export async function getUserTasks(token) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Забрать награду за выполненное задание
 */
export async function claimTaskReward(userTaskId, token) {
  const res = await fetch(`${API_BASE}/tasks/${userTaskId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Получение списка кейсов
 */
export async function getCases(token) {
  const res = await fetch(`${API_BASE}/cases`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Открытие кейса
 */
export async function openCase(caseId, token) {
  const res = await fetch(`${API_BASE}/cases/${caseId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Получение товаров магазина
 * Backend: GET /shop
 */
export async function getShop(token) {
  const res = await fetch(`${API_BASE}/shop`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Покупка товара в магазине
 * Backend: POST /shop/buy/{shop_item_id}
 */
export async function buyShopItem(shopItemId, token) {
  const res = await fetch(`${API_BASE}/shop/buy/${shopItemId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

/**
 * Получение списка доступных мини-игр
 * Backend: GET /games
 */
export async function getGames(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/games`, {
    method: 'GET',
    headers,
  });
  return handleResponse(res);
}

/**
 * Отправка результата сыгранной мини-игры
 * Backend: POST /games/{game_type}
 * Body: { result_value: number }
 */
export async function submitGameResult(gameType, resultValue, token) {
  const res = await fetch(`${API_BASE}/games/${gameType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ result_value: resultValue }),
  });
  return handleResponse(res);
}

