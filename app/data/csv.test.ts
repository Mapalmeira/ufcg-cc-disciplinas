import assert from "node:assert/strict";
import test from "node:test";
import { lerCsv } from "./csv.ts";

test("lê campos delimitados, vazios e quebras CRLF", () => {
  assert.deepEqual(lerCsv("codigo,nome,obs\r\n1,Algoritmos,\r\n"), [
    ["codigo", "nome", "obs"],
    ["1", "Algoritmos", ""],
  ]);
});

test("preserva vírgulas, aspas e quebras de linha dentro de campos", () => {
  assert.deepEqual(lerCsv('"nome","ementa"\n"Computação, Ética","Linha 1\nLinha ""2"""'), [
    ["nome", "ementa"],
    ["Computação, Ética", 'Linha 1\nLinha "2"'],
  ]);
});

test("remove BOM do primeiro cabeçalho", () => {
  assert.deepEqual(lerCsv("\uFEFFcodigo,nome\n1,Teste"), [
    ["codigo", "nome"],
    ["1", "Teste"],
  ]);
});
