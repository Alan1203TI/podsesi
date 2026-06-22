PODSESI Player - Versão Tablet com Firebase

CONFIGURAÇÃO JÁ INCLUÍDA
Projeto Firebase: podsesi2026
Senha padrão do painel admin: podsesi2026

ARQUIVOS PRINCIPAIS
index.html           Tela dos alunos
admin.html           Painel administrativo
style.css            Visual tablet
app.js               Player dos alunos
admin.js             Administração de categorias e episódios
firebase-config.js   Configuração Firebase já preenchida

1) FIRESTORE
No Firebase, acesse:
Firestore Database > Regras

Cole o conteúdo do arquivo:
docs/firestore.rules

Depois clique em Publicar.

2) STORAGE
No Firebase, acesse:
Storage > Regras

Cole o conteúdo do arquivo:
docs/storage.rules

Depois clique em Publicar.

3) GITHUB PAGES
Crie um repositório vazio no GitHub.
Envie todos os arquivos desta pasta.
Depois vá em:
Settings > Pages > Deploy from a branch > main > /root

Tela dos alunos:
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/

Painel administrativo:
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/admin.html

4) COMO USAR O PAINEL
Acesse admin.html.
Entre com a senha: podsesi2026

No painel você pode:
- criar categorias;
- excluir categorias;
- enviar episódio com título, descrição, categoria, capa e áudio;
- excluir episódios cadastrados;
- acompanhar quantidade de reproduções.

5) OBSERVAÇÃO IMPORTANTE
As regras estão abertas para facilitar o funcionamento inicial no GitHub Pages.
Depois que tudo estiver funcionando, é recomendado trocar o painel por login seguro com Firebase Authentication.
