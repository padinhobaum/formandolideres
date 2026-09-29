# Corrigir a entrega dos lembretes do Clima de Turma

## Resultado esperado
- O botão do painel administrativo enviará um novo lembrete para cada líder ainda pendente, mesmo que outro disparo manual tenha ocorrido no mesmo dia.
- A tela só informará sucesso quando o provedor aceitar cada mensagem e exibirá falhas reais separadamente.
- A entrega será validada com registros do provedor e um envio controlado.

## Implementação
1. Corrigir a identificação dos disparos manuais para que cada clique gere uma campanha única, sem deduplicação silenciosa.
2. Validar a resposta completa do provedor antes de contabilizar o e-mail como enviado e registrar o identificador retornado.
3. Melhorar o retorno do botão, informando enviados, recusados e detalhes úteis quando houver falhas.
4. Publicar a função atualizada e testar o fluxo administrativo.
5. Conferir os eventos recentes do provedor para confirmar aceitação e possíveis rejeições.

## Observação
A plataforma de envio confirma aceitação e registra rejeições, devoluções e bloqueios; a chegada na caixa principal depende também dos filtros do provedor de e-mail do destinatário.
