PODSESI PLAYER - COMO USAR

1) MODO SIMPLES PELO GITHUB PAGES
- Suba todos os arquivos para um repositório no GitHub.
- Vá em Settings > Pages > Deploy from branch > main > /root.
- Coloque os áudios MP3 na pasta uploads/audios.
- Coloque capas na pasta uploads/capas.
- Edite o arquivo episodios.js com título, descrição, categoria, audioUrl e capaUrl.

2) MODO COM PAINEL ADMIN + FIREBASE
- Crie um projeto no Firebase.
- Ative Firestore Database.
- Ative Storage.
- Copie as configurações do Firebase para firebase-config.js.
- Altere enabled:false para enabled:true.
- Abra admin.html, entre com a senha padrão podsesi2026 e envie os episódios.
- Altere a senha no arquivo admin.js.

3) OBSERVAÇÃO IMPORTANTE
O GitHub Pages sozinho não salva uploads enviados pelo navegador.
Para upload pela tela admin, precisa usar Firebase Storage + Firestore.

4) ESTRUTURA
index.html = tela dos alunos
admin.html = cadastro dos episódios
style.css = visual
app.js = player
admin.js = painel administrativo
firebase-config.js = configuração Firebase
episodios.js = episódios no modo local
uploads/audios = coloque os MP3 no modo local
uploads/capas = coloque as capas no modo local
