export const STORAGE_KEY = 'yunqi-ai-moment-state-v1';

export function safeStorage(environment = globalThis) {
  try {
    return environment?.localStorage ?? null;
  } catch {
    return null;
  }
}

const component = (text, x, y, extras = {}) => ({
  text,
  x,
  y,
  hidden: false,
  ...extras,
});

export const DEFAULT_STATE = Object.freeze({
  version: 1,
  photoMode: 'person',
  customPhoto: '',
  components: Object.freeze({
    eyebrow: component('云栖大会 AI 互动体验', 0, 0),
    title: component('我的 AI 云栖时刻', 0, 0, { fontSize: 82, align: 'center' }),
    subtitle: component('让这一刻，被 AI 记录', 0, 0, { fontSize: 38, color: '#092f78', align: 'center' }),
    share: component('分享我的云栖时刻', 0, 0),
    support: component('安墨客提供 AI 技术支持', 0, 0),
    slogan: component('AI 让空间更智能，让运营更简单', 0, 0),
    capability1: component('RFID精准感知', 0, 0),
    capability2: component('智慧展厅', 0, 0),
    capability3: component('空间智能运营', 0, 0),
    capability4: component('IoT智能硬件', 0, 0),
    capability5: component('现场签到识别', 0, 0),
    capability6: component('访客轨迹洞察', 0, 0),
    capability7: component('展项智能联动', 0, 0),
  }),
});

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_STATE));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const cleanText = (value, fallback) => typeof value === 'string' ? value.slice(0, 120) : fallback;

function normalizeComponent(candidate, fallback) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ...fallback };
  const aligns = new Set(['left', 'center', 'right']);
  return {
    ...fallback,
    text: cleanText(candidate.text, fallback.text),
    x: finite(candidate.x, fallback.x),
    y: finite(candidate.y, fallback.y),
    hidden: typeof candidate.hidden === 'boolean' ? candidate.hidden : fallback.hidden,
    ...(fallback.fontSize !== undefined || candidate.fontSize !== undefined
      ? { fontSize: Math.min(140, Math.max(12, finite(candidate.fontSize, fallback.fontSize ?? 24))) }
      : {}),
    ...(fallback.color !== undefined || candidate.color !== undefined
      ? { color: /^#[0-9a-f]{6}$/i.test(candidate.color ?? '') ? candidate.color : (fallback.color ?? '#093278') }
      : {}),
    ...(fallback.align !== undefined || candidate.align !== undefined
      ? { align: aligns.has(candidate.align) ? candidate.align : (fallback.align ?? 'center') }
      : {}),
  };
}

export function normalizeState(value) {
  const normalized = cloneDefaults();
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return normalized;

  if (['person', 'empty', 'custom'].includes(value.photoMode)) normalized.photoMode = value.photoMode;
  if (typeof value.customPhoto === 'string' && value.customPhoto.startsWith('data:image/')) {
    normalized.customPhoto = value.customPhoto;
  }
  if (!value.components || typeof value.components !== 'object' || Array.isArray(value.components)) return normalized;

  for (const [id, fallback] of Object.entries(DEFAULT_STATE.components)) {
    normalized.components[id] = normalizeComponent(value.components[id], fallback);
  }
  return normalized;
}

export function loadState(storage) {
  try {
    const target = storage === undefined ? safeStorage() : storage;
    const raw = target?.getItem?.(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : normalizeState(null);
  } catch {
    return normalizeState(null);
  }
}

export function saveState(storage, state) {
  try {
    const target = storage === undefined ? safeStorage() : storage;
    if (!target?.setItem) return false;
    target.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
    return true;
  } catch {
    return false;
  }
}

export function updateComponent(state, id, patch) {
  const current = normalizeState(state);
  if (!Object.hasOwn(current.components, id)) return current;
  return {
    ...current,
    components: {
      ...current.components,
      [id]: normalizeComponent({ ...current.components[id], ...patch }, DEFAULT_STATE.components[id]),
    },
  };
}
