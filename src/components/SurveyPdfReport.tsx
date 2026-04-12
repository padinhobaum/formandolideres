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
      // Fetch all surveys with responses
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

      // Fetch all responses
      const { data: allResponses } = await supabase
        .from("survey_responses")
        .select("survey_id, score_general, score_communication, contributes_environment, keeps_informed, opens_space, comments");

      // Fetch leaders and their profiles
      const { data: surveyLeaders } = await supabase.from("survey_leaders").select("survey_id, leader_user_id");
      const leaderIds = [...new Set((surveyLeaders || []).map((sl: any) => sl.leader_user_id))];
      let leaderProfiles: Record<string, string> = {};
      if (leaderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", leaderIds);
        (profiles || []).forEach((p: any) => { leaderProfiles[p.user_id] = p.full_name; });
      }

      // Group responses by survey
      const responseMap: Record<string, any[]> = {};
      (allResponses || []).forEach((r: any) => {
        if (!responseMap[r.survey_id]) responseMap[r.survey_id] = [];
        responseMap[r.survey_id].push(r);
      });

      // Build HTML for PDF
      const surveyRows = surveys.map((s: any) => {
        const responses = responseMap[s.id] || [];
        const total = responses.length;
        const avgGen = total > 0 ? (responses.reduce((acc: number, r: any) => acc + r.score_general, 0) / total).toFixed(1) : "-";
        const avgComm = total > 0 ? (responses.reduce((acc: number, r: any) => acc + r.score_communication, 0) / total).toFixed(1) : "-";
        const pctEnv = total > 0 ? ((responses.filter((r: any) => r.contributes_environment).length / total) * 100).toFixed(0) + "%" : "-";
        const pctInf = total > 0 ? ((responses.filter((r: any) => r.keeps_informed).length / total) * 100).toFixed(0) + "%" : "-";
        const pctSpace = total > 0 ? ((responses.filter((r: any) => r.opens_space).length / total) * 100).toFixed(0) + "%" : "-";

        const leaders = (surveyLeaders || [])
          .filter((sl: any) => sl.survey_id === s.id)
          .map((sl: any) => leaderProfiles[sl.leader_user_id] || "Desconhecido")
          .join(", ");

        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${s.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${s.bimester}º</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${total}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;font-weight:600;color:${Number(avgGen) >= 7 ? '#16a34a' : '#d97706'}">${avgGen}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;font-weight:600;color:${Number(avgComm) >= 7 ? '#16a34a' : '#d97706'}">${avgComm}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${pctEnv}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${pctInf}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${pctSpace}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;">${leaders || "—"}</td>
          </tr>
        `;
      }).join("");

      // Per-bimester summary
      const bimesters = [1, 2, 3, 4];
      const bimesterSummary = bimesters.map(b => {
        const bSurveys = surveys.filter((s: any) => s.bimester === b);
        const bResponses = bSurveys.flatMap((s: any) => responseMap[s.id] || []);
        const total = bResponses.length;
        if (total === 0) return null;
        const avgGen = (bResponses.reduce((acc: number, r: any) => acc + r.score_general, 0) / total).toFixed(1);
        const avgComm = (bResponses.reduce((acc: number, r: any) => acc + r.score_communication, 0) / total).toFixed(1);
        return `
          <div style="flex:1;min-width:200px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;text-align:center;">
            <p style="font-size:12px;color:#64748b;margin:0 0 4px;">${b}º Bimestre</p>
            <p style="font-size:28px;font-weight:700;color:#003d7a;margin:0;">${avgGen}</p>
            <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Nota geral média</p>
            <p style="font-size:20px;font-weight:600;color:#006ab5;margin:8px 0 0;">${avgComm}</p>
            <p style="font-size:11px;color:#64748b;margin:2px 0 0;">Comunicação média</p>
            <p style="font-size:12px;color:#64748b;margin:8px 0 0;">${total} respostas</p>
          </div>
        `;
      }).filter(Boolean).join("");

      const logoFormandoUrl = window.location.origin + "/lovable-uploads/footer-logo.png";
      const logoLiceuUrl = window.location.origin + "/lovable-uploads/logolj.webp";

      const html = `
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Ubuntu', 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }
            @page { size: A4 landscape; margin: 20mm; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div style="padding:20px;">
            <!-- Header with logos -->
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #003d7a;padding-bottom:16px;margin-bottom:24px;">
              <div style="display:flex;align-items:center;gap:16px;">
                <img src="${logoFormandoUrl}" alt="Formando Líderes" style="height:48px;width:auto;" crossorigin="anonymous" />
                <img src="${logoLiceuUrl}" alt="Liceu Jardim" style="height:48px;width:auto;" crossorigin="anonymous" />
              </div>
              <div style="flex:1;margin-left:24px;">
                <h1 style="font-size:22px;font-weight:700;color:#003d7a;margin:0;text-align:left;">Relatório Consolidado</h1>
                <p style="font-size:14px;color:#64748b;margin:4px 0 0;text-align:left;">Pesquisas de Opinião — Líderes de Sala</p>
                <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;text-align:left;">Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>
            </div>

            <!-- Bimester Summary -->
            ${bimesterSummary ? `
              <h2 style="font-size:16px;font-weight:700;color:#003d7a;margin:0 0 12px;">Resumo por Bimestre</h2>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;">
                ${bimesterSummary}
              </div>
            ` : ''}

            <!-- Table -->
            <h2 style="font-size:16px;font-weight:700;color:#003d7a;margin:0 0 12px;">Detalhamento por Pesquisa</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#003d7a;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#fff;">Pesquisa</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Bim.</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Respostas</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Nota Geral</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Comunicação</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Amb. Agradável</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Informados</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;">Abre Espaço</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#fff;">Líderes</th>
                </tr>
              </thead>
              <tbody>
                ${surveyRows}
              </tbody>
            </table>

            <!-- Footer -->
            <div style="margin-top:32px;border-top:2px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
              <p style="font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Formando Líderes — Todos os direitos reservados.</p>
              <p style="font-size:11px;color:#94a3b8;">www.formandolideres.org</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open print dialog with the HTML
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
    <Button
      variant="outline"
      size="sm"
      onClick={generatePdf}
      disabled={generating}
      className="gap-1.5"
    >
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generating ? "Gerando..." : "Relatório PDF"}
    </Button>
  );
}
