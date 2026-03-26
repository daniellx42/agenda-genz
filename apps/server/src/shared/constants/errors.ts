export const Errors = {
  AUTH: {
    UNAUTHORIZED: {
      code: "UNAUTHORIZED",
      message: "Não autorizado",
      httpStatus: 401,
    },
    FORBIDDEN: {
      code: "FORBIDDEN",
      message: "Acesso negado",
      httpStatus: 403,
    },
  },

  ACCOUNT: {
    PROFILE_IMAGE_UNAUTHORIZED_KEY: {
      code: "ACCOUNT_PROFILE_IMAGE_UNAUTHORIZED_KEY",
      message: "Acesso negado a esta foto de perfil",
      httpStatus: 403,
    },
  },

  CLIENT: {
    NOT_FOUND: {
      code: "CLIENT_NOT_FOUND",
      message: "Cliente não encontrado",
      httpStatus: 404,
    },
    PROFILE_IMAGE_NOT_FOUND: {
      code: "CLIENT_PROFILE_IMAGE_NOT_FOUND",
      message: "Foto de perfil não encontrada",
      httpStatus: 404,
    },
    PHONE_REQUIRED: {
      code: "CLIENT_PHONE_REQUIRED",
      message: "Telefone é obrigatório",
      httpStatus: 400,
    },
    INVALID_BIRTH_DATE: {
      code: "CLIENT_INVALID_BIRTH_DATE",
      message: "Data de nascimento inválida",
      httpStatus: 400,
    },
  },

  SERVICE: {
    NOT_FOUND: {
      code: "SERVICE_NOT_FOUND",
      message: "Serviço não encontrado",
      httpStatus: 404,
    },
    IN_USE: {
      code: "SERVICE_IN_USE",
      message: "Serviço possui agendamentos e não pode ser removido",
      httpStatus: 409,
    },
  },

  TIME_SLOT: {
    NOT_FOUND: {
      code: "TIME_SLOT_NOT_FOUND",
      message: "Horário não encontrado",
      httpStatus: 404,
    },
    ALREADY_EXISTS: {
      code: "TIME_SLOT_ALREADY_EXISTS",
      message: "Esse horário já está cadastrado para este dia",
      httpStatus: 409,
    },
    IN_USE: {
      code: "TIME_SLOT_IN_USE",
      message: "Horário possui agendamentos e não pode ser removido",
      httpStatus: 409,
    },
    BLOCK_ALREADY_EXISTS: {
      code: "TIME_SLOT_BLOCK_ALREADY_EXISTS",
      message: "Esse horário já está bloqueado para a data selecionada",
      httpStatus: 409,
    },
    BLOCK_DATE_MISMATCH: {
      code: "TIME_SLOT_BLOCK_DATE_MISMATCH",
      message: "Selecione uma data compatível com o dia deste horário",
      httpStatus: 400,
    },
    BLOCK_HAS_APPOINTMENT: {
      code: "TIME_SLOT_BLOCK_HAS_APPOINTMENT",
      message: "Não foi possível bloquear. Existe um agendamento para este horário na data selecionada",
      httpStatus: 409,
    },
    BLOCK_NOT_FOUND: {
      code: "TIME_SLOT_BLOCK_NOT_FOUND",
      message: "Não existe bloqueio para esta data",
      httpStatus: 404,
    },
    INVALID_TIME_FORMAT: {
      code: "TIME_SLOT_INVALID_FORMAT",
      message: "Formato de horário inválido. Use HH:MM",
      httpStatus: 400,
    },
  },

  UPLOAD: {
    INVALID_TYPE: {
      code: "UPLOAD_INVALID_TYPE",
      message: "Tipo de arquivo inválido. Apenas imagens são permitidas",
      httpStatus: 400,
    },
    UNAUTHORIZED_KEY: {
      code: "UPLOAD_UNAUTHORIZED_KEY",
      message: "Acesso negado a este arquivo",
      httpStatus: 403,
    },
  },

  APPOINTMENT: {
    NOT_FOUND: {
      code: "APPOINTMENT_NOT_FOUND",
      message: "Agendamento não encontrado",
      httpStatus: 404,
    },
    SLOT_UNAVAILABLE: {
      code: "APPOINTMENT_SLOT_UNAVAILABLE",
      message: "Este horário já está reservado para esta data",
      httpStatus: 409,
    },
    INVALID_DATE: {
      code: "APPOINTMENT_INVALID_DATE",
      message: "Data inválida",
      httpStatus: 400,
    },
    SHARE_RANGE_TOO_LARGE: {
      code: "APPOINTMENT_SHARE_RANGE_TOO_LARGE",
      message: "Selecione no máximo 7 dias para compartilhar",
      httpStatus: 400,
    },
    IMAGE_NOT_FOUND: {
      code: "APPOINTMENT_IMAGE_NOT_FOUND",
      message: "Imagem não encontrada neste agendamento",
      httpStatus: 404,
    },
    INVALID_STATUS_TRANSITION: {
      code: "APPOINTMENT_INVALID_STATUS",
      message: "Transição de status inválida",
      httpStatus: 400,
    },
  },
  BILLING: {
    PLAN_NOT_FOUND: {
      code: "BILLING_PLAN_NOT_FOUND",
      message: "Plano não encontrado",
      httpStatus: 404,
    },
    PLAN_INACTIVE: {
      code: "BILLING_PLAN_INACTIVE",
      message: "Plano não está disponível",
      httpStatus: 400,
    },
    PAYMENT_NOT_FOUND: {
      code: "BILLING_PAYMENT_NOT_FOUND",
      message: "Pagamento não encontrado",
      httpStatus: 404,
    },
    PAYMENT_ALREADY_PROCESSED: {
      code: "BILLING_PAYMENT_ALREADY_PROCESSED",
      message: "Pagamento já processado",
      httpStatus: 409,
    },
    PAYMENT_CREATION_FAILED: {
      code: "BILLING_PAYMENT_CREATION_FAILED",
      message: "Erro ao criar pagamento PIX",
      httpStatus: 502,
    },
    PAYMENT_CANCELLATION_FAILED: {
      code: "BILLING_PAYMENT_CANCELLATION_FAILED",
      message: "Não foi possível invalidar o PIX anterior",
      httpStatus: 502,
    },
    PAYMENT_STATUS_SYNC_FAILED: {
      code: "BILLING_PAYMENT_STATUS_SYNC_FAILED",
      message: "Não foi possível verificar o pagamento agora",
      httpStatus: 502,
    },
    PLAN_EXPIRED: {
      code: "BILLING_PLAN_EXPIRED",
      message: "Plano expirado. Renove sua assinatura.",
      httpStatus: 402,
    },
    WEBHOOK_INVALID_SIGNATURE: {
      code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
      message: "Assinatura inválida",
      httpStatus: 401,
    },
  },

  REFERRAL: {
    CODE_NOT_FOUND: {
      code: "REFERRAL_CODE_NOT_FOUND",
      message: "Código de convite inválido",
      httpStatus: 404,
    },
    SELF_REFERRAL_FORBIDDEN: {
      code: "REFERRAL_SELF_REFERRAL_FORBIDDEN",
      message: "Você não pode usar o seu próprio código",
      httpStatus: 400,
    },
    PROMPT_ALREADY_COMPLETED: {
      code: "REFERRAL_PROMPT_ALREADY_COMPLETED",
      message: "Você já concluiu o fluxo de código de convite",
      httpStatus: 409,
    },
    WITHDRAWAL_INVALID_AMOUNT: {
      code: "REFERRAL_WITHDRAWAL_INVALID_AMOUNT",
      message: "Informe um valor de saque válido",
      httpStatus: 400,
    },
    WITHDRAWAL_MIN_AMOUNT: {
      code: "REFERRAL_WITHDRAWAL_MIN_AMOUNT",
      message: "O valor mínimo de saque é R$ 100,00",
      httpStatus: 400,
    },
    WITHDRAWAL_INVALID_PIX_KEY: {
      code: "REFERRAL_WITHDRAWAL_INVALID_PIX_KEY",
      message: "Informe uma chave Pix válida",
      httpStatus: 400,
    },
    WITHDRAWAL_NOT_FOUND: {
      code: "REFERRAL_WITHDRAWAL_NOT_FOUND",
      message: "Solicitação de saque não encontrada",
      httpStatus: 404,
    },
    WITHDRAWAL_INSUFFICIENT_BALANCE: {
      code: "REFERRAL_WITHDRAWAL_INSUFFICIENT_BALANCE",
      message: "Saldo insuficiente para solicitar este saque",
      httpStatus: 409,
    },
  },
} as const;

export type ErrorCode =
  | (typeof Errors.AUTH)[keyof typeof Errors.AUTH]["code"]
  | (typeof Errors.ACCOUNT)[keyof typeof Errors.ACCOUNT]["code"]
  | (typeof Errors.CLIENT)[keyof typeof Errors.CLIENT]["code"]
  | (typeof Errors.SERVICE)[keyof typeof Errors.SERVICE]["code"]
  | (typeof Errors.TIME_SLOT)[keyof typeof Errors.TIME_SLOT]["code"]
  | (typeof Errors.APPOINTMENT)[keyof typeof Errors.APPOINTMENT]["code"]
  | (typeof Errors.UPLOAD)[keyof typeof Errors.UPLOAD]["code"]
  | (typeof Errors.BILLING)[keyof typeof Errors.BILLING]["code"]
  | (typeof Errors.REFERRAL)[keyof typeof Errors.REFERRAL]["code"];
