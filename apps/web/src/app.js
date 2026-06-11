import {
  login as apiLogin,
  register as apiRegister,
  forgotPassword,
  resetPassword,
  changePassword as apiChangePassword,
  getPlants,
  getStats,
  uploadPlantPhoto,
  identifyPlant,
  createPlant,
  deletePlant,
  getLikes,
  toggleLikeApi,
  getComments,
  addCommentApi,
  getMyProfile,
  updateProfile,
  getMyPlants,
  getLikedPlants,
  getPublicProfile,
  getPublicPlants,
} from './api.js';

// --- Global state ---
let map = null;
let markersGroup = null;
let userLat = 38.6745, userLng = 39.1944, gpsReady = false;
let currentUser = null, currentUserEmail = null, userBadge = '🌱';
let appData = [];
let isMapFilterActive = false;
let userLocationMarker = null;
let currentView = 'home';
let mapInitialized = false;
let forgotEmailCache = '';

// ============================================================
// INIT
// ============================================================

window.addEventListener('load', () => {
  markersGroup = L.layerGroup();
  checkSession();
  loadRealData();
  loadStats();
  setupDragDrop();
  setupPhotoInput();
  locateUser();
});

// ============================================================
// AUTH — session
// ============================================================

async function checkSession() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const profile = await getMyProfile();
    setLoggedInUser(profile.username, profile.badge, profile.email);
  } catch {
    localStorage.removeItem('token');
  }
}

