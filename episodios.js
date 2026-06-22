<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin PODSESI</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="admin-page">
  <main class="admin-card">
    <div class="brand admin-brand"><span class="logo-dot">▶</span><div><strong>PODSESI Admin</strong><small>Cadastro de episódios</small></div></div>
    <div id="loginBox">
      <p>Digite a senha administrativa para liberar o cadastro.</p>
      <input id="passwordInput" type="password" placeholder="Senha" />
      <button id="loginBtn" class="primary full">Entrar</button>
      <small>Senha padrão: <b>podsesi2026</b>. Altere no arquivo <b>admin.js</b>.</small>
    </div>

    <form id="episodeForm" hidden>
      <label>Título do episódio<input id="titulo" required placeholder="Ex: Episódio 01 - Robótica" /></label>
      <label>Descrição<textarea id="descricao" required placeholder="Resumo do áudio"></textarea></label>
      <label>Categoria
        <select id="categoria">
          <option>Podcast</option><option>Robótica</option><option>Biblioteca</option><option>Eventos</option><option>Professores</option><option>Entrevista</option>
        </select>
      </label>
      <label>Arquivo MP3<input id="audioFile" type="file" accept="audio/*" /></label>
      <label>Capa do episódio<input id="coverFile" type="file" accept="image/*" /></label>
      <div class="hint">Com Firebase configurado, o upload vai para a nuvem. Sem Firebase, use o gerador local abaixo para copiar no arquivo <b>episodios.js</b>.</div>
      <button class="primary full" type="submit">Salvar episódio</button>
    </form>

    <section id="localGenerator" hidden>
      <h3>Gerador local para GitHub Pages sem Firebase</h3>
      <p>Coloque o MP3 em <b>uploads/audios</b>, a capa em <b>uploads/capas</b> e copie o bloco abaixo para o arquivo <b>episodios.js</b>.</p>
      <textarea id="generatedCode" readonly></textarea>
    </section>
    <a href="index.html" class="admin-link back">Voltar ao player</a>
  </main>
  <script type="module" src="firebase-config.js"></script>
  <script type="module" src="admin.js"></script>
</body>
</html>
