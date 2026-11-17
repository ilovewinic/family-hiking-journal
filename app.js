'use strict';

const $ = (id) => document.getElementById(id);
const REGION_OPTIONS = ['서울','인천','경기','강원','충북','충남','대전','경북','대구','경남','부산','울산','전북','전남','광주','제주','기타'];
const PHOTO_KIND = { summit: '정상 인증', trail: '산행', food: '식당·음식' };

// 공식 명산 목록(산 이름 기준). 명산100+는 포함하지 않습니다.
// 산림청 100대 명산: 산림청 공식 안내서의 목차 기준.
// BAC 명산100: BAC 공식 프로그램 안내와 2026-09-17 공개 목록을 대조한 정적 목록.
const FOREST_100_NAMES = ["가리산","가리왕산","가야산","가지산","감악산","강천산","계룡산","계방산","공작산","관악산","구병산","금산","금수산","금오산","금정산","깃대봉","남산","내연산","내장산","대둔산","대암산","대야산","덕숭산(수덕산)","덕유산","덕항산","도락산","도봉산","두륜산","두타산","마니산","마이산","명성산","명지산","모악산","무등산","무학산","미륵산","민주지산","방장산","방태산","백덕산","백암산","백운산(포천)","백운산(광양)","백운산(정선)","변산","북한산","비슬산","삼악산","서대산","선운산","설악산","성인봉","소백산","소요산","속리산","신불산","연화산","오대산","오봉산","용문산","용화산","운문산","운악산","운장산","월악산","월출산","유명산","응봉산","장안산","재약산","적상산","점봉산","조계산","주왕산","주흘산","지리산","지리산(동영)","천관산","천마산","천성산","천태산","청량산","추월산","축령산","치악산","칠갑산","태백산","태화산","팔공산","팔봉산","팔영산","한라산","화악산","화왕산","황매산","황석산","황악산","황장산","희양산"];
const BAC_100_NAMES = ["가리산(홍천)","가리왕산","가야산(경상)","가야산(충남)","가지산","감악산(원주)","감악산(파주)","계룡산","계방산","관악산","광덕산","구병산(보은)","구봉산(진안)","금수산","금오산(구미)","금정산","남산(경주)","내변산(변산)","내연산","내장산","달마산","대둔산","대야산","덕룡산","덕유산","덕항산","도락산","도봉산","동악산(곡성)","두륜산","두타산","마니산(강화도)","마이산(진안)","명지산","모악산","무등산","민주지산","지리산 바래봉","지리산 반야봉","방장산","방태산","백덕산","백암산","백운산(광양)","백운산(동강)","북한산","불갑산(영광)","비슬산","삼악산","선운산","설악산","소백산","소요산","속리산","수락산","신불산","연인산","오대산 비로봉","오대산 노인봉","오봉산(춘천)","오서산(보령)","용문산(양평)","용봉산(홍성)","용화산","운악산","운장산","월악산","월출산","유명산","응봉산","장안산","재약산","조계산","조령산","주왕산","주흘산","지리산","천관산","천마산","천성산","천태산","청계산","청량산","청화산","축령산(장성)","치악산","칠갑산(청양)","칠보산(괴산)","태백산","태화산","팔공산","팔봉산(홍천)","팔영산","한라산","함백산","화악산(가평)","화왕산(창녕)","황매산(산청)","황석산(함양)","황악산(김천)"];

// 괄호 안의 지역명이나 인증 봉우리 표기는 빼고 기본 산 이름을 별칭으로도 인식합니다.
// 실제 방문지는 산 단위로 중복 제거하므로, 같은 산을 여러 번 가도 방문 수는 1곳입니다.
const MOUNTAIN_EXTRA_ALIASES = {
  '금산':['남해금산'], '남산':['경주남산'], '백운산':['포천백운산','광양백운산','정선백운산','동강백운산'],
  '축령산':['남양주축령산','가평축령산','장성축령산'], '가야산':['경상가야산','충남가야산'],
  '감악산':['원주감악산','파주감악산'], '구병산':['보은구병산'], '금오산':['구미금오산'],
  '오봉산':['춘천오봉산'], '오서산':['보령오서산'], '용문산':['양평용문산'], '용봉산':['홍성용봉산'],
  '칠갑산':['청양칠갑산'], '칠보산':['괴산칠보산'], '팔봉산':['홍천팔봉산'], '화악산':['가평화악산'],
  '화왕산':['창녕화왕산'], '황매산':['산청황매산'], '황석산':['함양황석산'], '황악산':['김천황악산'],
  '오대산':['오대산비로봉','오대산노인봉'], '지리산':['지리산바래봉','지리산반야봉'], '변산':['내변산']
};
function normalizeMountainName(value) {
  return String(value || '').toLowerCase().replace(/[\s·ㆍ,，]/g, '').replace(/[()（）\[\]【】]/g, '');
}
function mountainNameVariants(value) {
  const raw = String(value || '').trim();
  const variants = new Set();
  if (!raw) return variants;
  variants.add(normalizeMountainName(raw));
  variants.add(normalizeMountainName(raw.replace(/\([^)]*\)|（[^）]*）/g, '')));
  variants.add(normalizeMountainName(raw.replace(/\s*(정상|산행|등산)$/g, '')));
  variants.add(normalizeMountainName(raw.replace(/\([^)]*\)|（[^）]*）/g, '').replace(/\s*(정상|산행|등산)$/g, '')));
  return variants;
}
function mountainEntryParts(displayName) {
  const withoutParen = String(displayName).replace(/\([^)]*\)|（[^）]*）/g, '').trim();
  const base = withoutParen.replace(/\s+(비로봉|노인봉|바래봉|반야봉)$/g, '').trim();
  const aliases = new Set([normalizeMountainName(displayName), normalizeMountainName(withoutParen), normalizeMountainName(base)]);
  const parens = [...String(displayName).matchAll(/\(([^)]+)\)|（([^）]+)）/g)];
  parens.forEach(m => {
    const inside = m[1] || m[2] || '';
    if (['수덕산','변산'].includes(inside)) aliases.add(normalizeMountainName(inside));
  });
  if (String(displayName).includes('지리산 ') || String(displayName).startsWith('오대산 ')) aliases.add(normalizeMountainName(base));
  const group = normalizeMountainName(base === '내변산' ? '변산' : base);
  (MOUNTAIN_EXTRA_ALIASES[group] || []).forEach(alias => aliases.add(normalizeMountainName(alias)));
  return { displayName, group, aliases };
}
const FOREST_100_ENTRIES = FOREST_100_NAMES.map(mountainEntryParts);
const BAC_100_ENTRIES = BAC_100_NAMES.map(mountainEntryParts);
function isKnownRegionMismatch(record, program) {
  const name = normalizeMountainName(record?.name);
  const region = String(record?.region || '').trim();
  // 같은 산 이름을 쓰지만 실제 대상 산이 다른 경우는 지역/괄호 표기로 구분합니다.
  if (name.includes('축령산')) {
    const jangseong = name.includes('장성') || region === '전남';
    const gyeonggi = name.includes('남양주') || name.includes('가평') || region === '경기';
    if (program === 'forest' && jangseong) return true;
    if (program === 'bac' && gyeonggi) return true;
  }
  if (name.includes('백운산') && program === 'bac') {
    if (name.includes('포천') || region === '경기') return true;
    if (name.includes('정선') && !name.includes('동강')) return true;
  }
  if (name.includes('백운산') && program === 'forest' && name.includes('동강')) return true;
  if (name.includes('가야산') && program === 'forest' && (name.includes('충남') || region === '충남')) return true;
  if (name.includes('감악산') && program === 'forest' && (name.includes('원주') || region === '강원')) return true;
  if (name.includes('남산') && !name.includes('경주') && region && region !== '경북') {
    if (program === 'forest' || program === 'bac') return true;
  }
  if (name.includes('금산') && program === 'forest' && region && region !== '경남' && !name.includes('남해')) return true;
  return false;
}
function matchMountainList(record, entries, program) {
  if (isKnownRegionMismatch(record, program)) return new Set();
  const variants = mountainNameVariants(record?.name);
  const extra = MOUNTAIN_EXTRA_ALIASES[normalizeMountainName(String(record?.name || '').replace(/\([^)]*\)|（[^）]*）/g, '').trim())] || [];
  extra.forEach(alias => variants.add(normalizeMountainName(alias)));
  const matches = entries.filter(entry => [...entry.aliases].some(alias => variants.has(alias)));
  return new Set(matches.map(entry => entry.group));
}
function getMountainListStatus(record) {
  const forestGroups = matchMountainList(record, FOREST_100_ENTRIES, 'forest');
  const bacGroups = matchMountainList(record, BAC_100_ENTRIES, 'bac');
  return { forest: forestGroups.size > 0, bac: bacGroups.size > 0, forestGroups, bacGroups };
}
function mountainBadgeHtml(record, extraClass = '') {
  const status = getMountainListStatus(record);
  const badges = [];
  if (status.forest) badges.push('<span class="mountain-badge forest-badge">산림청 100대</span>');
  if (status.bac) badges.push('<span class="mountain-badge bac-badge">블랙야크 명산100</span>');
  return badges.length ? `<div class="mountain-badges ${extraClass}">${badges.join('')}</div>` : '';
}
function renderMountainProgress() {
  const forestVisited = new Set();
  const bacVisited = new Set();
  const sharedVisited = new Set();
  records.forEach(record => {
    const status = getMountainListStatus(record);
    status.forestGroups.forEach(group => forestVisited.add(group));
    status.bacGroups.forEach(group => bacVisited.add(group));
    if (status.forest && status.bac) {
      const common = [...status.forestGroups].filter(group => status.bacGroups.has(group));
      common.forEach(group => sharedVisited.add(group));
    }
  });
  $('forest-visited-count').textContent = `${forestVisited.size}곳`;
  $('bac-visited-count').textContent = `${bacVisited.size}곳`;
  $('shared-visited-count').textContent = `${sharedVisited.size}곳`;
  $('mountain-progress-note').textContent = records.length
    ? '저장된 산행 기록의 산 이름을 기준으로 자동 집계합니다. 같은 산의 반복 산행은 1곳으로 계산합니다. 이름이 같은 다른 산은 지역도 입력해 주세요. 블랙야크 공식 인증 완료 여부와는 별개입니다.'
    : '산행 기록을 추가하면 해당 명산 목록에 포함되는 산의 방문 수가 자동으로 표시됩니다.';
}
let records = [];
let activeRegion = 'all';
let activeNav = 'all';
let sortMode = 'date-desc';
let draftPhotos = [];
let editingOriginal = null;
let cloudClient = null;
let cloudUser = null;
let cloudMode = false;
let cloudRole = 'local';
let isOwner = true;
let realtimeChannel = null;
let authMode = 'login';
let toastTimer = null;
let hikingMap = null;
let hikingMapLayer = null;
let albumMode = 'all';
let albumSeason = 'all';
let albumYear = 'all';
let albumMonth = 'all';
let albumPerson = 'all';
let signedUrlRefreshTimer = null;

const DB_NAME = 'my-hiking-journal-v1';
const DB_STORE = 'records';

