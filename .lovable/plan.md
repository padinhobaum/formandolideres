# LíderAI 2.0 — Assistente Contextual com Memória

Transformar a LíderAI numa mentora pessoal contextual, com histórico estilo ChatGPT, memória persistente e acesso seguro aos dados do próprio usuário (pesquisas, XP, conquistas, perfil) + base de conhecimento da plataforma.

## 1. Banco de dados (migration)

**Novas tabelas (todas com RLS estrita: `user_id = auth.uid()`):**

- `ai_conversations`
  - `id`, `user_id`, `title` (gerado automaticamente após 1ª resposta), `created_at`, `updated_at`, `last_message_at`
- `ai_messages`
  - `id`, `conversation_id`, `user_id`, `role` ('user'|'assistant'), `content`, `created_at`
- `ai_memories` — fatos persistentes que a IA "lembra" do usuário
  - `id`, `user_id`, `key` (ex: "objetivo", "dificuldade"), `value` (texto), `created_at`, `updated_at`

**RLS:** cada tabela permite SELECT/INSERT/UPDATE/DELETE somente onde `user_id = auth.uid()`. Trigger `updated_at` em conversations.

Realtime opcional em `ai_messages` (não necessário pois usamos streaming SSE direto).

## 2. Edge function `lider-ai-chat` (refatorada)

Fluxo a cada request:

1. Validar JWT (extrair `user_id` do bearer token).
2. Carregar **contexto do usuário** via service role:
   - Perfil (nome, sala)
   - Roles (admin/líder)
   - XP total, nível, conquistas desbloqueadas
   - Streak atual
   - Resultados de pesquisas de avaliação (`survey_responses` onde o líder é alvo via `survey_leaders` + `surveys.results_released = true`) — médias de comunicação/geral, contagens de "abre espaço", "mantém informado", "contribui para o ambiente", e comentários
   - `ai_memories` do usuário
3. Montar **system prompt** dinâmico injetando esse contexto + instruções de mentora pessoal.
4. Receber `conversation_id` + nova mensagem do usuário; carregar últimas N (~20) mensagens da conversa para manter contexto curto.
5. Salvar mensagem do usuário em `ai_messages`.
6. Chamar Lovable AI Gateway (`google/gemini-3-flash-preview`) com streaming SSE.
7. Após `[DONE]`, salvar mensagem do assistant completa em `ai_messages` (via finalização no servidor — usar `ReadableStream` que repassa tokens E acumula para persistir ao final). Atualizar `last_message_at` da conversa.
8. Se a conversa não tem título e essa é a 1ª troca, gerar título curto numa chamada paralela rápida (não-streaming) e atualizar.

**Extração de memória (RAG leve sem embeddings):** após persistir resposta, fazer uma chamada rápida secundária pedindo ao modelo para extrair (via tool-calling estruturado) novos fatos relevantes sobre o usuário (objetivos, dificuldades, preferências) → upsert em `ai_memories`. Isso é assíncrono em relação à UX (fire-and-forget após o stream terminar).

**Base de conhecimento da plataforma:** incluir, no system prompt, um bloco estático descrevendo as funcionalidades da plataforma (Mural, Fórum, Videoaulas, Materiais, LíderAI, Resultados, Eventos, gamificação 10 níveis, conquistas) — sem embeddings nesta primeira versão. Suficiente para responder "como usar X". Futuro: indexar `materials`/`video_lessons` via embeddings.

## 3. Frontend — `LiderAIPage` redesenhado

**Layout (desktop):**

```text
+----------------+---------------------------------+
| Sidebar        | Header (título da conversa)     |
| [+ Nova]       +---------------------------------+
| - Conversa 1   |                                 |
| - Conversa 2   |   Mensagens (bolhas)            |
| - ...          |                                 |
|                +---------------------------------+
|                | Input                           |
+----------------+---------------------------------+
```

**Mobile:** sidebar vira drawer (Sheet) acionado por ícone no header. Layout atual de chat preservado.

**Componentes novos/atualizados:**

- `src/components/lider-ai/ConversationSidebar.tsx` — lista conversas (agrupadas por "Hoje", "Ontem", "Últimos 7 dias", "Mais antigas"), botão "Nova conversa", botão deletar (hover), item ativo destacado.
- `src/hooks/useAiConversations.ts` — CRUD de conversas via supabase client.
- `src/pages/LiderAIPage.tsx` — gerenciar conversa ativa, carregar mensagens persistidas, enviar `conversation_id` no payload do stream, criar conversa nova on-demand na primeira mensagem.
- `ChatEmptyState`, `ChatMessage`, `ChatInput` — mantidos, pequenos ajustes de spacing.

**UX premium:**
- Animações fade/slide ao trocar conversa
- Markdown já renderizado em `ChatMessage`
- Cursor pulsante durante streaming (já existe)
- Auto-scroll suave (já existe)
- Estilo limpo, espaçamento generoso, tipografia Rawline

## 4. Segurança

- Edge function valida JWT e extrai `user_id` — todas as queries usam ESSE id, ignorando qualquer id enviado pelo client.
- RLS nas tabelas garante isolamento mesmo se o front errar.
- Contexto sensível (pesquisas) só carregado para o próprio usuário; pesquisas só lidas se `results_released = true` (espelha RLS existente).

## 5. Detalhes técnicos

- Persistência de mensagem do assistant: usar `TransformStream` que repassa chunks ao client e acumula texto; ao fechar, fazer INSERT.
- Título automático: prompt curto "Resuma em ≤5 palavras o tema desta conversa" usando os 2-3 primeiros turns.
- Limites: últimas 20 mensagens na conversa para janela de contexto; máx ~10 memórias mais recentes injetadas.
- Sem embeddings nesta fase (escopo controlado, baixa latência, sem custo extra). Estrutura permite adicionar `pgvector` depois.

## Arquivos

**Criar:**
- Migration: `ai_conversations`, `ai_messages`, `ai_memories` + RLS + triggers
- `src/components/lider-ai/ConversationSidebar.tsx`
- `src/hooks/useAiConversations.ts`

**Editar:**
- `supabase/functions/lider-ai-chat/index.ts` (refatoração completa)
- `src/pages/LiderAIPage.tsx` (sidebar + conversa ativa + persistência)
- `mem://index.md` + nova memória de feature

## Fora de escopo (futuro)

- Embeddings/pgvector sobre `materials` e `video_lessons`
- Compartilhamento de conversas
- Edição/regeneração de mensagens
- Voz/TTS
