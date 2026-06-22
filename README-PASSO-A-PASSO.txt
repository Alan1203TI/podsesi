PODSESI - PASSO A PASSO

1) Suba todos os arquivos no GitHub.

2) Ative o GitHub Pages:
Settings > Pages > Deploy from branch > main > /root

3) Firebase já configurado em firebase-config.js com:
Projeto: podsesi2026
Storage bucket: podsesi2026.firebasestorage.app

4) Firestore:
Firebase Console > Firestore Database > Regras
Cole o conteúdo do arquivo REGRAS-FIRESTORE.txt

5) Storage:
Firebase Console > Storage > Regras
Cole o conteúdo do arquivo REGRAS-STORAGE.txt

6) Tela dos alunos:
Abra index.html pelo link do GitHub Pages.
A tela possui apenas campo de busca e lista de episódios.
Os episódios aparecem em ordem de cadastro, do mais recente para o mais antigo.

7) Painel administrativo:
Abra admin.html pelo link do GitHub Pages.
Senha padrão: podsesi2026

8) No painel você pode:
- cadastrar episódio;
- enviar capa;
- enviar MP3/áudio;
- excluir episódio.

As categorias foram removidas desta versão.