function isCloudConfigured() {
  const cfg = window.SUPABASE_CONFIG || {};
  return Boolean(cfg.url && cfg.anonKey && /^https:\/\//.test(cfg.url) && !cfg.url.includes('YOUR_PROJECT') && !cfg.anonKey.includes('YOUR_SUPABASE'));
}

function openLocalDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('브라우저 저장소를 열 수 없습니다.'));
  });
}
async function localGetAll() {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function localPut(record) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(record);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function localDelete(id) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function localPutMany(items) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('복원 내용을 저장하지 못했습니다.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('복원 작업이 취소되었습니다.')); };
  });
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function cleanPhoto(photo) {
  const out = { id: photo.id || makeId(), category: photo.category || 'trail' };
  if (photo.caption) out.caption = photo.caption;
  if (photo.isCover) out.isCover = true;
  if (photo.dataUrl) out.dataUrl = photo.dataUrl;
  if (photo.path) out.path = photo.path;
  if (photo.originalDataUrl) out.originalDataUrl = photo.originalDataUrl;
  if (photo.originalPath) out.originalPath = photo.originalPath;
  if (photo.originalName) out.originalName = photo.originalName;
  return out;
}
function cleanRecord(record) {
  const out = { ...record };
  out.photos = (record.photos || []).map(cleanPhoto);
  delete out.previewUrl;
  return out;
}
function makeId() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `hike-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(date, style = 'long') {
  if (!date) return '날짜 미기록';
  const parts = String(date).split('-');
  if (parts.length !== 3) return esc(date);
  const [y,m,d] = parts;
  return style === 'short' ? `${y.slice(-2)}.${m}.${d}` : `${y}.${m}.${d}`;
}
function dateForInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function calculateDuration(start, end) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(v => !Number.isFinite(v))) return '';
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // 자정을 넘어 하산한 경우
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}시간 ${mins}분`;
  if (hours) return `${hours}시간`;
  return `${mins}분`;
}
function updateDurationPreview() {
  const start = $('field-start').value;
  const end = $('field-end').value;
  if (start && end) {
    $('field-duration').value = calculateDuration(start, end);
  } else {
    $('field-duration').value = '출발·하산 시간을 모두 입력해 주세요';
  }
}
function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
function openModal(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(id) {
  $(id).hidden = true;
  if (![...document.querySelectorAll('.modal-backdrop')].some(el => !el.hidden)) document.body.style.overflow = '';
}
function setStorageStatus(label, cloud) {
  $('sync-label').textContent = label;
  $('sync-status').classList.toggle('cloud', Boolean(cloud));
}
function safeText(v) { return v === undefined || v === null ? '' : String(v); }

async function init() {
  bindEvents();
  window.addEventListener('focus', refreshSignedPhotoUrls);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshSignedPhotoUrls(); });
  if (isCloudConfigured() && window.supabase?.createClient) {
    try {
      cloudClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      // 인증 링크 복귀 이벤트를 getSession 처리 전에 등록해 비밀번호 재설정 신호를 놓치지 않습니다.
      cloudClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          cloudUser = null; cloudRole = 'pending'; isOwner = false; records = []; setAuthMode('login'); applyPermissions();
          render(); setStorageStatus('로그인 필요', true); openModal('auth-backdrop');
        } else if (event === 'PASSWORD_RECOVERY') {
          $('auth-tabs').hidden = true; $('auth-form').hidden = true; $('auth-reset-link').hidden = true;
          $('password-change-panel').hidden = true; $('password-recovery-panel').hidden = false;
          $('auth-message').textContent = '새 비밀번호를 입력해 주세요.'; openModal('auth-backdrop');
        }
      });
      cloudMode = true;
      setStorageStatus('클라우드 연결', true);
      if (signedUrlRefreshTimer) clearInterval(signedUrlRefreshTimer);
      signedUrlRefreshTimer = setInterval(refreshSignedPhotoUrls, 40 * 60 * 1000);
      $('storage-notice-text').textContent = '클라우드 모드가 설정되어 있습니다. 같은 계정으로 로그인한 기기에서 기록을 함께 볼 수 있습니다.';
      const { data, error } = await cloudClient.auth.getSession();
      if (error) throw error;
      if (data.session?.user) {
        cloudUser = data.session.user;
        await establishCloudRole();
        await loadCloudRecords();
        closeModal('auth-backdrop');
      } else {
        applyPermissions();
        setStorageStatus('로그인 필요', true);
        openModal('auth-backdrop');
      }
    } catch (err) {
      console.error(err);
      if (cloudClient) {
        cloudMode = true; cloudUser = null; isOwner = false; applyPermissions();
        setStorageStatus('클라우드 확인 필요', true);
        $('storage-notice').hidden = false;
        $('storage-notice-text').textContent = `클라우드 로그인 또는 계정 권한을 확인해 주세요: ${err.message || '연결 오류'}`;
        openModal('auth-backdrop');
        showToast('클라우드 계정 확인이 필요합니다.', true);
      } else {
        cloudMode = false;
        setStorageStatus('이 기기에 저장', false);
        await loadLocalRecords();
        showToast('클라우드 라이브러리를 불러오지 못해 이 기기 저장 모드로 열었습니다.', true);
      }
    }
  } else {
    cloudMode = false;
    setStorageStatus('이 기기에 저장', false);
    await loadLocalRecords();
  }
  render();
}

async function loadLocalRecords() {
  try {
    records = (await localGetAll()).map(r => ({ ...r, photos: (r.photos || []).map(p => ({...p, previewUrl: p.dataUrl || ''})) }));
    $('storage-notice').hidden = false;
    $('storage-notice-text').textContent = '현재 이 브라우저에 저장됩니다. 다른 기기와 자동으로 공유하려면 클라우드 동기화 설정이 필요합니다.';
  } catch (err) {
    console.error(err);
    records = [];
    showToast('브라우저 저장소를 사용할 수 없습니다. 다른 브라우저에서 열어주세요.', true);
  }
}
async function establishCloudRole() {
  let { data, error } = await cloudClient.rpc('get_my_hike_role');
  if (error) throw error;
  if (data === 'pending') {
    const claim = await cloudClient.rpc('claim_hike_owner');
    if (claim.error) throw claim.error;
    ({ data, error } = await cloudClient.rpc('get_my_hike_role'));
    if (error) throw error;
  }
  if (!['owner','family'].includes(data)) throw new Error('이 계정은 산행기록장에 등록되지 않았습니다. 관리자에게 가족 초대를 요청해 주세요.');
  cloudRole = data;
  isOwner = data === 'owner';
  applyPermissions();
}
function applyPermissions() {
  ['add-record-btn','empty-add-btn','backup-btn','footer-backup-btn'].forEach(id => { const el=$(id); if(el) el.hidden = !isOwner; });
  const familyBtn = $('family-manage-btn'); if (familyBtn) familyBtn.hidden = !isOwner;
  const logoutBtn = $('logout-btn'); if (logoutBtn) logoutBtn.hidden = !cloudMode || !cloudUser;
  const passwordBtn = $('change-password-btn'); if (passwordBtn) passwordBtn.hidden = !cloudMode || !cloudUser;
  const profileBtn = $('account-profile-btn'); if (profileBtn) profileBtn.hidden = !cloudMode || !cloudUser;
  updateAccountDisplayName();
  document.body.classList.toggle('family-reader', cloudMode && !isOwner);
}
async function loadCloudRecords() {
  if (!cloudClient || !cloudUser) return;
  const { data, error } = await cloudClient.from('hike_records').select('id, owner_id, record, updated_at').order('updated_at', { ascending: false });
  if (error) throw error;
  records = await Promise.all((data || []).map(async row => hydrateCloudRecord(row.record || {})));
  $('storage-notice').hidden = false;
  $('storage-notice-text').textContent = isOwner
    ? '클라우드 동기화 중 · 관리자 계정입니다. 이 계정에서만 산행 기록을 작성·수정할 수 있습니다.'
    : '가족 열람 모드 · 산행 기록과 사진을 볼 수 있지만 작성·수정·삭제는 할 수 없습니다.';
  applyPermissions();
  render();
  subscribeToChanges();
}
function subscribeToChanges() {
  if (realtimeChannel || !cloudClient) return;
  realtimeChannel = cloudClient.channel('hike-records-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hike_records' }, () => loadCloudRecords().catch(err => console.warn('동기화 새로고침 실패', err)))
    .subscribe();
}
async function hydrateCloudRecord(input) {
  const record = { ...input, photos: [] };
  for (const raw of (input.photos || [])) {
    const photo = cleanPhoto(raw);
    if (photo.path && cloudClient) {
      const { data, error } = await cloudClient.storage.from('hike-photos').createSignedUrl(photo.path, 60 * 60);
      if (!error && data?.signedUrl) {
        photo.previewUrl = data.signedUrl;
        photo.previewExpiresAt = Date.now() + 55 * 60 * 1000;
      }
    } else if (photo.dataUrl) photo.previewUrl = photo.dataUrl;
    record.photos.push(photo);
  }
  return record;
}
async function refreshSignedPhotoUrls() {
  if (!cloudMode || !cloudClient || !cloudUser || document.hidden) return;
  let changed = false;
  for (const record of records) {
    for (const photo of (record.photos || [])) {
      if (!photo.path || (photo.previewExpiresAt && photo.previewExpiresAt > Date.now() + 5 * 60 * 1000)) continue;
      try {
        const { data, error } = await cloudClient.storage.from('hike-photos').createSignedUrl(photo.path, 60 * 60);
        if (error) throw error;
        if (data?.signedUrl) {
          photo.previewUrl = data.signedUrl;
          photo.previewExpiresAt = Date.now() + 55 * 60 * 1000;
          changed = true;
        }
      } catch (err) { console.warn('사진 주소 갱신 실패:', err); }
    }
  }
  if (changed) { renderCards(); renderAlbum(); renderHikingMap(); if (!$('detail-backdrop').hidden) { const openId = $('detail-content').dataset.recordId; if (openId) openDetail(openId); } }
}

function updateAccountDisplayName() {
  const pill=$('account-display-name');
  if (!pill) return;
  const email=cloudUser?.email || '';
  const display=String(cloudUser?.user_metadata?.display_name || '').trim() || (email ? email.split('@')[0] : '');
  pill.textContent=display;
  pill.hidden = !(cloudMode && Boolean(cloudUser) && Boolean(display));
}
function openProfile() {
  if (!cloudUser) return;
  $('profile-display-name').value=String(cloudUser.user_metadata?.display_name || '').trim();
  $('profile-status').textContent='';
  openModal('profile-backdrop');
}
async function saveProfile(event) {
  event.preventDefault();
  const name=$('profile-display-name').value.trim();
  if (!name) { $('profile-status').textContent='표시할 이름을 입력해 주세요.'; return; }
  const btn=$('profile-save-btn'); btn.disabled=true; btn.textContent='저장 중…';
  try {
    const {data,error}=await cloudClient.auth.updateUser({data:{display_name:name}});
    if(error) throw error;
    cloudUser=data.user || {...cloudUser,user_metadata:{...cloudUser.user_metadata,display_name:name}};
    updateAccountDisplayName(); closeModal('profile-backdrop'); showToast('계정 표시 이름을 저장했습니다.');
  } catch(err) { $('profile-status').textContent=`이름 저장 실패: ${err.message||''}`; }
  finally { btn.disabled=false; btn.textContent='이름 저장'; }
}

function bindEvents() {
  $('add-record-btn').addEventListener('click', () => openForm());
  $('family-manage-btn').addEventListener('click', openFamilyManager);
  $('family-add-form').addEventListener('submit', addFamilyMember);
  $('family-backdrop').addEventListener('click', (e) => { if (e.target === $('family-backdrop')) closeModal('family-backdrop'); });
  $('profile-backdrop').addEventListener('click', (e) => { if (e.target === $('profile-backdrop')) closeModal('profile-backdrop'); });
  $('account-profile-btn').addEventListener('click', openProfile);
  $('profile-form').addEventListener('submit', saveProfile);
  $('logout-btn').addEventListener('click', async () => { if (cloudClient) await cloudClient.auth.signOut(); });
  $('empty-add-btn').addEventListener('click', () => openForm());
  $('nav-all').addEventListener('click', () => setNav('all'));
  $('nav-restaurant').addEventListener('click', () => setNav('restaurant'));
  $('nav-stats').addEventListener('click', () => setNav('stats'));
  $('nav-album').addEventListener('click', () => setNav('album'));
  document.querySelectorAll('[data-album-mode]').forEach(btn => btn.addEventListener('click', () => { albumMode = btn.dataset.albumMode; renderAlbum(); }));
  document.querySelectorAll('[data-album-season]').forEach(btn => btn.addEventListener('click', () => { albumSeason = btn.dataset.albumSeason; renderAlbum(); }));
  $('album-person-filter').addEventListener('change', e => { albumPerson = e.target.value; renderAlbum(); });
  $('album-year-tabs').addEventListener('click', e => { const btn=e.target.closest('[data-album-year]'); if(!btn)return; albumYear=btn.dataset.albumYear; albumMonth='all'; renderAlbum(); });
  $('album-month-tabs').addEventListener('click', e => { const btn=e.target.closest('[data-album-month]'); if(!btn)return; albumMonth=btn.dataset.albumMonth; renderAlbum(); });
  $('search-input').addEventListener('input', renderCards);
  $('sort-select').addEventListener('change', e => { sortMode = e.target.value; renderCards(); });
  $('record-form').addEventListener('submit', saveForm);
  $('field-start').addEventListener('input', updateDurationPreview);
  $('field-end').addEventListener('input', updateDurationPreview);
  $('summit-photos-input').addEventListener('change', e => addPhotoFiles(e.target.files, 'summit'));
  $('trail-photos-input').addEventListener('change', e => addPhotoFiles(e.target.files, 'trail'));
  $('food-photos-input').addEventListener('change', e => addPhotoFiles(e.target.files, 'food'));
  $('backup-btn').addEventListener('click', () => openBackup());
  $('footer-backup-btn').addEventListener('click', () => openBackup());
  $('export-btn').addEventListener('click', exportBackup);
  $('import-file-input').addEventListener('change', importBackup);
  $('setup-help-btn').addEventListener('click', () => openModal('help-backdrop'));
  $('help-backup-btn').addEventListener('click', () => { closeModal('help-backdrop'); openBackup(); });
  $('auth-login-tab').addEventListener('click', () => setAuthMode('login'));
  $('auth-signup-tab').addEventListener('click', () => setAuthMode('signup'));
  $('auth-form').addEventListener('submit', submitAuth);
  $('auth-reset-link').addEventListener('click', sendPasswordReset);
  $('save-new-password-btn').addEventListener('click', completePasswordRecovery);
  $('save-changed-password-btn').addEventListener('click', changePassword);
  $('change-password-btn').addEventListener('click', () => { $('auth-message').textContent = ''; $('auth-tabs').hidden = true; $('auth-form').hidden = true; $('auth-reset-link').hidden = true; $('password-recovery-panel').hidden = true; $('password-change-panel').hidden = false; openModal('auth-backdrop'); });
  $('form-backdrop').addEventListener('click', (e) => { if (e.target === $('form-backdrop')) closeModal('form-backdrop'); });
  $('detail-backdrop').addEventListener('click', (e) => { if (e.target === $('detail-backdrop')) closeModal('detail-backdrop'); });
  $('detail-content').addEventListener('click', e => { const download = e.target.closest('[data-download-photo]'); if (download) { downloadPhotoById(download.dataset.downloadPhoto).catch(err=>showToast(`사진 저장 실패: ${err.message||''}`,true)); return; } const img = e.target.closest('.zoomable-photo'); if (img) openPhotoViewer(img); });
  $('lightbox-close').addEventListener('click', closePhotoViewer);
  $('lightbox-prev').addEventListener('click', () => movePhotoViewer(-1));
  $('lightbox-next').addEventListener('click', () => movePhotoViewer(1));
  $('photo-lightbox').addEventListener('click', e => { if (e.target === $('photo-lightbox')) closePhotoViewer(); });
  $('lightbox-zoom-in').addEventListener('click', () => setPhotoZoom(photoZoom * 1.5));
  $('lightbox-zoom-out').addEventListener('click', () => setPhotoZoom(photoZoom / 1.5));
  $('lightbox-zoom-reset').addEventListener('click', resetPhotoZoom);
  setupPhotoZoom();
  $('backup-backdrop').addEventListener('click', (e) => { if (e.target === $('backup-backdrop')) closeModal('backup-backdrop'); });
  $('help-backdrop').addEventListener('click', (e) => { if (e.target === $('help-backdrop')) closeModal('help-backdrop'); });
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  document.addEventListener('keydown', e => { if (!$('photo-lightbox').hidden) { if (e.key === 'Escape') closePhotoViewer(); else if (e.key === 'ArrowRight') movePhotoViewer(1); else if (e.key === 'ArrowLeft') movePhotoViewer(-1); return; } if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => closeModal(m.id)); });
}

