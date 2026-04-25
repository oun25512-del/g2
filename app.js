// ===================================================
//  app.js — Homework, Schedule & AI logic
// ===================================================

const HW_KEY  = 'hw_homework_';
const SCH_KEY = 'hw_schedule_';

// ── subject colors ────────────────────────────────────
const SUBJECT_COLORS = {
  'คณิตศาสตร์': '#7c6ff7',
  'วิทยาศาสตร์': '#22d3ee',
  'ภาษาไทย':    '#f472b6',
  'ภาษาอังกฤษ': '#34d399',
  'สังคมศึกษา':  '#fbbf24',
  'ประวัติศาสตร์':'#fb923c',
  'ศิลปะ':       '#e879f9',
  'พลศึกษา':    '#4ade80',
  'คอมพิวเตอร์': '#38bdf8',
  'อื่นๆ':       '#94a3b8',
};

// ── homework helpers ──────────────────────────────────
function getUserHwKey() {
  const s = getSession();
  return HW_KEY + (s ? s.id : 'guest');
}
function getHomework() {
  return JSON.parse(localStorage.getItem(getUserHwKey()) || '[]');
}
function saveHomework(hw) {
  localStorage.setItem(getUserHwKey(), JSON.stringify(hw));
}
function addHomework(item) {
  const hw = getHomework();
  item.id = Date.now().toString();
  item.done = false;
  item.createdAt = new Date().toISOString();
  hw.unshift(item);
  saveHomework(hw);
  return item;
}
function toggleHomework(id) {
  const hw = getHomework();
  const i = hw.findIndex(h => h.id === id);
  if (i >= 0) { hw[i].done = !hw[i].done; saveHomework(hw); }
}
function deleteHomework(id) {
  saveHomework(getHomework().filter(h => h.id !== id));
}

// ── schedule helpers ──────────────────────────────────
function getUserSchKey() {
  const s = getSession();
  return SCH_KEY + (s ? s.id : 'guest');
}
function getSchedule() {
  return JSON.parse(localStorage.getItem(getUserSchKey()) || 'null') || getDefaultSchedule();
}
function saveSchedule(sch) {
  localStorage.setItem(getUserSchKey(), JSON.stringify(sch));
}
function getDefaultSchedule() {
  const days = ['จ','อ','พ','พฤ','ศ'];
  const periods = [
    '08:30','09:30','10:30','11:30','12:30','13:30','14:30','15:30'
  ];
  const grid = {};
  periods.forEach(t => {
    grid[t] = {};
    days.forEach(d => { grid[t][d] = null; });
  });
  return { days, periods, grid };
}

// ── date helpers ──────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' });
}
function getDaysLeft(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function dueLabelClass(daysLeft) {
  if (daysLeft === null) return '';
  if (daysLeft < 0) return 'urgent';
  if (daysLeft <= 2) return 'urgent';
  if (daysLeft <= 5) return 'soon';
  return '';
}
function dueLabelText(daysLeft) {
  if (daysLeft === null) return 'ไม่มีกำหนด';
  if (daysLeft < 0) return `เลยกำหนด ${Math.abs(daysLeft)} วัน`;
  if (daysLeft === 0) return 'ถึงกำหนดวันนี้!';
  return `อีก ${daysLeft} วัน`;
}

// ── AI CHAT (Anthropic API) ───────────────────────────
const AI_MODEL   = 'claude-sonnet-4-20250514';
const AI_SYSTEM  = `คุณคือ "StudyBot" ผู้ช่วย AI สำหรับนักเรียน ชื่อเล่น "สตาดี้"
ช่วยเรื่อง: การบ้าน, ตารางเรียน, เทคนิคการเรียน, อธิบายเนื้อหา
ตอบเป็นภาษาไทยเสมอ ใช้ภาษาสุภาพแต่เป็นมิตร กระชับ ชัดเจน
ถ้าถูกถามเรื่องการบ้านให้ช่วยอธิบาย ไม่ทำการบ้านแทนโดยตรง
ใช้ emoji เพิ่มความสนุกสนาน`;

async function askAI(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1000,
      system: AI_SYSTEM,
      messages,
    }),
  });
  if (!res.ok) throw new Error('API Error: ' + res.status);
  const data = await res.json();
  return data.content?.[0]?.text || 'ขอโทษนะ ไม่สามารถตอบได้ตอนนี้ 😅';
}

// ── current page detection ────────────────────────────
function currentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}
