import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const app = initializeApp(firebaseConfig); const db = getFirestore(app); const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
let categories = []; let episodes = [];
const $ = id => document.getElementById(id);

$('loginBtn').onclick = () => { if($('passwordInput').value === ADMIN_PASSWORD){ sessionStorage.setItem('podsesi-admin','ok'); showAdmin(); } else alert('Senha incorreta.'); };
$('logoutBtn').onclick = () => { sessionStorage.removeItem('podsesi-admin'); location.reload(); };
if(sessionStorage.getItem('podsesi-admin') === 'ok') showAdmin();
function showAdmin(){ $('loginScreen').classList.add('hidden'); $('adminApp').classList.remove('hidden'); startListeners(); }

function startListeners(){
  onSnapshot(query(collection(db,'categories'), orderBy('name')), snap => { categories = snap.docs.map(d=>({id:d.id,...d.data()})); renderCategories(); fillCategorySelect(); });
  onSnapshot(query(collection(db,'episodes'), orderBy('createdAt','desc')), snap => { episodes = snap.docs.map(d=>({id:d.id,...d.data()})); renderEpisodes(); });
}
$('addCategoryBtn').onclick = async () => { const name=$('categoryName').value.trim(); if(!name) return; await addDoc(collection(db,'categories'), { name, createdAt: serverTimestamp() }); $('categoryName').value=''; };
function renderCategories(){ $('categoriesList').innerHTML = categories.map(c => `<div class="manage-item"><strong>${esc(c.name)}</strong><button class="danger-btn" data-delcat="${c.id}">Excluir</button></div>`).join(''); document.querySelectorAll('[data-delcat]').forEach(b => b.onclick = async()=>{ if(confirm('Excluir esta categoria? Os episódios não serão apagados.')) await deleteDoc(doc(db,'categories',b.dataset.delcat)); }); }
function fillCategorySelect(){ $('categorySelect').innerHTML = categories.length ? categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('') : '<option value="PODSESI">PODSESI</option>'; }

$('episodeForm').onsubmit = async (e) => { e.preventDefault(); const audio=$('audioFile').files[0]; if(!audio) return alert('Selecione o arquivo de áudio.'); const cover=$('coverFile').files[0]; const id = Date.now().toString(); $('saveEpisodeBtn').disabled=true; try{
  const audioPath = `audios/${id}-${safe(audio.name)}`;
  const coverPath = cover ? `capas/${id}-${safe(cover.name)}` : '';
  const audioUrl = await uploadFile(audio, audioPath, 'Áudio');
  const coverUrl = cover ? await uploadFile(cover, coverPath, 'Capa') : '';
  await addDoc(collection(db,'episodes'), { title:$('title').value.trim(), description:$('description').value.trim(), category:$('categorySelect').value, audioUrl, coverUrl, audioPath, coverPath, plays:0, createdAt: serverTimestamp() });
  $('episodeForm').reset(); $('uploadStatus').textContent='Episódio enviado com sucesso!';
} catch(err){ console.error(err); $('uploadStatus').textContent = 'Erro: ' + firebaseErrorMessage(err); alert('Erro ao enviar: ' + firebaseErrorMessage(err)); } finally { $('saveEpisodeBtn').disabled=false; setTimeout(()=> $('uploadStatus').textContent='', 4000); } };
function uploadFile(file, path, label='Arquivo'){ return new Promise((resolve,reject)=>{
  $('uploadStatus').textContent = `${label}: iniciando envio...`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'application/octet-stream' });
  let watchdog = setTimeout(() => {
    if (task.snapshot.bytesTransferred === 0) {
      $('uploadStatus').textContent = `${label}: ainda em 0%. Verifique se o Firebase Storage está ativado e se as regras foram publicadas.`;
    }
  }, 10000);
  task.on('state_changed',
    s => {
      clearTimeout(watchdog);
      const total = s.totalBytes || file.size || 1;
      const pct = Math.max(1, Math.round((s.bytesTransferred / total) * 100));
      $('uploadStatus').textContent = `${label}: enviando ${pct}%`;
    },
    err => { clearTimeout(watchdog); reject(err); },
    async () => { clearTimeout(watchdog); $('uploadStatus').textContent = `${label}: enviado 100%`; resolve(await getDownloadURL(task.snapshot.ref)); }
  );
}); }
function firebaseErrorMessage(err){
  const code = err?.code || '';
  if(code.includes('unauthorized')) return 'sem permissão no Storage. Publique as regras do arquivo REGRAS-STORAGE.txt.';
  if(code.includes('bucket-not-found')) return 'bucket do Storage não encontrado. Confira o storageBucket no firebase-config.js.';
  if(code.includes('canceled')) return 'upload cancelado.';
  if(code.includes('quota')) return 'limite/cota do Firebase Storage atingido.';
  return err?.message || 'erro desconhecido no Firebase.';
}
function renderEpisodes(){ $('episodesList').innerHTML = episodes.map(ep => `<div class="manage-item"><img src="${ep.coverUrl||'logo-podsesi.png'}"><div class="item-text"><strong>${esc(ep.title)}</strong><small>${esc(ep.category||'PODSESI')} • ${ep.plays||0} reproduções</small><small>${esc(ep.description||'')}</small></div><button class="danger-btn" data-delep="${ep.id}">Excluir</button></div>`).join(''); document.querySelectorAll('[data-delep]').forEach(b => b.onclick = async()=> deleteEpisode(b.dataset.delep)); }
async function deleteEpisode(id){ const ep=episodes.find(e=>e.id===id); if(!confirm('Excluir este episódio e seus arquivos?')) return; await deleteDoc(doc(db,'episodes',id)); if(ep?.audioPath) deleteObject(ref(storage,ep.audioPath)).catch(()=>{}); if(ep?.coverPath) deleteObject(ref(storage,ep.coverPath)).catch(()=>{}); }
function safe(name){ return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-'); } function esc(s){ return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