function setNav(nav) {
  activeNav = nav;
  $('nav-all').classList.toggle('active', nav === 'all');
  $('nav-restaurant').classList.toggle('active', nav === 'restaurant');
  $('nav-stats').classList.toggle('active', nav === 'stats');
  $('nav-album').classList.toggle('active', nav === 'album');
  $('page-title').textContent = nav === 'restaurant' ? '산행 맛집 기록' : nav === 'stats' ? '나의 산행 통계' : nav === 'album' ? '가족 산행 앨범' : '전체 산행 기록';
  $('page-subtitle').textContent = nav === 'restaurant'
    ? '산행 후 들른 식당과 먹었던 메뉴를 모아보세요.'
    : nav === 'stats' ? '누적 거리와 시간, 연도별·월별 산행을 돌아보세요.'
    : nav === 'album' ? '계절마다 쌓인 풍경과 가족 산행 사진을 모아봅니다.'
    : '직접 걸은 길과 그날의 풍경, 하산 후 맛있게 먹은 한 끼까지.';
  $('mountain-progress-section').hidden = nav === 'restaurant' || nav === 'album';
  $('expanded-stats-section').hidden = nav !== 'stats';
  $('album-section').hidden = nav !== 'album';
  $('storage-notice').hidden = nav === 'album' || nav === 'stats';
  const nonListPage = nav === 'album' || nav === 'stats';
  $('toolbar').hidden = nonListPage;
  $('filter-row').hidden = nonListPage;
  $('results-line').hidden = nonListPage;
  $('record-grid').hidden = nonListPage;
  $('empty-state').hidden = nonListPage || getFilteredRecords().length > 0;
  renderCards();
  renderAdvancedStats();
  renderAlbum();
  renderHikingMap();
  if (nav === 'stats') setTimeout(() => $('expanded-stats-section').scrollIntoView({behavior:'smooth',block:'start'}), 50);
}

const MOUNTAIN_COORDS = {
  '마니산':[37.6285,126.4315], '소요산':[37.9364,127.0872], '태백산':[37.0968,128.9152],
  '계양산':[37.55,126.724], '청계산':[37.427,127.056], '광교산':[37.329,127.032],
  '고려산':[37.783,126.424], '함백산':[37.161,128.917], '오대산':[37.798,128.543],
  '주왕산':[36.389,129.161], '무등산':[35.134,126.988], '감악산':[37.936,126.965],
  '북한산':[37.658,126.977], '관악산':[37.445,126.964], '도봉산':[37.695,127.015],
  '설악산':[38.1197,128.4654], '한라산':[33.3617,126.5292], '지리산':[35.3369,127.7306],
  '덕유산':[35.8612,127.7462], '소백산':[36.9579,128.4846], '치악산':[37.3653,128.0559],
  '월악산':[36.8862,128.1016], '속리산':[36.5439,127.8705], '내장산':[35.485,126.889],
  '선운산':[35.493,126.575], '대둔산':[36.12,127.319], '계룡산':[36.35,127.205],
  '대야산':[36.685,127.95], '희양산':[36.73,128.01], '민주지산':[36.055,127.85],
  '도락산':[36.856,128.31], '금수산':[36.987,128.26], '주흘산':[36.795,128.10],
  '황장산':[36.85,128.22], '청량산':[36.79,128.91], '팔공산':[36.014,128.696],
  '비슬산':[35.715,128.511], '가야산':[35.822,128.117], '금오산':[36.091,128.314],
  '금정산':[35.282,129.049], '가지산':[35.62,129.00], '신불산':[35.54,129.05],
  '재약산':[35.55,128.98], '천성산':[35.416,129.104], '황석산':[35.673,127.811],
  '황악산':[36.116,128.0], '내연산':[36.256,129.284], '월출산':[34.766,126.706],
  '두륜산':[34.471,126.626], '천관산':[34.539,126.914], '팔영산':[34.622,127.408],
  '조계산':[34.988,127.292], '모악산':[35.729,127.088], '변산':[35.65,126.58],
  '강천산':[35.407,127.047], '덕숭산':[36.67,126.62], '오서산':[36.45,126.66],
  '칠갑산':[36.42,126.86], '가리산':[37.893,127.962], '공작산':[37.704,128.03],
  '계방산':[37.728,128.465], '방태산':[37.891,128.405], '가리왕산':[37.460,128.566],
  '두타산':[37.428,129.017], '덕항산':[37.355,129.011], '민둥산':[37.279,128.785],
  '화악산':[38.019,127.502], '명성산':[38.106,127.318], '명지산':[37.941,127.435],
  '운악산':[37.878,127.336], '연인산':[37.922,127.394], '유명산':[37.579,127.490],
  '용문산':[37.565,127.561], '천마산':[37.681,127.267], '수락산':[37.691,127.081],
  '불암산':[37.66,127.097], '검단산':[37.525,127.258], '남한산':[37.477,127.182],
  '수리산':[37.36,126.89], '마이산':[35.761,127.397], '천태산':[36.22,127.58],
  '팔봉산':[37.70,127.70], '방장산':[35.453,126.754], '추월산':[35.43,127.02],
  '무학산':[35.208,128.56], '미륵산':[34.80,128.42], '황매산':[35.488,127.974],
  '구병산':[36.48,127.82], '남해금산':[34.77,127.98], '대암산':[38.21,128.13],
  '삼악산':[37.85,127.65], '서대산':[36.24,127.64], '성인봉':[37.50,130.86],
  '연화산':[35.06,128.26], '오봉산':[38.006,127.855], '운문산':[35.62,128.96],
  '운장산':[35.90,127.45], '장안산':[35.62,127.59], '적상산':[35.94,127.68],
  '점봉산':[38.05,128.47], '응봉산':[37.08,129.23], '화왕산':[35.55,128.54],
  '백덕산':[37.42,128.26], '백암산':[35.45,126.88], '광덕산':[38.08,127.45],
  '용화산':[38.02,127.74], '태화산':[37.11,128.56], '대암산':[38.21,128.13],
  '구봉산':[35.94,127.39], '달마산':[34.38,126.55], '덕룡산':[34.55,126.74],
  '동악산':[35.28,127.31], '불갑산':[35.21,126.52], '용봉산':[36.64,126.63],
  '조령산':[36.79,128.08], '청화산':[36.60,127.92], '칠보산':[36.71,127.90]
};
function coordsForRecord(record) {
  if (Array.isArray(record.coordinates) && record.coordinates.length === 2 && record.coordinates.every(Number.isFinite)) return record.coordinates;
  const name = String(record.name || '').replace(/[\s·ㆍ]/g,'');
  const region = String(record.region || '');
  if (name.includes('백운산')) {
    if (name.includes('포천') || region === '경기') return [37.75,127.38];
    if (name.includes('광양') || region === '전남') return [35.11,127.62];
    if (name.includes('정선') || region === '강원') return [37.39,128.69];
  }
  if (name.includes('금산') && (name.includes('남해') || region === '경남')) return [34.77,127.98];
  if (name.includes('가야산')) return name.includes('충남') || region === '충남' ? [36.71,126.62] : [35.822,128.117];
  if (name.includes('감악산')) return name.includes('원주') || region === '강원' ? [37.265,128.032] : [37.936,126.965];
  if (name.includes('축령산')) return name.includes('장성') || region === '전남' ? [35.39,126.78] : [37.74,127.32];
  if (name.includes('경주남산') || (name === '남산' && region === '경북')) return [35.78,129.22];
  if (name.includes('축령산') && (name.includes('장성') || region === '전남')) return [35.39,126.78];
  for (const [key, point] of Object.entries(MOUNTAIN_COORDS)) if (name.includes(key)) return point;
  return null;
}

