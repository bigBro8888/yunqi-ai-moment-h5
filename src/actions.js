const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function chooseShareAction(capabilities = {}) {
  if (capabilities.share) return 'share';
  if (capabilities.clipboard) return 'clipboard';
  return 'manual';
}

export function editableText(value, maxLength = 120) {
  const limit = Number.isFinite(Number(maxLength)) ? Math.max(0, Number(maxLength)) : 120;
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export function liveEditableText(value, maxLength = 120) {
  const limit = Number.isFinite(Number(maxLength)) ? Math.max(0, Number(maxLength)) : 120;
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

export function serializeExportName(title, now = new Date()) {
  const safeTitle = editableText(title, 60)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/[. ]+$/g, '') || 'yunqi-ai-moment';
  const date = now instanceof Date && !Number.isNaN(now.valueOf()) ? now : new Date();
  const suffix = [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0')].join('');
  return `${safeTitle}-${suffix}.png`;
}

export function readImageFile(file) {
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error('请选择 JPG、PNG 或 WebP 图片'));
  }
  if (!Number.isFinite(file.size) || file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error('图片不能超过 8MB'));
  }
  if (typeof FileReader === 'undefined') {
    return Promise.reject(new Error('当前浏览器无法读取图片'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')), { once: true });
    reader.addEventListener('error', () => reject(new Error('图片读取失败，请重新选择')), { once: true });
    reader.readAsDataURL(file);
  });
}
