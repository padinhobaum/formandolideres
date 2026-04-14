import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

export default function SurveyPdfReport() {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const { data: surveys } = await supabase
        .from("surveys")
        .select("*")
        .order("bimester")
        .order("created_at", { ascending: false });

      if (!surveys || surveys.length === 0) {
        toast.error("Nenhuma pesquisa encontrada.");
        setGenerating(false);
        return;
      }

      const { data: allResponses } = await supabase
        .from("survey_responses")
        .select("survey_id, score_general, score_communication, contributes_environment, keeps_informed, opens_space, comments, student_name");

      const { data: surveyLeaders } = await supabase.from("survey_leaders").select("survey_id, leader_user_id");
      const leaderIds = [...new Set((surveyLeaders || []).map((sl: any) => sl.leader_user_id))];
      let leaderProfiles: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (leaderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", leaderIds);
        (profiles || []).forEach((p: any) => { leaderProfiles[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      }

      const responseMap: Record<string, any[]> = {};
      (allResponses || []).forEach((r: any) => {
        if (!responseMap[r.survey_id]) responseMap[r.survey_id] = [];
        responseMap[r.survey_id].push(r);
      });

      // === Leader Spotlight: find leader with highest average ===
      let spotlightLeader: { name: string; avatar_url: string | null; avg: number; metric: string } | null = null;
      const leaderAvgs: { id: string; avg: number }[] = [];
      leaderIds.forEach((lid) => {
        const leaderSurveyIds = (surveyLeaders || []).filter((sl: any) => sl.leader_user_id === lid).map((sl: any) => sl.survey_id);
        const leaderResponses = leaderSurveyIds.flatMap((sid: string) => responseMap[sid] || []);
        if (leaderResponses.length > 0) {
          const avg = leaderResponses.reduce((a: number, r: any) => a + r.score_general, 0) / leaderResponses.length;
          leaderAvgs.push({ id: lid, avg });
        }
      });
      if (leaderAvgs.length > 0) {
        leaderAvgs.sort((a, b) => b.avg - a.avg);
        const best = leaderAvgs[0];
        const prof = leaderProfiles[best.id];
        if (prof) {
          spotlightLeader = { name: prof.full_name, avatar_url: prof.avatar_url, avg: best.avg, metric: "Maior nota geral média" };
        }
      }

      // === Build table rows ===
      const surveyRows = surveys.map((s: any) => {
        const responses = responseMap[s.id] || [];
        const total = responses.length;
        const avgGen = total > 0 ? (responses.reduce((acc: number, r: any) => acc + r.score_general, 0) / total).toFixed(1) : "-";
        const avgComm = total > 0 ? (responses.reduce((acc: number, r: any) => acc + r.score_communication, 0) / total).toFixed(1) : "-";
        const pctEnv = total > 0 ? ((responses.filter((r: any) => r.contributes_environment).length / total) * 100).toFixed(0) + "%" : "-";
        const pctInf = total > 0 ? ((responses.filter((r: any) => r.keeps_informed).length / total) * 100).toFixed(0) + "%" : "-";
        const pctSpace = total > 0 ? ((responses.filter((r: any) => r.opens_space).length / total) * 100).toFixed(0) + "%" : "-";
        const leaders = (surveyLeaders || []).filter((sl: any) => sl.survey_id === s.id).map((sl: any) => leaderProfiles[sl.leader_user_id]?.full_name || "—").join(", ");

        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;">${s.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${s.bimester}º</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${total}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;font-weight:600;color:${Number(avgGen) >= 7 ? '#16a34a' : '#d97706'}">${avgGen}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;font-weight:600;color:${Number(avgComm) >= 7 ? '#16a34a' : '#d97706'}">${avgComm}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${pctEnv}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${pctInf}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${pctSpace}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;">${leaders || "—"}</td>
        </tr>`;
      }).join("");

      // === Bimester summary ===
      const bimesters = [1, 2, 3, 4];
      const bimesterData = bimesters.map(b => {
        const bSurveys = surveys.filter((s: any) => s.bimester === b);
        const bResponses = bSurveys.flatMap((s: any) => responseMap[s.id] || []);
        const total = bResponses.length;
        if (total === 0) return null;
        return {
          b,
          total,
          avgGen: (bResponses.reduce((a: number, r: any) => a + r.score_general, 0) / total).toFixed(1),
          avgComm: (bResponses.reduce((a: number, r: any) => a + r.score_communication, 0) / total).toFixed(1),
        };
      }).filter(Boolean) as { b: number; total: number; avgGen: string; avgComm: string }[];

      const bimesterSummary = bimesterData.map(d => `
        <div style="flex:1;min-width:160px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px;text-align:center;">
          <p style="font-size:11px;color:#64748b;margin:0 0 4px;">${d.b}º Bimestre</p>
          <p style="font-size:26px;font-weight:700;color:#003d7a;margin:0;">${d.avgGen}</p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0;">Nota geral</p>
          <p style="font-size:18px;font-weight:600;color:#006ab5;margin:6px 0 0;">${d.avgComm}</p>
          <p style="font-size:10px;color:#64748b;">Comunicação</p>
          <p style="font-size:11px;color:#64748b;margin:6px 0 0;">${d.total} respostas</p>
        </div>
      `).join("");

      // === SVG Chart - evolution line ===
      const chartWidth = 600;
      const chartHeight = 180;
      const padding = 40;
      const chartSvg = bimesterData.length >= 2 ? (() => {
        const maxVal = 10;
        const points = bimesterData.map((d, i) => {
          const x = padding + (i / (bimesterData.length - 1)) * (chartWidth - 2 * padding);
          const y = chartHeight - padding - (parseFloat(d.avgGen) / maxVal) * (chartHeight - 2 * padding);
          return { x, y, label: `${d.b}º Bim`, val: d.avgGen };
        });
        const commPoints = bimesterData.map((d, i) => {
          const x = padding + (i / (bimesterData.length - 1)) * (chartWidth - 2 * padding);
          const y = chartHeight - padding - (parseFloat(d.avgComm) / maxVal) * (chartHeight - 2 * padding);
          return { x, y, val: d.avgComm };
        });
        const genLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const commLine = commPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

        return `
        <div style="margin:20px 0;">
          <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 8px;">Evolução por Bimestre</h3>
          <svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width:100%;max-width:600px;height:auto;font-family:'Ubuntu',sans-serif;">
            <!-- Grid lines -->
            ${[0,2,4,6,8,10].map(v => {
              const y = chartHeight - padding - (v / maxVal) * (chartHeight - 2 * padding);
              return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5"/>
                      <text x="${padding - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${v}</text>`;
            }).join('')}
            <!-- Lines -->
            <path d="${genLine}" fill="none" stroke="#003d7a" stroke-width="2.5" stroke-linecap="round"/>
            <path d="${commLine}" fill="none" stroke="#d4a843" stroke-width="2.5" stroke-dasharray="6,3" stroke-linecap="round"/>
            <!-- Points + labels -->
            ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#003d7a"/><text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" font-weight="700" fill="#003d7a">${p.val}</text>`).join('')}
            ${commPoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#d4a843"/><text x="${p.x}" y="${p.y + 16}" text-anchor="middle" font-size="9" fill="#d4a843">${p.val}</text>`).join('')}
            <!-- X labels -->
            ${points.map(p => `<text x="${p.x}" y="${chartHeight - 8}" text-anchor="middle" font-size="10" fill="#64748b">${p.label}</text>`).join('')}
            <!-- Legend -->
            <rect x="${chartWidth - 180}" y="4" width="10" height="10" rx="2" fill="#003d7a"/>
            <text x="${chartWidth - 166}" y="13" font-size="9" fill="#334155">Nota Geral</text>
            <rect x="${chartWidth - 95}" y="4" width="10" height="10" rx="2" fill="#d4a843"/>
            <text x="${chartWidth - 81}" y="13" font-size="9" fill="#334155">Comunicação</text>
          </svg>
        </div>`;
      })() : '';

      // === All comments ===
      const allComments = (allResponses || []).filter((r: any) => r.comments?.trim()).map((r: any) => r.comments.trim());
      const commentsHtml = allComments.length > 0 ? `
        <div style="page-break-before:auto;margin-top:24px;">
          <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 12px;">Comentários dos Alunos</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${allComments.slice(0, 30).map((c: string) => `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:11px;color:#334155;line-height:1.5;flex:1 1 280px;max-width:48%;">
                "${c}"
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      // === Spotlight section ===
      const spotlightHtml = spotlightLeader ? `
        <div style="margin-bottom:24px;background:linear-gradient(135deg,#f0f9ff,#fef3c7);border:1px solid #bae6fd;border-radius:14px;padding:20px;display:flex;align-items:center;gap:20px;">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:3px solid #d4a843;flex-shrink:0;background:#e2e8f0;">
            ${spotlightLeader.avatar_url ? `<img src="${spotlightLeader.avatar_url}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#003d7a;">${spotlightLeader.name[0]}</div>`}
          </div>
          <div>
            <p style="font-size:11px;color:#d4a843;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">⭐ Líder em Destaque</p>
            <p style="font-size:20px;font-weight:700;color:#003d7a;margin:0;">${spotlightLeader.name}</p>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">${spotlightLeader.metric}: <strong style="color:#003d7a">${spotlightLeader.avg.toFixed(1)}</strong></p>
          </div>
        </div>
      ` : '';

      // === Insights section ===
      const allAvgGen = (allResponses || []).length > 0
        ? ((allResponses || []).reduce((a: number, r: any) => a + r.score_general, 0) / (allResponses || []).length)
        : 0;
      const insights: string[] = [];
      if (allAvgGen >= 8) insights.push("As notas gerais estão acima de 8 — excelente desempenho! Mantenha as práticas atuais e reconheça os líderes publicamente.");
      else if (allAvgGen >= 6) insights.push("As notas gerais estão na faixa de 6-8. Considere mentorias individuais e treinamentos em comunicação para elevar o padrão.");
      else insights.push("As notas gerais estão abaixo de 6. É recomendado um plano de ação urgente com feedback direto e acompanhamento semanal.");
      
      const pctInformed = (allResponses || []).length > 0
        ? ((allResponses || []).filter((r: any) => r.keeps_informed).length / (allResponses || []).length * 100)
        : 0;
      if (pctInformed < 70) insights.push(`Apenas ${pctInformed.toFixed(0)}% dos alunos sentem-se informados. Incentive os líderes a usarem canais visuais (murais, grupos) para comunicação.`);
      
      insights.push("Realize rodas de conversa periódicas para que os líderes compartilhem boas práticas entre si.");

      const insightsHtml = `
        <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:12px;padding:20px;background:#fafafa;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="background:#003d7a;color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;letter-spacing:0.5px;">Fornecido pela LíderAI</span>
            <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0;">Insights para Gestores</h3>
          </div>
          <ul style="margin:0;padding-left:18px;">
            ${insights.map(i => `<li style="font-size:12px;color:#334155;line-height:1.7;margin-bottom:6px;">${i}</li>`).join('')}
          </ul>
        </div>
      `;

      const logoFormandoUrl = window.location.origin + "/lovable-uploads/footer-logo.png";
      const logoLiceuUrl = window.location.origin + "/lovable-uploads/logolj.webp";

      const html = `<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Ubuntu','Segoe UI',sans-serif; color:#1e293b; background:#fff; }
    @page { size:A4 landscape; margin:18mm; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div style="padding:10px;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #003d7a;padding-bottom:14px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <img src="${logoFormandoUrl}" alt="Formando Líderes" style="height:48px;" crossorigin="anonymous" />
        <img src="${logoLiceuUrl}" alt="Liceu Jardim" style="height:56px;" crossorigin="anonymous" />
      </div>
      <div style="flex:1;margin-left:24px;">
        <h1 style="font-size:22px;font-weight:700;color:#003d7a;margin:0;text-align:left;">Relatório Consolidado</h1>
        <p style="font-size:13px;color:#64748b;margin:3px 0 0;text-align:left;">Pesquisas de Opinião — Líderes de Sala</p>
        <p style="font-size:10px;color:#94a3b8;margin:3px 0 0;text-align:left;">Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
    </div>

    ${spotlightHtml}

    ${bimesterSummary ? `
      <h2 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 10px;">Resumo por Bimestre</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">${bimesterSummary}</div>
    ` : ''}

    ${chartSvg}

    <h2 style="font-size:14px;font-weight:700;color:#003d7a;margin:16px 0 10px;">Detalhamento por Pesquisa</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:11px;">
      <thead>
        <tr style="background:#003d7a;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;">Pesquisa</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Bim.</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Resp.</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Geral</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Comunicação</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Amb.</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Informados</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Espaço</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;">Líderes</th>
        </tr>
      </thead>
      <tbody>${surveyRows}</tbody>
    </table>

    ${insightsHtml}
    ${commentsHtml}

    <!-- Footer -->
    <div style="margin-top:24px;border-top:2px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
      <p style="font-size:10px;color:#94a3b8;">© ${new Date().getFullYear()} Formando Líderes — Todos os direitos reservados.</p>
      <p style="font-size:10px;color:#94a3b8;">www.formandolideres.org</p>
    </div>
  </div>
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Permita pop-ups para gerar o PDF.");
        setGenerating(false);
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setGenerating(false);
      }, 800);
      toast.success("Relatório gerado! Use 'Salvar como PDF' na janela de impressão.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar relatório.");
      setGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-1.5">
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generating ? "Gerando..." : "Relatório PDF"}
    </Button>
  );
}
