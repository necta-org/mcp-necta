import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "../utils/api.js";
import { formatHttpError } from "../utils/errors.js";

export function registerTrackingTools(server: McpServer) {
  server.tool(
    "updateTracking",
    "Atualiza o status de rastreio/entrega de uma transacao. Usado para informar o status de envio de produtos fisicos.",
    {
      financialTransactionId: z.string().describe("ULID da transacao"),
      status: z.enum([
        "PENDING_SHIPMENT", "SHIPPED", "IN_TRANSIT",
        "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "LOST",
      ]).describe("Status de rastreio"),
      trackingNumber: z.string().max(120).optional().describe("Codigo de rastreio (max 120 chars)"),
      service: z.string().max(60).optional().describe("Transportadora (max 60 chars)"),
    },
    async ({ financialTransactionId, ...body }) => {
      try {
        await makeRequest({
          method: "PATCH",
          path: `/transaction/${financialTransactionId}/tracking`,
          body: body as Record<string, unknown>,
        });

        let text = `## Rastreio Atualizado\n\n`;
        text += `- **Transacao:** ${financialTransactionId}\n`;
        text += `- **Status:** ${body.status}\n`;
        if (body.trackingNumber) text += `- **Codigo de Rastreio:** ${body.trackingNumber}\n`;
        if (body.service) text += `- **Transportadora:** ${body.service}\n`;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao atualizar rastreio: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );
}
