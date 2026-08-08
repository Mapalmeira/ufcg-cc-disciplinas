export function lerCsv(conteudo: string): string[][] {
  const resultado: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let entreAspas = false;

  for (let indice = 0; indice < conteudo.length; indice += 1) {
    const caractere = conteudo[indice];

    if (entreAspas) {
      if (caractere === '"' && conteudo[indice + 1] === '"') {
        campo += '"';
        indice += 1;
      } else if (caractere === '"') {
        entreAspas = false;
      } else {
        campo += caractere;
      }
    } else if (caractere === '"') {
      entreAspas = true;
    } else if (caractere === ",") {
      linha.push(campo);
      campo = "";
    } else if (caractere === "\n") {
      linha.push(campo);
      resultado.push(linha);
      linha = [];
      campo = "";
    } else if (caractere !== "\r") {
      campo += caractere;
    }
  }

  if (campo || linha.length) {
    linha.push(campo);
    resultado.push(linha);
  }
  if (resultado[0]?.[0]) resultado[0][0] = resultado[0][0].replace(/^\uFEFF/, "");

  return resultado;
}
