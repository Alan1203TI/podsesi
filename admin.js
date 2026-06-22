import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EPISODES_COLLECTION = 'episodios';
let episodes = [];
const $ = id => document.getElementById(id);

$('loginBtn').onclick = () => {
  if ($('passwordInput').value === ADMIN_PASSWORD) {
    sessionStorage.setItem('podsesi-admin', 'ok');
    showAdmin();
  } else {
    alert('Senha incorreta.');
  }
};

$('passwordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('loginBtn').click();
});

$('logoutBtn').onclick = () => {
  sessionStorage.removeItem('podsesi-admin');
  location.reload();
};

$('audioFile').addEventListener('change', () => {
  const file = $('audioFile').files[0];
  if (file) $('audioName').value = safe(file.name);
});

$('coverFile').addEventListener('change', () => {
  const file = $('coverFile').files[0];
  if (file) $('coverName').value = safe(file.name);
});

if (sessionStorage.getItem('podsesi-admin') === 'ok') showAdmin();

function showAdmin() {
  $('loginScreen').classList.add('hidden');
  $('adminApp').classList.remove('hidden');
  startListeners();
}

function startListeners() {
  onSnapshot(
    query(collection(db, EPISODES_COLLECTION), orderBy('createdAt', 'desc')),
    snap => {
      episodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderEpisodes();
    },
    err => {
      console.error(err);
      alert('Erro ao carregar episódios: ' + firebaseErrorMessage(err));
    }
  );
}

$('episodeForm').onsubmit = async (e) => {
  e.preventDefault();

  const title = $('title').value.trim();
  const description = $('description').value.trim();
  const audioName = safe($('audioName').value.trim());
  const coverName = safe($('coverName').value.trim());

  if (!title) return alert('Digite o título do episódio.');
  if (!audioName) return alert('Informe o nome do arquivo MP3 que está na pasta audios/.');
  if (!audioName.toLowerCase().match(/\.(mp3|wav|m4a|ogg)$/)) {
    return alert('O arquivo de áudio precisa terminar com .mp3, .wav, .m4a ou .ogg');
  }

  $('saveEpisodeBtn').disabled = true;
  $('uploadStatus').textContent = 'Salvando informações no Firestore...';

  try {
    await addDoc(collection(db, EPISODES_COLLECTION), {
      title,
      description,
      audioUrl: `audios/${audioName}`,
      coverUrl: coverName ? `capas/${coverName}` : 'logo-podsesi.png',
      audioPath: `audios/${audioName}`,
      coverPath: coverName ? `capas/${coverName}` : '',
      plays: 0,
      createdAt: serverTimestamp()
    });

    $('episodeForm').reset();
    $('uploadStatus').innerHTML = 'Episódio salvo! Agora confirme se o MP3 está na pasta <strong>audios/</strong> e a capa na pasta <strong>capas/</strong> do GitHub.';
  } catch (err) {
    console.error(err);
    $('uploadStatus').textContent = 'Erro: ' + firebaseErrorMessage(err);
    alert('Erro ao salvar: ' + firebaseErrorMessage(err));
  } finally {
    $('saveEpisodeBtn').disabled = false;
    setTimeout(() => $('uploadStatus').textContent = '', 9000);
  }
};

function renderEpisodes() {
  if (!episodes.length) {
    $('episodesList').innerHTML = '<div class="empty-admin">Nenhum episódio cadastrado ainda.</div>';
    return;
  }

  $('episodesList').innerHTML = episodes.map(ep => `
    <div class="manage-item">
      <img src="${esc(ep.coverUrl || 'logo-podsesi.png')}" onerror="this.onerror=null;this.src='logo-podsesi.png';" alt="Capa">
      <div class="item-text">
        <strong>${esc(ep.title)}</strong>
        <small>${ep.plays || 0} reproduções</small>
        <small>Áudio: ${esc(ep.audioUrl || '')}</small>
        <small>${esc(ep.description || '')}</small>
      </div>
      <button class="danger-btn" data-delep="${ep.id}">Excluir</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-delep]').forEach(btn => {
    btn.onclick = async () => deleteEpisode(btn.dataset.delep);
  });
}

async function deleteEpisode(id) {
  if (!confirm('Excluir este episódio do painel? Os arquivos no GitHub não serão apagados automaticamente.')) return;
  await deleteDoc(doc(db, EPISODES_COLLECTION, id));
}

function firebaseErrorMessage(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied')) return 'sem permissão no Firestore. Publique as regras do arquivo REGRAS-FIRESTORE.txt.';
  return err?.message || 'erro desconhecido no Firebase.';
}

function safe(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function esc(s) {
  return String(s || '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}
