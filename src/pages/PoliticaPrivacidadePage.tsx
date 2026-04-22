import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoliticaPrivacidadePage() {
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
          Política de Privacidade
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
              1. Disposições Gerais
            </h2>
            <p className="mb-3">
              A presente Política de Privacidade tem por finalidade estabelecer as regras
              sobre a coleta, uso, armazenamento, tratamento e proteção dos dados pessoais
              dos usuários da plataforma <strong>Formando Líderes</strong>, em conformidade
              com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD) e demais
              normas aplicáveis.
            </p>
            <p>
              Ao utilizar a plataforma, o titular declara estar ciente e de acordo com as
              disposições desta Política.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              2. Definições
            </h2>
            <p className="mb-3">Para os fins desta Política, consideram-se:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong>Dados pessoais:</strong> toda informação relacionada a pessoa
                natural identificada ou identificável;
              </li>
              <li>
                <strong>Titular:</strong> pessoa natural a quem se referem os dados
                pessoais;
              </li>
              <li>
                <strong>Controlador:</strong> pessoa jurídica responsável pelas decisões
                referentes ao tratamento de dados;
              </li>
              <li>
                <strong>Operador:</strong> pessoa que realiza o tratamento em nome do
                controlador;
              </li>
              <li>
                <strong>Tratamento:</strong> toda operação realizada com dados pessoais,
                como coleta, produção, recepção, classificação, utilização, acesso,
                reprodução, transmissão, distribuição, processamento, arquivamento,
                armazenamento, eliminação, avaliação ou controle da informação.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              3. Coleta de Dados Pessoais
            </h2>
            <p className="mb-3">
              A coleta de dados pessoais poderá ocorrer nas seguintes hipóteses:
            </p>

            <h3 className="font-heading font-semibold text-base text-foreground mt-4 mb-2">
              3.1 Dados fornecidos diretamente pelo titular
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo</li>
              <li>Endereço eletrônico (e-mail)</li>
              <li>Instituição de ensino</li>
              <li>Turma ou classe</li>
              <li>Função exercida na plataforma</li>
              <li>Imagem de perfil (quando fornecida)</li>
            </ul>

            <h3 className="font-heading font-semibold text-base text-foreground mt-4 mb-2">
              3.2 Dados coletados automaticamente
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Endereço IP</li>
              <li>Registros de acesso</li>
              <li>Informações sobre dispositivo e navegador</li>
              <li>Dados de navegação</li>
            </ul>

            <h3 className="font-heading font-semibold text-base text-foreground mt-4 mb-2">
              3.3 Dados decorrentes da utilização da plataforma
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Respostas a formulários e pesquisas</li>
              <li>Propostas submetidas</li>
              <li>Avaliações, votos e interações</li>
              <li>Histórico de utilização</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              4. Finalidade do Tratamento
            </h2>
            <p className="mb-3">O tratamento dos dados pessoais tem por finalidade:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Viabilizar a prestação dos serviços ofertados pela plataforma;</li>
              <li>Gerenciar a relação contratual com o usuário;</li>
              <li>Produzir análises, relatórios e indicadores educacionais;</li>
              <li>Aprimorar a experiência do usuário e o funcionamento da plataforma;</li>
              <li>Realizar comunicações institucionais e operacionais;</li>
              <li>Cumprir obrigações legais e regulatórias;</li>
              <li>Prevenir fraudes e garantir a segurança da informação.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              5. Base Legal para o Tratamento
            </h2>
            <p className="mb-3">
              O tratamento de dados pessoais fundamenta-se nas seguintes bases legais
              previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Consentimento do titular, quando aplicável;</li>
              <li>
                Execução de contrato ou de procedimentos preliminares relacionados a
                contrato;
              </li>
              <li>Cumprimento de obrigação legal ou regulatória;</li>
              <li>
                Legítimo interesse do controlador, observados os direitos e liberdades
                fundamentais do titular.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              6. Compartilhamento de Dados
            </h2>
            <p className="mb-3">Os dados pessoais poderão ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>Instituições de ensino às quais o titular esteja vinculado;</li>
              <li>
                Prestadores de serviços contratados para apoio tecnológico e operacional;
              </li>
              <li>Autoridades públicas, mediante requisição legal.</li>
            </ul>
            <p>
              O Formando Líderes <strong>não realiza a comercialização</strong> de dados
              pessoais.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              7. Armazenamento e Segurança
            </h2>
            <p className="mb-3">
              Os dados pessoais serão armazenados pelo período necessário ao cumprimento
              das finalidades descritas nesta Política, bem como para atendimento de
              obrigações legais e regulatórias.
            </p>
            <p>
              São adotadas medidas técnicas e administrativas aptas a proteger os dados
              pessoais contra acessos não autorizados, situações acidentais ou ilícitas
              de destruição, perda, alteração, comunicação ou difusão.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              8. Direitos do Titular
            </h2>
            <p className="mb-3">
              Nos termos do art. 18 da LGPD, o titular poderá, a qualquer tempo e
              mediante requisição:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>Confirmar a existência de tratamento;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>
                Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários
                ou tratados em desconformidade;
              </li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento;</li>
              <li>Obter informações sobre compartilhamento de dados.</li>
            </ul>
            <p>
              As solicitações deverão ser encaminhadas ao canal de contato informado
              nesta Política.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              9. Tratamento de Dados de Menores
            </h2>
            <p>
              Nos casos em que houver tratamento de dados pessoais de menores de idade,
              este será realizado em observância ao seu melhor interesse, podendo
              envolver consentimento específico de responsável legal ou tratamento
              vinculado à prestação de serviços educacionais.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              10. Uso de Cookies
            </h2>
            <p className="mb-3">
              A plataforma poderá utilizar cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>Garantir o funcionamento adequado dos serviços;</li>
              <li>Melhorar a experiência do usuário;</li>
              <li>Realizar análises estatísticas de uso.</li>
            </ul>
            <p>
              O usuário poderá gerenciar tais preferências por meio das configurações de
              seu navegador.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              11. Alterações da Política
            </h2>
            <p>
              O Formando Líderes reserva-se o direito de alterar esta Política a qualquer
              tempo, mediante publicação da versão atualizada na plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">
              12. Contato
            </h2>
            <p className="mb-3">
              Para exercício de direitos ou esclarecimento de dúvidas:
            </p>
            <p className="flex items-center gap-2">
              <span>📧</span>
              <a
                href="mailto:lgpd@formandolideres.org"
                className="text-primary hover:underline font-medium"
              >
                lgpd@formandolideres.org
              </a>
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
