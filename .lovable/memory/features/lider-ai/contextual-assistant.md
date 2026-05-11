---
name: LíderAI Contextual Assistant
description: LíderAI now has persistent chat history, user memory, and context-aware responses using survey results, XP, and profile data.
type: feature
---
## LíderAI 2.0

**Persistência:**
- `ai_conversations`: conversas por usuário com título auto-gerado
- `ai_messages`: histórico completo (user/assistant)
- `ai_memories`: fatos persistentes (objetivos, dificuldades) extraídos via tool-calling
- RLS estrita: `user_id = auth.uid()` em todas as 3 tabelas

**Edge function `lider-ai-chat`:**
- Valida JWT via `getClaims`, usa service role para ler contexto
- Carrega: profile, roles, XP/nível, streak, conquistas, resultados de pesquisas liberadas (médias + comentários), memórias
- Sistema prompt injeta contexto + knowledge base estática da plataforma
- Janela de 20 últimas mensagens da conversa
- `TransformStream` repassa SSE ao client E acumula para persistir o assistant ao final
- Gera título automaticamente na 1ª troca via call não-streaming
- Extrai memórias persistentes após cada turno (tool-calling) e faz upsert em `ai_memories`
- Retorna `X-Conversation-Id` no header (CORS Expose-Headers)

**Frontend:**
- Sidebar de conversas (desktop fixa, mobile via Sheet) agrupadas por data
- `useAiConversations` hook + `loadMessages` helper
- Conversa nova criada server-side na primeira mensagem; client lê `X-Conversation-Id`
- Apagar conversa via AlertDialog (cascade no DB)

**Sem embeddings nesta fase** — knowledge base é estática. Estrutura permite adicionar pgvector depois.
