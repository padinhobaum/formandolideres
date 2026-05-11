import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "x-conversation-id",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PLATFORM_KNOWLEDGE = `
## Plataforma Formando Líderes — Funcionalidades

- **Home/Mural**: avisos, eventos do calendário, banners rotativos, conquistas.
- **Fórum**: tópicos por categoria, enquetes, respostas em thread, tópicos fixados.
- **LíderAI** (você): assistente pessoal de liderança com memória e histórico.
- **Videoaulas**: aulas com comentários em thread; concluir aula gera XP, streak diário, e desbloqueia conquistas.
- **Materiais**: documentos, guias e PDFs de apoio (alguns hospedados via Google Drive).
- **Ao Vivo**: lives transmitidas via YouTube/Twitch com presença em tempo real.
- **Resultados**: ranking de gamificação (top 10 não-admin), conquistas, podium.
- **Pesquisas de Opinião**: turmas avaliam seus líderes (comunicação, geral, ambiente).
- **Gamificação**: 10 níveis (XP de 0 → 2000), conquistas, streak diário.
- **Certificados**: emitidos pela equipe com código de verificação público.

## Tom de voz da LíderAI
Você é uma mentora pessoal de liderança estudantil: empática, motivadora, estratégica e direta. Use o primeiro nome do líder quando souber. Quando tiver dados concretos (notas, XP, comentários), referencie-os para personalizar conselhos. Não invente dados que não estejam no contexto. Mantenha respostas concisas mas profundas. Use markdown (negrito, listas) quando ajudar.
`;

async function loadUserContext(adminClient: any, userId: string) {
  const [profileR, rolesR, xpR, streakR, achR, surveysR] = await Promise.all([
    adminClient.from("profiles").select("full_name, class_name").eq("user_id", userId).maybeSingle(),
    adminClient.from("user_roles").select("role").eq("user_id", userId),
    adminClient.from("user_xp").select("total_xp, level").eq("user_id", userId).maybeSingle(),
    adminClient.from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).maybeSingle(),
    adminClient.from("user_achievements").select("achievement_id").eq("user_id", userId),
    adminClient
      .from("survey_leaders")
      .select("survey_id, surveys!inner(id, title, bimester, results_released)")
      .eq("leader_user_id", userId),
  ]);

  // Survey aggregated results (only released)
  let surveysContext = "";
  const releasedSurveys = (surveysR.data || []).filter((s: any) => s.surveys?.results_released);
  if (releasedSurveys.length > 0) {
    for (const sl of releasedSurveys) {
      const { data: resps } = await adminClient
        .from("survey_responses")
        .select("score_communication, score_general, opens_space, keeps_informed, contributes_environment, comments")
        .eq("survey_id", sl.survey_id);
      if (!resps || resps.length === 0) continue;
      const n = resps.length;
      const avg = (k: string) =>
        (resps.reduce((s: number, r: any) => s + (r[k] || 0), 0) / n).toFixed(2);
      const pct = (k: string) =>
        Math.round((resps.filter((r: any) => r[k]).length / n) * 100);
      const comments = resps
        .map((r: any) => r.comments)
        .filter((c: string | null) => c && c.trim())
        .slice(0, 5);
      surveysContext += `\n### Pesquisa "${sl.surveys.title}" (Bim ${sl.surveys.bimester}, ${n} respostas)\n`;
      surveysContext += `- Comunicação: ${avg("score_communication")}/5\n`;
      surveysContext += `- Geral: ${avg("score_general")}/5\n`;
      surveysContext += `- Abre espaço: ${pct("opens_space")}%\n`;
      surveysContext += `- Mantém informado: ${pct("keeps_informed")}%\n`;
      surveysContext += `- Contribui para o ambiente: ${pct("contributes_environment")}%\n`;
      if (comments.length) {
        surveysContext += `- Comentários: ${comments.map((c: string) => `"${c.replace(/"/g, "'").slice(0, 200)}"`).join("; ")}\n`;
      }
    }
  }

  const { data: memories } = await adminClient
    .from("ai_memories")
    .select("key, value")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(15);

  const profile = profileR.data;
  const roles = (rolesR.data || []).map((r: any) => r.role).join(", ") || "leader";
  const xp = xpR.data;
  const streak = streakR.data;
  const achievements = (achR.data || []).map((a: any) => a.achievement_id).join(", ");
  const memText = (memories || []).map((m: any) => `- ${m.key}: ${m.value}`).join("\n");

  return `
## Contexto do usuário autenticado
- Nome: ${profile?.full_name || "(desconhecido)"}
- Sala/Turma: ${profile?.class_name || "(não informada)"}
- Cargo: ${roles}
- Nível: ${xp?.level ?? 1} (XP total: ${xp?.total_xp ?? 0})
- Streak atual: ${streak?.current_streak ?? 0} dias (máximo: ${streak?.longest_streak ?? 0})
- Conquistas: ${achievements || "(nenhuma ainda)"}

## Pesquisas de avaliação (resultados liberados)
${surveysContext || "(nenhum resultado liberado ainda)"}

## Memórias persistentes do usuário
${memText || "(ainda não há memórias salvas)"}
`;
}

