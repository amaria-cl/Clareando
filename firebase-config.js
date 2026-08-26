/* =============================================
   CLAREANDO v3 — Firebase
   ============================================= */

const firebaseConfig = {
  apiKey:            "AIzaSyBdptTH-k7U2sDrP_8BX17AgWJrfaq3WrU",
  authDomain:        "clareando.firebaseapp.com",
  projectId:         "clareando",
  storageBucket:     "clareando.firebasestorage.app",
  messagingSenderId: "545970418454",
  appId:             "1:545970418454:web:fd902c21561ee1b8afd637",
  measurementId:     "G-3TXL1KGLYW"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.db = db;

async function testarFirebase() {
  const badge = document.getElementById('fb-badge');
  const dot   = document.getElementById('fb-dot');
  const lbl   = document.getElementById('fb-label');
  try {
    await db.collection('_ping').doc('_ok').set({ t: Date.now() }, { merge: true });
    badge?.classList.add('connected');
    if (dot)  dot.style.background  = 'var(--green)';
    if (lbl)  lbl.textContent = 'Firebase ativo';
  } catch(e) {
    badge?.classList.add('error');
    if (dot)  dot.style.background  = 'var(--red)';
    if (lbl)  lbl.textContent = 'Sem conexão';
    console.warn('Firebase:', e.message);
  }
}
document.addEventListener('DOMContentLoaded', testarFirebase);
