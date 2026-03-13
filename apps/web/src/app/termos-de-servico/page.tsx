import type { Metadata } from "next";

import LegalPageShell from "@/features/legal/components/legal-page-shell";

const updatedAt = "12 de março de 2026";

const sections = [
  {
    title: "1. Objeto da plataforma",
    paragraphs: [
      "O Agenda GenZ é uma plataforma digital voltada ao agendamento e à gestão operacional de serviços na área da beleza, permitindo que profissionais e estabelecimentos organizem horários, cadastros de clientes, serviços, histórico de atendimentos, observações e registros relacionados ao negócio.",
      "A plataforma não executa os serviços de beleza cadastrados pelos usuários e não se torna parte da relação comercial entre o profissional e seu cliente final. O atendimento contratado é prestado diretamente pelo profissional ou estabelecimento responsável.",
    ],
    items: [
      "agenda de horários e disponibilidade",
      "cadastro de clientes e histórico de atendimento",
      "organização de serviços, preços, sinal e status de pagamento",
      "armazenamento de imagens e anotações relacionadas ao atendimento, quando aplicável",
    ],
  },
  {
    title: "2. Cadastro, conta e acesso",
    paragraphs: [
      "Para usar funcionalidades autenticadas, o usuário deve fornecer informações verdadeiras, completas e atualizadas, mantendo a segurança de suas credenciais e de qualquer dispositivo usado para acesso.",
      "O usuário declara possuir capacidade legal para contratar a plataforma e se responsabiliza por todas as atividades realizadas em sua conta, inclusive por acessos concedidos a colaboradores, parceiros ou terceiros sob sua gestão.",
    ],
  },
  {
    title: "3. Dados de clientes e responsabilidade do profissional",
    paragraphs: [
      "Ao cadastrar dados de clientes na plataforma, o usuário declara que possui base legal adequada para tratar essas informações, incluindo, quando necessário, consentimento, execução de contrato, exercício regular de direitos ou outra hipótese válida prevista na LGPD.",
      "Nos casos em que o usuário insere ou gerencia dados dos seus próprios clientes, o profissional ou estabelecimento atua como controlador desses dados, enquanto o Agenda GenZ atua, em regra, como operador da plataforma, tratando as informações de acordo com as instruções legítimas do usuário e com as necessidades técnicas do serviço.",
    ],
    note:
      "O usuário é responsável pela qualidade, legitimidade e atualização dos dados que inserir na plataforma, bem como por atender solicitações dos titulares quando a lei atribuir essa responsabilidade ao controlador.",
  },
  {
    title: "4. Agendamentos, comunicações e relacionamento com clientes",
    paragraphs: [
      "A plataforma pode disponibilizar recursos para organizar agendamentos, confirmar horários, registrar faltas, controlar sinal, armazenar observações e apoiar comunicações operacionais com clientes.",
      "Quando o usuário utilizar mensagens, lembretes ou qualquer forma de contato com clientes, caberá a ele garantir que a comunicação tenha fundamento legal, respeite as preferências do cliente e não viole normas de privacidade, publicidade, telecomunicações ou defesa do consumidor.",
    ],
  },
  {
    title: "5. Planos, cobranças e pagamentos",
    paragraphs: [
      "O Agenda GenZ pode oferecer funcionalidades gratuitas, períodos promocionais, teste gratuito e também funcionalidades pagas, conforme as condições comerciais informadas no momento da contratação.",
      "Quando houver cobrança, os valores, prazos, benefícios, renovações, formas de pagamento e eventuais regras de cancelamento serão apresentados antes da conclusão da compra. Alguns pagamentos podem ser processados por parceiros especializados, inclusive via PIX.",
      "A falta de pagamento de funcionalidades contratadas pode resultar na limitação, suspensão ou cancelamento de recursos pagos, sem prejuízo da cobrança de valores devidos nos termos da legislação aplicável.",
    ],
  },
  {
    title: "6. Conteúdos, imagens e uploads",
    paragraphs: [
      "O usuário pode armazenar imagens, fotos de perfil, registros visuais de antes e depois, anotações e outros conteúdos relacionados à sua operação, desde que possua direitos, autorizações e bases legais suficientes para tanto.",
      "É vedado inserir conteúdos ilícitos, ofensivos, discriminatórios, enganosos, que violem direitos de terceiros ou que exponham dados pessoais sem justificativa adequada.",
    ],
  },
  {
    title: "7. Uso permitido e condutas proibidas",
    paragraphs: [
      "O usuário concorda em utilizar a plataforma de boa-fé, em conformidade com a lei, com estes Termos e com a finalidade profissional a que o Agenda GenZ se destina.",
    ],
    items: [
      "usar a plataforma para práticas ilegais, fraudulentas ou abusivas",
      "coletar ou tratar dados pessoais sem base legal adequada",
      "enviar spam, assédio, mensagens indevidas ou conteúdo ofensivo a clientes",
      "tentar acessar contas, dados, sistemas ou ambientes sem autorização",
      "copiar, explorar, revender, desmontar ou tentar contornar medidas técnicas da plataforma sem permissão",
    ],
  },
  {
    title: "8. Propriedade intelectual",
    paragraphs: [
      "A estrutura da plataforma, seu software, interface, identidade visual, marcas, textos, organização de banco de dados, códigos e demais elementos protegidos pertencem ao Agenda GenZ ou aos respectivos titulares de direitos, sendo vedado seu uso sem autorização, salvo nos limites permitidos por lei.",
      "Nenhuma disposição destes Termos transfere ao usuário direitos de propriedade intelectual sobre a plataforma, exceto a licença limitada, revogável, não exclusiva e intransferível de uso durante a vigência da conta e conforme estes Termos.",
    ],
  },
  {
    title: "9. Disponibilidade, evolução do produto e suporte",
    paragraphs: [
      "O Agenda GenZ busca manter a plataforma disponível, segura e em constante evolução, mas não garante funcionamento ininterrupto, ausência total de falhas, compatibilidade absoluta com todos os dispositivos ou disponibilidade permanente de todas as funcionalidades.",
      "Podemos realizar manutenções, atualizações, mudanças de interface, melhorias de segurança, ajustes de funcionalidades e descontinuações parciais ou totais, inclusive para adequação legal, técnica ou comercial.",
    ],
  },
  {
    title: "10. Limitação de responsabilidade",
    paragraphs: [
      "Dentro dos limites permitidos por lei, o Agenda GenZ não responde por prejuízos decorrentes de informações inseridas pelo usuário, condutas de clientes finais, cancelamentos, faltas, erros operacionais do próprio profissional, indisponibilidades de terceiros, falhas de conectividade, uso inadequado da conta ou descumprimento de obrigações legais pelo usuário.",
      "A plataforma também não se responsabiliza pelo resultado dos serviços de beleza prestados, pela relação comercial mantida entre profissional e cliente, nem por promessas, políticas comerciais ou condições de atendimento definidas pelo usuário fora da plataforma.",
    ],
  },
  {
    title: "11. Suspensão, cancelamento e encerramento",
    paragraphs: [
      "O Agenda GenZ poderá suspender ou encerrar contas, limitar acessos ou bloquear funcionalidades em caso de violação destes Termos, uso ilícito, risco à segurança, fraude, inadimplência relacionada a serviços pagos, ordem legal ou necessidade técnica relevante.",
      "O usuário pode solicitar o encerramento da conta a qualquer momento, observadas as obrigações pendentes, os prazos de retenção legalmente exigidos e as regras de tratamento de dados descritas na Política de Privacidade.",
    ],
  },
  {
    title: "12. Privacidade, LGPD e legislação aplicável",
    paragraphs: [
      "O tratamento de dados pessoais relacionado ao uso do Agenda GenZ segue a Política de Privacidade da plataforma, que complementa estes Termos e deve ser lida em conjunto com este documento.",
      "Estes Termos são regidos pela legislação brasileira. As partes se comprometem a buscar, sempre que possível, uma solução amigável para eventuais divergências antes da adoção das medidas cabíveis.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description:
    "Conheça as condições de uso do Agenda GenZ para agendamento, cadastro de clientes e gestão de serviços na área da beleza.",
  alternates: {
    canonical: "/termos-de-servico",
  },
  openGraph: {
    title: "Termos de Serviço | Agenda GenZ",
    description:
      "Condições de uso da plataforma Agenda GenZ para profissionais da beleza, com foco em agendamentos, clientes e serviços.",
    url: "/termos-de-servico",
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      badge="Documento jurídico"
      title="Termos de Serviço"
      description="Estas condições regulam o uso do Agenda GenZ por profissionais e estabelecimentos da área da beleza que utilizam a plataforma para organizar clientes, horários, serviços, registros operacionais e recursos relacionados ao negócio."
      updatedAt={updatedAt}
      currentPath="/termos-de-servico"
      sections={sections}
    />
  );
}
