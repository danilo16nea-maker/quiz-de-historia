import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const Regras = require('../docs/jogo/regras.js');
const sorteioFixo = () => 0;

test('cada partida tem dez perguntas com quatro alternativas', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  assert.equal(estado.perguntas.length, 10);
  assert.equal(Regras.perguntaAtual(estado).alternativas.length, 4);
  assert.equal(Regras.TEMPO_POR_PERGUNTA, 15);
});

test('um acerto vale 100 pontos mais os segundos restantes', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  const resultado = Regras.responder(estado, Regras.perguntaAtual(estado).correta, 8);
  assert.equal(resultado.pontos, 108);
  assert.equal(resultado.ultimaCorreta, true);
  assert.equal(resultado.respondida, true);
});

test('segundos restantes são limitados entre zero e quinze', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  const correta = Regras.perguntaAtual(estado).correta;
  assert.equal(Regras.responder(estado, correta, 99).pontos, 115);
  assert.equal(Regras.responder(estado, correta, -3).pontos, 100);
});

test('resposta errada e tempo esgotado não dão pontos', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  const errada = (Regras.perguntaAtual(estado).correta + 1) % 4;
  assert.equal(Regras.responder(estado, errada, 15).pontos, 0);
  assert.equal(Regras.responder(estado, -1, 0).pontos, 0);
});

test('uma pergunta só pode ser respondida uma vez', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  const correta = Regras.perguntaAtual(estado).correta;
  const primeira = Regras.responder(estado, correta, 10);
  assert.equal(Regras.responder(primeira, correta, 15).pontos, 110);
});

test('não avança antes de responder e termina depois da décima pergunta', () => {
  let estado = Regras.novaPartida(sorteioFixo);
  assert.equal(Regras.avancar(estado), estado);
  for (let i = 0; i < 10; i++) {
    estado = Regras.responder(estado, -1, 0);
    estado = Regras.avancar(estado);
  }
  assert.equal(estado.terminou, true);
  assert.equal(Regras.perguntaAtual(estado), null);
  assert.equal(Regras.avancar(estado), estado);
});

test('perguntas e alternativas são embaralhadas usando o sorteio recebido', () => {
  const primeiro = Regras.novaPartida(() => 0);
  const segundo = Regras.novaPartida(() => 0.999999);
  assert.notEqual(primeiro.perguntas[0].texto, segundo.perguntas[0].texto);
  assert.notDeepEqual(primeiro.perguntas[0].alternativas, segundo.perguntas[0].alternativas);
  assert.equal(new Set(primeiro.perguntas.map((p) => p.texto)).size, 10);
});

test('índice de alternativa fora do intervalo conta como erro sem quebrar a regra', () => {
  const estado = Regras.novaPartida(sorteioFixo);
  const resultado = Regras.responder(estado, 7, 4);
  assert.equal(resultado.pontos, 0);
  assert.equal(resultado.respondida, true);
});
