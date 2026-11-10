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

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function cleanPhoto(photo) {
  const out = { id: photo.id || makeId(), category: photo.category || 'trail' };
  if (photo.caption) out.caption = photo.caption;
  if (photo.dataUrl) out.dataUrl = photo.dataUrl;
  if (photo.path) out.path = photo.path;
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
  if (isCloudConfigured() && window.supabase?.createClient) {
    try {
      cloudClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      cloudMode = true;
      setStorageStatus('클라우드 연결', true);
      $('storage-notice-text').textContent = '클라우드 모드가 설정되어 있습니다. 같은 계정으로 로그인한 기기에서 기록을 함께 볼 수 있습니다.';
      const { data, error } = await cloudClient.auth.getSession();
      if (error) throw error;
      if (data.session?.user) {
        cloudUser = data.session.user;
        await establishCloudRole();
        await loadCloudRecords();
        closeModal('auth-backdrop');
      } else {
        setStorageStatus('로그인 필요', true);
        openModal('auth-backdrop');
      }
      cloudClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          cloudUser = null;
          cloudRole = 'pending'; isOwner = false;
          records = [];
          render();
          setStorageStatus('로그인 필요', true);
          openModal('auth-backdrop');
        }
      });
    } catch (err) {
      console.error(err);
      if (cloudClient) {
        cloudMode = true;
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
  const logoutBtn = $('logout-btn'); if (logoutBtn) logoutBtn.hidden = !cloudMode;
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
      if (!error && data?.signedUrl) photo.previewUrl = data.signedUrl;
    } else if (photo.dataUrl) photo.previewUrl = photo.dataUrl;
    record.photos.push(photo);
  }
  return record;
}

function bindEvents() {
  $('add-record-btn').addEventListener('click', () => openForm());
  $('family-manage-btn').addEventListener('click', openFamilyManager);
  $('family-add-form').addEventListener('submit', addFamilyMember);
  $('family-backdrop').addEventListener('click', (e) => { if (e.target === $('family-backdrop')) closeModal('family-backdrop'); });
  $('logout-btn').addEventListener('click', async () => { if (cloudClient) await cloudClient.auth.signOut(); });
  $('empty-add-btn').addEventListener('click', () => openForm());
  $('nav-all').addEventListener('click', () => setNav('all'));
  $('nav-restaurant').addEventListener('click', () => setNav('restaurant'));
  $('nav-stats').addEventListener('click', () => setNav('stats'));
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
  $('form-backdrop').addEventListener('click', (e) => { if (e.target === $('form-backdrop')) closeModal('form-backdrop'); });
  $('detail-backdrop').addEventListener('click', (e) => { if (e.target === $('detail-backdrop')) closeModal('detail-backdrop'); });
  $('backup-backdrop').addEventListener('click', (e) => { if (e.target === $('backup-backdrop')) closeModal('backup-backdrop'); });
  $('help-backdrop').addEventListener('click', (e) => { if (e.target === $('help-backdrop')) closeModal('help-backdrop'); });
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => closeModal(m.id)); });
}

function setNav(nav) {
  activeNav = nav;
  $('nav-all').classList.toggle('active', nav === 'all');
  $('nav-restaurant').classList.toggle('active', nav === 'restaurant');
  $('nav-stats').classList.toggle('active', nav === 'stats');
  $('page-title').textContent = nav === 'restaurant' ? '산행 맛집 기록' : nav === 'stats' ? '나의 명산 기록' : '전체 산행 기록';
  $('page-subtitle').textContent = nav === 'restaurant'
    ? '산행 후 들른 식당과 먹었던 메뉴를 모아보세요.'
    : nav === 'stats' ? '산림청 100대 명산과 블랙야크 명산100 방문 현황을 확인해 보세요.'
    : '직접 걸은 길과 그날의 풍경, 하산 후 맛있게 먹은 한 끼까지.';
  $('mountain-progress-section').hidden = nav === 'restaurant';
  renderCards();
  renderHikingMap();
  if (nav === 'stats') setTimeout(() => $('mountain-progress-section').scrollIntoView({behavior:'smooth',block:'start'}), 50);
}