function setLoggedInUser(username, badge, email) {
  currentUser = username;
  userBadge = badge || '🌱';
  currentUserEmail = email;

  const wmsg = document.getElementById('welcomeMsg');
  if (wmsg) wmsg.innerHTML = `👋 ${username} <span style="opacity:0.7">(${badge})</span>`;

  const badgeEl = document.getElementById('navUserBadge');
  if (badgeEl) { badgeEl.textContent = `${badge} ${username}`; badgeEl.style.display = 'flex'; }

  const authBtn = document.getElementById('navAuthBtn');
  if (authBtn) {
    authBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Çıkış`;
    authBtn.onclick = logout;
  }

  closeAuth();
  // Giriş sonrası sosyal feed'i yenile (beğeni durumları güncellensin)
  if (currentView === 'social') renderSocialFeed();
}

// ============================================================
// AUTH — Modal helpers
// ============================================================

function openAuth() { document.getElementById('loginOverlay').style.display = 'flex'; switchAuthView('login'); }
function closeAuth() { document.getElementById('loginOverlay').style.display = 'none'; }

function switchAuthView(view) {
  const views = ['login', 'register', 'forgot', 'otp'];
  const titles = {
    login: ['Giriş Yap', 'Doğayı keşfetmeye devam et.'],
    register: ['Kayıt Ol', 'Topluluğa katılmak için hesap oluştur.'],
    forgot: ['Şifremi Unuttum', 'E-postana doğrulama kodu göndereceğiz.'],
    otp: ['Şifreyi Sıfırla', 'Gelen kodu gir ve yeni şifreni belirle.'],
  };
  views.forEach((v) => {
    const el = document.getElementById('authView' + v.charAt(0).toUpperCase() + v.slice(1));
    if (el) el.style.display = v === view ? 'block' : 'none';
  });
  const [title, sub] = titles[view] || ['Giriş Yap', ''];
  const titleEl = document.getElementById('authTitle');
  const subEl = document.getElementById('authSubtitle');
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = sub;
}

// ============================================================
// AUTH — handlers
// ============================================================

async function handleLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username || !password) { showToast('E-posta/kullanıcı adı ve parola gerekli.', 'error'); return; }
  try {
    const data = await apiLogin({ username, password });
    localStorage.setItem('token', data.token);
    setLoggedInUser(data.username, data.badge, data.email);
    showToast('Giriş başarılı! 🌿', 'success');
  } catch (e) {
    showToast(e.message || 'Giriş yapılamadı.', 'error');
  }
}

async function handleRegister() {
  const username = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPass').value;
  const pConf = document.getElementById('regPassConf').value;
  const agree = document.getElementById('regAgree').checked;

  if (!username || !email || !password) { showToast('Kullanıcı adı, e-posta ve parola gerekli.', 'error'); return; }
  if (password !== pConf) { showToast('Parolalar eşleşmiyor.', 'error'); return; }
  if (password.length < 6) { showToast('Parola en az 6 karakter olmalı.', 'error'); return; }
  if (!agree) { showToast('Kullanıcı sözleşmesini kabul etmelisiniz.', 'error'); return; }

  try {
    const data = await apiRegister({ username, email, password });
    localStorage.setItem('token', data.token);
    setLoggedInUser(data.username, data.badge, email);
    showToast('Aramıza hoş geldin! 🌱', 'success');
  } catch (e) {
    showToast(e.message || 'Kayıt başarısız.', 'error');
  }
}

async function handleForgot() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showToast('E-posta adresi girin.', 'error'); return; }
  forgotEmailCache = email;
  try {
    await forgotPassword(email);
    showToast('Doğrulama kodu e-postanıza gönderildi.', 'success');
    switchAuthView('otp');
    setTimeout(() => { const el = document.getElementById('otp0'); if (el) el.focus(); }, 100);
  } catch (e) {
    showToast(e.message || 'Bağlantı hatası.', 'error');
  }
}

async function handleReset() {
  const email = forgotEmailCache;
  const newPassword = document.getElementById('resetPass').value;
  const pConf = document.getElementById('resetPassConf').value;
  let otpCode = '';
  for (let i = 0; i < 6; i++) { const el = document.getElementById(`otp${i}`); if (el) otpCode += el.value; }

  if (otpCode.length < 6 || !newPassword) { showToast('Lütfen 6 haneli kodu ve yeni şifreyi girin.', 'error'); return; }
  if (newPassword !== pConf) { showToast('Şifreler eşleşmiyor.', 'error'); return; }

  try {
    await resetPassword({ email, otpCode, newPassword });
    showToast('Şifreniz sıfırlandı. Giriş yapabilirsiniz.', 'success');
    switchAuthView('login');
  } catch (e) {
    showToast(e.message || 'Bağlantı hatası.', 'error');
  }
}

async function handleChangePassword() {
  const oldPassword = document.getElementById('secOldPass').value;
  const newPassword = document.getElementById('secNewPass').value;
  if (!oldPassword || !newPassword) { showToast('Mevcut ve yeni şifreyi girin.', 'error'); return; }
  try {
    await apiChangePassword({ oldPassword, newPassword });
    showToast('Şifre başarıyla güncellendi.', 'success');
    document.getElementById('secOldPass').value = '';
    document.getElementById('secNewPass').value = '';
  } catch (e) {
    showToast(e.message || 'Hata oluştu.', 'error');
  }
}

async function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  currentUserEmail = null;
  userBadge = '🌱';
  location.reload();
}

// ============================================================
// AUTH — Password strength
// ============================================================

function checkPasswordStrength(val) {
  const bar = document.getElementById('pwdStrengthBar');
  const text = document.getElementById('pwdStrengthText');
  const box = document.getElementById('pwdStrengthBox');
  if (!bar || !text || !box) return;
  if (!val) { box.style.display = 'none'; text.style.display = 'none'; return; }
  box.style.display = 'block'; text.style.display = 'block';
  const score = [/[A-Z]/.test(val), /\d/.test(val), /[^A-Za-z0-9]/.test(val), val.length >= 10].filter(Boolean).length + (val.length >= 6 ? 1 : 0);
  bar.className = 'password-strength-bar';
  if (score <= 2) { bar.classList.add('strength-weak'); text.textContent = 'Zayıf'; text.style.color = 'var(--destructive)'; }
  else if (score <= 3) { bar.classList.add('strength-medium'); text.textContent = 'Orta'; text.style.color = 'var(--secondary)'; }
  else { bar.classList.add('strength-strong'); text.textContent = 'Güçlü'; text.style.color = 'var(--primary)'; }
}

// ============================================================
// OTP helpers
// ============================================================

function focusNext(el, nextIndex) { if (el.value && nextIndex < 6) { const n = document.getElementById(`otp${nextIndex}`); if (n) n.focus(); } }
function handleOtpKeyDown(e, index) { if (e.key === 'Backspace') { const el = document.getElementById(`otp${index}`); if (el && !el.value && index > 0) { const prev = document.getElementById(`otp${index - 1}`); if (prev) { prev.value = ''; prev.focus(); } } } }
function handleOtpPaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
  for (let i = 0; i < 6; i++) { const el = document.getElementById(`otp${i}`); if (el) el.value = text[i] || ''; }
  const last = document.getElementById(`otp${Math.min(text.length, 5)}`);
  if (last) last.focus();
}

// ============================================================
// VIEW SWITCHING
// ============================================================

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active-view'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
  const viewMap = { home: 'homeView', map: 'mapView', social: 'socialView' };
  const btnMap = { home: 'btnHomeMode', map: 'btnMapMode', social: 'btnSocialMode' };
  const viewEl = document.getElementById(viewMap[view]);
  if (viewEl) viewEl.classList.add('active-view');
  const btnEl = document.getElementById(btnMap[view]);
  if (btnEl) btnEl.classList.add('active');
  if (view === 'map' && !mapInitialized) setTimeout(initMap, 100);
  if (view === 'social') renderSocialFeed();
}

// ============================================================
// TOAST
// ============================================================

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3500);
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ============================================================
// MAP
// ============================================================

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;
  map = L.map('map', { zoomControl: true }).setView([userLat, userLng], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
  markersGroup.addTo(map);
  map.on('moveend', () => { if (isMapFilterActive) filterObservations(); });
  if (appData.length) renderObservations(appData);
}

function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; gpsReady = true; if (map) map.flyTo([userLat, userLng], 12, { animate: true, duration: 1.5 }); }, () => { gpsReady = true; });
}

function flyToUserLocation() {
  if (!map) { switchView('map'); setTimeout(() => flyToUserLocation(), 600); return; }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userLat = pos.coords.latitude; userLng = pos.coords.longitude; gpsReady = true;
      map.flyTo([userLat, userLng], 14, { animate: true, duration: 1.2 });
      if (userLocationMarker) userLocationMarker.remove();
      userLocationMarker = L.circleMarker([userLat, userLng], { radius: 10, fillColor: '#2a6b4a', fillOpacity: 0.8, color: '#fff', weight: 3 }).bindPopup('📍 Konumunuz').addTo(map);
    });
  }
}

function renderObservations(data) {
  if (!map || !markersGroup) return;
  markersGroup.clearLayers();
  const list = document.getElementById('observationList');
  if (list) list.innerHTML = '';

  data.forEach((item) => {
    if (!item.lat || !item.lng) return;
    const pinHtml = `<div class="custom-pin" style="width:46px;height:46px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);">${item.photoUrl ? `<img src="${item.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:20px;">${item.userBadge}</div>`}</div>`;
    const customIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [46, 46], iconAnchor: [23, 46] });
    const marker = L.marker([item.lat, item.lng], { icon: customIcon });
    marker.on('click', () => openPlantDetail(item));
    marker.bindPopup(`<div style="font-family:var(--font-sans,sans-serif);min-width:160px;">${item.photoUrl ? `<img src="${item.photoUrl}" style="width:100%;border-radius:8px;margin-bottom:8px;display:block;" />` : ''}<strong style="color:#1a4731;font-size:14px;">${item.name}</strong><br/><span style="font-size:12px;color:#7f9a8e;">@${item.userName}</span></div>`);
    markersGroup.addLayer(marker);

    if (list) {
      const li = document.createElement('li');
      li.innerHTML = `<div class="list-avatar">${item.photoUrl ? `<img src="${item.photoUrl}" alt="${item.name}" />` : `<span class="emoji">${item.userBadge}</span>`}</div><div class="list-info"><div class="name">${item.name}</div><div class="user">@${item.userName} · ${formatDate(item.createdAt)}</div></div>`;
      li.onclick = () => openPlantDetail(item);
      list.appendChild(li);
    }
  });
}

function filterObservations() {
  if (!map || !isMapFilterActive) { renderObservations(appData); return; }
  const bounds = map.getBounds();
  renderObservations(appData.filter((item) => item.lat && item.lng && bounds.contains([item.lat, item.lng])));
}

function toggleMapFilter() {
  const chk = document.getElementById('chkMapBounds');
  isMapFilterActive = chk ? chk.checked : false;
  filterObservations();
}

function searchLocationOrPlant(geoOnly = false) {
  const q = document.getElementById('searchInput')?.value?.trim();
  if (!q) return;
  if (geoOnly) {
    if (!map) { switchView('map'); setTimeout(() => searchLocationOrPlant(true), 600); return; }
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=tr&limit=1`)
      .then((r) => r.json())
      .then((results) => {
        if (results.length) { const { lat, lon } = results[0]; map.flyTo([parseFloat(lat), parseFloat(lon)], 12, { animate: true, duration: 1.5 }); }
        else showToast('Konum bulunamadı.', 'error');
      }).catch(() => showToast('Konum arama hatası.', 'error'));
    return;
  }
  const lower = q.toLowerCase();
  renderObservations(appData.filter((item) => item.name.toLowerCase().includes(lower) || item.userName.toLowerCase().includes(lower)));
  if (!map) switchView('map');
}

