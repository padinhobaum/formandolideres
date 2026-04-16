---
name: Edital de Propostas
description: Sistema completo de propostas colaborativas com fases, votação positiva/negativa, ranking e feedback da Direção
type: feature
---
O Edital de Propostas permite líderes criarem, colaborarem e votarem em propostas para melhoria da escola.

- **Controle Admin**: Status ativo/inativo (singleton `edital_config`), 5 fases (submissão→encaminhamento), notificações push ao abrir/fechar
- **Fases**: submission, discussion, voting, selection, direction — admin controla a fase atual
- **Propostas**: Título, descrição, categoria, impacto, esforço, público beneficiado, imagem opcional
- **Colaboração**: Autor convida outros líderes (pendente/aceito/recusado), colaboradores podem editar e discutir internamente
- **Votação**: Votos positivos (+1) e negativos (-1). Limite configurável de votos por usuário (default 5). Cada usuário pode ter apenas 1 voto por proposta (positivo OU negativo). Pode alterar ou remover voto. Triggers automáticos para contagem de positive_vote_count, negative_vote_count e score.
- **Comentários**: Públicos (todos) e internos (só autor+colaboradores)
- **Histórico**: Registro de edições com `proposal_history`
- **Dashboard Direção**: Ranking de propostas, stats por categoria, controle de status (em análise/aprovada/rejeitada/execução/concluída)
- **Feedback**: Admin pode adicionar justificativas oficiais via `proposal_direction_feedback`
- **Relatório Admin**: Visão geral (totais, votos +/-), distribuição por categoria, impacto/esforço médio, top votadas, mais rejeitadas, mais engajadas, lista completa. Exportável via impressão/PDF.
- **Navegação**: Aba "Propostas" aparece no sidebar quando edital está ativo. No mobile, substitui "Videoaulas" no bottom nav quando ativo.
- **Badge**: "Fornecido pela LíderAI" no dashboard da direção

Tabelas: `edital_config`, `proposals` (com positive_vote_count, negative_vote_count), `proposal_collaborators`, `proposal_comments`, `proposal_internal_comments`, `proposal_votes` (com vote_type: 1/-1), `proposal_history`, `proposal_direction_feedback`
