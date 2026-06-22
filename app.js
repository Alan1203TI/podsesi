import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = { categories: [], episodes: [], filtered: [], selectedCategory: 'Todos', currentIndex: -1 };
const els = {
  tabs: document.getElementById('categoryTabs'), grid: document.getElementById('episodesGrid'), empty: document.getElementById('emptyState'), search: document.getElementById('searchInput'),
  bar: document.getElementById('playerBar'), cover: document.getElementById('playerCover'), title: document.getElementById('playerTitle'), cat: document.getElementById('playerCategory'), audio: document.getElementById('audioPlayer'),
  play: document.getElementById('playPauseBtn'), prev: document.getElementById('prevBtn'), next: document.getElementById('nextBtn'), progress: document.getElementById('progress'), current: document.getElementById('currentTime'), duration: document.getElementById('duration')
};

onSnapshot(query(collection(db, 'categories'), orderBy('name')), snap => { state.categories = snap.docs.map(d => ({ id:d.id, ...d.data() })); renderTabs(); });
onSnapshot(query(collection(db, 'episodes'), orderBy('createdAt', 'desc')), snap => { state.episodes = snap.docs.map(d => ({ id:d.id, ...d.data() })); applyFilters(); });

function renderTabs(){
  const all = ['Todos', ...state.categories.map(c => c.name)];
  els.tabs.innerHTML = all.map(name => `<button class="tab ${name===state.selectedCategory?'active':''}" data-cat="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
  els.tabs.querySelectorAll('button').forEach(btn => btn.onclick = () => { state.selectedCategory = btn.dataset.cat; renderTabs(); applyFilters(); });
}
function applyFilters(){
  const term = els.search.value.trim().toLowerCase();
  state.filtered = state.episodes.filter(ep => {
    const catOk = state.selectedCategory === 'Todos' || ep.category === state.selectedCategory;
    const text = `${ep.title||''} ${ep.description||''} ${ep.category||''}`.toLowerCase();
    return catOk && (!term || text.includes(term));
  });
  renderEpisodes();
}
function renderEpisodes(){
  els.empty.classList.toggle('hidden', state.filtered.length > 0);
  els.grid.innerHTML = state.filtered.map((ep, idx) => `
    <article class="episode-card" data-index="${idx}">
      <img src="${ep.coverUrl || 'assets/logo-podsesi.jpeg'}" alt="${escapeHtml(ep.title||'Episódio')}" />
      <h3>${escapeHtml(ep.title || 'Sem título')}</h3>
      <p>${escapeHtml(ep.description || 'Episódio do PODSESI.')}</p>
      <span class="badge">${escapeHtml(ep.category || 'PODSESI')}</span>
      <button class="play-pill">▶ Ouvir</button>
    </article>
  `).join('');
  els.grid.querySelectorAll('.episode-card').forEach(card => card.onclick = () => playEpisode(Number(card.dataset.index)));
}
async function playEpisode(index){
  const ep = state.filtered[index]; if(!ep?.audioUrl) return;
  state.currentIndex = index;
  els.bar.classList.remove('hidden'); els.cover.src = ep.coverUrl || 'assets/logo-podsesi.jpeg'; els.title.textContent = ep.title || 'Episódio'; els.cat.textContent = ep.category || 'PODSESI';
  els.audio.src = ep.audioUrl; await els.audio.play().catch(()=>{}); els.play.textContent = '⏸';
  updateDoc(doc(db, 'episodes', ep.id), { plays: increment(1) }).catch(()=>{});
}
function playAdjacent(step){ if(!state.filtered.length) return; const next = state.currentIndex < 0 ? 0 : (state.currentIndex + step + state.filtered.length) % state.filtered.length; playEpisode(next); }
els.search.addEventListener('input', applyFilters); els.play.onclick = () => { if(els.audio.paused){ els.audio.play(); els.play.textContent='⏸'; } else { els.audio.pause(); els.play.textContent='▶'; } }; els.prev.onclick=()=>playAdjacent(-1); els.next.onclick=()=>playAdjacent(1); els.audio.onended=()=>playAdjacent(1);
els.audio.ontimeupdate = () => { if(!els.audio.duration) return; els.progress.value = (els.audio.currentTime / els.audio.duration) * 100; els.current.textContent = fmt(els.audio.currentTime); els.duration.textContent = fmt(els.audio.duration); };
els.progress.oninput = () => { if(els.audio.duration) els.audio.currentTime = (Number(els.progress.value)/100)*els.audio.duration; };
function fmt(sec){ sec=Math.floor(sec||0); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
