import MicroAppComandos from "./comandos.ts";

const app = new MicroAppComandos("mensagem customizada");

// "mockando" a mensagem do usuario
// como é um comando, deve interromper a pipeline e retornar
// "mensagem vazia"
app.conversa.mensagens = [{
  origem: "cliente",
  conteudo: {
    texto: "!msg",
  },
}];

let resultado = await app.processaComando();
console.log(resultado); // "mensagem customizada"

// como não é um comando, deve retornar undefined, o que não
// interrompe a pipeline
app.conversa.mensagens.push({
  origem: "cliente",
  conteudo: {
    texto: "nao eh um comando",
  },
});

resultado = await app.processaComando();
console.log(resultado); // undefined
