import { DEFAULT_STATE, normalizeState } from './state.js?v=17';
import { fitStage } from './geometry.js?v=17';
import { serializeExportName } from './actions.js?v=17';
import { componentInlineStyle, buildStageSvg } from './view-model.js?v=17';

const DESIGN = { width: 941, height: 1672 };
const stage = document.querySelector('#stage');
const shell = document.querySelector('#stage-shell');
const customPhoto = document.querySelector('#custom-photo');
const customPhotoWrap = document.querySelector('#custom-photo-wrap');
const defaultCharacter = document.querySelector('#default-character');
const toast = document.querySelector('#toast');

const state = normalizeState(DEFAULT_STATE);
let toastTimer = 0;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

function updateScale() {
  const fit = fitStage(window.innerWidth, window.innerHeight, DESIGN.width, DESIGN.height);
  shell.style.width = `${fit.width}px`;
  shell.style.height = `${fit.height}px`;
  stage.style.setProperty('--stage-scale', String(fit.scale || 1));
}

updateScale();

function textTarget(element) {
  if (element.matches('.primary-action, .secondary-action')) return element.querySelector('span:first-child');
  if (element.matches('.capability-chip')) return element.querySelector('span:last-child');
  return element;
}

function bits(className, digits) {
  const element = document.createElement('i');
  element.className = `title-bits ${className}`;
  element.setAttribute('aria-hidden', 'true');
  element.textContent = digits;
  return element;
}

function setTitleText(element, value) {
  element.textContent = '';
  for (const part of String(value).split(/(AI)/)) {
    if (!part) continue;
    if (part !== 'AI') {
      element.append(document.createTextNode(part));
      continue;
    }
    const accent = document.createElement('span');
    accent.className = 'title-ai';
    accent.append(bits('title-bits--top', '0101\n0010'), part, bits('title-bits--bottom', '0010\n1101'));
    element.append(accent);
  }
}

function setElementText(element, value) {
  if (element.matches('.main-title')) {
    setTitleText(element, value);
    return;
  }
  textTarget(element).textContent = value;
}

function renderComponent(id, componentState) {
  const element = stage.querySelector(`[data-component-id="${id}"]`);
  if (!element) return;
  setElementText(element, componentState.text);
  element.style.translate = `${componentState.x}px ${componentState.y}px`;
  element.classList.toggle('is-hidden', componentState.hidden);
  Object.assign(element.style, componentInlineStyle(componentState));
}

function renderPhoto() {
  const guestUrl = guestPhotoFailed ? '' : getGuestPhotoUrl();
  const showGuest = Boolean(guestUrl);
  if (showGuest && customPhoto.dataset.guestSrc !== guestUrl) {
    customPhoto.dataset.guestSrc = guestUrl;
    customPhoto.src = guestUrl;
  }
  const guestReady = showGuest && customPhoto.complete && customPhoto.naturalWidth > 0;
  defaultCharacter.classList.toggle('is-hidden', guestReady);
  customPhotoWrap.classList.toggle('is-active', guestReady);
  customPhotoWrap.classList.toggle('is-guest', guestReady);
  customPhotoWrap.setAttribute('aria-hidden', guestReady ? 'false' : 'true');
}

function render() {
  for (const [id, componentState] of Object.entries(state.components)) renderComponent(id, componentState);
  renderPhoto();
}

function addParticles() {
  const field = document.querySelector('#particles');
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 24; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'particle';
    particle.style.left = `${5 + ((index * 37) % 90)}%`;
    particle.style.top = `${20 + ((index * 53) % 70)}%`;
    particle.style.setProperty('--duration', `${6 + (index % 6)}s`);
    particle.style.setProperty('--delay', `${-(index % 7)}s`);
    particle.style.setProperty('--drift', `${(index % 2 ? 1 : -1) * (8 + index % 18)}px`);
    fragment.append(particle);
  }
  field.append(fragment);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')), { once: true });
    reader.addEventListener('error', () => reject(new Error('图片资源读取失败')), { once: true });
    reader.readAsDataURL(blob);
  });
}

const IMAGE_PROXY_URL = 'https://lmartink.atuofuture.com/api/v1/public/image-proxy';
let guestPhotoFailed = false;
let guestPhotoDataUrl = '';

function getGuestPhotoUrl() {
  const fromQuery = new URLSearchParams(location.search).get('imageUrl');
  return fromQuery && /^https?:\/\//i.test(fromQuery) ? fromQuery : '';
}

function isCrossOriginUrl(href) {
  try {
    return new URL(href, location.href).origin !== location.origin;
  } catch {
    return false;
  }
}

