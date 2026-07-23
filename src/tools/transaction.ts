import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "../utils/api.js";
import { formatHttpError } from "../utils/errors.js";
import { formatCurrency } from "../utils/formatters.js";

const TransactionStatusEnum = z.enum([
  "AUTHORIZED", "CANCELED", "CHARGEBACK", "EXPIRED", "UNDER_REVIEW",
  "IN_DISPUTE", "DISPUTE_ACCEPTED", "DISPUTE_REJECTED", "DISPUTE_CANCELED",
  "PAID", "PENDING", "REFUNDED", "REJECTED",
]);

const TrackingStatusEnum = z.enum([
  "PENDING_SHIPMENT", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY",
  "DELIVERED", "RETURNED", "LOST",
]);

export function registerTransactionTools(server: McpServer) {
  server.tool(
    "listTransactions",
    "Lista transacoes com filtros e paginacao. Permite filtrar por status, metodo de pagamento, cliente, datas e valores.",
    {
      page: z.number().optional().describe("Pagina (paginacao)"),
      limit: z.number().optional().describe("Limite por pagina"),
      transactionId: z.string().optional().describe("ULID da transacao"),
      pixEndToEndId: z.string().optional().describe("ID Pix end-to-end"),
      status: z.array(TransactionStatusEnum).optional().describe("Filtrar por status"),
      trackingStatus: z.array(TrackingStatusEnum).optional().describe("Filtrar por status de rastreio"),
      isRejected: z.boolean().optional().describe("Filtrar rejeitadas"),
      isPreChargebackRefund: z.boolean().optional().describe("Filtrar pre-chargeback refund"),
      orderByPaymentDate: z.boolean().optional().describe("Ordenar por data de pagamento"),
      customerName: z.string().optional().describe("Nome do cliente"),
      customerEmail: z.string().optional().describe("Email do cliente"),
      customerPhone: z.string().optional().describe("Telefone do cliente"),
      customerCpfCnpj: z.string().optional().describe("CPF/CNPJ do cliente"),
      cardLastDigits: z.string().optional().describe("4 ultimos digitos do cartao"),
      cardBrand: z.enum(["VISA", "MASTERCARD", "ELO", "AMEX"]).optional().describe("Bandeira do cartao"),
      method: z.array(z.enum(["PIX", "CREDIT_CARD", "BOLETO"])).optional().describe("Metodos de pagamento"),
      amountFrom: z.number().optional().describe("Valor minimo em centavos"),
      amountTo: z.number().optional().describe("Valor maximo em centavos"),
      installmentsAmount: z.array(z.number()).optional().describe("Filtrar por numero de parcelas (1-12)"),
      acquirer: z.array(z.enum(["IUGU", "WOOVI", "SEVEN_TRUST", "PAGARME"])).optional().describe("Filtrar por adquirente"),
      createdFrom: z.string().optional().describe("Data criacao inicio (ISO 8601)"),
      createdTo: z.string().optional().describe("Data criacao fim (ISO 8601)"),
      paymentConfirmedFrom: z.string().optional().describe("Data confirmacao inicio (ISO 8601)"),
      paymentConfirmedTo: z.string().optional().describe("Data confirmacao fim (ISO 8601)"),
      updatedFrom: z.string().optional().describe("Data atualizacao inicio (ISO 8601)"),
      updatedTo: z.string().optional().describe("Data atualizacao fim (ISO 8601)"),
      refundedFrom: z.string().optional().describe("Data estorno inicio (ISO 8601)"),
      refundedTo: z.string().optional().describe("Data estorno fim (ISO 8601)"),
    },
    async (params) => {
      try {
        const query: Record<string, string | string[] | undefined> = {};

        for (const [key, value] of Object.entries(params)) {
          if (value === undefined) continue;
          if (Array.isArray(value)) {
            query[key] = value.map(String);
          } else {
            query[key] = String(value);
          }
        }

        const result = await makeRequest<Record<string, unknown>>({
          method: "GET",
          path: "/transaction",
          query,
        });

        const data = (result.data || result.items || result) as Record<string, unknown>[];
        const items = Array.isArray(data) ? data : [];

        let text = `## Transacoes\n\n`;
        text += `**Total:** ${result.total || items.length} transacao(oes)\n\n`;

        if (items.length === 0) {
          text += "Nenhuma transacao encontrada com os filtros informados.\n";
        } else {
          for (const [i, tx] of items.entries()) {
            const amount = typeof tx.amountInCents === "number" ? formatCurrency(tx.amountInCents as number) : "N/A";
            text += `${i + 1}. **#${tx.id}** | ${tx.paymentMethod || "N/A"} | ${amount} | ${tx.status || "N/A"} | ${tx.customerName || "N/A"}\n`;
          }
        }

        text += `\n### Resposta Completa\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao listar transacoes: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "findTransaction",
    "Busca detalhes completos de uma transação por ID. Retorna status, metodo, cliente, endereco, pagamento, rastreio, metadata, etc.",
    {
      financialTransactionId: z.string().describe("ULID da transacao"),
    },
    async ({ financialTransactionId }) => {
      try {
        const result = await makeRequest<Record<string, unknown>>({
          method: "GET",
          path: `/transaction/${financialTransactionId}`,
        });

        let text = `## Transacao ${financialTransactionId}\n\n`;
        text += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao buscar transacao: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "refundTransaction",
    "Estorna uma transacao. A transacao precisa estar com status PAID para ser estornada. Retorna HTTP 202 (Accepted).",
    {
      financialTransactionId: z.string().describe("ULID da transacao a ser estornada"),
    },
    async ({ financialTransactionId }) => {
      try {
        const result = await makeRequest<Record<string, unknown>>({
          method: "POST",
          path: `/transaction/${financialTransactionId}/refund`,
        });

        let text = `## Estorno Solicitado\n\n`;
        text += `- **Transacao:** ${financialTransactionId}\n`;
        text += `- **Status:** Aceito (HTTP 202)\n`;
        text += `\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao estornar transacao: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );
}