function goToMapLocation(lat, lng) {
  if (!map) { switchView('map'); setTimeout(() => goToMapLocation(lat, lng), 600); return; }
  map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
}

// ============================================================
// DRAG & DROP + Photo input
// ============================================================

function setupDragDrop() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
  });
}

function setupPhotoInput() {
  const input = document.getElementById('photoInput');
  if (!input) return;
  input.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) showPreview(file); });
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = document.getElementById('uploadPreview');
    const img = document.getElementById('previewImg');
    const dropZone = document.getElementById('dropZone');
    if (preview && img) { img.src = ev.target.result; preview.style.display = 'block'; if (dropZone) dropZone.style.display = 'none'; }
  };
  reader.readAsDataURL(file);
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = document.getElementById('photoInput');
  if (input) input.files = dt.files;
}

// ============================================================
// STATS
// ============================================================

async function loadStats() {
  const container = document.getElementById('statsContainer');
  if (!container) return;
  try {
    const { totalObservations, uniquePlants, activeUsers } = await getStats();
    container.innerHTML = `
      <div class="stat-card animate-fade-in-up delay-1"><div class="stat-number green">${totalObservations || 0}</div><div class="stat-label">Toplam Gözlem</div></div>
      <div class="stat-card animate-fade-in-up delay-2"><div class="stat-number amber">${uniquePlants || 0}</div><div class="stat-label">Keşfedilen Tür</div></div>
      <div class="stat-card animate-fade-in-up delay-3"><div class="stat-number green">${activeUsers || 0}</div><div class="stat-label">Aktif Kullanıcı</div></div>`;
  } catch {
    container.innerHTML = `<div class="stat-card"><div class="stat-number">—</div><div class="stat-label">Yüklenemedi</div></div>`;
  }
}

