/* Regras puras do history.quest. O sorteio é injetado para permitir testes repetíveis. */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Regras = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const TEMPO_POR_PERGUNTA = 15;
  const PERGUNTAS = [
    { texto: 'Em que ano foi proclamada a Independência do Brasil?', alternativas: ['1822', '1889', '1500', '1808'], correta: 0, explicacao: 'Dom Pedro proclamou a Independência em 7 de setembro de 1822.' },
    { texto: 'Qual povo construiu a cidade de Machu Picchu?', alternativas: ['Incas', 'Maias', 'Astecas', 'Olmecas'], correta: 0, explicacao: 'Machu Picchu foi construída pelos incas, na região dos Andes.' },
    { texto: 'Quem foi a primeira mulher a receber um Prêmio Nobel?', alternativas: ['Marie Curie', 'Ada Lovelace', 'Bertha von Suttner', 'Rosalind Franklin'], correta: 0, explicacao: 'Marie Curie recebeu o Nobel de Física em 1903.' },
    { texto: 'Qual era a capital do Império Romano?', alternativas: ['Roma', 'Atenas', 'Cartago', 'Alexandria'], correta: 0, explicacao: 'Roma foi o centro político do Império Romano.' },
    { texto: 'Em qual país começou a Revolução Industrial?', alternativas: ['Inglaterra', 'França', 'Portugal', 'Japão'], correta: 0, explicacao: 'A Revolução Industrial começou na Inglaterra no século XVIII.' },
    { texto: 'Qual documento inglês de 1215 limitou o poder do rei?', alternativas: ['Magna Carta', 'Código de Hamurabi', 'Tratado de Tordesilhas', 'Declaração de 1789'], correta: 0, explicacao: 'A Magna Carta foi selada pelo rei João da Inglaterra em 1215.' },
    { texto: 'Quem liderou a luta pela independência da Índia com a resistência não violenta?', alternativas: ['Mahatma Gandhi', 'Nelson Mandela', 'Jawaharlal Nehru', 'Rabindranath Tagore'], correta: 0, explicacao: 'Gandhi tornou-se símbolo da resistência não violenta na Índia.' },
    { texto: 'Em que ano caiu o Muro de Berlim?', alternativas: ['1989', '1961', '1945', '1999'], correta: 0, explicacao: 'A abertura do Muro de Berlim aconteceu em novembro de 1989.' },
    { texto: 'Qual civilização antiga desenvolveu a escrita cuneiforme?', alternativas: ['Sumérios', 'Fenícios', 'Romanos', 'Persas'], correta: 0, explicacao: 'Os sumérios registravam informações em tabuletas com escrita cuneiforme.' },
    { texto: 'Quem assinou a Lei Áurea, que aboliu a escravidão no Brasil?', alternativas: ['Princesa Isabel', 'Dom Pedro II', 'D. Leopoldina', 'Deodoro da Fonseca'], correta: 0, explicacao: 'A Princesa Isabel assinou a Lei Áurea em 13 de maio de 1888.' }
  ];

  function embaralhar(lista, sorteio) {
    const resultado = lista.slice();
    const aleatorio = typeof sorteio === 'function' ? sorteio : Math.random;
    for (let i = resultado.length - 1; i > 0; i--) {
      const j = Math.max(0, Math.min(i, Math.floor(aleatorio() * (i + 1))));
      [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }
    return resultado;
  }

  function novaPartida(sorteio) {
    const perguntas = embaralhar(PERGUNTAS, sorteio).map((p) => {
      const alternativas = embaralhar(p.alternativas.map((texto, indice) => ({ texto, indice })), sorteio);
      return { ...p, alternativas: alternativas.map((a) => a.texto), correta: alternativas.findIndex((a) => a.indice === p.correta) };
    });
    return { perguntas, indice: 0, pontos: 0, respondida: false, terminou: false, ultimaCorreta: false, explicacao: '' };
  }

  function perguntaAtual(estado) {
    return estado && !estado.terminou ? estado.perguntas[estado.indice] || null : null;
  }

  function responder(estado, escolha, segundosRestantes) {
    if (!estado || estado.terminou || estado.respondida) return estado;
    const pergunta = perguntaAtual(estado);
    if (!pergunta) return { ...estado, terminou: true };
    const correta = Number.isInteger(escolha) && escolha === pergunta.correta;
    const segundos = Math.max(0, Math.min(TEMPO_POR_PERGUNTA, Math.floor(Number(segundosRestantes) || 0)));
    return {
      ...estado,
      pontos: estado.pontos + (correta ? 100 + segundos : 0),
      respondida: true,
      ultimaCorreta: correta,
      explicacao: pergunta.explicacao
    };
  }

  function avancar(estado) {
    if (!estado || estado.terminou || !estado.respondida) return estado;
    const indice = estado.indice + 1;
    if (indice >= estado.perguntas.length) return { ...estado, indice, terminou: true };
    return { ...estado, indice, respondida: false, ultimaCorreta: false, explicacao: '' };
  }

  return { TEMPO_POR_PERGUNTA, TOTAL_PERGUNTAS: PERGUNTAS.length, novaPartida, perguntaAtual, responder, avancar };
});