const MOUNTAIN_COORDS = {
  '마니산':[37.6285,126.4315], '소요산':[37.9364,127.0872], '태백산':[37.0968,128.9152],
  '계양산':[37.55,126.724], '청계산':[37.427,127.056], '광교산':[37.329,127.032],
  '고려산':[37.783,126.424], '함백산':[37.161,128.917], '오대산':[37.798,128.543],
  '주왕산':[36.389,129.161], '무등산':[35.134,126.988], '감악산':[37.936,126.965],
  '북한산':[37.658,126.977], '관악산':[37.445,126.964], '도봉산':[37.695,127.015],
};
function coordsForRecord(record) {
  const name = String(record.name || '').replace(/\s/g,'');
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
    hikingMap = L.map('hiking-map', { scrollWheelZoom:false, zoomControl:true }).setView([36.35,127.75], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18, attribution:'&copy; OpenStreetMap'
    }).addTo(hikingMap);
    hikingMapLayer = L.layerGroup().addTo(hikingMap);
    setTimeout(() => hikingMap && hikingMap.invalidateSize(), 180);
  }
  hikingMapLayer.clearLayers();
  const plotted = records.map(record => ({record, point:coordsForRecord(record)})).filter(x => x.point);
  $('map-count').textContent = `${plotted.length}개 산`;
  plotted.forEach(({record, point}) => {
    const photo = mapPhoto(record);
    const src = photo ? (photo.previewUrl || photo.dataUrl || '') : '';
    const html = `<button class="map-photo-pin ${src ? '' : 'no-photo'}" type="button" aria-label="${esc(record.name)} 산행 기록 보기">${src ? `<img src="${esc(src)}" alt="">` : '<span class="pin-mountain">▲</span>'}<b>${esc(record.name)}</b></button>`;
    const icon = L.divIcon({className:'map-photo-marker', html, iconSize:[76,88], iconAnchor:[38,78]});
    const marker = L.marker(point,{icon}).addTo(hikingMapLayer);
    marker.on('click', () => openDetail(record.id));
  });
  if (plotted.length) {
    const bounds = L.latLngBounds(plotted.map(x => x.point));
    if (plotted.length === 1) hikingMap.setView(plotted[0].point, 9);
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
  $('mountain-progress-section').hidden = activeNav === 'restaurant';
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
function mountainPlaceholder() {
  return `<div class="photo-placeholder"><svg viewBox="0 0 100 78" aria-hidden="true"><path d="M4 70 35 19l21 33 13-20 27 38H4Z" fill="currentColor"/><path d="m27 32 8-13 21 33-13-7-6 5-10-18Z" fill="#fff" opacity=".9"/><path d="M8 73h84" stroke="#78a98a" stroke-width="2" stroke-linecap="round"/></svg></div>`;
}
function renderCards() {
  const list = getFilteredRecords();
  $('results-label').textContent = `${list.length}개 기록`;
  $('filter-label').textContent = activeRegion === 'all' ? (activeNav === 'restaurant' ? '식당 기록이 있는 산행' : '모든 산행을 표시합니다') : `${activeRegion} 지역`;
  $('record-grid').innerHTML = list.map((record, listIndex) => {
    const index = listIndex + 1;
    const photo = heroPhoto(record);
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
  $('empty-state').hidden = list.length > 0;
  $('record-grid').hidden = list.length === 0;
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

async function addPhotoFiles(fileList, category) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  const input = category === 'summit' ? $('summit-photos-input') : category === 'trail' ? $('trail-photos-input') : $('food-photos-input');
  const prevText = $('save-record-btn').textContent;
  $('save-record-btn').disabled = true;
  $('save-record-btn').textContent = '사진 처리 중…';
  try {
    for (const file of files) {
      const dataUrl = await compressImage(file);
      draftPhotos.push({ id: makeId(), category, dataUrl, caption: file.name.replace(/\.[^.]+$/, '') });
    }
    renderPhotoPreviews();
    showToast(`${files.length}장 사진을 추가했습니다.`);
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
      return `<div class="photo-preview"><img src="${esc(src)}" alt="${esc(PHOTO_KIND[p.category] || '사진')}"><span class="photo-kind">${esc(PHOTO_KIND[p.category] || '사진')}</span><button type="button" data-remove-photo="${i}" aria-label="사진 제거">×</button></div>`;
    }).join('');
  });
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
  const record = {
    id, name, date:$('field-date').value || '', region:$('field-region').value,
    course:$('field-course').value.trim(), distance:$('field-distance').value ? Number($('field-distance').value) : '',
    duration:calculateDuration($('field-start').value, $('field-end').value) || (!$('field-start').value && !$('field-end').value ? (editingOriginal?.duration || '') : ''), elevation:$('field-elevation').value ? Number($('field-elevation').value) : '',
    difficulty:$('field-difficulty').value, weather:$('field-weather').value.trim(), companions:$('field-companions').value.trim(),
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
    showToast(editingOriginal ? '산행 기록을 수정했습니다.' : '새 산행 기록을 저장했습니다.');
  } catch (err) {
    console.error(err);
    showToast(`저장에 실패했습니다: ${err.message || '저장소를 확인해 주세요.'}`, true);
  } finally {
    btn.disabled = false; btn.textContent = $('record-id').value ? '수정 내용 저장' : '기록 저장';
  }
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}
async function saveCloudRecord(record, oldRecord) {
  const oldPaths = new Set((oldRecord?.photos || []).map(p => p.path).filter(Boolean));
  const clean = cleanRecord(record);
  for (const photo of clean.photos) {
    if (photo.dataUrl) {
      const blob = await dataUrlToBlob(photo.dataUrl);
      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `${cloudUser.id}/${record.id}/${photo.id || makeId()}.${ext}`;
      const { error } = await cloudClient.storage.from('hike-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
      if (error) throw error;
      photo.path = path;
      delete photo.dataUrl;
    }
  }
  const newPaths = new Set(clean.photos.map(p => p.path).filter(Boolean));
  const { error } = await cloudClient.from('hike_records').upsert({ id:record.id, owner_id:cloudUser.id, record:clean, updated_at:new Date().toISOString() });
  if (error) throw error;
  const removePaths = [...oldPaths].filter(p => !newPaths.has(p));
  if (removePaths.length) {
    const { error: delErr } = await cloudClient.storage.from('hike-photos').remove(removePaths);
    if (delErr) console.warn('Old photo cleanup failed', delErr);
  }
  return await hydrateCloudRecord(clean);
}

function openDetail(id) {
  const r = records.find(item => item.id === id);
  if (!r) return;
  const photo = heroPhoto(r);
  const photos = (r.photos || []).filter(p => p.previewUrl || p.dataUrl);
  const summitPhotos = photos.filter(p => p.category === 'summit');
  const trailPhotos = photos.filter(p => p.category === 'trail');
  const foodPhotos = photos.filter(p => p.category === 'food');
  const fact = (label, value) => `<div class="detail-fact"><span>${label}</span><strong>${value || '—'}</strong></div>`;
  const photoGrid = arr => arr.length ? `<div class="detail-gallery">${arr.map(p => `<img src="${esc(p.previewUrl || p.dataUrl || '')}" alt="${esc(p.caption || '산행 사진')}">`).join('')}</div>` : '<p>등록된 사진이 없습니다.</p>';
  $('detail-content').innerHTML = `${photo ? `<div class="detail-cover"><img src="${esc(photo.previewUrl || photo.dataUrl || '')}" alt="${esc(r.name)} 대표 사진"></div>` : ''}
    <div class="detail-main"><div class="detail-topline"><span class="region-tag">${esc(r.region || '지역 미지정')}</span><span class="detail-date">${esc(formatDate(r.date))}</span>${r.difficulty ? `<span class="region-tag">${esc(r.difficulty)}</span>` : ''}</div>
    <h2 id="detail-title">${esc(r.name)}</h2>${mountainBadgeHtml(r, 'detail-mountain-badges')}<div class="detail-subline">${r.elevation ? `${esc(r.elevation)}m` : '정상 높이 미기록'}${r.course ? `　·　${esc(r.course)}` : ''}</div>
    <div class="detail-facts">${fact('산행 거리', r.distance ? `${esc(r.distance)}km` : '')}${fact('소요 시간', esc(r.duration))}${fact('출발 / 하산', r.startTime || r.endTime ? `${esc(r.startTime || '—')} / ${esc(r.endTime || '—')}` : '')}${fact('날씨', esc(r.weather))}</div>
    ${r.companions ? `<div class="detail-section"><h3>함께한 사람</h3><p>${esc(r.companions)}</p></div>` : ''}
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
      const paths = (record.photos || []).map(p => p.path).filter(Boolean);
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
    for (const r of records) {
      const copy = cleanRecord(r);
      copy.photos = [];
      for (const p of (r.photos || [])) {
        const item = cleanPhoto(p);
        if (!item.dataUrl && p.previewUrl) {
          try { item.dataUrl = await toDataUrlFromUrl(p.previewUrl); delete item.path; }
          catch (err) { /* keep path metadata if a network backup cannot fetch this picture */ }
        }
        if (!item.dataUrl && item.path) item.note = '클라우드 사진 경로: ' + item.path;
        copy.photos.push(item);
      }
      backupRecords.push(copy);
    }
    const payload = { app:'나의 산행기록장', version:1, exportedAt:new Date().toISOString(), photoMode: cloudMode ? 'cloud' : 'local', records:backupRecords };
    const blob = new Blob([JSON.stringify(payload)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `산행기록장_백업_${dateForInput()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    const noPhoto = backupRecords.reduce((s,r) => s + (r.photos || []).filter(p => !p.dataUrl).length, 0);
    $('backup-status').textContent = noPhoto ? `백업 파일을 만들었습니다. 일부 클라우드 사진 ${noPhoto}장은 네트워크 문제로 포함하지 못했을 수 있습니다.` : '백업 파일을 내려받았습니다. 안전한 개인 저장공간에 보관하세요.';
  } catch (err) {
    console.error(err); $('backup-status').textContent = `백업 실패: ${err.message || ''}`;
  } finally { btn.disabled = false; btn.textContent = '백업 내려받기'; }
}
async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = $('backup-status'); status.textContent = '백업 파일을 읽고 있습니다.';
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || !Array.isArray(payload.records)) throw new Error('산행기록장 백업 파일 형식이 아닙니다.');
    let imported = 0;
    for (const raw of payload.records) {
      const r = { ...raw, id: raw.id || makeId(), photos: (raw.photos || []).map(p => ({...p, id:p.id || makeId()})) };
      delete r.previewUrl;
      // Duplicate IDs are updated; records with a different ID are added.
      const old = records.find(x => x.id === r.id) || null;
      if (cloudMode) {
        if (!cloudUser) throw new Error('먼저 클라우드 계정에 로그인해 주세요.');
        const previousPhotos = old || null;
        const saved = await saveCloudRecord(r, previousPhotos);
        records = records.filter(x => x.id !== saved.id); records.push(saved);
      } else {
        const clean = cleanRecord(r);
        await localPut(clean);
        records = records.filter(x => x.id !== clean.id); records.push({...clean,photos:clean.photos.map(p=>({...p,previewUrl:p.dataUrl||''}))});
      }
      imported++;
    }
    records.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    render(); status.textContent = `${imported}개 산행 기록을 복원했습니다. 기존과 ID가 같은 기록은 업데이트했습니다.`;
    event.target.value = '';
  } catch (err) {
    console.error(err); status.textContent = `복원 실패: ${err.message || '파일을 확인해 주세요.'}`;
  }
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
