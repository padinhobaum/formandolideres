import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { weekLabel, average, total, comments } = await req.json() as {
      weekLabel?: string; average?: number; total?: number;
      comments?: { class_name: string; mood_score: number; comment: string }[];
    };

    const list = (comments ?? []).filter((c) => c.comment?.trim());
    if (list.length === 0) {
      return new Response(JSON.stringify({ summary: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const body = list
      .map((c) => `- [Sala ${c.class_name} | nota ${c.mood_score}/5] ${c.comment.trim()}`)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um analista educacional do programa Formando Líderes. Recebe comentários semanais escritos por líderes de sala sobre o clima da turma e produz um resumo executivo para gestores escolares. Responda SEMPRE em português brasileiro, em JSON válido, sem markdown.",
          },
          {
            role: "user",
            content: `Semana: ${weekLabel ?? "-"}. Respostas: ${total ?? list.length}. Média geral: ${average?.toFixed?.(1) ?? "-"}/5.

Comentários escritos dos líderes:
${body}

Retorne APENAS um JSON com este formato:
{"resumo":"2 a 4 frases resumindo o sentimento geral e os assuntos mais citados","temas":["tema recorrente 1","tema 2","tema 3"],"pontos_atencao":["ponto crítico 1","ponto 2"],"acoes":["ação prática e específica que o gestor pode tomar nesta semana","ação 2","ação 3"]}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      return new Response(
        JSON.stringify({
          error:
            res.status === 429
              ? "Muitas requisições à IA. Tente novamente em alguns segundos."
              : res.status === 402
              ? "Créditos de IA insuficientes para gerar o resumo."
              : "Erro no serviço de IA.",
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let summary: unknown = null;
    try {
      summary = JSON.parse(content);
    } catch {
      summary = { resumo: content, temas: [], pontos_atencao: [], acoes: [] };
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("climate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
