// ===================================================
//  auth.js — Authentication & User Storage Logic
// ===================================================

const AUTH_KEY   = 'hw_users';
const SESSION_KEY = 'hw_session';
const REMEMBER_KEY = 'hw_remember';

// ── helpers ──────────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}
function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null');
}
function setSession(user, remember = false) {
  const data = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(SESSION_KEY, data);
  } else {
    sessionStorage.setItem(SESSION_KEY, data);
    localStorage.removeItem(SESSION_KEY);
  }
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
function isLoggedIn() {
  return !!getSession();
}

// ── register ─────────────────────────────────────────
function register({ name, email, gmail, password, grade }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { ok: false, msg: 'อีเมลนี้ถูกใช้งานแล้ว' };
  }
  const user = {
    id: Date.now().toString(),
    name, email, gmail: gmail || '', password, grade: grade || '',
    createdAt: new Date().toISOString(),
    avatar: name.charAt(0).toUpperCase(),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

// ── login ─────────────────────────────────────────────
function login({ email, password, remember }) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { ok: false, msg: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  const safe = { ...user };
  delete safe.password;
  setSession(safe, remember);
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email }));
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
  return { ok: true, user: safe };
}

// ── logout ────────────────────────────────────────────
function logout() {
  clearSession();
  window.location.href = 'login.html';
}

// ── get remembered email ──────────────────────────────
function getRemembered() {
  return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
}

// ── redirect guards ───────────────────────────────────
function requireAuth() {
  if (!isLoggedIn()) window.location.href = 'login.html';
}
function redirectIfLoggedIn() {
  if (isLoggedIn()) window.location.href = 'dashboard.html';
}

// ── toast ─────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '💡', warn: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'💬'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
