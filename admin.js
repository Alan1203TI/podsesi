import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Usa o bucket configurado no firebase-config.js automaticamente.
// Não forçamos gs:// aqui para evitar erro de bucket/CORS em projetos novos do Firebase.
const storage = getStorage(app);

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

  const audio = $('audioFile').files[0];
  if (!audio) return alert('Selecione o arquivo de áudio.');

  const title = $('title').value.trim();
  if (!title) return alert('Digite o título do episódio.');

  const cover = $('coverFile').files[0];
  const id = Date.now().toString();
  $('saveEpisodeBtn').disabled = true;

  try {
    const audioPath = `audios/${id}-${safe(audio.name)}`;
    const coverPath = cover ? `capas/${id}-${safe(cover.name)}` : '';

    const audioUrl = await uploadFile(audio, audioPath, 'Áudio');
    const coverUrl = cover ? await uploadFile(cover, coverPath, 'Capa') : '';

    await addDoc(collection(db, EPISODES_COLLECTION), {
      title,
      description: $('description').value.trim(),
      audioUrl,
      coverUrl,
      audioPath,
      coverPath,
      plays: 0,
      createdAt: serverTimestamp()
    });

    $('episodeForm').reset();
    $('uploadStatus').textContent = 'Episódio enviado com sucesso!';
  } catch (err) {
    console.error(err);
    $('uploadStatus').textContent = 'Erro: ' + firebaseErrorMessage(err);
    alert('Erro ao enviar: ' + firebaseErrorMessage(err));
  } finally {
    $('saveEpisodeBtn').disabled = false;
    setTimeout(() => $('uploadStatus').textContent = '', 5000);
  }
};

function uploadFile(file, path, label = 'Arquivo') {
  return new Promise((resolve, reject) => {
    $('uploadStatus').textContent = `${label}: iniciando envio...`;
    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type || (path.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream'),
      cacheControl: 'public,max-age=3600'
    };
    const task = uploadBytesResumable(storageRef, file, metadata);

    const watchdog = setTimeout(() => {
      if (task.snapshot.bytesTransferred === 0) {
        $('uploadStatus').textContent = `${label}: ainda em 0%. O Firebase Storage pode não estar criado/ativado ou as regras do Storage não foram publicadas.`;
      }
    }, 10000);

    task.on('state_changed',
      snapshot => {
        const total = snapshot.totalBytes || file.size || 1;
        const pct = Math.round((snapshot.bytesTransferred / total) * 100);
        $('uploadStatus').textContent = `${label}: enviando ${pct}%`;
      },
      err => {
        clearTimeout(watchdog);
        reject(err);
      },
      async () => {
        clearTimeout(watchdog);
        $('uploadStatus').textContent = `${label}: enviado 100%`;
        resolve(await getDownloadURL(task.snapshot.ref));
      }
    );
  });
}

function renderEpisodes() {
  if (!episodes.length) {
    $('episodesList').innerHTML = '<div class="empty-admin">Nenhum episódio cadastrado ainda.</div>';
    return;
  }

  $('episodesList').innerHTML = episodes.map(ep => `
    <div class="manage-item">
      <img src="${ep.coverUrl || './assets/logo-podsesi.png'}" onerror="this.onerror=null;this.src='./logo-podsesi.png';" alt="Capa">
      <div class="item-text">
        <strong>${esc(ep.title)}</strong>
        <small>${ep.plays || 0} reproduções</small>
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
  const ep = episodes.find(e => e.id === id);
  if (!confirm('Excluir este episódio e seus arquivos?')) return;

  await deleteDoc(doc(db, EPISODES_COLLECTION, id));
  if (ep?.audioPath) deleteObject(ref(storage, ep.audioPath)).catch(() => {});
  if (ep?.coverPath) deleteObject(ref(storage, ep.coverPath)).catch(() => {});
}

function firebaseErrorMessage(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied')) return 'sem permissão no Firestore. Publique as regras do arquivo REGRAS-FIRESTORE.txt.';
  if (code.includes('unauthorized')) return 'sem permissão no Storage. Publique as regras do arquivo REGRAS-STORAGE.txt em Storage > Regras.';
  if (code.includes('object-not-found')) return 'arquivo não encontrado no Storage.';
  if (code.includes('storage/unknown')) return 'falha no Storage. Verifique se o Storage foi criado em Firebase > Storage > Arquivos e publique as regras.';
  if (code.includes('bucket-not-found')) return 'bucket do Storage não encontrado. Confira o storageBucket no firebase-config.js.';
  if (code.includes('canceled')) return 'upload cancelado.';
  if (code.includes('quota')) return 'limite/cota do Firebase Storage atingido.';
  return err?.message || 'erro desconhecido no Firebase.';
}

function safe(name) {
  return String(name || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-');
}

function esc(s) {
  return String(s || '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}
