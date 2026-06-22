PODSESI PLAYER - PASSO A PASSO

1. CRIAR O PROJETO NO FIREBASE
- Acesse console.firebase.google.com
- Clique em Adicionar projeto
- Nome sugerido: podsesi-player

2. CRIAR APP WEB
- Na visão geral do projeto, clique no ícone Web </>
- Nome: PODSESI Player
- Copie o firebaseConfig

3. CONFIGURAR O ARQUIVO
- Abra firebase-config.js
- Substitua os dados de exemplo pelo firebaseConfig do seu projeto
- Altere a senha do ADMIN_PASSWORD se desejar

4. ATIVAR FIRESTORE
- Firebase > Firestore Database > Criar banco de dados
- Comece em modo de teste
- Localização sugerida: southamerica-east1

5. ATIVAR STORAGE
- Firebase > Storage > Primeiros passos
- Comece em modo de teste

6. REGRAS DO FIRESTORE
Cole em Firestore Database > Regras:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{id} {
      allow read: if true;
      allow write: if true;
    }
    match /episodes/{id} {
      allow read: if true;
      allow write: if true;
    }
  }
}

7. REGRAS DO STORAGE
Cole em Storage > Regras:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /episodios/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}

8. SUBIR NO GITHUB
- Crie um repositório vazio
- Envie todos os arquivos desta pasta
- Vá em Settings > Pages
- Source: Deploy from a branch
- Branch: main
- Pasta: /root

9. ACESSOS
Tela dos alunos:
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/

Painel admin:
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/admin.html

Senha padrão:
podsesi2026

OBSERVAÇÃO IMPORTANTE
As regras acima ficam abertas para teste. Depois que tudo estiver funcionando, o ideal é trocar por login com Firebase Authentication para proteger melhor o painel administrativo.
