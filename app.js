import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EPISODES_COLLECTION = 'episodios';
const state = { episodes: [], filtered: [], currentIndex: -1 };

const els = {
  grid: document.getElementById('episodesGrid'),
  empty: document.getElementById('emptyState'),
  search: document.getElementById('searchInput'),
  bar: document.getElementById('playerBar'),
  cover: document.getElementById('playerCover'),
  title: document.getElementById('playerTitle'),
  cat: document.getElementById('playerCategory'),
  audio: document.getElementById('audioPlayer'),
  play: document.getElementById('playPauseBtn'),
  prev: document.getElementById('prevBtn'),
  next: document.getElementById('nextBtn'),
  progress: document.getElementById('progress'),
  current: document.getElementById('currentTime'),
  duration: document.getElementById('duration')
};

onSnapshot(
  query(collection(db, EPISODES_COLLECTION), orderBy('createdAt', 'desc')),
  snap => {
    state.episodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    applyFilters();
  },
  err => {
    console.error(err);
    els.empty.classList.remove('hidden');
    els.empty.innerHTML = '<h3>Erro ao carregar episódios</h3><p>Confira as regras do Firestore e a configuração do Firebase.</p>';
  }
);

function applyFilters() {
  const term = els.search.value.trim().toLowerCase();
  state.filtered = state.episodes.filter(ep => {
    const text = `${ep.title || ''} ${ep.description || ''}`.toLowerCase();
    return !term || text.includes(term);
  });
  renderEpisodes();
}

function renderEpisodes() {
  els.empty.classList.toggle('hidden', state.filtered.length > 0);
  els.grid.innerHTML = state.filtered.map((ep, idx) => `
    <article class="episode-card" data-index="${idx}">
      <img src="${resolveCover(ep.coverUrl)}" onerror="this.onerror=null;this.src='logo-podsesi.png';" alt="${escapeHtml(ep.title || 'Episódio')}" />
      <h3>${escapeHtml(ep.title || 'Sem título')}</h3>
      <p>${escapeHtml(ep.description || 'Episódio do PODSESI.')}</p>
      <span class="badge">PODSESI</span>
      <button class="play-pill">▶</button>
    </article>
  `).join('');

  els.grid.querySelectorAll('.episode-card').forEach(card => {
    card.onclick = () => playEpisode(Number(card.dataset.index));
  });
}

async function playEpisode(index) {
  const ep = state.filtered[index];
  if (!ep?.audioUrl) return;
  const audioSrc = resolveAudio(ep.audioUrl);

  state.currentIndex = index;
  els.bar.classList.remove('hidden');
  els.cover.src = resolveCover(ep.coverUrl);
  els.title.textContent = ep.title || 'Episódio';
  els.cat.textContent = 'PODSESI';
  els.audio.src = audioSrc;

  await els.audio.play().catch(() => {});
  els.play.textContent = '⏸';
  updateDoc(doc(db, EPISODES_COLLECTION, ep.id), { plays: increment(1) }).catch(() => {});
}

function playAdjacent(step) {
  if (!state.filtered.length) return;
  const next = state.currentIndex < 0 ? 0 : (state.currentIndex + step + state.filtered.length) % state.filtered.length;
  playEpisode(next);
}

els.search.addEventListener('input', applyFilters);
els.play.onclick = () => {
  if (els.audio.paused) {
    els.audio.play();
    els.play.textContent = '⏸';
  } else {
    els.audio.pause();
    els.play.textContent = '▶';
  }
};
els.prev.onclick = () => playAdjacent(-1);
els.next.onclick = () => playAdjacent(1);
els.audio.onended = () => playAdjacent(1);

els.audio.ontimeupdate = () => {
  if (!els.audio.duration) return;
  els.progress.value = (els.audio.currentTime / els.audio.duration) * 100;
  els.current.textContent = fmt(els.audio.currentTime);
  els.duration.textContent = fmt(els.audio.duration);
};

els.progress.oninput = () => {
  if (els.audio.duration) els.audio.currentTime = (Number(els.progress.value) / 100) * els.audio.duration;
};

function resolveCover(value) {
  if (!value) return 'logo-podsesi.png';
  if (/^https?:\/\//i.test(value)) return value;
  return value;
}

function resolveAudio(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return value;
}

function fmt(sec) {
  sec = Math.floor(sec || 0);
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}
