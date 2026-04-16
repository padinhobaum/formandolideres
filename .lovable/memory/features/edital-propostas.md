---
name: Edital de Propostas
description: Sistema completo de propostas colaborativas com fases, votação, ranking e feedback da Direção
type: feature
---
O Edital de Propostas permite líderes criarem, colaborarem e votarem em propostas para melhoria da escola.

- **Controle Admin**: Status ativo/inativo (singleton `edital_config`), 5 fases (submissão→encaminhamento), notificações push ao abrir/fechar
- **Fases**: submission, discussion, voting, selection, direction — admin controla a fase atual
- **Propostas**: Título, descrição, categoria, impacto, esforço, público beneficiado
- **Colaboração**: Autor convida outros líderes (pendente/aceito/recusado), colaboradores podem editar e discutir internamente
- **Votação**: Limite configurável de votos por usuário (default 5), triggers automáticos para contagem
- **Comentários**: Públicos (todos) e internos (só autor+colaboradores)
- **Histórico**: Registro de edições com `proposal_history`
- **Dashboard Direção**: Ranking de propostas, stats por categoria, controle de status (em análise/aprovada/rejeitada/execução/concluída)
- **Feedback**: Admin pode adicionar justificativas oficiais via `proposal_direction_feedback`
- **Navegação**: Aba "Propostas" aparece no sidebar apenas quando edital está ativo, rota `/propostas`
- **Badge**: "Fornecido pela LíderAI" no dashboard da direção

Tabelas: `edital_config`, `proposals`, `proposal_collaborators`, `proposal_comments`, `proposal_internal_comments`, `proposal_votes`, `proposal_history`, `proposal_direction_feedback`
