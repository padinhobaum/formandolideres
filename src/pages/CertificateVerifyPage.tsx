import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Award } from "lucide-react";

export default function CertificateVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data } = await supabase.from("certificates").select("*").eq("verification_code", code).maybeSingle();
      if (data) {
        setCert(data);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", (data as any).user_id).maybeSingle();
        if (profile) setUserName((profile as any).full_name);
      }
      setLoading(false);
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-12 mx-auto mb-6" />

        {cert ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">Certificado Válido</h1>
            <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left space-y-2">
              <div>
                <p className="text-xs text-gray-500">Título</p>
                <p className="text-sm font-semibold text-gray-800">{cert.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Destinatário</p>
                <p className="text-sm font-semibold text-gray-800">{userName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data de Emissão</p>
                <p className="text-sm text-gray-800">
                  {new Date(cert.issued_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Código de Verificação</p>
                <p className="text-sm font-mono text-gray-800">{cert.verification_code}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Certificado Inválido</h1>
            <p className="text-sm text-gray-500">O código informado não corresponde a nenhum certificado registrado.</p>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6">© {new Date().getFullYear()} Formando Líderes</p>
      </div>
    </div>
  );
}
