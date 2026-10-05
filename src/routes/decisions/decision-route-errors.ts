import { errorResponseSchema } from "../../schemas/shared/index.js";

const errorContent = { "application/json": { schema: errorResponseSchema } };

export const mutationErrors = {
  401: { description: "Token inválido" },
  404: {
    description: "Decisão ou recurso não encontrado",
    content: errorContent,
  },
  409: { description: "Estado da decisão incompatível", content: errorContent },
  422: { description: "Entrada inválida", content: errorContent },
} as const;
