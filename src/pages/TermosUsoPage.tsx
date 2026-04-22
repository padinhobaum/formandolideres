import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermosUsoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3">
            <img
              src="/lovable-uploads/footer-logo.png"
              alt="Formando Líderes"
              className="h-10 w-auto"
            />
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2">
          Termos de Uso
        </h1>
        <p className="text-sm text-muted-foreground mb-2">Formando Líderes</p>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização:{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              1. Objeto
            </h2>
            <p>
              Os presentes Termos de Uso regulam o acesso e a utilização da plataforma{" "}
              <strong>Formando Líderes</strong>, estabelecendo direitos, deveres e
              responsabilidades dos usuários e da plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              2. Aceitação
            </h2>
            <p>
              O acesso e a utilização da plataforma implicam a aceitação integral e
              irrestrita destes Termos.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              3. Cadastro e Responsabilidade do Usuário
            </h2>
            <p className="mb-3">O usuário compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Fornecer informações verídicas, completas e atualizadas;</li>
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Responsabilizar-se por todas as atividades realizadas em sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              4. Condutas Vedadas
            </h2>
            <p className="mb-3">É expressamente vedado ao usuário:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>
                Utilizar a plataforma para fins ilícitos ou contrários à legislação
                vigente;
              </li>
              <li>
                Inserir ou divulgar conteúdo ofensivo, discriminatório, ilícito ou
                inadequado;
              </li>
              <li>Manipular dados, avaliações ou resultados;</li>
              <li>
                Tentar obter acesso não autorizado a sistemas ou contas de terceiros.
              </li>
            </ul>
            <p>
              O descumprimento poderá ensejar a suspensão ou exclusão da conta, sem
              prejuízo das medidas legais cabíveis.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              5. Conteúdo Gerado pelo Usuário
            </h2>
            <p className="mb-3">
              O usuário é integralmente responsável pelo conteúdo por ele inserido na
              plataforma.
            </p>
            <p>
              Ao disponibilizar conteúdo, o usuário concede ao Formando Líderes licença
              não exclusiva para sua utilização, reprodução e exibição, estritamente
              para fins operacionais e institucionais.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              6. Propriedade Intelectual
            </h2>
            <p>
              Todos os direitos relativos à plataforma, incluindo software, design,
              marca, funcionalidades e conteúdos, são de titularidade exclusiva do
              Formando Líderes, sendo vedada sua reprodução, modificação ou distribuição
              sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              7. Privacidade
            </h2>
            <p>
              O tratamento de dados pessoais é realizado conforme disposto na{" "}
              <Link
                to="/politica-de-privacidade"
                className="text-primary hover:underline font-medium"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              8. Disponibilidade e Funcionamento
            </h2>
            <p className="mb-3">
              A plataforma poderá sofrer interrupções, suspensões ou alterações
              decorrentes de:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>Manutenções técnicas;</li>
              <li>Atualizações;</li>
              <li>Fatores externos.</li>
            </ul>
            <p>Não há garantia de disponibilidade contínua ou isenta de falhas.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              9. Limitação de Responsabilidade
            </h2>
            <p className="mb-3">O Formando Líderes não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Danos decorrentes do uso indevido da plataforma;</li>
              <li>Conteúdos inseridos por usuários;</li>
              <li>
                Decisões tomadas com base nas informações geradas pela plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              10. Suspensão e Encerramento
            </h2>
            <p className="mb-3">
              O Formando Líderes poderá, a seu exclusivo critério, suspender ou encerrar
              o acesso do usuário em caso de violação destes Termos.
            </p>
            <p>O usuário poderá solicitar a exclusão de sua conta a qualquer momento.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              11. Alterações dos Termos
            </h2>
            <p>
              Os presentes Termos poderão ser modificados a qualquer tempo, mediante
              publicação na plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              12. Legislação e Foro
            </h2>
            <p className="mb-3">
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p>
              Fica eleito o foro da comarca de <strong>Santo André - SP</strong>, com
              renúncia a qualquer outro, por mais privilegiado que seja, para dirimir
              eventuais controvérsias.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card py-6">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Formando Líderes – Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
