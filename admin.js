import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const app = initializeApp(firebaseConfig); const db = getFirestore(app); const storage = getStorage(app);
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
  const audioUrl = await uploadFile(audio, `episodios/audios/${id}-${safe(audio.name)}`);
  const coverUrl = cover ? await uploadFile(cover, `episodios/capas/${id}-${safe(cover.name)}`) : '';
  await addDoc(collection(db,'episodes'), { title:$('title').value.trim(), description:$('description').value.trim(), category:$('categorySelect').value, audioUrl, coverUrl, audioPath:`episodios/audios/${id}-${safe(audio.name)}`, coverPath: cover?`episodios/capas/${id}-${safe(cover.name)}`:'', plays:0, createdAt: serverTimestamp() });
  $('episodeForm').reset(); $('uploadStatus').textContent='Episódio enviado com sucesso!';
} catch(err){ console.error(err); alert('Erro ao enviar. Confira Firebase config e regras.'); } finally { $('saveEpisodeBtn').disabled=false; setTimeout(()=> $('uploadStatus').textContent='', 4000); } };
function uploadFile(file, path){ return new Promise((resolve,reject)=>{ const task=uploadBytesResumable(ref(storage,path), file); task.on('state_changed', s=>{ $('uploadStatus').textContent = `Enviando: ${Math.round((s.bytesTransferred/s.totalBytes)*100)}%`; }, reject, async()=> resolve(await getDownloadURL(task.snapshot.ref))); }); }
function renderEpisodes(){ $('episodesList').innerHTML = episodes.map(ep => `<div class="manage-item"><img src="${ep.coverUrl||'assets/logo-podsesi.jpeg'}"><div class="item-text"><strong>${esc(ep.title)}</strong><small>${esc(ep.category||'PODSESI')} • ${ep.plays||0} reproduções</small><small>${esc(ep.description||'')}</small></div><button class="danger-btn" data-delep="${ep.id}">Excluir</button></div>`).join(''); document.querySelectorAll('[data-delep]').forEach(b => b.onclick = async()=> deleteEpisode(b.dataset.delep)); }
async function deleteEpisode(id){ const ep=episodes.find(e=>e.id===id); if(!confirm('Excluir este episódio e seus arquivos?')) return; await deleteDoc(doc(db,'episodes',id)); if(ep?.audioPath) deleteObject(ref(storage,ep.audioPath)).catch(()=>{}); if(ep?.coverPath) deleteObject(ref(storage,ep.coverPath)).catch(()=>{}); }
function safe(name){ return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-'); } function esc(s){ return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