// ============================================================
// PLANT DATA
// ============================================================

async function loadRealData() {
  try {
    const { plants } = await getPlants();
    appData = plants || [];
    if (map) renderObservations(appData);
    if (currentView === 'social') renderSocialFeed();
  } catch (e) {
    console.error('Veri yükleme hatası:', e.message);
  }
}

// ============================================================
// ANALYZE & SAVE
// ============================================================

async function analyzeAndSave() {
  if (!currentUser) { openAuth(); return; }
  const fileInput = document.getElementById('photoInput');
  const userDescInput = document.getElementById('userDescription');
  const status = document.getElementById('statusMsg');
  const aiStatus = document.getElementById('aiStatus');

  if (!fileInput || !fileInput.files[0]) { showToast('Lütfen bir fotoğraf seçin.', 'error'); return; }
  if (!gpsReady) { showToast('Konum alınamadı. Lütfen konum iznini kontrol edin.', 'error'); return; }

  if (status) { status.innerHTML = '<span class="loader-spinner"></span> İşleniyor...'; status.style.color = 'var(--fg-muted)'; }

  const file = fileInput.files[0];
  let plantName = 'Bilinmeyen Tür';
  let aiConfidence = '';

  try {
    // 1. PlantNet AI analizi
    try {
      if (aiStatus) aiStatus.classList.add('visible');
      const aiForm = new FormData();
      aiForm.append('images', file);
      aiForm.append('organs', 'flower');
      const j = await identifyPlant(aiForm);
      if (j.results?.[0]) {
        const r = j.results[0];
        plantName = r.species?.commonNames?.[0] || r.species?.scientificNameWithoutAuthor || plantName;
        aiConfidence = `(AI: %${(r.score * 100).toFixed(0)})`;
      }
    } catch (aiErr) {
      console.warn('PlantNet AI hatası (devam ediliyor):', aiErr.message);
    } finally {
      if (aiStatus) aiStatus.classList.remove('visible');
    }

    // 2. Cloudinary'e yükle
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    const { url: photoUrl } = await uploadPlantPhoto(uploadForm);

    // 3. Veritabanına kaydet
    const userText = userDescInput?.value?.trim() || '';
    const finalDesc = userText ? `${userText} ${aiConfidence}` : `Bir gözlem paylaşıldı. ${aiConfidence}`;
    await createPlant({ name: plantName, description: finalDesc, photoUrl, lat: userLat, lng: userLng });

    if (status) { status.innerHTML = '✅ Başarıyla eklendi!'; status.style.color = 'var(--primary)'; }
    showToast(`"${plantName}" başarıyla paylaşıldı!`, 'success');

    if (fileInput) fileInput.value = '';
    if (userDescInput) userDescInput.value = '';
    const preview = document.getElementById('uploadPreview');
    const dropZone = document.getElementById('dropZone');
    if (preview) preview.style.display = 'none';
    if (dropZone) dropZone.style.display = 'block';

    await loadRealData();
    await loadStats();
  } catch (e) {
    if (status) { status.innerHTML = '❌ Hata: ' + e.message; status.style.color = 'var(--destructive)'; }
  }
}

