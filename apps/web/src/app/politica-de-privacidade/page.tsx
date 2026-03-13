import type { Metadata } from "next";

import LegalPageShell from "@/features/legal/components/legal-page-shell";

const updatedAt = "12 de março de 2026";

const sections = [
  {
    title: "1. Quem trata os dados e em qual papel",
    paragraphs: [
      "Esta Política de Privacidade descreve como o Agenda GenZ trata dados pessoais relacionados ao uso da plataforma de agendamento e gestão para profissionais da área da beleza.",
      "Quando o próprio profissional ou estabelecimento cadastra dados dos seus clientes no sistema, esse usuário atua, em regra, como controlador desses dados. Nessa hipótese, o Agenda GenZ atua como operador da plataforma, tratando as informações para disponibilizar os recursos contratados, manter a segurança do serviço e cumprir obrigações legais e contratuais.",
    ],
    note:
      "Se você for cliente de uma profissional ou de um salão que usa o Agenda GenZ, pedidos sobre cadastro, agendamento, correção ou exclusão de dados do seu atendimento devem ser direcionados primeiro ao profissional ou estabelecimento responsável, salvo quando a solicitação disser respeito diretamente à operação da plataforma.",
  },
  {
    title: "2. Quais dados podem ser tratados",
    paragraphs: [
      "Os dados tratados variam conforme a forma de uso da plataforma e as funcionalidades ativadas. Nem todos os campos são obrigatórios em todos os casos.",
    ],
    items: [
      "dados de conta e acesso, como nome, e-mail, identificadores de sessão e informações básicas da assinatura",
      "dados operacionais do negócio, como serviços cadastrados, preços, horários, disponibilidade, agendamentos, status de atendimento, sinal e situação de pagamento",
      "dados de clientes inseridos pelo usuário, como nome, telefone, e-mail, Instagram, CPF, endereço, idade, gênero, observações, foto de perfil e registros visuais de atendimento, quando aplicável",
      "dados de cobrança e transação relativos a planos pagos, como identificadores da compra, valor, meio de pagamento, expiração e status da transação",
      "dados técnicos e de segurança, como logs de acesso, endereços IP, cookies de sessão, navegador, dispositivo e eventos necessários para estabilidade, auditoria e prevenção a fraude",
    ],
  },
  {
    title: "3. Para quais finalidades usamos os dados",
    paragraphs: [
      "Tratamos dados pessoais para operar, manter, proteger e evoluir a plataforma, bem como para permitir que o usuário organize o próprio negócio com mais eficiência e segurança.",
    ],
    items: [
      "criar e administrar contas de acesso",
      "autenticar usuários e proteger sessões",
      "registrar clientes, serviços, agenda, histórico de atendimentos e informações operacionais",
      "processar contratações, cobranças e confirmações de pagamento",
      "armazenar arquivos e imagens enviados legitimamente pelo usuário",
      "prevenir fraudes, abusos e incidentes de segurança",
      "cumprir obrigações legais, regulatórias e requisições válidas de autoridades",
      "prestar suporte, solucionar problemas técnicos e melhorar a experiência do produto",
    ],
  },
  {
    title: "4. Bases legais aplicáveis",
    paragraphs: [
      "O tratamento de dados pessoais pode se apoiar, conforme o contexto, em diferentes bases legais previstas na LGPD, incluindo execução de contrato, procedimentos preliminares relacionados ao contrato, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse e, quando necessário, consentimento.",
      "Quando o usuário cadastrar dados de clientes, caberá a ele identificar e documentar a base legal apropriada para cada tratamento realizado em seu contexto de atendimento.",
    ],
  },
  {
    title: "5. Compartilhamento com terceiros",
    paragraphs: [
      "Não comercializamos dados pessoais. O compartilhamento ocorre apenas quando necessário para operar a plataforma, viabilizar funcionalidades contratadas ou cumprir exigências legais.",
    ],
    items: [
      "provedores de infraestrutura, hospedagem, banco de dados, armazenamento em nuvem e segurança",
      "parceiros de pagamento para cobranças e confirmação de transações, inclusive via PIX, como o Mercado Pago quando aplicável",
      "prestadores de serviços de suporte, monitoramento, comunicação ou notificação, quando a funcionalidade correspondente estiver ativa",
      "autoridades administrativas, judiciais ou reguladoras, quando houver obrigação legal, ordem válida ou necessidade de exercício regular de direitos",
    ],
    note:
      "Sempre que possível, adotamos contratos, instruções operacionais e medidas de segurança compatíveis com a natureza do tratamento realizado por terceiros.",
  },
  {
    title: "6. Cookies, sessão e tecnologias semelhantes",
    paragraphs: [
      "Utilizamos cookies e identificadores técnicos necessários para manter a sessão autenticada, preservar preferências básicas de uso, melhorar a navegação, reforçar a segurança e entender eventos operacionais essenciais da plataforma.",
      "Cookies estritamente necessários podem ser usados independentemente de consentimento quando indispensáveis ao funcionamento do serviço. Outros mecanismos, quando existentes e exigidos por lei, deverão seguir os controles e avisos aplicáveis.",
    ],
  },
  {
    title: "7. Retenção e exclusão",
    paragraphs: [
      "Os dados pessoais são mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política, atender obrigações legais, preservar registros de segurança, resolver disputas e exercer direitos em processos administrativos, arbitrais ou judiciais.",
      "Contas e registros podem ser excluídos mediante solicitação, observadas as limitações técnicas, obrigações de retenção e o papel de cada agente de tratamento. Em ambientes de backup e redundância, a remoção definitiva pode ocorrer em ciclos adicionais de segurança.",
    ],
  },
  {
    title: "8. Segurança da informação",
    paragraphs: [
      "Adotamos medidas técnicas e administrativas razoáveis para proteger dados pessoais contra acessos não autorizados, destruição, perda, alteração, divulgação ou tratamento inadequado, considerando a natureza dos dados e os riscos envolvidos.",
      "Ainda assim, nenhum ambiente digital é totalmente imune a incidentes. Por isso, o usuário também deve contribuir para a segurança do ecossistema, usando senhas fortes, controlando acessos de colaboradores e evitando o cadastro de dados excessivos ou desnecessários.",
    ],
  },
  {
    title: "9. Transferências internacionais",
    paragraphs: [
      "Parte da infraestrutura tecnológica utilizada pelo Agenda GenZ ou por parceiros operacionais pode estar localizada fora do Brasil ou envolver processamento internacional de dados. Nesses casos, buscamos adotar salvaguardas contratuais e medidas compatíveis com a legislação aplicável.",
    ],
  },
  {
    title: "10. Direitos dos titulares",
    paragraphs: [
      "Nos limites da LGPD e conforme o papel exercido por cada parte no tratamento, o titular pode solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informações sobre compartilhamento, revisão de decisões automatizadas quando aplicável e revogação do consentimento.",
      "Quando o Agenda GenZ atuar apenas como operador em nome do profissional ou estabelecimento, a solicitação poderá ser encaminhada ao controlador responsável para tratamento adequado.",
    ],
    items: [
      "confirmação e acesso aos dados",
      "correção de dados incompletos, inexatos ou desatualizados",
      "anonimização, bloqueio ou eliminação quando cabível",
      "informações sobre compartilhamento e sobre a possibilidade de não fornecer consentimento",
      "petição perante a ANPD ou outros órgãos competentes, conforme a lei",
    ],
  },
  {
    title: "11. Atualizações desta política",
    paragraphs: [
      "Podemos atualizar esta Política de Privacidade para refletir mudanças legais, operacionais, de segurança ou evoluções do produto. A versão vigente será sempre a publicada nesta área, com indicação da data de última atualização.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Entenda como o Agenda GenZ trata dados pessoais relacionados a agendamentos, cadastros de clientes e operação de serviços na área da beleza.",
  alternates: {
    canonical: "/politica-de-privacidade",
  },
  openGraph: {
    title: "Política de Privacidade | Agenda GenZ",
    description:
      "Informações sobre tratamento de dados pessoais, LGPD, clientes cadastrados, cobranças e segurança no Agenda GenZ.",
    url: "/politica-de-privacidade",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      badge="Privacidade e LGPD"
      title="Política de Privacidade"
      description="Este documento explica como dados pessoais podem ser coletados, utilizados, compartilhados, armazenados e protegidos no contexto do Agenda GenZ, incluindo o uso da plataforma por profissionais da beleza para cadastrar clientes, organizar agendamentos e operar seus serviços."
      updatedAt={updatedAt}
      currentPath="/politica-de-privacidade"
      sections={sections}
    />
  );
}
