import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "../utils/api.js";
import { formatHttpError } from "../utils/errors.js";
import { formatCurrency } from "../utils/formatters.js";

export function registerPaymentTools(server: McpServer) {
  server.tool(
    "createPayment",
    "Cria um pagamento na Bestfy. Suporta PIX, Cartao de Credito e Boleto. Retorna dados da transacao incluindo QR Code (PIX) ou link de pagamento.",
    {
      paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]).describe("Metodo de pagamento"),
      items: z.array(z.object({
        productTitle: z.string().describe("Titulo do produto"),
        description: z.string().describe("Descricao do produto"),
        quantity: z.number().min(1).describe("Quantidade (minimo 1)"),
        priceCents: z.number().min(1).describe("Preco em centavos (minimo 1)"),
        productType: z.enum(["COMMON", "DIGITAL"]).describe("Tipo: COMMON (fisico) ou DIGITAL"),
      })).describe("Lista de itens do pagamento"),
      customer: z.object({
        name: z.string().describe("Nome do cliente"),
        email: z.string().describe("Email do cliente"),
        phone: z.string().describe("Telefone (ex: 11999999999)"),
        cpfOrCnpj: z.string().describe("CPF (11 digitos) ou CNPJ (14 digitos)"),
      }).describe("Dados do cliente"),
      creditCard: z.object({
        number: z.string().describe("Numero do cartao (16 digitos)"),
        verificationValue: z.string().describe("CVV (3 digitos)"),
        firstName: z.string().describe("Primeiro nome do titular"),
        lastName: z.string().describe("Ultimo nome do titular"),
        month: z.string().describe("Mes vencimento (ex: 09)"),
        year: z.string().describe("Ano vencimento (ex: 2025)"),
        numberOfInstallments: z.number().min(1).max(12).optional().describe("Parcelas (1 a 12, padrao: 1)"),
      }).optional().describe("Dados do cartao (obrigatorio se paymentMethod = CREDIT_CARD)"),
      address: z.object({
        postalCode: z.string().describe("CEP (ex: 59127-490)"),
        neighborhood: z.string().describe("Bairro"),
        city: z.string().describe("Cidade"),
        state: z.string().describe("UF (ex: RN)"),
        streetAddress: z.string().describe("Logradouro"),
        streetNumber: z.string().describe("Numero"),
      }).optional().describe("Endereco do cliente"),
      metadata: z.string().optional().describe("JSON string com metadados (ex: '{\"key\": \"value\"}')"),
      postbackUrl: z.string().optional().describe("URL de webhook para notificacoes"),
      finalAmountInCents: z.number().min(100).optional().describe("Sobrescreve o total calculado (minimo 100 centavos)"),
      endUserIp: z.string().optional().describe("IP do cliente final (para antifraude)"),
    },
    async (params) => {
      try {
        const { endUserIp, ...body } = params;
        const headers: Record<string, string> = {};
        if (endUserIp) {
          headers["x-end-user-ip"] = endUserIp;
        }

        const result = await makeRequest<Record<string, unknown>>({
          method: "POST",
          path: "/payment",
          body: body as Record<string, unknown>,
          headers,
        });

        const totalCents = params.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
        const finalAmount = params.finalAmountInCents || totalCents;

        let text = `## Pagamento Criado\n\n`;
        text += `- **ID:** ${result.id || "N/A"}\n`;
        text += `- **Metodo:** ${params.paymentMethod}\n`;
        text += `- **Status:** ${result.status || "PENDING"}\n`;
        text += `- **Valor:** ${formatCurrency(finalAmount)}\n`;
        text += `- **Cliente:** ${params.customer.name} (${params.customer.email})\n`;

        if (result.pixQrCode || result.qrCode) {
          text += `\n### PIX Copia e Cola\n\`\`\`\n${result.pixQrCode || result.qrCode}\n\`\`\`\n`;
        }

        if (result.boletoUrl) {
          text += `\n### Boleto\n- **URL:** ${result.boletoUrl}\n`;
        }

        text += `\n### Resposta Completa\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao criar pagamento: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );
}