function renderHikingMap() {
  const section = $('family-map-section');
  if (!section) return;
  section.hidden = activeNav !== 'all';
  if (activeNav !== 'all') return;
  if (!window.L) {
    $('hiking-map').innerHTML = '<div class="map-fallback">지도를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</div>';
    return;
  }
  if (!hikingMap) {
    // 휠 줌은 산행지도에서만 사용합니다. 사진 뷰어의 휠 이벤트와 분리됩니다.
    hikingMap = L.map('hiking-map', { scrollWheelZoom:false, zoomControl:true }).setView([36.35,127.75], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18, attribution:'&copy; OpenStreetMap contributors'
    }).addTo(hikingMap);
    hikingMapLayer = L.layerGroup().addTo(hikingMap);
    setTimeout(() => hikingMap && hikingMap.invalidateSize(), 180);
  }
  hikingMapLayer.clearLayers();
  const known = records.map(record => ({record, point:coordsForRecord(record)})).filter(x => x.point);
  const grouped = new Map();
  known.forEach(item => {
    // 산 이름 표기(괄호/지역명)가 달라도 같은 좌표면 같은 산행 지점으로 묶습니다.
    const key = `${Number(item.point[0]).toFixed(3)},${Number(item.point[1]).toFixed(3)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });
  const missing = records.filter(r => !coordsForRecord(r)).length;
  $('map-count').textContent = `${grouped.size}개 산 · ${known.length}회 방문`;
  $('map-missing-note').textContent = missing ? `아직 지도 좌표가 없는 산행 ${missing}건은 추후 좌표 목록 보강이 필요합니다.` : '등록된 산행 기록을 모두 지도에 표시하고 있습니다.';
  grouped.forEach(items => {
    items.sort((a,b) => compareHikeRecords(a.record,b.record,'desc'));
    const {record, point} = items[0];
    const photo = mapPhoto(record);
    const src = photo ? (photo.previewUrl || photo.dataUrl || '') : '';
    const html = `<div class="map-photo-pin-wrap"><button class="map-photo-pin ${src ? '' : 'no-photo'}" type="button" aria-label="${esc(record.name)} 산행 기록 보기">${src ? `<img src="${esc(src)}" alt="">` : '<span class="pin-mountain">▲</span>'}<b>${esc(record.name)}</b>${items.length > 1 ? `<i class="pin-visit-count">${items.length}회</i>` : ''}</button></div>`;
    const icon = L.divIcon({className:'map-photo-marker', html, iconSize:[82,92], iconAnchor:[41,82]});
    const marker = L.marker(point,{icon}).addTo(hikingMapLayer);
    if (items.length === 1) marker.on('click', () => openDetail(record.id));
    else {
      const popup = `<div class="map-visit-popup"><strong>${esc(record.name)} · ${items.length}회 방문</strong>${items.map(({record:r}) => `<button type="button" data-map-record="${esc(r.id)}"><span>${esc(formatDate(r.date,'short'))}</span><b>${esc(r.course || '산행 기록 보기')}</b></button>`).join('')}</div>`;
      marker.bindPopup(popup, {maxWidth:280});
      marker.on('popupopen', event => event.popup.getElement()?.querySelectorAll('[data-map-record]').forEach(btn => btn.addEventListener('click', () => { const id=btn.dataset.mapRecord; hikingMap.closePopup(); openDetail(id); })));
    }
  });
  if (known.length) {
    const bounds = L.latLngBounds(known.map(x => x.point));
    if (grouped.size === 1) hikingMap.setView(known[0].point, 9);
    else hikingMap.fitBounds(bounds.pad(0.28), {maxZoom:8});
  } else {
    hikingMap.setView([36.35,127.75], 7);
  }
  setTimeout(() => hikingMap && hikingMap.invalidateSize(), 80);
}

function render() {
  const withName = records.filter(r => r.name && r.name.trim());
  const unique = new Set(withName.map(r => r.name.trim().toLowerCase()));
  $('total-count').textContent = records.length;
  $('mountain-count').textContent = unique.size;
  $('restaurant-count').textContent = records.filter(r => r.restaurant && r.restaurant.trim()).length;
  $('all-filter-count').textContent = records.length;
  renderMountainProgress();
  $('mountain-progress-section').hidden = activeNav === 'restaurant' || activeNav === 'album';
  $('expanded-stats-section').hidden = activeNav !== 'stats';
  $('album-section').hidden = activeNav !== 'album';
  renderAdvancedStats();
  renderAlbum();
  renderRegionChips();
  renderCards();
  renderHikingMap();
}
function renderRegionChips() {
  const counts = {};
  records.forEach(r => { const name = r.region || '지역 미지정'; counts[name] = (counts[name] || 0) + 1; });
  const sorted = Object.keys(counts).sort((a,b) => REGION_OPTIONS.indexOf(a) - REGION_OPTIONS.indexOf(b));
  $('region-chips').innerHTML = sorted.map(region => `<button class="filter-chip ${activeRegion === region ? 'selected' : ''}" data-region="${esc(region)}" type="button">${esc(region)} <span>${counts[region]}</span></button>`).join('');
  $('filter-row').querySelectorAll('[data-region]').forEach(btn => {
    btn.onclick = () => { activeRegion = btn.dataset.region; renderRegionChips(); renderCards(); };
  });
  $('filter-row').querySelector('[data-region="all"]').classList.toggle('selected', activeRegion === 'all');
  $('filter-row').querySelector('[data-region="all"]').onclick = () => { activeRegion = 'all'; renderRegionChips(); renderCards(); };
}
// 산행 기록은 입력한 시각(updated_at)이 아니라 실제 산행 날짜와 출발 시각으로 정렬합니다.
function compareHikeRecords(a, b, direction = 'desc') {
  const dateA = String(a.date || '');
  const dateB = String(b.date || '');
  const dateCompare = dateA.localeCompare(dateB);
  if (dateCompare !== 0) return direction === 'asc' ? dateCompare : -dateCompare;

  const timeA = String(a.startTime || '');
  const timeB = String(b.startTime || '');
  // 출발 시간이 없는 옛 기록은 같은 날짜 안에서 뒤쪽에 배치합니다.
  if (!timeA && timeB) return 1;
  if (timeA && !timeB) return -1;
  const timeCompare = timeA.localeCompare(timeB);
  return direction === 'asc' ? timeCompare : -timeCompare;
}
function getFilteredRecords() {
  const query = $('search-input').value.trim().toLowerCase();
  let list = [...records];
  if (activeRegion !== 'all') list = list.filter(r => (r.region || '지역 미지정') === activeRegion);
  if (activeNav === 'restaurant') list = list.filter(r => r.restaurant && r.restaurant.trim());
  if (query) list = list.filter(r => [r.name,r.region,r.course,r.restaurant,r.menu,r.memo,r.foodReview,r.companions].some(v => String(v || '').toLowerCase().includes(query)));
  list.sort((a,b) => {
    if (sortMode === 'date-asc') return compareHikeRecords(a, b, 'asc');
    if (sortMode === 'name-asc') {
      const nameCompare = String(a.name || '').localeCompare(String(b.name || ''), 'ko');
      return nameCompare || compareHikeRecords(a, b, 'desc');
    }
    return compareHikeRecords(a, b, 'desc');
  });
  return list;
}
function heroPhoto(record) {
  const photos = record.photos || [];
  return photos.find(p => p.category === 'trail' && (p.previewUrl || p.dataUrl)) || photos.find(p => p.previewUrl || p.dataUrl) || null;
}
function mapPhoto(record) {
  const photos = record.photos || [];
  return photos.find(p => p.category === 'summit' && (p.previewUrl || p.dataUrl)) || heroPhoto(record);
}
function recordCoverPhoto(record) {
  const photos = record.photos || [];
  return photos.find(p => p.isCover && p.category !== 'food' && (p.previewUrl || p.dataUrl)) || mapPhoto(record);
}
function getParticipantNames(record) {
  if (!Array.isArray(record?.participants)) return [];
  return [...new Set(record.participants.map(name => String(name || '').trim()).filter(Boolean))];
}
function participantNameOrder(a, b) {
  const priority = name => ({'나':0,'수호':1,'현아':2}[name] ?? 10);
  return priority(a) - priority(b) || a.localeCompare(b, 'ko');
}
function getAvailableParticipantChoices() {
  const names = new Set(['나','수호','현아']);
  records.forEach(record => getParticipantNames(record).forEach(name => names.add(name)));
  return [...names].sort(participantNameOrder);
}
function renderParticipantOptions(selectedNames = []) {
  const selected = new Set(selectedNames);
  $('participant-options').innerHTML = getAvailableParticipantChoices().map(name =>
    `<label class="participant-option"><input type="checkbox" value="${esc(name)}" ${selected.has(name) ? 'checked' : ''}><span>${esc(name)}</span></label>`
  ).join('');
}
function collectParticipantNames() {
  const selected = [...$('participant-options').querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
  const extra = $('field-other-participants').value.split(/[,，、;；\n]+/).map(name => name.trim()).filter(Boolean);
  return [...new Set([...selected, ...extra])].sort(participantNameOrder);
}
function isFamilyRecord(record) {
  const participants = getParticipantNames(record);
  return participants.includes('수호') || participants.includes('현아');
}
function getSeason(date) {
  const month = Number(String(date || '').split('-')[1] || 0);
  if ([3,4,5].includes(month)) return 'spring';
  if ([6,7,8].includes(month)) return 'summer';
  if ([9,10,11].includes(month)) return 'autumn';
  if ([12,1,2].includes(month)) return 'winter';
  return 'unknown';
}
function durationMinutes(record) {
  if (record.startTime && record.endTime) {
    const [sh,sm]=record.startTime.split(':').map(Number), [eh,em]=record.endTime.split(':').map(Number);
    if ([sh,sm,eh,em].every(Number.isFinite)) return ((eh*60+em)-(sh*60+sm)+1440)%1440;
  }
  const value=String(record.duration || '');
  const h=value.match(/(\d+)\s*시간/), m=value.match(/(\d+)\s*분/);
  if (h || m) return Number(h?.[1] || 0)*60 + Number(m?.[1] || 0);
  return 0;
}
function renderAdvancedStats() {
  if (!$('expanded-stats-grid')) return;
  const km=records.reduce((sum,r)=>sum+(Number(r.distance)||0),0);
  const mins=records.reduce((sum,r)=>sum+durationMinutes(r),0);
  const timed=records.filter(r=>durationMinutes(r)>0).length;
  const avg=records.length ? km/records.filter(r=>Number(r.distance)>0).length : 0;
  const average=records.some(r=>Number(r.distance)>0) ? (km/records.filter(r=>Number(r.distance)>0).length).toFixed(1) : '0';
  const fmtDuration = total => `${Math.floor(total/60)}시간 ${total%60}분`;
  $('expanded-stats-grid').innerHTML = [
    ['누적 산행 거리',`${km.toFixed(1)}km`,'거리 입력 기록 기준'],
    ['누적 산행 시간',fmtDuration(mins),`${timed}건의 시간 정보 기준`],
    ['평균 산행 거리',`${average}km`,'거리 입력 기록 기준'],
    ['산행한 날짜',new Set(records.map(r=>r.date).filter(Boolean)).size+'일','날짜 기준 중복 제거']
  ].map(([label,value,note])=>`<article class="expanded-stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  const years={}; const months=Array(12).fill(0); const mountainCounts={};
  records.forEach(r=>{ if(r.date){const y=r.date.slice(0,4); years[y]=(years[y]||0)+1; const m=Number(r.date.slice(5,7)); if(m>=1&&m<=12)months[m-1]++;} const n=String(r.name||'').trim(); if(n)mountainCounts[n]=(mountainCounts[n]||0)+1; });
  const yearEntries=Object.entries(years).sort((a,b)=>b[0].localeCompare(a[0])); const yearMax=Math.max(1,...yearEntries.map(x=>x[1]));
  $('year-stats').innerHTML=yearEntries.length?yearEntries.map(([year,count])=>`<div class="year-stat-row"><b>${esc(year)}년</b><span class="stat-bar"><i style="width:${count/yearMax*100}%"></i></span><strong>${count}회</strong></div>`).join(''):'<p class="empty-help">날짜가 입력된 산행 기록이 아직 없습니다.</p>';
  const monthMax=Math.max(1,...months);
  $('month-stats').innerHTML=months.map((count,i)=>`<div class="month-stat"><span>${i+1}월</span><i><b style="height:${count/monthMax*100}%"></b></i><strong>${count}</strong></div>`).join('');
  const longest=records.filter(r=>Number(r.distance)>0).sort((a,b)=>Number(b.distance)-Number(a.distance))[0];
  const longestTime=records.filter(r=>durationMinutes(r)>0).sort((a,b)=>durationMinutes(b)-durationMinutes(a))[0];
  $('highlight-stats').innerHTML=[longest?`<p><span>가장 긴 거리</span><strong>${esc(longest.name)} · ${Number(longest.distance).toFixed(1)}km</strong></p>`:'',longestTime?`<p><span>가장 긴 산행 시간</span><strong>${esc(longestTime.name)} · ${esc(longestTime.duration || fmtDuration(durationMinutes(longestTime)))}</strong></p>`:''].filter(Boolean).join('')||'<p class="empty-help">거리와 시간이 입력된 기록이 쌓이면 표시됩니다.</p>';
  const favorites=Object.entries(mountainCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko')).slice(0,5);
  $('favorite-mountains').innerHTML=favorites.length?favorites.map(([name,count],i)=>`<p><span>${i+1}. ${esc(name)}</span><strong>${count}회</strong></p>`).join(''):'<p class="empty-help">산행 기록을 추가하면 자주 찾은 산을 보여드립니다.</p>';
  renderParticipantStats();
}
function renderParticipantStats() {
  const fmtDuration = total => `${Math.floor(total/60)}시간 ${total%60}분`;
  const participantNames = [...new Set(records.flatMap(getParticipantNames))].sort(participantNameOrder);
  const missingCount = records.filter(record => getParticipantNames(record).length === 0).length;
  $('participant-stats-note').textContent = `참여자별 거리와 시간은 해당 산행 전체 값을 각각 반영합니다. 가족 전체 통계는 산행 1건으로만 계산하며, 참여자 미기록 ${missingCount}건은 누구에게도 임의 배분하지 않습니다.`;
  $('participant-stats').innerHTML = participantNames.length ? participantNames.map(name => {
    const mine = records.filter(record => getParticipantNames(record).includes(name));
    const km = mine.reduce((sum, record) => sum + (Number(record.distance) || 0), 0);
    const timed = mine.filter(record => durationMinutes(record) > 0);
    const minutes = timed.reduce((sum, record) => sum + durationMinutes(record), 0);
    const mountains = new Set(mine.map(record => String(record.name || '').trim().toLocaleLowerCase('ko-KR')).filter(Boolean));
    const longest = mine.filter(record => Number(record.distance) > 0).sort((a,b) => Number(b.distance)-Number(a.distance))[0];
    const years = {};
    mine.forEach(record => { if (/^\\d{4}-\\d{2}-\\d{2}$/.test(String(record.date || ''))) { const year=record.date.slice(0,4); years[year]=(years[year]||0)+1; } });
    const yearText = Object.entries(years).sort((a,b)=>b[0].localeCompare(a[0])).map(([year,count])=>`<span><b>${esc(year)}년</b> ${count}회</span>`).join('');
    return `<article class="participant-stat-card"><h4>${esc(name)}</h4><div class="participant-stat-metrics"><div><span>산행 횟수</span><strong>${mine.length}회</strong></div><div><span>누적 거리</span><strong>${km.toFixed(1)}km</strong></div><div><span>누적 시간</span><strong>${fmtDuration(minutes)}</strong><small>시간 기록 ${timed.length}건</small></div><div><span>다른 산</span><strong>${mountains.size}곳</strong></div><div><span>최장 산행</span><strong>${longest ? `${esc(longest.name)} · ${Number(longest.distance).toFixed(1)}km` : '—'}</strong></div></div><div class="participant-year-list"><b>연도별</b> ${yearText || '<span>날짜 기록 없음</span>'}</div></article>`;
  }).join('') : '<p class="empty-help">참여자를 선택해 산행을 저장하면 사람별 기록이 여기에 쌓입니다.</p>';

  const combinations = new Map();
  records.forEach(record => {
    const names = getParticipantNames(record).sort(participantNameOrder);
    if (!names.length) return;
    const key = names.join(' + ');
    const current = combinations.get(key) || { count:0, km:0, minutes:0, timed:0 };
    current.count++;
    current.km += Number(record.distance) || 0;
    const duration = durationMinutes(record);
    if (duration) { current.minutes += duration; current.timed++; }
    combinations.set(key, current);
  });
  const comboRows = [...combinations.entries()].sort((a,b)=>b[1].count-a[1].count || a[0].localeCompare(b[0],'ko'));
  $('combination-stats').innerHTML = comboRows.length ? comboRows.map(([names,stats]) =>
    `<div class="combination-stat-row"><div><strong>${esc(names)}</strong><small>${stats.km.toFixed(1)}km · ${fmtDuration(stats.minutes)}</small></div><b>${stats.count}회</b></div>`
  ).join('') : '<p class="empty-help">참여자를 지정한 산행 기록이 쌓이면 함께한 조합도 집계됩니다.</p>';
}
function getAlbumYearKey(date) {
  const value=String(date||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(0,4) : 'unknown';
}
function getAlbumMonthKey(date) {
  const value=String(date||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? String(Number(value.slice(5,7))) : 'unknown';
}
function albumPhotoCardHtml(item) {
  const {record,photo}=item;
  const src=photo.previewUrl||photo.dataUrl||'';
  const alt=photo.caption||record.name||'산행 사진';
  return `<button type="button" class="album-photo-card" data-album-record="${esc(record.id)}" aria-label="${esc(record.name)} 사진 보기"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"><span class="album-photo-shade"><b>${esc(record.name||'이름 없는 산행')}</b><small>${esc(formatDate(record.date,'short'))}${photo.caption?` · ${esc(photo.caption)}`:''}</small></span></button>`;
}
function renderAlbum() {
  if (!$('album-gallery')) return;
  document.querySelectorAll('[data-album-mode]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.albumMode===albumMode));
  document.querySelectorAll('[data-album-season]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.albumSeason===albumSeason));
  const albumPeople = [...new Set(records.flatMap(getParticipantNames))].sort(participantNameOrder);
  if (albumPerson !== 'all' && albumPerson !== 'unrecorded' && !albumPeople.includes(albumPerson)) albumPerson = 'all';
  $('album-person-filter').innerHTML = [
    '<option value="all">전체 동행인</option>',
    '<option value="unrecorded">동행인 미기록</option>',
    ...albumPeople.map(name => `<option value="${esc(name)}">${esc(name)}</option>`)
  ].join('');
  $('album-person-filter').value = albumPerson;

  const list=[...records].sort((a,b)=>compareHikeRecords(a,b,'desc'));
  const items=[];
  list.forEach(record=>{
    const participants = getParticipantNames(record);
    if(albumMode==='family'&&!isFamilyRecord(record))return;
    if(albumPerson==='unrecorded'&&participants.length>0)return;
    if(albumPerson!=='all'&&albumPerson!=='unrecorded'&&!participants.includes(albumPerson))return;
    if(albumSeason!=='all'&&getSeason(record.date)!==albumSeason)return;
    (record.photos||[]).filter(p=>['summit','trail'].includes(p.category)&&(p.previewUrl||p.dataUrl)).forEach(photo=>items.push({record,photo,year:getAlbumYearKey(record.date),month:getAlbumMonthKey(record.date)}));
  });

  const yearCounts=new Map();
  items.forEach(item=>yearCounts.set(item.year,(yearCounts.get(item.year)||0)+1));
  const years=[...yearCounts.keys()].sort((a,b)=>{
    if(a==='unknown')return 1;
    if(b==='unknown')return -1;
    return b.localeCompare(a);
  });
  if(albumYear!=='all'&&!yearCounts.has(albumYear)){albumYear='all';albumMonth='all';}
  $('album-year-tabs').innerHTML=[
    `<button type="button" class="${albumYear==='all'?'selected':''}" data-album-year="all">전체 연도 <span>${items.length}</span></button>`,
    ...years.map(year=>`<button type="button" class="${albumYear===year?'selected':''}" data-album-year="${esc(year)}">${year==='unknown'?'날짜 미기록':`${esc(year)}년`} <span>${yearCounts.get(year)}</span></button>`)
  ].join('');

  const monthNavigation=$('album-month-navigation');
  const monthCounts=new Map();
  if(albumYear!=='all'&&albumYear!=='unknown'){
    items.filter(item=>item.year===albumYear).forEach(item=>monthCounts.set(item.month,(monthCounts.get(item.month)||0)+1));
    monthNavigation.hidden=false;
    const monthEntries=[...monthCounts.entries()].sort((a,b)=>Number(a[0])-Number(b[0]));
    if(albumMonth!=='all'&&!monthCounts.has(albumMonth))albumMonth='all';
    $('album-month-tabs').innerHTML=[
      `<button type="button" class="${albumMonth==='all'?'selected':''}" data-album-month="all">전체 월 <span>${yearCounts.get(albumYear)||0}</span></button>`,
      ...monthEntries.map(([month,count])=>`<button type="button" class="${albumMonth===month?'selected':''}" data-album-month="${month}">${month}월 <span>${count}</span></button>`)
    ].join('');
  } else {
    monthNavigation.hidden=true;
    albumMonth='all';
    $('album-month-tabs').innerHTML='';
  }

  const visibleItems=albumYear==='all' ? items : items.filter(item=>item.year===albumYear&&(albumMonth==='all'||item.month===albumMonth));
  $('album-count').textContent=`${visibleItems.length}장`;
  const modeLabel=albumMode==='family'?'가족과 함께한 산행':'전체 산행';
  const seasonLabel=albumSeason==='all'?'전체 계절':({spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'}[albumSeason]||'전체 계절');
  const personLabel=albumPerson==='all'?'전체 동행인':albumPerson==='unrecorded'?'동행인 미기록':albumPerson;
  const dateLabel=albumYear==='all'?'연도별 모아보기':albumYear==='unknown'?'날짜 미기록 사진':`${albumYear}년${albumMonth==='all'?'':` ${albumMonth}월`}`;
  $('album-summary').textContent=`${modeLabel} · ${personLabel} · ${seasonLabel} · ${dateLabel} · ${visibleItems.length}장`;

  let html='';
  if(albumYear==='all'){
    html=years.map(year=>{
      const group=items.filter(item=>item.year===year);
      const title=year==='unknown'?'날짜 미기록':`${year}년`;
      return `<section class="album-year-group"><div class="album-year-heading"><h3>${title}</h3><span>${group.length}장</span></div><div class="album-gallery">${group.map(albumPhotoCardHtml).join('')}</div></section>`;
    }).join('');
  } else {
    html=visibleItems.length ? `<div class="album-gallery">${visibleItems.map(albumPhotoCardHtml).join('')}</div>` : '';
  }
  $('album-gallery').innerHTML=html||'<div class="album-empty"><strong>선택한 조건에 표시할 사진이 없습니다.</strong><span>연도·월·계절 또는 가족 산행 조건을 바꿔서 다시 찾아보세요.</span></div>';
  $('album-gallery').querySelectorAll('[data-album-record]').forEach(btn=>btn.addEventListener('click',()=>openDetail(btn.dataset.albumRecord)));
}
function mountainPlaceholder() {
  return `<div class="photo-placeholder"><svg viewBox="0 0 100 78" aria-hidden="true"><path d="M4 70 35 19l21 33 13-20 27 38H4Z" fill="currentColor"/><path d="m27 32 8-13 21 33-13-7-6 5-10-18Z" fill="#fff" opacity=".9"/><path d="M8 73h84" stroke="#78a98a" stroke-width="2" stroke-linecap="round"/></svg></div>`;
}
function renderCards() {
  const list = getFilteredRecords();
  $('results-label').textContent = `${list.length}개 기록`;
  $('filter-label').textContent = activeRegion === 'all' ? (activeNav === 'restaurant' ? '식당 기록이 있는 산행' : '모든 산행을 표시합니다') : `${activeRegion} 지역`;
  $('record-grid').innerHTML = list.map((record, listIndex) => {
    const index = listIndex + 1;
    // 카드 대표 사진도 지도와 상세 화면처럼 정상 인증 사진을 우선 사용합니다.
    const photo = recordCoverPhoto(record);
    const numPhotos = (record.photos || []).length;
    const date = record.date ? formatDate(record.date, 'short') : '날짜 미기록';
    const intro = record.course || record.memo || '산행 코스와 후기를 기록해 보세요.';
    const stats = [record.distance ? `${esc(record.distance)}km` : '', record.duration ? esc(record.duration) : ''].filter(Boolean).join(' · ');
    return `<article class="record-card" data-open-record="${esc(record.id)}" tabindex="0" role="button" aria-label="${esc(record.name)} 산행 기록 보기">
      <div class="card-photo">${photo ? `<img src="${esc(photo.previewUrl || photo.dataUrl || '')}" alt="${esc(record.name)} 산행 사진" loading="lazy">` : mountainPlaceholder()}<span class="date-ribbon">✓ ${esc(date)}</span>${numPhotos > 1 ? `<span class="card-photo-count">▧ ${numPhotos}장</span>` : ''}</div>
      <div class="card-content"><div class="card-meta-top"><span class="card-number">${String(index).padStart(2,'0')}</span><span class="region-tag">${esc(record.region || '지역 미지정')}</span></div>
      <h2>${esc(record.name || '이름 없는 산행')}</h2>${mountainBadgeHtml(record)}<p class="card-elevation">${record.elevation ? `${esc(record.elevation)}m` : (stats || '산행 정보 추가 가능')}</p><p class="card-description">${esc(intro)}</p>
      ${record.restaurant ? `<div class="card-footer"><span class="mini-icon">✦</span><span class="restaurant-teaser">${esc(record.restaurant)}${record.menu ? ` · ${esc(record.menu)}` : ''}</span></div>` : (stats ? `<div class="card-footer"><span>↗</span><span>${stats}</span></div>` : '')}</div>
    </article>`;
  }).join('');
  $('record-grid').querySelectorAll('[data-open-record]').forEach(card => {
    const open = () => openDetail(card.dataset.openRecord);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  const nonListPage = activeNav === 'album' || activeNav === 'stats';
  $('empty-state').hidden = nonListPage || list.length > 0;
  $('record-grid').hidden = nonListPage || list.length === 0;
  if (!records.length) {
    $('empty-title').textContent = '첫 산행을 기록해 보세요';
    $('empty-copy').textContent = '사진 한 장으로 시작해도 좋아요. 산행 정보와 하산 후 식당까지 한곳에 모아둘 수 있습니다.';
  } else {
    $('empty-title').textContent = '조건에 맞는 기록이 없습니다';
    $('empty-copy').textContent = '검색어나 지역 필터를 바꿔서 다시 찾아보세요.';
  }
}

function openForm(record = null) {
  if (cloudMode && !isOwner) { showToast('가족 열람 계정은 기록을 수정할 수 없습니다.', true); return; }
  editingOriginal = record ? clone(record) : null;
  draftPhotos = record ? (record.photos || []).map(p => ({...p})) : [];
  $('record-form').reset();
  $('record-id').value = record?.id || '';
  $('form-title').textContent = record ? '산행 기록 수정' : '새 산행 기록';
  $('save-record-btn').textContent = record ? '수정 내용 저장' : '기록 저장';
  $('field-date').value = record?.date || dateForInput();
  $('field-name').value = record?.name || '';
  $('field-region').value = record?.region || '';
  $('field-course').value = record?.course || '';
  $('field-distance').value = record?.distance ?? '';
  $('field-duration').value = record?.duration || ''; 
  $('field-elevation').value = record?.elevation ?? '';
  $('field-difficulty').value = record?.difficulty || '';
  $('field-weather').value = record?.weather || '';
  $('field-companions').value = record?.companions || '';
  renderParticipantOptions(record ? getParticipantNames(record) : ['나']);
  $('field-other-participants').value = '';
  $('field-start').value = record?.startTime || '';
  $('field-end').value = record?.endTime || '';
  if (record?.startTime && record?.endTime) updateDurationPreview();
  $('field-memo').value = record?.memo || '';
  $('field-restaurant').value = record?.restaurant || '';
  $('field-menu').value = record?.menu || '';
  $('field-rating').value = record?.rating ? String(record.rating) : '';
  $('field-revisit').value = record?.revisit || '';
  $('field-food-review').value = record?.foodReview || '';
  $('summit-photos-input').value = '';
  $('trail-photos-input').value = '';
  $('food-photos-input').value = '';
  renderPhotoPreviews();
  openModal('form-backdrop');
  setTimeout(() => $('field-name').focus(), 50);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('원본 사진을 읽지 못했습니다.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}
async function addPhotoFiles(fileList, category) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  const input = category === 'summit' ? $('summit-photos-input') : category === 'trail' ? $('trail-photos-input') : $('food-photos-input');
  const prevText = $('save-record-btn').textContent;
  let skippedOriginal = 0;
  $('save-record-btn').disabled = true;
  $('save-record-btn').textContent = '사진 처리 중…';
  try {
    for (const file of files) {
      const dataUrl = await compressImage(file);
      // 12MB 이하 파일은 표시용 압축본과 별도로 원본도 보관합니다.
      const originalDataUrl = file.size <= 8 * 1024 * 1024 ? await readFileAsDataUrl(file) : '';
      if (!originalDataUrl) skippedOriginal++;
      draftPhotos.push({ id: makeId(), category, dataUrl, ...(originalDataUrl ? {originalDataUrl, originalName:file.name} : {}), caption: file.name.replace(/\.[^.]+$/, '') });
    }
    renderPhotoPreviews();
    showToast(skippedOriginal ? `${files.length}장 추가 완료 · ${skippedOriginal}장은 용량이 커 압축본만 저장합니다.` : `${files.length}장 사진을 추가했습니다. 원본도 함께 보관합니다.`);
  } catch (err) {
    console.error(err);
    showToast('사진을 읽지 못했습니다. 다른 사진 파일로 시도해 주세요.', true);
  } finally {
    $('save-record-btn').disabled = false;
    $('save-record-btn').textContent = prevText;
    input.value = '';
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 해석 실패'));
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const keepTransparency = file.type === 'image/png' || file.type === 'image/webp';
        const ctx = canvas.getContext('2d', { alpha: keepTransparency });
        if (!keepTransparency) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (keepTransparency) {
          let result = canvas.toDataURL('image/png');
          if (result.length > 3_500_000) {
            const smaller = document.createElement('canvas');
            const ratio = Math.sqrt(3_500_000 / result.length);
            smaller.width = Math.max(1, Math.round(canvas.width * ratio));
            smaller.height = Math.max(1, Math.round(canvas.height * ratio));
            smaller.getContext('2d').drawImage(canvas,0,0,smaller.width,smaller.height);
            result = smaller.toDataURL('image/png');
          }
          resolve(result);
        } else {
          let quality = 0.84;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length > 2_000_000 && quality > 0.5) {
            quality -= 0.08;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function renderPhotoPreviews() {
  const groups = [
    { key:'summit', id:'summit-photo-previews' },
    { key:'trail', id:'trail-photo-previews' },
    { key:'food', id:'food-photo-previews' }
  ];
  groups.forEach(g => {
    $(g.id).innerHTML = draftPhotos.map((p, i) => ({p,i})).filter(x => x.p.category === g.key).map(({p,i}) => {
      const src = p.previewUrl || p.dataUrl || '';
      return `<div class="photo-preview photo-preview-editable"><img src="${esc(src)}" alt="${esc(PHOTO_KIND[p.category] || '사진')}"><span class="photo-kind">${esc(PHOTO_KIND[p.category] || '사진')}</span><input class="photo-caption-input" type="text" maxlength="120" value="${esc(p.caption || '')}" data-photo-caption-index="${i}" aria-label="사진 설명"><div class="photo-preview-actions">${p.category !== 'food' ? `<button type="button" class="photo-cover-button ${p.isCover ? 'selected' : ''}" data-set-cover="${i}">${p.isCover ? '대표 사진' : '대표로 지정'}</button>` : ''}<button type="button" data-remove-photo="${i}" aria-label="사진 제거">삭제</button></div></div>`;
    }).join('');
  });
  document.querySelectorAll('[data-photo-caption-index]').forEach(input => input.addEventListener('input', () => { const photo=draftPhotos[Number(input.dataset.photoCaptionIndex)]; if(photo) photo.caption=input.value; }));
  document.querySelectorAll('[data-set-cover]').forEach(btn => btn.addEventListener('click', () => {
    const selected=Number(btn.dataset.setCover);
    draftPhotos.forEach((photo,index)=>{ if(photo.category!=='food') photo.isCover=index===selected; });
    renderPhotoPreviews();
  }));
  document.querySelectorAll('[data-remove-photo]').forEach(btn => btn.addEventListener('click', () => {
    draftPhotos.splice(Number(btn.dataset.removePhoto), 1);
    renderPhotoPreviews();
  }));
}

async function saveForm(event) {
  event.preventDefault();
  if (cloudMode && !isOwner) { showToast('관리자만 기록을 저장할 수 있습니다.', true); return; }
  const name = $('field-name').value.trim();
  if (!name) { $('field-name').focus(); showToast('산 이름을 입력해 주세요.', true); return; }
  if (cloudMode && !cloudUser) { showToast('먼저 클라우드 계정에 로그인해 주세요.', true); openModal('auth-backdrop'); return; }
  const id = $('record-id').value || makeId();
  const participantNames = collectParticipantNames();
  const record = {
    id, name, date:$('field-date').value || '', region:$('field-region').value,
    course:$('field-course').value.trim(), distance:$('field-distance').value ? Number($('field-distance').value) : '',
    duration:calculateDuration($('field-start').value, $('field-end').value) || (!$('field-start').value && !$('field-end').value ? (editingOriginal?.duration || '') : ''), elevation:$('field-elevation').value ? Number($('field-elevation').value) : '',
    difficulty:$('field-difficulty').value, weather:$('field-weather').value.trim(), companions:$('field-companions').value.trim(),
    ...(participantNames.length || Array.isArray(editingOriginal?.participants) ? {participants:participantNames} : {}),
    startTime:$('field-start').value, endTime:$('field-end').value, memo:$('field-memo').value.trim(),
    restaurant:$('field-restaurant').value.trim(), menu:$('field-menu').value.trim(), rating:$('field-rating').value ? Number($('field-rating').value) : '',
    revisit:$('field-revisit').value, foodReview:$('field-food-review').value.trim(), photos:draftPhotos.map(p => ({...p}))
  };
  const old = editingOriginal ? records.find(r => r.id === id) || editingOriginal : null;
  const btn = $('save-record-btn');
  btn.disabled = true; btn.textContent = cloudMode ? '클라우드에 저장 중…' : '저장 중…';
  try {
    let saved;
    if (cloudMode) saved = await saveCloudRecord(record, old);
    else {
      const clean = cleanRecord(record);
      await localPut(clean);
      saved = { ...clean, photos: clean.photos.map(p => ({...p, previewUrl:p.dataUrl || ''})) };
    }
    records = records.filter(r => r.id !== id);
    records.push(saved);
    records.sort((a,b) => compareHikeRecords(a, b, 'desc'));
    render(); closeModal('form-backdrop');
    showToast(saved.originalUploadWarning ? '기록과 압축 사진은 저장했지만 일부 원본 사진은 용량/권한 문제로 저장하지 못했습니다.' : (editingOriginal ? '산행 기록을 수정했습니다.' : '새 산행 기록을 저장했습니다.'));
  } catch (err) {
    console.error(err);
    showToast(`저장에 실패했습니다: ${err.message || '저장소를 확인해 주세요.'}`, true);
  } finally {
    btn.disabled = false; btn.textContent = $('record-id').value ? '수정 내용 저장' : '기록 저장';
  }
}

function extensionFromMime(mime) {
  const subtype=String(mime||'image/jpeg').toLowerCase().split('/')[1]?.split(';')[0] || 'jpeg';
  if (subtype === 'jpeg' || subtype === 'pjpeg') return 'jpg';
  if (subtype === 'svg+xml') return 'svg';
  return /^[a-z0-9]+$/.test(subtype) ? subtype : 'jpg';
}
async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}
async function saveCloudRecord(record, oldRecord) {
  const oldPaths = new Set((oldRecord?.photos || []).flatMap(p => [p.path,p.originalPath]).filter(Boolean));
  const clean = cleanRecord(record);
  let originalUploadWarning = false;
  for (const photo of clean.photos) {
    const photoId = photo.id || makeId();
    if (photo.dataUrl) {
      const blob = await dataUrlToBlob(photo.dataUrl);
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${cloudUser.id}/${record.id}/${photoId}.${ext}`;
      const { error } = await cloudClient.storage.from('hike-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
      if (error) throw error;
      photo.path = path;
      delete photo.dataUrl;
    }
    if (photo.originalDataUrl) {
      try {
        const originalBlob = await dataUrlToBlob(photo.originalDataUrl);
        const mime = originalBlob.type || 'image/jpeg';
        const originalExt = extensionFromMime(mime);
        const originalPath = `${cloudUser.id}/${record.id}/${photoId}_original.${originalExt}`;
        const { error } = await cloudClient.storage.from('hike-photos').upload(originalPath, originalBlob, { contentType:mime, upsert:true });
        if (error) throw error;
        photo.originalPath = originalPath;
      } catch (err) {
        originalUploadWarning = true;
        console.warn('원본 사진 저장 생략(압축본은 저장):',err);
      }
      delete photo.originalDataUrl;
    }
  }
  const newPaths = new Set(clean.photos.flatMap(p => [p.path,p.originalPath]).filter(Boolean));
  const { error } = await cloudClient.from('hike_records').upsert({ id:record.id, owner_id:cloudUser.id, record:clean, updated_at:new Date().toISOString() });
  if (error) throw error;
  const removePaths = [...oldPaths].filter(p => !newPaths.has(p));
  if (removePaths.length) {
    const { error: delErr } = await cloudClient.storage.from('hike-photos').remove(removePaths);
    if (delErr) console.warn('Old photo cleanup failed', delErr);
  }
  const hydrated = await hydrateCloudRecord(clean);
  hydrated.originalUploadWarning = originalUploadWarning;
  return hydrated;
}

let viewerPhotos = [];
let viewerIndex = 0;
let photoZoom = 1, photoPanX = 0, photoPanY = 0;
let photoPointers = new Map(), photoGestureStart = null, pinchStartDistance = 0, pinchStartZoom = 1, lastPhotoTap = 0;
function openPhotoViewer(clickedImage) {
  viewerPhotos = [...$('detail-content').querySelectorAll('.zoomable-photo')].filter(img => img.src);
  viewerIndex = Math.max(0, viewerPhotos.indexOf(clickedImage));
  if (!viewerPhotos.length) return;
  $('photo-lightbox').hidden = false;
  document.body.classList.add('lightbox-open');
  updatePhotoViewer();
  $('lightbox-close').focus();
}
function updatePhotoViewer() {
  const img = viewerPhotos[viewerIndex];
  if (!img) return;
  resetPhotoZoom();
  $('lightbox-image').src = img.src;
  $('lightbox-image').alt = img.alt || '산행 사진';
  $('lightbox-caption').textContent = img.dataset.photoCaption || img.alt || '';
  $('lightbox-counter').textContent = `${viewerIndex + 1} / ${viewerPhotos.length}`;
  const multiple = viewerPhotos.length > 1;
  $('lightbox-prev').hidden = !multiple;
  $('lightbox-next').hidden = !multiple;
}
function movePhotoViewer(direction) {
  if (!viewerPhotos.length) return;
  viewerIndex = (viewerIndex + direction + viewerPhotos.length) % viewerPhotos.length;
  updatePhotoViewer();
}
function setPhotoZoom(value) {
  photoZoom = Math.max(1, Math.min(5, value));
  if (photoZoom === 1) { photoPanX = 0; photoPanY = 0; }
  const image = $('lightbox-image');
  image.style.transform = `translate(${photoPanX}px, ${photoPanY}px) scale(${photoZoom})`;
  image.style.cursor = photoZoom > 1 ? 'grab' : 'zoom-in';
  $('lightbox-zoom-level').textContent = `${Math.round(photoZoom * 100)}%`;
}
function resetPhotoZoom() { photoZoom = 1; photoPanX = 0; photoPanY = 0; if ($('lightbox-image')) setPhotoZoom(1); }
function setupPhotoZoom() {
  const image = $('lightbox-image');
  const viewer = $('photo-lightbox');
  // 이미지 픽셀 위뿐 아니라 전체 사진 뷰어 영역에서 휠을 받습니다.
  // 캡션·이전/다음·확대 버튼 위에서는 일반 버튼 동작을 방해하지 않습니다.
  viewer.addEventListener('wheel', e => {
    if (viewer.hidden || !(e.target instanceof Element) || e.target.closest('.lightbox-tools,.lightbox-close,.lightbox-nav')) return;
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY;
    const factor = Math.exp(-delta * 0.0018);
    setPhotoZoom(photoZoom * factor);
  }, {passive:false, capture:true});
  image.addEventListener('dblclick', e => { e.preventDefault(); setPhotoZoom(photoZoom > 1 ? 1 : 2); });
  image.addEventListener('pointerdown', e => {
    e.preventDefault(); image.setPointerCapture(e.pointerId);
    photoPointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
    if (photoPointers.size === 1) photoGestureStart = {x:e.clientX,y:e.clientY,panX:photoPanX,panY:photoPanY};
    if (photoPointers.size === 2) { const pts=[...photoPointers.values()]; pinchStartDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y); pinchStartZoom=photoZoom; }
  });
  image.addEventListener('pointermove', e => {
    if (!photoPointers.has(e.pointerId)) return;
    photoPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (photoPointers.size >= 2) { const pts=[...photoPointers.values()]; const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y); if (pinchStartDistance) setPhotoZoom(pinchStartZoom*d/pinchStartDistance); }
    else if (photoZoom > 1 && photoGestureStart) { photoPanX=photoGestureStart.panX+e.clientX-photoGestureStart.x; photoPanY=photoGestureStart.panY+e.clientY-photoGestureStart.y; setPhotoZoom(photoZoom); }
  });
  const endPointer = e => {
    const start=photoGestureStart; const current=photoPointers.get(e.pointerId);
    if (photoPointers.size===1 && photoZoom===1 && start && current) { const dx=current.x-start.x; if (Math.abs(dx)>65) movePhotoViewer(dx<0?1:-1); else if (Math.hypot(dx,current.y-start.y)<8 && e.pointerType==='touch') { const now=Date.now(); if (now-lastPhotoTap<320) setPhotoZoom(photoZoom>1?1:2); lastPhotoTap=now; } }
    photoPointers.delete(e.pointerId); photoGestureStart=null; if (photoPointers.size<2) pinchStartDistance=0;
  };
  image.addEventListener('pointerup',endPointer); image.addEventListener('pointercancel',endPointer);
}
function closePhotoViewer() {
  $('photo-lightbox').hidden = true;
  $('lightbox-image').src = '';
  resetPhotoZoom();
  photoPointers.clear();
  document.body.classList.remove('lightbox-open');
  viewerPhotos = [];
}

async function downloadPhotoById(photoId) {
  const recordId=$('detail-content').dataset.recordId;
  const record=records.find(r=>r.id===recordId);
  const photo=(record?.photos||[]).find(p=>p.id===photoId);
  if (!record || !photo) throw new Error('사진 정보를 찾을 수 없습니다.');
  let blob;
  const hasOriginal = Boolean(photo.originalDataUrl || photo.originalPath);
  if (photo.originalDataUrl) blob=await dataUrlToBlob(photo.originalDataUrl);
  else if (cloudMode && photo.originalPath) {
    const {data,error}=await cloudClient.storage.from('hike-photos').createSignedUrl(photo.originalPath,60*60);
    if(error) throw error;
    const response=await fetch(data?.signedUrl || '');
    if(!response.ok) throw new Error('원본 사진을 내려받지 못했습니다.');
    blob=await response.blob();
  } else if (photo.dataUrl) blob=await dataUrlToBlob(photo.dataUrl);
  else {
    let url=photo.previewUrl || '';
    if (cloudMode && photo.path) {
      const {data,error}=await cloudClient.storage.from('hike-photos').createSignedUrl(photo.path,60*60);
      if(error) throw error;
      url=data?.signedUrl || url;
    }
    if (!url) throw new Error('사진 주소가 없습니다.');
    const response=await fetch(url);
    if(!response.ok) throw new Error('사진을 내려받지 못했습니다.');
    blob=await response.blob();
  }
  const mime=blob.type||'image/jpeg';
  const ext=extensionFromMime(mime);
  const base=(photo.originalName || photo.caption || '산행사진').replace(/\.[^.]+$/,'');
  const fileName=`${record.name}_${base}_${photo.id}${hasOriginal?'_원본':''}.${ext}`.replace(/[\\/:*?"<>|]/g,'_');
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  showToast(hasOriginal ? '원본 사진을 저장했습니다.' : '저장된 사진을 내려받았습니다.');
}

function openDetail(id) {
  const r = records.find(item => item.id === id);
  if (!r) return;
  // 상세 화면의 대표 사진은 정상 인증 사진을 우선 표시하고, 없으면 산행 사진으로 대체합니다.
  const photo = recordCoverPhoto(r);
  const photos = (r.photos || []).filter(p => p.previewUrl || p.dataUrl);
  const participantLabel = getParticipantNames(r).length ? getParticipantNames(r).join(' · ') : '미기록';
  const summitPhotos = photos.filter(p => p.category === 'summit');
  const trailPhotos = photos.filter(p => p.category === 'trail');
  const foodPhotos = photos.filter(p => p.category === 'food');
  const fact = (label, value) => `<div class="detail-fact"><span>${label}</span><strong>${value || '—'}</strong></div>`;
  const photoGrid = arr => arr.length ? `<div class="detail-gallery">${arr.map(p => `<div class="detail-photo-item"><img class="zoomable-photo" src="${esc(p.previewUrl || p.dataUrl || '')}" alt="${esc(p.caption || '산행 사진')}" data-photo-caption="${esc(p.caption || r.name + ' 산행 사진')}" loading="lazy"><button type="button" class="detail-photo-save" data-download-photo="${esc(p.id)}">${p.originalDataUrl || p.originalPath ? '원본 저장 ↓' : '사진 저장 ↓'}</button>${p.caption ? `<span class="detail-photo-caption">${esc(p.caption)}</span>` : ''}</div>`).join('')}</div>` : '<p>등록된 사진이 없습니다.</p>';
  $('detail-content').dataset.recordId = id;
  $('detail-content').innerHTML = `${photo ? `<div class="detail-cover"><img class="zoomable-photo" src="${esc(photo.previewUrl || photo.dataUrl || '')}" alt="${esc(r.name)} 대표 사진" data-photo-caption="${esc(photo.caption || r.name + ' 대표 사진')}"><button type="button" class="detail-photo-save cover-photo-save" data-download-photo="${esc(photo.id)}">${photo.originalDataUrl || photo.originalPath ? '대표 원본 저장 ↓' : '대표 사진 저장 ↓'}</button></div>` : ''}
    <div class="detail-main"><div class="detail-topline"><span class="region-tag">${esc(r.region || '지역 미지정')}</span><span class="detail-date">${esc(formatDate(r.date))}</span>${r.difficulty ? `<span class="region-tag">${esc(r.difficulty)}</span>` : ''}</div>
    <h2 id="detail-title">${esc(r.name)}</h2>${mountainBadgeHtml(r, 'detail-mountain-badges')}<div class="detail-subline">${r.elevation ? `${esc(r.elevation)}m` : '정상 높이 미기록'}${r.course ? `　·　${esc(r.course)}` : ''}</div>
    <div class="detail-facts">${fact('산행 거리', r.distance ? `${esc(r.distance)}km` : '')}${fact('소요 시간', esc(r.duration))}${fact('출발 / 하산', r.startTime || r.endTime ? `${esc(r.startTime || '—')} / ${esc(r.endTime || '—')}` : '')}${fact('날씨', esc(r.weather))}</div>
    <div class="detail-section"><h3>산행 참여자</h3><p>${esc(participantLabel)}</p>${r.companions ? `<p class="participant-memo"><small>동행 메모: ${esc(r.companions)}</small></p>` : ''}</div>
    <div class="detail-section"><h3>산행 후기</h3><p>${esc(r.memo || '아직 산행 후기가 없습니다.')}</p></div>
    ${summitPhotos.length ? `<div class="detail-section"><h3>정상 인증 사진 (${summitPhotos.length}장)</h3>${photoGrid(summitPhotos)}</div>` : ''}
    <div class="detail-section"><h3>산행 사진${trailPhotos.length ? ` (${trailPhotos.length}장)` : ''}</h3>${photoGrid(trailPhotos)}</div>
    ${r.restaurant || r.menu || r.foodReview || foodPhotos.length ? `<div class="detail-section"><h3>하산 후 식당과 메뉴</h3><div class="restaurant-panel"><h4>${esc(r.restaurant || '식당 미기록')}</h4>${r.menu ? `<div class="menu-line">${esc(r.menu)}</div>` : ''}${r.rating ? `<div class="rating-stars" aria-label="만족도 ${r.rating}점">${'★'.repeat(Number(r.rating))}${'☆'.repeat(5-Number(r.rating))}</div>` : ''}${r.revisit ? `<p style="margin:8px 0 0">재방문: ${esc(r.revisit)}</p>` : ''}${r.foodReview ? `<p style="margin-top:10px">${esc(r.foodReview)}</p>` : ''}</div><div style="margin-top:14px">${photoGrid(foodPhotos)}</div></div>` : ''}
    ${isOwner ? '<div class="detail-actions"><button class="secondary-button" id="detail-delete-btn" type="button">기록 삭제</button><button class="add-button" id="detail-edit-btn" type="button">기록 수정</button></div>' : '<p class="family-readonly-note">가족 열람 전용 기록입니다.</p>'}</div></div>`;
  if (isOwner) {
    $('detail-edit-btn').onclick = () => { closeModal('detail-backdrop'); openForm(records.find(item => item.id === id)); };
    $('detail-delete-btn').onclick = () => deleteRecord(id);
  }
  openModal('detail-backdrop');
}

async function deleteRecord(id) {
  if (cloudMode && !isOwner) { showToast('관리자만 기록을 삭제할 수 있습니다.', true); return; }
  const record = records.find(r => r.id === id);
  if (!record || !confirm(`'${record.name}' 산행 기록을 삭제할까요? 삭제한 기록은 복구하기 어렵습니다.`)) return;
  try {
    if (cloudMode) {
      const paths = (record.photos || []).flatMap(p => [p.path,p.originalPath]).filter(Boolean);
      const { error } = await cloudClient.from('hike_records').delete().eq('id', id);
      if (error) throw error;
      if (paths.length) {
        const { error: photoError } = await cloudClient.storage.from('hike-photos').remove(paths);
        if (photoError) console.warn(photoError);
      }
    } else await localDelete(id);
    records = records.filter(r => r.id !== id);
    closeModal('detail-backdrop'); render(); showToast('산행 기록을 삭제했습니다.');
  } catch (err) { console.error(err); showToast(`삭제하지 못했습니다: ${err.message || ''}`, true); }
}

function openBackup() { $('backup-status').textContent = ''; $('import-file-input').value = ''; openModal('backup-backdrop'); }
async function toDataUrlFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('사진을 불러오지 못했습니다.');
  const blob = await response.blob();
  return await new Promise((resolve,reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
  });
}
async function exportBackup() {
  const btn = $('export-btn');
  btn.disabled = true; btn.textContent = '백업 준비 중…';
  $('backup-status').textContent = '기록과 사진을 모으고 있습니다.';
  try {
    const backupRecords = [];
    let completedPhotos = 0;
    const totalPhotos = records.reduce((sum,r)=>sum+(r.photos||[]).length,0);
    for (const r of records) {
      const copy = cleanRecord(r);
      copy.photos = [];
      for (const p of (r.photos || [])) {
        const item = cleanPhoto(p);
        if (!item.dataUrl) {
          try {
            let url = p.previewUrl || '';
            // 기존에 발급한 1시간짜리 주소가 만료됐을 수 있으므로 백업할 때 새 주소를 발급합니다.
            if (cloudMode && p.path) {
              const {data,error}=await cloudClient.storage.from('hike-photos').createSignedUrl(p.path,60*60);
              if(error) throw error;
              url=data?.signedUrl || url;
            }
            if (url) { item.dataUrl = await toDataUrlFromUrl(url); delete item.path; }
          } catch (err) { console.warn('사진 백업 일부 실패:', p.path || p.id, err); }
        }
        if (!item.dataUrl && item.path) item.note = '클라우드 사진 경로: ' + item.path;
        if (!item.originalDataUrl && p.originalPath && cloudMode) {
          try {
            const {data,error}=await cloudClient.storage.from('hike-photos').createSignedUrl(p.originalPath,60*60);
            if(error) throw error;
            if(data?.signedUrl) item.originalDataUrl=await toDataUrlFromUrl(data.signedUrl);
          } catch(err) { console.warn('원본 사진 백업 실패:',p.originalPath,err); }
        }
        copy.photos.push(item);
        completedPhotos++;
        $('backup-status').textContent = `사진 백업 중… ${completedPhotos}/${totalPhotos}`;
      }
      backupRecords.push(copy);
    }
    const payload = { app:'나의 산행기록장', version:2, exportedAt:new Date().toISOString(), photoMode: cloudMode ? 'cloud' : 'local', records:backupRecords };
    const blob = new Blob([JSON.stringify(payload)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `산행기록장_백업_${dateForInput()}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    const noPhoto = backupRecords.reduce((sum,r) => sum + (r.photos || []).filter(p => !p.dataUrl).length, 0);
    const noOriginal = backupRecords.reduce((sum,r) => sum + (r.photos || []).filter(p => p.originalPath && !p.originalDataUrl).length, 0);
    $('backup-status').textContent = noPhoto || noOriginal
      ? `백업 파일을 만들었습니다. 사진 ${noPhoto}장 또는 원본 ${noOriginal}장은 포함되지 못했을 수 있습니다. 원본 사진도 별도로 보관해 주세요.`
      : `산행 기록 ${backupRecords.length}건과 저장된 사진·원본을 백업했습니다. 안전한 개인 저장공간에 보관하세요.`;
  } catch (err) {
    console.error(err); $('backup-status').textContent = `백업 실패: ${err.message || ''}`;
  } finally { btn.disabled = false; btn.textContent = '백업 내려받기'; }
}
function validateBackupPayload(payload) {
  if (!payload || !Array.isArray(payload.records)) throw new Error('산행기록장 백업 파일 형식이 아닙니다.');
  if (payload.records.length > 2000) throw new Error('산행 기록이 너무 많습니다. 파일을 확인해 주세요.');
  return payload.records.map((raw,index)=>{
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${index+1}번째 기록의 형식이 올바르지 않습니다.`);
    if (!String(raw.name || '').trim()) throw new Error(`${index+1}번째 기록에 산 이름이 없습니다.`);
    if (raw.photos !== undefined && !Array.isArray(raw.photos)) throw new Error(`${index+1}번째 기록의 사진 목록이 올바르지 않습니다.`);
    const photos=(raw.photos||[]).map((photo,photoIndex)=>{
      if (!photo || typeof photo !== 'object' || Array.isArray(photo)) throw new Error(`${index+1}번째 기록의 ${photoIndex+1}번째 사진 정보가 올바르지 않습니다.`);
      if (photo.dataUrl && !/^data:image\/[a-z0-9.+-]+;base64,/i.test(photo.dataUrl)) throw new Error(`${index+1}번째 기록의 ${photoIndex+1}번째 사진 파일을 확인해 주세요.`);
      if (photo.originalDataUrl && !/^data:image\/[a-z0-9.+-]+;base64,/i.test(photo.originalDataUrl)) throw new Error(`${index+1}번째 기록의 ${photoIndex+1}번째 원본 사진 파일을 확인해 주세요.`);
      return {...photo,id:photo.id||makeId(),category:['summit','trail','food'].includes(photo.category)?photo.category:'trail'};
    });
    return {...raw,id:raw.id||makeId(),name:String(raw.name).trim(),photos};
  });
}
async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = $('backup-status'); status.textContent = '백업 파일을 읽고 검사하고 있습니다.';
  const importBtn = $('import-file-input');
  importBtn.disabled = true;
  try {
    if (file.size > 250 * 1024 * 1024) throw new Error('백업 파일이 250MB를 초과합니다. 파일을 나누어 주세요.');
    const payload = JSON.parse(await file.text());
    // 파일 전체를 먼저 검사하므로 잘못된 항목 때문에 중간에 복원이 시작되지 않습니다.
    const prepared = validateBackupPayload(payload);
    if (cloudMode && (!cloudUser || !isOwner)) throw new Error('클라우드 백업 복원은 관리자 계정으로 로그인해야 합니다.');
    if (!cloudMode) {
      const cleanItems=prepared.map(raw=>cleanRecord(raw));
      await localPutMany(cleanItems); // IndexedDB 단일 트랜잭션으로 일괄 저장
      const merged=new Map(records.map(r=>[r.id,r]));
      cleanItems.forEach(item=>merged.set(item.id,{...item,photos:item.photos.map(photo=>({...photo,previewUrl:photo.dataUrl||''}))}));
      records=[...merged.values()].sort((a,b)=>compareHikeRecords(a,b,'desc'));
      render(); status.textContent=`백업 파일 검사를 통과했습니다. ${cleanItems.length}개 기록을 한 번에 복원했습니다.`;
    } else {
      let imported=0;
      for (const r of prepared) {
        const old=records.find(item=>item.id===r.id)||null;
        const saved=await saveCloudRecord(r,old);
        records=records.filter(item=>item.id!==saved.id); records.push(saved);
        imported++;
        status.textContent=`클라우드 복원 중… ${imported}/${prepared.length}건`;
      }
      records.sort((a,b)=>compareHikeRecords(a,b,'desc'));
      render(); status.textContent=`파일 검사 완료 후 ${imported}개 기록을 복원했습니다. 중간에 연결이 끊기면 같은 백업 파일을 다시 선택해도 이미 복원된 ID는 업데이트됩니다.`;
    }
    event.target.value = '';
  } catch (err) {
    console.error(err); status.textContent = `복원하지 못했습니다: ${err.message || '파일을 확인해 주세요.'}`;
  } finally { importBtn.disabled=false; }
}

async function openFamilyManager() {
  if (!isOwner) return;
  $('family-member-email').value = '';
  $('family-manager-status').textContent = '';
  await refreshFamilyMembers();
  openModal('family-backdrop');
}
async function refreshFamilyMembers() {
  const { data, error } = await cloudClient.from('hike_family_access').select('member_id, member_email, created_at').order('created_at', {ascending:true});
  if (error) throw error;
  $('family-member-list').innerHTML = (data || []).length ? data.map(m => `<div class="family-member-row"><span>${esc(m.member_email)}</span><button type="button" class="text-button family-remove-btn" data-member="${esc(m.member_id)}">접근 해제</button></div>`).join('') : '<p class="help-note">아직 등록된 가족 계정이 없습니다.</p>';
  $('family-member-list').querySelectorAll('[data-member]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('이 가족 계정의 열람 권한을 해제할까요?')) return;
    const { error: removeError } = await cloudClient.rpc('remove_hike_family_member', { member_user_id: btn.dataset.member });
    if (removeError) { $('family-manager-status').textContent = removeError.message; return; }
    $('family-manager-status').textContent = '가족 열람 권한을 해제했습니다.';
    await refreshFamilyMembers();
  }));
}
async function addFamilyMember(event) {
  event.preventDefault();
  const email = $('family-member-email').value.trim();
  if (!email) return;
  $('family-add-submit').disabled = true;
  $('family-manager-status').textContent = '가족 계정을 확인하고 있습니다…';
  try {
    const { error } = await cloudClient.rpc('add_hike_family_member', { member_email: email });
    if (error) throw error;
    $('family-manager-status').textContent = '가족 계정을 등록했습니다. 해당 이메일로 로그인하면 산행 기록을 볼 수 있습니다.';
    $('family-member-email').value = '';
    await refreshFamilyMembers();
  } catch (err) { $('family-manager-status').textContent = err.message || '가족 등록에 실패했습니다.'; }
  finally { $('family-add-submit').disabled = false; }
}

function setAuthMode(mode) {
  authMode = mode;
  $('auth-login-tab').classList.toggle('selected', mode === 'login');
  $('auth-signup-tab').classList.toggle('selected', mode === 'signup');
  $('auth-title').textContent = mode === 'login' ? '산행기록장 로그인' : '산행기록장 계정 만들기';
  $('auth-submit').textContent = mode === 'login' ? '로그인' : '가입하기';
  $('auth-message').textContent = '';
  $('password-recovery-panel').hidden = true; $('password-change-panel').hidden = true;
  $('auth-tabs').hidden = false; $('auth-form').hidden = false; $('auth-reset-link').hidden = false;
}
async function sendPasswordReset() {
  const email = $('auth-email').value.trim();
  if (!email) { $('auth-message').textContent = '먼저 가입한 이메일 주소를 입력해 주세요.'; $('auth-email').focus(); return; }
  if (!cloudClient) { $('auth-message').textContent = '클라우드 설정을 확인할 수 없습니다.'; return; }
  $('auth-reset-link').disabled = true;
  $('auth-message').textContent = '비밀번호 재설정 메일을 보내고 있습니다.';
  try {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await cloudClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    $('auth-message').textContent = '재설정 메일을 보냈습니다. 이메일의 링크를 열어 새 비밀번호를 설정해 주세요.';
  } catch (err) { $('auth-message').textContent = `메일 발송 실패: ${err.message || '잠시 후 다시 시도해 주세요.'}`; }
  finally { $('auth-reset-link').disabled = false; }
}
async function completePasswordRecovery() {
  const password=$('new-password').value, confirmPassword=$('confirm-new-password').value;
  if (password.length<6) { $('auth-message').textContent='새 비밀번호는 6자 이상 입력해 주세요.'; return; }
  if (password!==confirmPassword) { $('auth-message').textContent='두 비밀번호가 서로 다릅니다.'; return; }
  const btn=$('save-new-password-btn'); btn.disabled=true; btn.textContent='저장 중…';
  try {
    const { error } = await cloudClient.auth.updateUser({password});
    if (error) throw error;
    $('new-password').value=''; $('confirm-new-password').value='';
    $('password-recovery-panel').hidden=true; $('auth-tabs').hidden=false; $('auth-form').hidden=false; $('auth-reset-link').hidden=false;
    $('auth-message').textContent='비밀번호를 변경했습니다. 새 비밀번호로 로그인할 수 있습니다.';
    if (cloudUser) closeModal('auth-backdrop');
  } catch (err) { $('auth-message').textContent=`비밀번호 변경 실패: ${err.message || ''}`; }
  finally { btn.disabled=false; btn.textContent='새 비밀번호 저장'; }
}
async function changePassword() {
  const password=$('change-new-password').value, confirmPassword=$('change-confirm-password').value;
  if (password.length<6) { $('auth-message').textContent='새 비밀번호는 6자 이상 입력해 주세요.'; return; }
  if (password!==confirmPassword) { $('auth-message').textContent='두 비밀번호가 서로 다릅니다.'; return; }
  const btn=$('save-changed-password-btn'); btn.disabled=true; btn.textContent='변경 중…';
  try {
    const { error }=await cloudClient.auth.updateUser({password});
    if (error) throw error;
    $('change-new-password').value=''; $('change-confirm-password').value='';
    $('password-change-panel').hidden=true; closeModal('auth-backdrop'); showToast('비밀번호를 변경했습니다.');
  } catch(err) { $('auth-message').textContent=`비밀번호 변경 실패: ${err.message || ''}`; }
  finally { btn.disabled=false; btn.textContent='비밀번호 변경'; }
}

async function submitAuth(event) {
  event.preventDefault();
  if (!cloudClient) { $('auth-message').textContent = '클라우드 설정을 확인할 수 없습니다.'; return; }
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  const btn = $('auth-submit');
  btn.disabled = true; btn.textContent = '처리 중…';
  $('auth-message').textContent = '';
  try {
    let result;
    if (authMode === 'signup') result = await cloudClient.auth.signUp({ email, password });
    else result = await cloudClient.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (!result.data.session || !result.data.user) {
      $('auth-message').textContent = '가입 요청을 보냈습니다. 이메일 인증을 마친 뒤 로그인해 주세요.';
      if (authMode === 'signup') setAuthMode('login');
    } else {
      cloudUser = result.data.user;
      closeModal('auth-backdrop');
      await establishCloudRole();
      await loadCloudRecords();
      setStorageStatus('클라우드 동기화 중', true);
      $('auth-password').value = '';
      showToast(authMode === 'signup' ? '계정이 만들어졌습니다.' : '로그인했습니다.');
    }
  } catch (err) {
    $('auth-message').textContent = err.message || '로그인에 실패했습니다.';
  } finally {
    btn.disabled = false; btn.textContent = authMode === 'login' ? '로그인' : '가입하기';
  }
}

init().catch(err => { console.error(err); showToast('기록장을 시작하지 못했습니다.', true); });
