const ADMIN_PASSWORD = 'podsesi2026';
const loginBox = document.getElementById('loginBox');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const form = document.getElementById('episodeForm');
const localGenerator = document.getElementById('localGenerator');
const generatedCode = document.getElementById('generatedCode');

loginBtn.addEventListener('click', () => {
  if(passwordInput.value !== ADMIN_PASSWORD){ alert('Senha incorreta.'); return; }
  loginBox.hidden = true; form.hidden = false; localGenerator.hidden = false;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('titulo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const categoria = document.getElementById('categoria').value;
  const audioFile = document.getElementById('audioFile').files[0];
  const coverFile = document.getElementById('coverFile').files[0];
  const safe = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const localObj = {
    titulo, descricao, categoria,
    data: new Date().toISOString().slice(0,10),
    audioUrl: `uploads/audios/${audioFile?.name || safe + '.mp3'}`,
    capaUrl: coverFile ? `uploads/capas/${coverFile.name}` : 'assets/podsesi-card.jpeg'
  };
  generatedCode.value = JSON.stringify(localObj, null, 2) + ',';

  const fb = window.PODSESI_FIREBASE;
  if(!fb?.enabled){ alert('Bloco local gerado. Copie para episodios.js.'); return; }

  try {
    if(!audioFile) { alert('Selecione o arquivo de áudio.'); return; }
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js');
    const app = initializeApp(fb.config);
    const db = getFirestore(app); const storage = getStorage(app);
    const audioRef = ref(storage, `${fb.storagePath}/audios/${Date.now()}-${audioFile.name}`);
    await uploadBytes(audioRef, audioFile);
    const audioUrl = await getDownloadURL(audioRef);
    let capaUrl = 'assets/podsesi-card.jpeg';
    if(coverFile){ const coverRef = ref(storage, `${fb.storagePath}/capas/${Date.now()}-${coverFile.name}`); await uploadBytes(coverRef, coverFile); capaUrl = await getDownloadURL(coverRef); }
    await addDoc(collection(db, fb.collection), { titulo, descricao, categoria, audioUrl, capaUrl, data: new Date().toISOString().slice(0,10), criadoEm: serverTimestamp() });
    alert('Episódio enviado com sucesso!'); form.reset();
  } catch(err){ console.error(err); alert('Erro ao salvar no Firebase. Confira as configurações e regras.'); }
});