async function fetchImageBlob(href) {
  const attempts = [
    () => fetch(href, { mode: 'cors', credentials: 'omit' }),
    () => fetch(`${IMAGE_PROXY_URL}?url=${encodeURIComponent(href)}`, { credentials: 'omit' }),
  ];
  for (const attempt of attempts) {
    try {
      const response = await attempt();
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) return blob;
    } catch {
      // Try the next source. Direct OSS requests often omit CORS headers.
    }
  }
  throw new Error('图片加载失败');
}

async function preloadGuestPhoto() {
  const href = getGuestPhotoUrl();
  if (!href || !isCrossOriginUrl(href)) return;
  try {
    guestPhotoDataUrl = await blobToDataUrl(await fetchImageBlob(href));
  } catch {
    // The visible image can still load directly; export falls back to that copy.
  }
}

async function inlineCloneImages(clone) {
  const originals = [...stage.querySelectorAll('img')];
  const copies = [...clone.querySelectorAll('img')];
  const guestUrl = getGuestPhotoUrl();
  await Promise.all(originals.map(async (image, index) => {
    const source = image.currentSrc || image.src;
    if (!source || source.startsWith('data:')) {
      if (source) copies[index].src = source;
      return;
    }
    if (guestPhotoDataUrl && guestUrl && (source === guestUrl || image.id === 'custom-photo')) {
      copies[index].src = guestPhotoDataUrl;
      return;
    }
    try {
      const blob = isCrossOriginUrl(source) ? await fetchImageBlob(source) : await (await fetch(source)).blob();
      copies[index].src = await blobToDataUrl(blob);
    } catch (error) {
      if (image.id !== 'custom-photo') throw error;
    }
  }));
}

function pageCssText() {
  return [...document.styleSheets].flatMap((sheet) => {
    try { return [...sheet.cssRules].map((rule) => rule.cssText); }
    catch { return []; }
  }).join('\n');
}

async function renderPosterCanvas() {
  const clone = stage.cloneNode(true);
  clone.style.transform = 'none';
  clone.style.setProperty('--stage-scale', '1');
  await inlineCloneImages(clone);
  const markup = new XMLSerializer().serializeToString(clone);

  const svg = buildStageSvg(markup, pageCssText(), DESIGN.width, DESIGN.height);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', () => reject(new Error('页面合成失败')), { once: true });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = DESIGN.width;
  canvas.height = DESIGN.height;
  canvas.getContext('2d').drawImage(image, 0, 0, DESIGN.width, DESIGN.height);
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('海报生成失败'))), 'image/png');
  });
}

const SHARE_TITLE = '我的 AI 云栖时刻';
const SHARE_TEXT = '来看看我的云栖大会 AI 专属纪念页';
const SHARE_CONFIG_URL = 'https://lmartink.atuofuture.com/api/v1/public/wechat/jssdk-config';
const shareSheet = document.querySelector('#share-sheet');
const sharePosterImg = document.querySelector('#share-poster-img');
const posterPreview = document.querySelector('#poster-preview');
const posterPreviewImg = document.querySelector('#poster-preview-img');
const posterPreviewTip = document.querySelector('#poster-preview-tip');
const shareImageTips = {
  wechat: '长按图片，选择「发送给朋友」',
  moments: '长按图片保存到相册，再到朋友圈发布',
};
let posterBlob = null;
let posterBlobUrl = '';
let posterDataUrl = '';
let wechatShareReady = false;

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function upsertMeta(attrName, attrValue, content) {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.append(meta);
  }
  meta.setAttribute('content', content);
}

function updateShareMeta() {
  const pageUrl = location.href.split('#')[0];
  const imageUrl = getGuestPhotoUrl() || new URL('./assets/back1.png', location.href).href;
  document.title = SHARE_TITLE;
  upsertMeta('name', 'description', SHARE_TEXT);
  upsertMeta('property', 'og:title', SHARE_TITLE);
  upsertMeta('property', 'og:description', SHARE_TEXT);
  upsertMeta('property', 'og:image', imageUrl);
  upsertMeta('property', 'og:url', pageUrl);
  upsertMeta('property', 'og:type', 'website');
  return { pageUrl, imageUrl };
}

