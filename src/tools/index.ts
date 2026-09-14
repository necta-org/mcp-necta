import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPaymentTools } from "./payment.js";
import { registerTransactionTools } from "./transaction.js";
import { registerTrackingTools } from "./tracking.js";
import { registerCompanyTools } from "./company.js";
import { registerPaymentLinkTools } from "./payment-link.js";

export function registerAllTools(server: McpServer) {
  registerPaymentTools(server);
  registerTransactionTools(server);
  registerTrackingTools(server);
  registerCompanyTools(server);
  registerPaymentLinkTools(server);
}
