import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeRequest } from "../utils/api.js";
import { formatHttpError } from "../utils/errors.js";
import { formatCurrency } from "../utils/formatters.js";
                               
export function registerCompanyTools(server: McpServer) {
  server.tool(
    "getBalance",
    "Consulta o saldo disponivel e reservado da empresa. A empresa e identificada automaticamente pela API key.",
    {},
    async () => {
      try {
        const result = await makeRequest<Record<string, unknown>>({
          method: "GET",
          path: "/company/balance",
        });

        const available = typeof result.available === "number" ? result.available : 0;
        const reserved = typeof result.reserved === "number" ? result.reserved : 0;

        let text = `## Saldo da Empresa\n\n`;
        text += `- **Disponivel:** ${formatCurrency(available)}\n`;
        text += `- **Reservado:** ${formatCurrency(reserved)}\n`;
        text += `\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao consultar saldo: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );

  server.tool(
    "validateApiKey",
    "Valida a API key configurada e retorna dados basicos da empresa vinculada.",
    {},
    async () => {
      try {
        const result = await makeRequest<Record<string, unknown>>({
          method: "GET",
          path: "/company/validate-api-key",
        });

        let text = `## API Key Valida\n\n`;
        text += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Erro ao validar API key: ${formatHttpError(error)}` }], isError: true };
      }
    }
  );
}
