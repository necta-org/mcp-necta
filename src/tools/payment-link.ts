import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "../utils/api.js";
import { formatHttpError } from "../utils/errors.js";
import { formatCurrency } from "../utils/formatters.js";

interface PaymentLink {
  id: string;
  name: string;
  slug: string;
  url: string;
  amountInCents: number;
  pixEnabled: boolean;
  creditCardEnabled: boolean;
  maxInstallments: number;
  maxInterestFreeInstallments: number;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentLinkListResponse {
  total: number;
  data: PaymentLink[];
}

export function registerPaymentLinkTools(server: McpServer) {
  server.tool(
    "listPaymentLinks",
    "Lista os links de pagamento da empresa com paginacao e busca. Retorna nome, URL, valor, metodos de pagamento habilitados e status.",
    {
      page: z.number().min(1).optional().describe("Pagina (padrao: 1)"),
      limit: z.number().min(1).max(40).optional().describe("Limite por pagina (padrao: 10, maximo: 40)"),
      search: z.string().optional().describe("Busca por nome do link (parcial, case-insensitive)"),
    },
    async (params) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (params.page !== undefined) query.page = String(params.page);
        if (params.limit !== undefined) query.limit = String(params.limit);
        if (params.search !== undefined) query.search = params.search;

        const result = await makeRequest<PaymentLinkListResponse>({
          method: "GET",
          path: "/public-api/payment-link",
          query,
        });

        const items = result.data || [];

        let text = `## Links de Pagamento\n\n`;
        text += `**Total:** ${result.total} link(s)\n\n`;

        if (items.length === 0) {
          text += "Nenhum link de pagamento encontrado.\n";
        } else {
          for (const [i, link] of items.entries()) {
            const methods = [
              link.pixEnabled ? "PIX" : null,
              link.creditCardEnabled ? "Cartao" : null,
            ].filter(Boolean).join(", ");

            text += `${i + 1}. **${link.name}** | ${formatCurrency(link.amountInCents)} | ${methods} | ${link.isActive ? "Ativo" : "Inativo"}\n`;
            text += `   URL: ${link.url}\n`;
          }
        }

        text += `\n### Resposta Completa\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao listar links de pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "findPaymentLink",
    "Busca detalhes de um link de pagamento por ID. Retorna nome, slug, URL, valor, metodos habilitados, parcelas e status.",
    {
      paymentLinkId: z.string().describe("ID do link de pagamento"),
    },
    async ({ paymentLinkId }) => {
      try {
        const result = await makeRequest<PaymentLink>({
          method: "GET",
          path: `/public-api/payment-link/${paymentLinkId}`,
        });

        const methods = [
          result.pixEnabled ? "PIX" : null,
          result.creditCardEnabled ? "Cartao" : null,
        ].filter(Boolean).join(", ");

        let text = `## Link de Pagamento\n\n`;
        text += `- **ID:** ${result.id}\n`;
        text += `- **Nome:** ${result.name}\n`;
        text += `- **Slug:** ${result.slug}\n`;
        text += `- **URL:** ${result.url}\n`;
        text += `- **Valor:** ${formatCurrency(result.amountInCents)}\n`;
        text += `- **Metodos:** ${methods}\n`;
        text += `- **Parcelas:** ate ${result.maxInstallments}x (${result.maxInterestFreeInstallments}x sem juros)\n`;
        text += `- **Status:** ${result.isActive ? "Ativo" : "Inativo"}\n`;
        text += `- **Criado em:** ${result.createdAt}\n`;
        text += `- **Atualizado em:** ${result.updatedAt}\n`;
        text += `\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao buscar link de pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "createPaymentLink",
    "Cria um link de pagamento. Precisa de pelo menos um metodo de pagamento habilitado (PIX ou Cartao). maxInterestFreeInstallments deve ser <= maxInstallments.",
    {
      name: z.string().max(60).describe("Nome interno do link (max 60 chars, unico por empresa, nao exibido ao comprador)"),
      amountInCents: z.number().min(100).max(100000000).describe("Valor em centavos (R$150 = 15000, minimo 100)"),
      pixEnabled: z.boolean().describe("Habilitar pagamento via PIX"),
      creditCardEnabled: z.boolean().describe("Habilitar pagamento via cartao de credito"),
      maxInstallments: z.number().min(1).max(12).describe("Maximo de parcelas no cartao (1-12)"),
      maxInterestFreeInstallments: z.number().min(1).max(12).describe("Parcelas sem juros (1-12, deve ser <= maxInstallments)"),
      isActive: z.boolean().describe("Link aceita pagamentos se true"),
    },
    async (params) => {
      try {
        const result = await makeRequest<Record<string, unknown>>({
          method: "POST",
          path: "/public-api/payment-link",
          body: params as Record<string, unknown>,
        });

        let text = `## Link de Pagamento Criado\n\n`;
        text += `- **Nome:** ${params.name}\n`;
        text += `- **Valor:** ${formatCurrency(params.amountInCents)}\n`;
        text += `- **PIX:** ${params.pixEnabled ? "Sim" : "Nao"}\n`;
        text += `- **Cartao:** ${params.creditCardEnabled ? "Sim" : "Nao"}\n`;
        text += `- **Parcelas:** ate ${params.maxInstallments}x (${params.maxInterestFreeInstallments}x sem juros)\n`;
        text += `- **Ativo:** ${params.isActive ? "Sim" : "Nao"}\n`;
        text += `\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao criar link de pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "togglePaymentLink",
    "Ativa ou desativa um link de pagamento. Inverte o estado atual do link (ativo -> inativo, inativo -> ativo).",
    {
      paymentLinkId: z.string().describe("ID do link de pagamento"),
      isActive: z.boolean().describe("true para ativar, false para desativar"),
    },
    async ({ paymentLinkId, isActive }) => {
      try {
        const result = await makeRequest<{ isActive: boolean }>({
          method: "PATCH",
          path: `/public-api/payment-link/${paymentLinkId}/toggle-active`,
          body: { isActive } as Record<string, unknown>,
        });

        let text = `## Link de Pagamento Atualizado\n\n`;
        text += `- **ID:** ${paymentLinkId}\n`;
        text += `- **Status:** ${result.isActive ? "Ativo" : "Inativo"}\n`;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao ativar/desativar link de pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "deletePaymentLink",
    "Exclui um link de pagamento (exclusao logica). O link para de aceitar pagamentos e nao pode ser restaurado. Transacoes existentes nao sao afetadas.",
    {
      paymentLinkId: z.string().describe("ID do link de pagamento a ser excluido"),
    },
    async ({ paymentLinkId }) => {
      try {
        await makeRequest({
          method: "DELETE",
          path: `/public-api/payment-link/${paymentLinkId}`,
        });

        let text = `## Link de Pagamento Excluido\n\n`;
        text += `- **ID:** ${paymentLinkId}\n`;
        text += `- **Status:** Excluido com sucesso\n`;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao excluir link de pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );
}