// ============================================================
// SOCIAL FEED
// ============================================================

async function renderSocialFeed() {
  const container = document.getElementById('socialFeedList');
  if (!container) return;
  container.innerHTML = '<div class="empty-feed"><div class="spinner" style="width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--secondary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div><p>Yükleniyor...</p></div>';

  if (!appData.length) {
    try { const { plants } = await getPlants(); appData = plants || []; }
    catch { container.innerHTML = '<div class="empty-feed"><div class="icon">🌿</div><p>Veriler yüklenirken hata oluştu.</p></div>'; return; }
  }

  if (!appData.length) { container.innerHTML = '<div class="empty-feed"><div class="icon">🌿</div><p>Henüz keşif paylaşılmamış. İlk sen paylaş!</p></div>'; return; }

  container.innerHTML = '';

  for (const item of appData) {
    let likeCount = 0, isLiked = false, comments = [];
    try {
      const likesData = await getLikes(item.id);
      likeCount = likesData.count || 0;
      isLiked = likesData.liked || false;
      comments = await getComments(item.id);
    } catch { /**/ }

    const commentsHtml = comments.length
      ? comments.map((c) => `<div class="comment-item"><span class="comment-user">${c.username}:</span><span>${c.text}</span></div>`).join('')
      : '<div style="font-size:12px;color:var(--fg-subtle);font-style:italic;">Henüz yorum yok.</div>';

    const card = document.createElement('div');
    card.className = 'social-card animate-fade-in-up';
    card.innerHTML = `
      <div class="card-header">
        <div class="user-info"><span class="user-badge">${item.userBadge}</span><span class="username" onclick="openPublicProfile('${item.userName}')" style="cursor:pointer;">@${item.userName}</span></div>
        ${item.lat ? `<div class="map-link" onclick="goToMapLocation(${item.lat},${item.lng}); switchView('map');"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg> Haritada Gör</div>` : ''}
      </div>
      ${item.photoUrl ? `<img class="card-image" src="${item.photoUrl}" alt="${item.name}" onclick="openPlantDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="cursor:pointer;" loading="lazy" />` : ''}
      <div class="card-body">
        <div class="social-actions">
          <button class="action-btn" onclick="toggleLike(${item.id})"><span class="icon" id="like-icon-${item.id}">${isLiked ? '❤️' : '🤍'}</span><span class="count" id="like-count-${item.id}">${likeCount}</span></button>
          <button class="action-btn"><span class="icon">💬</span><span class="count" id="comment-count-${item.id}">${comments.length}</span></button>
          ${item.userName === currentUser ? `<button class="action-btn" onclick="handleDeletePlant(${item.id})" style="margin-left:auto;color:var(--destructive);">🗑️</button>` : ''}
        </div>
        <div class="plant-name">${item.name}</div>
        ${item.description ? `<div class="plant-desc">${item.description}</div>` : ''}
        <div class="card-date">${formatDate(item.createdAt)}</div>
      </div>
      <div class="comment-section">
        <div class="comment-list" id="comment-list-${item.id}">${commentsHtml}</div>
        <div class="comment-input-wrapper">
          <input type="text" class="comment-input" id="comment-input-${item.id}" placeholder="Yorum yaz..." onkeydown="if(event.key==='Enter') addComment(${item.id}, 'comment-input-${item.id}')" />
          <button class="comment-submit" onclick="addComment(${item.id}, 'comment-input-${item.id}')">Gönder</button>
        </div>
      </div>`;
    container.appendChild(card);
  }
}

// ============================================================
// LIKE
// ============================================================

async function toggleLike(id) {
  if (!currentUser) { openAuth(); return; }
  const iconEl = document.getElementById(`like-icon-${id}`);
  const countEl = document.getElementById(`like-count-${id}`);
  if (!iconEl || !countEl) return;
  try {
    const { liked, count } = await toggleLikeApi(id);
    countEl.textContent = count;
    iconEl.textContent = liked ? '❤️' : '🤍';
    if (liked) { iconEl.style.animation = 'heartBeat 0.6s ease-in-out'; setTimeout(() => { iconEl.style.animation = ''; }, 600); }
  } catch (e) { showToast(e.message || 'Beğeni işlemi başarısız.', 'error'); }
}

// ============================================================
// COMMENT
// ============================================================

async function addComment(id, inputId) {
  if (!currentUser) { openAuth(); return; }
  const inputEl = document.getElementById(inputId || `comment-input-${id}`);
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;
  try {
    await addCommentApi(id, text);
    inputEl.value = '';
    const listEl = document.getElementById(`comment-list-${id}`);
    if (listEl) {
      if (listEl.innerHTML.includes('Henüz yorum yok')) listEl.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `<span class="comment-user">${currentUser}:</span><span>${text}</span>`;
      listEl.appendChild(div);
      listEl.scrollTop = listEl.scrollHeight;
    }
    const countEl = document.getElementById(`comment-count-${id}`);
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
  } catch (e) { showToast(e.message || 'Yorum gönderilemedi.', 'error'); }
}

// ============================================================
// DELETE PLANT
// ============================================================

async function handleDeletePlant(id) {
  if (!confirm('Bu gözlemi silmek istiyor musunuz?')) return;
  try {
    await deletePlant(id);
    showToast('Gözlem silindi.', 'success');
    await loadRealData();
    if (currentView === 'social') renderSocialFeed();
  } catch (e) { showToast(e.message || 'Silinemedi.', 'error'); }
}

// ============================================================
// PLANT DETAIL OVERLAY
// ============================================================

async function openPlantDetail(item) {
  if (typeof item === 'string') { try { item = JSON.parse(item); } catch { return; } }
  const overlay = document.getElementById('plantDetailOverlay');
  const content = document.getElementById('plantDetailContent');
  if (!overlay || !content) return;
  overlay.style.display = 'flex';
  content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--fg-muted);">Yükleniyor...</div>';

  let likeCount = 0, isLiked = false, comments = [];
  try {
    const likesData = await getLikes(item.id);
    likeCount = likesData.count || 0; isLiked = likesData.liked || false;
    comments = await getComments(item.id);
  } catch { /**/ }

  const commentsHtml = comments.length
    ? comments.map((c) => `<div class="comment-item"><span class="comment-user">${c.username}:</span><span>${c.text}</span></div>`).join('')
    : '<div style="font-size:12px;color:var(--fg-subtle);font-style:italic;">Henüz yorum yok.</div>';

  content.innerHTML = `
    ${item.photoUrl ? `<img src="${item.photoUrl}" alt="${item.name}" style="width:100%;display:block;max-height:300px;object-fit:cover;" loading="lazy" />` : ''}
    <div style="padding:20px;">
      <h2 style="font-family:var(--font-serif);font-size:1.4rem;color:var(--primary);margin-bottom:6px;">${item.name}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">${item.userBadge}</span>
        <span onclick="openPublicProfile('${item.userName}')" style="font-size:14px;color:var(--secondary);font-weight:600;cursor:pointer;">@${item.userName}</span>
        <span style="font-size:12px;color:var(--fg-subtle);margin-left:auto;">${formatDate(item.createdAt)}</span>
      </div>
      ${item.description ? `<p style="font-size:14px;color:var(--fg-muted);line-height:1.6;margin-bottom:16px;">${item.description}</p>` : ''}
      ${item.lat ? `<div style="display:flex;gap:8px;margin-bottom:16px;"><button class="btn btn-sm btn-solid" onclick="goToMapLocation(${item.lat},${item.lng}); switchView('map'); document.getElementById('plantDetailOverlay').style.display='none';">🗺️ Haritada Gör</button></div>` : ''}
      <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--border-light);border-bottom:1px solid var(--border-light);margin-bottom:16px;">
        <button class="action-btn" onclick="toggleLike(${item.id})"><span id="like-icon-${item.id}">${isLiked ? '❤️' : '🤍'}</span><span id="like-count-${item.id}" style="font-weight:600;font-size:13px;">${likeCount}</span></button>
      </div>
      <h4 style="font-size:13px;font-weight:600;color:var(--fg-muted);margin-bottom:8px;">YORUMLAR (${comments.length})</h4>
      <div id="comment-list-${item.id}" style="max-height:180px;overflow-y:auto;font-size:13px;margin-bottom:10px;">${commentsHtml}</div>
      <div style="display:flex;gap:8px;">
        <input type="text" class="comment-input" id="comment-input-${item.id}" placeholder="Yorum yaz..." onkeydown="if(event.key==='Enter') addComment(${item.id}, 'comment-input-${item.id}')" />
        <button class="comment-submit" onclick="addComment(${item.id}, 'comment-input-${item.id}')">Gönder</button>
      </div>
    </div>`;
}

// ============================================================
// PUBLIC PROFILE OVERLAY
// ============================================================

async function openPublicProfile(username) {
  if (!username) return;
  const overlay = document.getElementById('publicProfileOverlay');
  const content = document.getElementById('publicProfileContent');
  const title = document.getElementById('publicProfileTitle');
  if (!overlay || !content) return;
  overlay.style.display = 'flex';
  if (title) title.textContent = `@${username}`;
  content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--fg-muted);">Yükleniyor...</div>';

  try {
    const [profile, plants] = await Promise.all([getPublicProfile(username), getPublicPlants(username)]);
    const gridHtml = plants.length
      ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:16px;">${plants.map((p) => p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="openPlantDetail(${JSON.stringify({...p,userBadge:p.userBadge||'🌱'}).replace(/"/g,'&quot;')})" loading="lazy"/>` : `<div style="aspect-ratio:1;background:var(--muted-bg);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">${p.userBadge || '🌱'}</div>`).join('')}</div>`
      : '<div style="padding:20px;text-align:center;color:var(--fg-subtle);">Henüz keşif yok.</div>';

    content.innerHTML = `
      <div style="font-size:52px;line-height:1;margin-bottom:12px;">${profile.badge}</div>
      <div style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:4px;">@${profile.username}</div>
      <div style="display:flex;gap:24px;justify-content:center;margin:12px 0 16px;">
        <div><div style="font-size:22px;font-weight:bold;color:var(--primary);">${profile.totalObservations}</div><div style="font-size:12px;color:var(--fg-muted);">Keşif</div></div>
        <div><div style="font-size:22px;font-weight:bold;color:var(--secondary);">${profile.discoveredSpecies}</div><div style="font-size:12px;color:var(--fg-muted);">Tür</div></div>
      </div>
      ${gridHtml}`;
  } catch {
    content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--destructive);">Kullanıcı profili yüklenemedi.</div>';
  }
}

// ============================================================
// PROFILE MODAL
// ============================================================

async function openProfile() {
  if (!currentUser) { openAuth(); return; }
  document.getElementById('profileOverlay').style.display = 'flex';
  document.getElementById('profName').textContent = currentUser;
  document.getElementById('profBadge').textContent = userBadge;
  document.getElementById('profEmail').textContent = currentUserEmail || '';
  switchProfileTab('my-plants');

  try {
    const [myPlants, likedPlants] = await Promise.all([getMyPlants(), getLikedPlants()]);
    renderProfileGrid(myPlants || [], 'profileMyPlantsView', 'Henüz keşif yapmadın. Haritaya git ve ilk gözlemini paylaş!');
    document.getElementById('profObs').textContent = (myPlants || []).length;
    document.getElementById('profSpec').textContent = new Set((myPlants || []).map((p) => p.name)).size;
    renderProfileGrid(likedPlants || [], 'profileLikedPlantsView', 'Henüz beğendiğin keşif yok.');
    document.getElementById('profLikes').textContent = (likedPlants || []).length;
  } catch (e) { console.error('Profil yükleme hatası:', e.message); }
}

function renderProfileGrid(plants, containerId, emptyMsg) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!plants.length) { container.innerHTML = `<div class="empty-state" style="grid-column:span 3;text-align:center;padding:40px 0;color:var(--fg-muted);">${emptyMsg}</div>`; return; }
  container.innerHTML = plants.map((p) => {
    const safeItem = JSON.stringify(p).replace(/"/g, '&quot;');
    return p.photoUrl
      ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="openPlantDetail('${safeItem}')" loading="lazy" />`
      : `<div style="aspect-ratio:1;background:var(--muted-bg);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;" onclick="openPlantDetail('${safeItem}')">${p.userBadge || '🌱'}</div>`;
  }).join('');
}

