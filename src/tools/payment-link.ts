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
          path: "/payment-link",
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
}
