(async function () {
  'use strict';

  const config = window.JOGO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const idsTelas = ['tela-inicio', 'tela-jogo', 'tela-fim'];
  let estado = null;
  let inicioPergunta = 0;
  let relogio = null;
  let salvando = false;

  document.title = config.nome || 'history.quest';
  $('titulo').textContent = config.nome || 'history.quest';
  if (config.cor) {
    document.documentElement.style.setProperty('--cor', config.cor);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', config.cor);
  }

  PlacarUI.montar($('painel-placar'));
  const progresso = await Placar.iniciar();
  $('melhor').textContent = progresso.melhor.toLocaleString('pt-BR');
  Placar.aoMudar((p) => { $('melhor').textContent = p.melhor.toLocaleString('pt-BR'); });

  function mostrar(tela) {
    idsTelas.forEach((id) => { $(id).hidden = id !== tela; });
  }

  function desenharPergunta() {
    const pergunta = Regras.perguntaAtual(estado);
    $('progresso-pergunta').textContent = 'Pergunta ' + (estado.indice + 1) + ' de ' + Regras.TOTAL_PERGUNTAS;
    $('pergunta').textContent = pergunta.texto;
    $('pontos').textContent = estado.pontos.toLocaleString('pt-BR');
    $('feedback').hidden = true;
    $('botao-proxima').hidden = true;
    $('botao-proxima').textContent = estado.indice === Regras.TOTAL_PERGUNTAS - 1 ? 'Ver resultado' : 'Próxima pergunta';
    const area = $('alternativas');
    area.replaceChildren();
    pergunta.alternativas.forEach((texto, indice) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'opcao';
      botao.textContent = String.fromCharCode(65 + indice) + '. ' + texto;
      botao.addEventListener('click', () => responder(indice));
      area.appendChild(botao);
    });
    inicioPergunta = performance.now();
    atualizarTempo();
    clearInterval(relogio);
    relogio = setInterval(atualizarTempo, 100);
  }

  function atualizarTempo() {
    if (!estado || estado.respondida || estado.terminou) return;
    const decorrido = (performance.now() - inicioPergunta) / 1000;
    const restante = Math.max(0, Regras.TEMPO_POR_PERGUNTA - decorrido);
    $('tempo').textContent = Math.ceil(restante);
    $('barra').style.width = (restante / Regras.TEMPO_POR_PERGUNTA * 100) + '%';
    if (restante <= 0) responder(-1);
  }

  function responder(escolha) {
    if (!estado || estado.respondida || estado.terminou) return;
    clearInterval(relogio);
    const segundos = Math.max(0, Math.ceil(Regras.TEMPO_POR_PERGUNTA - (performance.now() - inicioPergunta) / 1000));
    estado = Regras.responder(estado, escolha, escolha < 0 ? 0 : segundos);
    const pergunta = Regras.perguntaAtual(estado);
    Array.from($('alternativas').children).forEach((botao, indice) => {
      botao.disabled = true;
      if (indice === pergunta.correta) botao.classList.add('correta');
      if (indice === escolha && !estado.ultimaCorreta) botao.classList.add('errada');
    });
    const feedback = $('feedback');
    feedback.hidden = false;
    feedback.className = 'feedback ' + (estado.ultimaCorreta ? 'acerto' : 'erro');
    feedback.textContent = (estado.ultimaCorreta ? '✅ Correto! ' : escolha < 0 ? '⌛ O tempo acabou. ' : '❌ Não foi dessa vez. ') + estado.explicacao;
    $('pontos').textContent = estado.pontos.toLocaleString('pt-BR');
    $('botao-proxima').hidden = false;
    $('botao-proxima').focus();
  }

  function comecar() {
    estado = Regras.novaPartida();
    salvando = false;
    mostrar('tela-jogo');
    desenharPergunta();
  }

  async function terminar() {
    if (!estado || salvando) return;
    salvando = true;
    clearInterval(relogio);
    const pontos = estado.pontos;
    $('resultado').textContent = pontos.toLocaleString('pt-BR');
    $('situacao-salvamento').textContent = 'Salvando pontuação...';
    mostrar('tela-fim');
    try {
      const salvo = await Placar.registrarPartida(pontos);
      $('situacao-salvamento').textContent = Placar.modo() === 'nuvem' && !salvo.salvoNaNuvem
        ? 'Pontuação guardada neste aparelho. Entre com apelido e PIN no placar para enviar ao ranking.'
        : 'Pontuação salva!';
    } catch (erro) {
      $('situacao-salvamento').textContent = 'Não foi possível salvar: ' + erro.message;
    }
  }

  $('botao-jogar').addEventListener('click', comecar);
  $('botao-de-novo').addEventListener('click', comecar);
  $('botao-proxima').addEventListener('click', () => {
    estado = Regras.avancar(estado);
    if (estado.terminou) terminar();
    else desenharPergunta();
  });
  mostrar('tela-inicio');
})();
