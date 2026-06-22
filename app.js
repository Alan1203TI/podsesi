const grid = document.getElementById('episodesGrid');
const counter = document.getElementById('counter');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const audio = document.getElementById('audioPlayer');
const playerCover = document.getElementById('playerCover');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playFirst = document.getElementById('playFirst');
const installBtn = document.getElementById('installBtn');

let episodes = [];
let visible = [];
let currentIndex = -1;
let categoryFilter = 'todos';

async function loadEpisodes(){
  const fb = window.PODSESI_FIREBASE;
  if (fb?.enabled) {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const { getFirestore, collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const app = initializeApp(fb.config);
      const db = getFirestore(app);
      const q = query(collection(db, fb.collection), orderBy('criadoEm', 'desc'));
      onSnapshot(q, snap => {
        episodes = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        applyFilters();
      });
      return;
    } catch (e) { console.warn('Firebase indisponível. Usando modo local.', e); }
  }
  episodes = window.EPISODIOS_LOCAIS || [];
  applyFilters();
}

function applyFilters(){
  const term = searchInput.value.toLowerCase().trim();
  visible = episodes.filter(ep => {
    const byCat = categoryFilter === 'todos' || ep.categoria === categoryFilter;
    const text = `${ep.titulo} ${ep.descricao} ${ep.categoria}`.toLowerCase();
    return byCat && (!term || text.includes(term));
  });
  if (sortSelect.value === 'titulo') visible.sort((a,b)=>a.titulo.localeCompare(b.titulo));
  else visible.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  render();
}

function render(){
  counter.textContent = `${visible.length} episódio${visible.length===1?'':'s'}`;
  grid.innerHTML = visible.map((ep,i)=>`
    <article class="episode" data-index="${i}">
      <img src="${ep.capaUrl || 'assets/podsesi-card.jpeg'}" alt="Capa" onerror="this.src='assets/podsesi-card.jpeg'" />
      <div class="episode-info">
        <span>${ep.categoria || 'Podcast'}</span>
        <h3>${ep.titulo}</h3>
        <p>${ep.descricao || ''}</p>
        <button class="play-card">▶ Escutar</button>
      </div>
    </article>`).join('') || '<div class="empty">Nenhum episódio encontrado.</div>';
  document.querySelectorAll('.episode').forEach(card => card.addEventListener('click', () => playEpisode(Number(card.dataset.index))));
}

function playEpisode(index){
  const ep = visible[index];
  if(!ep) return;
  currentIndex = index;
  playerCover.src = ep.capaUrl || 'assets/podsesi-card.jpeg';
  playerTitle.textContent = ep.titulo;
  playerMeta.textContent = ep.categoria || 'PODSESI';
  audio.src = ep.audioUrl;
  audio.play().catch(()=>{});
  playPauseBtn.textContent = '⏸';
}

playPauseBtn.addEventListener('click', () => {
  if(!audio.src && visible.length) return playEpisode(0);
  if(audio.paused){ audio.play(); playPauseBtn.textContent='⏸'; }
  else { audio.pause(); playPauseBtn.textContent='▶'; }
});
audio.addEventListener('ended', () => nextBtn.click());
prevBtn.addEventListener('click', () => playEpisode(Math.max(0, currentIndex-1)));
nextBtn.addEventListener('click', () => playEpisode(Math.min(visible.length-1, currentIndex+1)));
playFirst.addEventListener('click', () => playEpisode(0));
searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);
document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  categoryFilter = btn.dataset.filter;
  applyFilters();
}));

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; installBtn.hidden = false; });
installBtn?.addEventListener('click', async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; installBtn.hidden=true; }});
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
loadEpisodes();
