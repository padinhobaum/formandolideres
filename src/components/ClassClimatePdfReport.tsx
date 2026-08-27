import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import liceuLogoAsset from "@/assets/liceu-jardim.png.asset.json";

interface ClimateResponse {
  id: string;
  user_id: string;
  class_name: string;
  mood_score: number;
  comment: string | null;
  week_start: string;
  created_at: string;
}

interface Props {
  week: Date;
  weekLabel: string;
  current: ClimateResponse[];
  previous: ClimateResponse[];
  insights: string[];
}

const MOOD = {
  1: { emoji: "😢", label: "Muito ruim", color: "#dc2626" },
  2: { emoji: "😕", label: "Ruim", color: "#ea580c" },
  3: { emoji: "😐", label: "Neutro", color: "#ca8a04" },
  4: { emoji: "🙂", label: "Bom", color: "#65a30d" },
  5: { emoji: "😄", label: "Ótimo", color: "#059669" },
} as const;

const moodOf = (avg: number) =>
  avg >= 4.5 ? MOOD[5] : avg >= 3.5 ? MOOD[4] : avg >= 2.5 ? MOOD[3] : avg >= 1.5 ? MOOD[2] : MOOD[1];

export default function ClassClimatePdfReport({ week, weekLabel, current, previous, insights }: Props) {
  const [generating, setGenerating] = useState(false);

  const generatePdf = () => {
    if (current.length === 0) {
      toast.error("Nenhuma resposta nesta semana para gerar o relatório.");
      return;
    }
    setGenerating(true);
    try {
      const total = current.length;
      const avg = current.reduce((s, r) => s + r.mood_score, 0) / total;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      current.forEach((r) => { distribution[r.mood_score] = (distribution[r.mood_score] || 0) + 1; });

      const agg = (rows: ClimateResponse[]) => {
        const m: Record<string, { count: number; sum: number; comments: string[] }> = {};
        rows.forEach((r) => {
          if (!m[r.class_name]) m[r.class_name] = { count: 0, sum: 0, comments: [] };
          m[r.class_name].count += 1;
          m[r.class_name].sum += r.mood_score;
          if (r.comment?.trim()) m[r.class_name].comments.push(r.comment.trim());
        });
        return m;
      };
      const cur = agg(current);
      const prev = agg(previous);

      const classes = Object.entries(cur)
        .map(([name, d]) => ({
          name,
          count: d.count,
          avg: d.sum / d.count,
          comments: d.comments,
          delta: prev[name] ? d.sum / d.count - prev[name].sum / prev[name].count : null as number | null,
        }))
        .sort((a, b) => b.avg - a.avg);

      const prevTotal = previous.length;
      const prevAvg = prevTotal > 0 ? previous.reduce((s, r) => s + r.mood_score, 0) / prevTotal : null;
      const globalDelta = prevAvg !== null ? avg - prevAvg : null;

      // KPI cards
      const kpis = `
        <div style="flex:1;min-width:150px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px;text-align:center;">
          <p style="font-size:11px;color:#64748b;margin:0 0 4px;">Respostas</p>
          <p style="font-size:26px;font-weight:700;color:#003d7a;margin:0;">${total}</p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0;">em ${classes.length} sala(s)</p>
        </div>
        <div style="flex:1;min-width:150px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px;text-align:center;">
          <p style="font-size:11px;color:#64748b;margin:0 0 4px;">Média geral</p>
          <p style="font-size:26px;font-weight:700;color:#003d7a;margin:0;">${avg.toFixed(1)} <span style="font-size:20px;">${moodOf(avg).emoji}</span></p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0;">de 5 pontos</p>
        </div>
        <div style="flex:1;min-width:150px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px;text-align:center;">
          <p style="font-size:11px;color:#64748b;margin:0 0 4px;">vs semana anterior</p>
          <p style="font-size:26px;font-weight:700;margin:0;color:${globalDelta === null ? "#94a3b8" : globalDelta > 0.1 ? "#059669" : globalDelta < -0.1 ? "#dc2626" : "#64748b"};">
            ${globalDelta === null ? "—" : `${globalDelta > 0 ? "+" : ""}${globalDelta.toFixed(1)}`}
          </p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0;">${prevAvg !== null ? `média anterior ${prevAvg.toFixed(1)}` : "sem dados anteriores"}</p>
        </div>
        <div style="flex:1;min-width:150px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:14px;text-align:center;">
          <p style="font-size:11px;color:#64748b;margin:0 0 4px;">Alertas</p>
          <p style="font-size:26px;font-weight:700;color:#b45309;margin:0;">${(distribution[1] || 0) + (distribution[2] || 0)}</p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0;">respostas negativas</p>
        </div>
      `;

      // Distribution bar chart (SVG)
      const cw = 600, ch = 180, pad = 40;
      const maxCount = Math.max(...Object.values(distribution), 1);
      const barW = (cw - 2 * pad) / 5 - 16;
      const distChart = `
        <svg viewBox="0 0 ${cw} ${ch}" style="width:100%;max-width:600px;height:auto;font-family:'Ubuntu',sans-serif;">
          ${[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = ch - pad - f * (ch - 2 * pad);
            return `<line x1="${pad}" y1="${y}" x2="${cw - pad}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5"/>
                    <text x="${pad - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${Math.round(f * maxCount)}</text>`;
          }).join("")}
          ${[1, 2, 3, 4, 5].map((s, i) => {
            const v = distribution[s] || 0;
            const h = (v / maxCount) * (ch - 2 * pad);
            const x = pad + i * ((cw - 2 * pad) / 5) + 8;
            const y = ch - pad - h;
            return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${MOOD[s as 1].color}"/>
                    <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">${v}</text>
                    <text x="${x + barW / 2}" y="${ch - pad + 16}" text-anchor="middle" font-size="13">${MOOD[s as 1].emoji}</text>
                    <text x="${x + barW / 2}" y="${ch - pad + 30}" text-anchor="middle" font-size="9" fill="#64748b">${MOOD[s as 1].label}</text>`;
          }).join("")}
        </svg>`;

      // Table
      const rows = classes.map((c) => {
        const m = moodOf(c.avg);
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:500;">${c.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${c.count}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;font-weight:700;color:${m.color};">${c.avg.toFixed(1)} ${m.emoji}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${m.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;color:${c.delta === null ? "#94a3b8" : c.delta > 0.1 ? "#059669" : c.delta < -0.1 ? "#dc2626" : "#64748b"};">
            ${c.delta === null ? "—" : `${c.delta > 0 ? "▲ +" : c.delta < 0 ? "▼ " : "= "}${c.delta.toFixed(1)}`}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;">${c.comments.length}</td>
        </tr>`;
      }).join("");

      const insightsHtml = insights.length > 0 ? `
        <div style="margin-top:20px;border:1px solid #e2e8f0;border-radius:12px;padding:20px;background:#fafafa;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="background:#003d7a;color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;letter-spacing:0.5px;">Fornecido pela LíderAI</span>
            <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0;">Insights para Gestores</h3>
          </div>
          <ul style="margin:0;padding-left:18px;">
            ${insights.map((i) => `<li style="font-size:12px;color:#334155;line-height:1.7;margin-bottom:6px;">${i}</li>`).join("")}
          </ul>
        </div>` : "";

      const commentBlocks = classes.filter((c) => c.comments.length > 0);
      const commentsHtml = commentBlocks.length > 0 ? `
        <div style="margin-top:24px;">
          <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 12px;">Comentários dos Líderes</h3>
          ${commentBlocks.map((c) => `
            <div style="margin-bottom:12px;break-inside:avoid;">
              <p style="font-size:11px;font-weight:700;color:#003d7a;margin:0 0 6px;">${c.name}</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${c.comments.slice(0, 12).map((cm) => `
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:11px;color:#334155;line-height:1.5;flex:1 1 280px;max-width:48%;">"${cm}"</div>
                `).join("")}
              </div>
            </div>`).join("")}
        </div>` : "";

      const logoFormandoUrl = window.location.origin + "/lovable-uploads/footer-logo.png";
      const logoLiceuUrl = window.location.origin + liceuLogoAsset.url;

      const html = `<html>
<head>
  <meta charset="utf-8" />
  <title>Relatório Clima das Turmas</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Ubuntu','Segoe UI',sans-serif; color:#1e293b; background:#fff; }
    @page { size:A4 landscape; margin:18mm 18mm 24mm; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    /* Rodapé repetido em todas as páginas */
    .page-footer {
      position:fixed; bottom:0; left:0; right:0;
      border-top:2px solid #e5e7eb; padding-top:8px;
      display:flex; justify-content:space-between; align-items:center;
      background:#fff;
    }
    .page-footer p { font-size:10px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="page-footer">
    <p>© ${new Date().getFullYear()} Formando Líderes — Todos os direitos reservados.</p>
    <p>Relatório Clima das Turmas — ${weekLabel}</p>
    <p>www.formandolideres.org</p>
  </div>

  <div style="padding:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #003d7a;padding-bottom:14px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <img src="${logoFormandoUrl}" alt="Formando Líderes" style="height:48px;" crossorigin="anonymous" />
        <img src="${logoLiceuUrl}" alt="Liceu Jardim" style="height:56px;" crossorigin="anonymous" />
      </div>
      <div style="flex:1;margin-left:24px;">
        <h1 style="font-size:22px;font-weight:700;color:#003d7a;margin:0;">Relatório Clima das Turmas</h1>
        <p style="font-size:13px;color:#64748b;margin:3px 0 0;">Semana de ${weekLabel}</p>
        <p style="font-size:10px;color:#94a3b8;margin:3px 0 0;">Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
    </div>

    <h2 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 10px;">Resumo da Semana</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">${kpis}</div>

    <div style="margin:20px 0;break-inside:avoid;">
      <h3 style="font-size:14px;font-weight:700;color:#003d7a;margin:0 0 8px;">Distribuição das Respostas</h3>
      ${distChart}
    </div>

    <h2 style="font-size:14px;font-weight:700;color:#003d7a;margin:16px 0 10px;">Detalhamento por Sala</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;font-size:11px;">
      <thead>
        <tr style="background:#003d7a;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;">Sala</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Respostas</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Média</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">Clima</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;">vs semana anterior</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;">Comentários</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${insightsHtml}
    ${commentsHtml}
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
    <Button variant="outline" size="sm" onClick={generatePdf} disabled={generating} className="gap-1.5 rounded-xl">
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generating ? "Gerando..." : "Relatório PDF"}
    </Button>
  );
}