function applyWechatShareData(pageUrl, imageUrl) {
  if (!window.wx || !wechatShareReady) return;
  const friendShare = { title: SHARE_TITLE, desc: SHARE_TEXT, link: pageUrl, imgUrl: imageUrl };
  const momentsShare = { title: SHARE_TITLE, link: pageUrl, imgUrl: imageUrl };
  window.wx.updateAppMessageShareData(friendShare);
  window.wx.updateTimelineShareData(momentsShare);
  window.wx.onMenuShareAppMessage?.(friendShare);
  window.wx.onMenuShareTimeline?.(momentsShare);
}

function loadWechatSdk() {
  if (window.wx) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('微信分享组件加载失败'));
    document.head.append(script);
  });
}

async function initWechatShare() {
  if (!isWeChat()) return;
  const { pageUrl, imageUrl } = updateShareMeta();
  try {
    await loadWechatSdk();
    const response = await fetch(`${SHARE_CONFIG_URL}?url=${encodeURIComponent(pageUrl)}`);
    const result = await response.json();
    if (result?.code !== 1 || !result.data) return;
    const config = result.data;
    window.wx.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData', 'onMenuShareAppMessage', 'onMenuShareTimeline'],
    });
    window.wx.ready(() => {
      wechatShareReady = true;
      applyWechatShareData(pageUrl, imageUrl);
    });
    window.wx.error((error) => console.warn('wx.config failed', error));
  } catch {
    // Poster sharing still works when the page is outside the configured WeChat domain.
  }
}

function clearPosterPreview() {
  if (posterBlobUrl) URL.revokeObjectURL(posterBlobUrl);
  posterBlob = null;
  posterBlobUrl = '';
  posterDataUrl = '';
  sharePosterImg.removeAttribute('src');
  posterPreviewImg.removeAttribute('src');
  posterPreview.hidden = true;
}

function closeShareSheet() {
  shareSheet.hidden = true;
  clearPosterPreview();
}

async function showPosterImagePreview(type) {
  if (!posterBlob) return false;
  posterPreviewTip.textContent = shareImageTips[type] || '长按图片保存到相册';
  if (!posterDataUrl) posterDataUrl = await blobToDataUrl(posterBlob);
  posterPreviewImg.src = posterDataUrl;
  posterPreview.hidden = false;
  return true;
}

async function sharePosterFile() {
  if (!posterBlob || !navigator.canShare) return false;
  const file = new File([posterBlob], serializeExportName(SHARE_TITLE, new Date()), { type: 'image/png' });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title: SHARE_TITLE, text: SHARE_TEXT });
  return true;
}

async function handleShare(type) {
  if (!posterBlob) {
    showToast('海报未准备好，请稍后再试');
    return;
  }
  if (isWeChat()) {
    const shown = await showPosterImagePreview(type);
    if (!shown) showToast('海报展示失败，请长按上方图片分享');
    return;
  }
  try {
    if (await sharePosterFile()) return;
  } catch (error) {
    if (error?.name === 'AbortError') return;
  }
  const shown = await showPosterImagePreview(type);
  if (!shown) {
    showToast(type === 'moments' ? '请长按海报保存后发布到朋友圈' : '请长按海报保存后发送给好友');
  }
}

async function sharePage() {
  showToast('正在生成分享海报…');
  try {
    clearPosterPreview();
    posterBlob = await canvasToBlob(await renderPosterCanvas());
    posterBlobUrl = URL.createObjectURL(posterBlob);
    sharePosterImg.src = posterBlobUrl;
    shareSheet.hidden = false;
  } catch (error) {
    showToast(error.message || '海报生成失败，请稍后重试');
  }
}

document.querySelector('#share-button').addEventListener('click', () => { sharePage(); });
document.querySelector('#share-mask').addEventListener('click', closeShareSheet);
document.querySelector('#share-cancel').addEventListener('click', closeShareSheet);
document.querySelector('#poster-preview-mask').addEventListener('click', () => { posterPreview.hidden = true; });
document.querySelector('#poster-preview-close').addEventListener('click', () => { posterPreview.hidden = true; });
document.querySelectorAll('[data-share]').forEach((button) => {
  button.addEventListener('click', () => handleShare(button.dataset.share));
});

document.querySelectorAll('.capability-chip').forEach((chip) => chip.addEventListener('click', () => {
  chip.classList.add('is-lit');
  window.setTimeout(() => chip.classList.remove('is-lit'), 520);
}));

window.addEventListener('resize', updateScale, { passive: true });
window.addEventListener('orientationchange', updateScale, { passive: true });

addParticles();
updateScale();
render();
customPhoto.addEventListener('load', renderPhoto);
customPhoto.addEventListener('error', () => {
  guestPhotoFailed = true;
  renderPhoto();
});
updateShareMeta();
initWechatShare();
preloadGuestPhoto();
