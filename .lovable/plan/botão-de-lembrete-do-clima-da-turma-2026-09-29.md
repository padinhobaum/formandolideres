# Botão de lembrete do Clima da Turma

## Objetivo
Adicionar à aba administrativa “Clima da Turma” um botão para enviar, sob demanda, o e-mail de lembrete aos líderes que ainda não responderam na semana atual.

## Implementação
- Exibir o botão somente na semana atual, junto aos controles do relatório.
- Solicitar confirmação antes do disparo para evitar envios acidentais.
- Usar a sessão do administrador para chamar o envio já protegido e conectado ao Brevo.
- Bloquear o botão durante o processamento e mostrar uma mensagem clara com a quantidade enviada e ignorada.
- Manter a regra existente que exclui líderes que já responderam.

## Validação
- Confirmar que a aplicação compila sem erros.
- Testar no painel administrativo o estado inicial, a confirmação e o retorno visual do disparo.
