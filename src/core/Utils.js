/**
 * Utils - Вспомогательные функции для Windows 11 Web OS
 */

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Форматирование даты
 * @param {number} timestamp - Временная метка
 * @param {boolean} includeTime - Включать ли время
 * @returns {string} Отформатированная дата
 */
export function formatDate(timestamp, includeTime = true) {
  const date = new Date(timestamp);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleString('ru-RU', options);
}

/**
 * Генерация уникального ID
 * @returns {string} Уникальный ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce функция
 * @param {Function} func - Функция для debounce
 * @param {number} wait - Время ожидания в мс
 * @returns {Function} Debounced функция
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функция
 * @param {Function} func - Функция для throttle
 * @param {number} limit - Лимит времени в мс
 * @returns {Function} Throttled функция
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Получение иконки для типа файла
 * @param {string} fileName - Имя файла
 * @param {string} fileType - Тип файла
 * @returns {string} Emoji иконка
 */
export function getFileIcon(fileName, fileType) {
  if (fileType === 'folder') return '📁';
  
  const ext = fileName.split('.').pop().toLowerCase();
  
  const iconMap = {
    // Текстовые
    'txt': '📄',
    'doc': '📝',
    'docx': '📝',
    'pdf': '📕',
    
    // Изображения
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    
    // Видео
    'mp4': '🎬',
    'avi': '🎬',
    'mov': '🎬',
    'mkv': '🎬',
    
    // Аудио
    'mp3': '🎵',
    'wav': '🎵',
    'flac': '🎵',
    
    // Архивы
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    
    // Код
    'js': '📜',
    'html': '📜',
    'css': '📜',
    'json': '📜',
    'py': '📜',
    'java': '📜',
    
    // Таблицы
    'xls': '📊',
    'xlsx': '📊',
    'csv': '📊'
  };
  
  return iconMap[ext] || '📄';
}

/**
 * Получение типа файла по расширению
 * @param {string} fileName - Имя файла
 * @returns {string} Тип файла
 */
export function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const typeMap = {
    'txt': 'text',
    'doc': 'document',
    'docx': 'document',
    'pdf': 'document',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'mp3': 'audio',
    'wav': 'audio',
    'zip': 'archive',
    'rar': 'archive',
    'js': 'code',
    'html': 'code',
    'css': 'code',
    'json': 'code',
    'py': 'code'
  };
  
  return typeMap[ext] || 'unknown';
}

/**
 * Проверка валидности имени файла/папки
 * @param {string} name - Имя
 * @returns {boolean} Валидность
 */
export function isValidFileName(name) {
  // Запрещенные символы в Windows
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  
  // Запрещенные имена в Windows
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                          'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                          'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  
  if (!name || name.trim() === '') return false;
  if (invalidChars.test(name)) return false;
  if (reservedNames.includes(name.toUpperCase())) return false;
  if (name.endsWith('.') || name.endsWith(' ')) return false;
  
  return true;
}

/**
 * Escape HTML для предотвращения XSS
 * @param {string} text - Текст
 * @returns {string} Escaped текст
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Получение относительного времени
 * @param {number} timestamp - Временная метка
 * @returns {string} Относительное время
 */
export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  if (weeks < 4) return `${weeks} нед. назад`;
  if (months < 12) return `${months} мес. назад`;
  return `${years} г. назад`;
}

/**
 * Копирование текста в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<boolean>} Успешность операции
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Скачивание файла
 * @param {string} content - Содержимое файла
 * @param {string} fileName - Имя файла
 * @param {string} mimeType - MIME тип
 */
export function downloadFile(content, fileName, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Получение координат клика относительно элемента
 * @param {MouseEvent} event - Событие мыши
 * @param {HTMLElement} element - Элемент
 * @returns {Object} Координаты {x, y}
 */
export function getRelativePosition(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

/**
 * Ограничение значения в диапазоне
 * @param {number} value - Значение
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Ограниченное значение
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

