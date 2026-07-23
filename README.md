# bestfy-mcp

MCP Server para a API de pagamentos da [Bestfy](https://bestfy.io). Permite gerenciar pagamentos, transações, estornos, rastreio de entregas e saldo diretamente via Claude, Cursor, Windsurf e outros clientes MCP.

## Instalação

```bash
npm install -g bestfy-mcp
```

Ou use diretamente via `npx`:

```bash
npx bestfy-mcp
```

## Configuração

### Variável de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `BESTFY_API_KEY` | Sim | Sua API key da Bestfy |

### Claude Desktop

Adicione ao seu arquivo de configuração (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bestfy": {
      "command": "npx",
      "args": ["-y", "bestfy-mcp"],
      "env": {
        "BESTFY_API_KEY": "sua-api-key-aqui"
      }
    }
  }
}
```

### Cursor

Adicione ao `.cursor/mcp.json` do seu projeto ou nas configurações globais:

```json
{
  "mcpServers": {
    "bestfy": {
      "command": "npx",
      "args": ["-y", "bestfy-mcp"],
      "env": {
        "BESTFY_API_KEY": "sua-api-key-aqui"
      }
    }
  }
}
```

## Tools disponíveis

### Pagamentos

| Tool | Descrição |
|------|-----------|
| `createPayment` | Cria um pagamento (PIX, Cartão de Crédito ou Boleto) |

### Transações

| Tool | Descrição |
|------|-----------|
| `listTransactions` | Lista transações com filtros e paginação |
| `findTransaction` | Busca detalhes de uma transação por ID |
| `refundTransaction` | Estorna uma transação (status PAID) |

### Rastreio

| Tool | Descrição |
|------|-----------|
| `updateTracking` | Atualiza status de rastreio/entrega de uma transação |

### Empresa

| Tool | Descrição |
|------|-----------|
| `getBalance` | Consulta saldo disponível e reservado |
| `validateApiKey` | Valida a API key e retorna dados da empresa |

## Exemplos de uso

Depois de configurado, você pode pedir ao Claude coisas como:

- "Crie um pagamento PIX de R$ 50,00 para o cliente João"
- "Liste as transações pagas de hoje"
- "Qual o saldo disponível da minha conta?"
- "Estorne a transação 01JXYZ..."
- "Atualize o rastreio da transação para SHIPPED com código AB123456789BR"

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Watch mode
npm run dev

# Rodar localmente
BESTFY_API_KEY=sua-key node dist/index.js
```

## Licença

MIT