function switchProfileTab(tab) {
  const views = { 'my-plants': 'profileMyPlantsView', 'liked-plants': 'profileLikedPlantsView', settings: 'profileSettingsView' };
  const tabIds = { 'my-plants': 'tabMyPlants', 'liked-plants': 'tabLikedPlants', settings: 'tabSettings' };
  Object.keys(views).forEach((t) => {
    const viewEl = document.getElementById(views[t]);
    const tabEl = document.getElementById(tabIds[t]);
    if (viewEl) viewEl.style.display = t === tab ? (t === 'settings' ? 'block' : 'grid') : 'none';
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
}

// ============================================================
// WINDOW EXPORTS
// ============================================================

window.switchView = switchView;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.switchAuthView = switchAuthView;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgot = handleForgot;
window.handleReset = handleReset;
window.handleChangePassword = handleChangePassword;
window.logout = logout;
window.checkPasswordStrength = checkPasswordStrength;
window.focusNext = focusNext;
window.handleOtpKeyDown = handleOtpKeyDown;
window.handleOtpPaste = handleOtpPaste;
window.openProfile = openProfile;
window.switchProfileTab = switchProfileTab;
window.renderProfileGrid = renderProfileGrid;
window.flyToUserLocation = flyToUserLocation;
window.searchLocationOrPlant = searchLocationOrPlant;
window.toggleMapFilter = toggleMapFilter;
window.goToMapLocation = goToMapLocation;
window.analyzeAndSave = analyzeAndSave;
window.toggleLike = toggleLike;
window.addComment = addComment;
window.openPlantDetail = openPlantDetail;
window.openPublicProfile = openPublicProfile;
window.handleDeletePlant = handleDeletePlant;
