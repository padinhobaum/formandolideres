---
name: Clima da Turma
description: Sistema semanal de feedback de clima da turma com escala de 5 emojis, 1 resposta por semana por líder, e relatório admin com insights estatísticos
type: feature
---
Bloco principal da Home (substitui antigos blocos de Sala/Avisos/Online):

- **UI Líder**: Escala de 5 emojis (😢😕😐🙂😄), comentário opcional (280 chars), 1 resposta/semana baseada em `class_name` do perfil. Após responder, mostra estado bloqueado até segunda-feira seguinte.
- **Admin** (`AdminClassClimate.tsx`, aba "Clima da Turma"): Navegador semanal, KPIs (total, média, distribuição), insights automáticos estatísticos (sem IA — média geral, melhor/pior sala, deltas vs semana anterior, alertas de "muito ruim"), breakdown por sala com tendências e amostra de comentários, botão imprimir/PDF.
- **Persistência**: Tabela `class_climate_responses` com `UNIQUE(user_id, week_start)`. RLS: usuário lê/escreve só os próprios; admin lê todos.
- **Quem responde**: Apenas líderes (admins não respondem — bloco oculto). Agrupado por `profile.class_name`.
- **Função SQL**: `get_week_start(date)` retorna segunda-feira da semana.