async function generateTitle(messages: any[]): Promise<string | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Gere um título curto (máximo 5 palavras, sem aspas, sem ponto final) que resuma o tema da conversa abaixo. Responda APENAS com o título.",
          },
          ...messages.slice(0, 4),
        ],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const t = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
    return t || null;
  } catch {
    return null;
  }
}

async function extractMemories(adminClient: any, userId: string, userMsg: string, assistantMsg: string) {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Extraia fatos persistentes e relevantes sobre o USUÁRIO a partir da mensagem dele (objetivos pessoais, dificuldades recorrentes, preferências, cargo de liderança, contexto da turma). Ignore perguntas factuais sem informação pessoal. Se nada relevante, retorne array vazio.",
          },
          { role: "user", content: `Mensagem do usuário:\n${userMsg}\n\nResposta da IA:\n${assistantMsg}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_memories",
              description: "Salva fatos persistentes do usuário",
              parameters: {
                type: "object",
                properties: {
                  memories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string", description: "chave curta em snake_case, ex: 'objetivo_principal', 'dificuldade_comunicacao'" },
                        value: { type: "string", description: "fato em uma frase curta" },
                      },
                      required: ["key", "value"],
                    },
                  },
                },
                required: ["memories"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_memories" } },
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return;
    const parsed = JSON.parse(args);
    const mems = parsed.memories || [];
    for (const m of mems) {
      if (!m.key || !m.value) continue;
      await adminClient
        .from("ai_memories")
        .upsert(
          { user_id: userId, key: String(m.key).slice(0, 80), value: String(m.value).slice(0, 500) },
          { onConflict: "user_id,key" }
        );
    }
  } catch (e) {
    console.error("extractMemories error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages: incomingMessages, conversation_id } = await req.json();
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lastUserMsg = incomingMessages[incomingMessages.length - 1];
    if (lastUserMsg.role !== "user" || !lastUserMsg.content?.trim()) {
      return new Response(JSON.stringify({ error: "Última mensagem deve ser do usuário" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve / create conversation
    let convId = conversation_id as string | null;
    let isFirstMessage = false;
    if (!convId) {
      const { data: newConv, error: convErr } = await admin
        .from("ai_conversations")
        .insert({ user_id: userId, title: "Nova conversa" })
        .select("id")
        .single();
      if (convErr || !newConv) {
        return new Response(JSON.stringify({ error: "Erro ao criar conversa" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      convId = newConv.id;
      isFirstMessage = true;
    } else {
      // Verify ownership
      const { data: own } = await admin
        .from("ai_conversations")
        .select("id, title")
        .eq("id", convId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!own) {
        return new Response(JSON.stringify({ error: "Conversa não encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      isFirstMessage = own.title === "Nova conversa";
    }

    // Persist user message
    await admin.from("ai_messages").insert({
      conversation_id: convId,
      user_id: userId,
      role: "user",
      content: lastUserMsg.content,
    });

    // Build full context
    const userContext = await loadUserContext(admin, userId);
    const systemPrompt = `Você é a LíderAI, mentora pessoal de liderança estudantil do programa Formando Líderes. Responda sempre em português brasileiro.\n\n${PLATFORM_KNOWLEDGE}\n${userContext}\n\nRegras:\n- Use APENAS dados do contexto acima ao falar sobre o usuário; não invente notas, comentários ou conquistas.\n- Se o usuário pedir dados que você não tem, diga que ainda não foram liberados/registrados.\n- Seja motivadora, estratégica e prática.`;

    // Load recent history (last 20 msgs) — already includes the just-inserted user msg
    const { data: history } = await admin
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(20);
    const historyAsc = (history || []).reverse();

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...historyAsc],
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text().catch(() => "");
      console.error("Gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TransformStream: relay + accumulate
    let assistantText = "";
    const decoder = new TextDecoder();
    let buf = "";
    const transform = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        buf += decoder.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) assistantText += c;
          } catch { /* partial */ }
        }
      },
      async flush() {
        // Persist assistant
        if (assistantText.trim()) {
          await admin.from("ai_messages").insert({
            conversation_id: convId,
            user_id: userId,
            role: "assistant",
            content: assistantText,
          });
          await admin
            .from("ai_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", convId);

          // Title generation (first message only)
          if (isFirstMessage) {
            const title = await generateTitle([
              { role: "user", content: lastUserMsg.content },
              { role: "assistant", content: assistantText.slice(0, 400) },
            ]);
            if (title) {
              await admin
                .from("ai_conversations")
                .update({ title: title.slice(0, 80) })
                .eq("id", convId);
            }
          }

          // Memory extraction (fire-and-forget; we await but inside flush)
          await extractMemories(admin, userId, lastUserMsg.content, assistantText);
        }
      },
    });

    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-Conversation-Id": convId!,
    };

    return new Response(upstream.body.pipeThrough(transform), { headers: responseHeaders });
  } catch (e) {
    console.error("lider-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
