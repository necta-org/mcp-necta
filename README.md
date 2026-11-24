# Necta MCP Server

Um servidor MCP (Model Context Protocol) para integração com a API da [Necta](https://necta.com.br), permitindo gerenciar pagamentos, transações, estornos, rastreio de entregas e saldo diretamente através de assistentes de IA como Claude e Cursor.

## O que você pode fazer

- **Criar pagamentos**: PIX, Cartão de Crédito e Boleto
- **Gerenciar transações**: Listar, buscar detalhes e estornar
- **Rastreio de entregas**: Atualizar status de envio de produtos físicos
- **Consultar saldo**: Saldo disponível e reservado da empresa
- **Validar API Key**: Verificar se a chave está correta e ver dados da empresa

## Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/necta-org/mcp-necta.git
cd mcp-necta
npm install
npm run build
```

### 2. Configure no Claude Desktop

Abra o arquivo de configuração `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Adicione a configuração:

```json
{
  "mcpServers": {
    "necta": {
      "command": "node",
      "args": ["/caminho/completo/para/mcp-necta/dist/index.js"],
      "env": {
        "necta_API_KEY": "sua-api-key-aqui"
      }
    }
  }
}
```

### 3. Configure no Cursor

Adicione ao `.cursor/mcp.json` do seu projeto ou nas configurações globais:

```json
{
  "mcpServers": {
    "necta": {
      "command": "node",
      "args": ["/caminho/completo/para/mcp-necta/dist/index.js"],
      "env": {
        "necta_API_KEY": "sua-api-key-aqui"
      }
    }
  }
}
```

**Importante**: Substitua `/caminho/completo/para/mcp-necta/` pelo caminho real onde você clonou o repositório.

## Como obter sua API Key

1. Acesse [Necta](https://app.necta.com.br)
2. Vá em **Configurações** → **API Keys**
3. Copie sua API Key

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

### Criar um pagamento PIX
```
"Crie um pagamento PIX de R$ 50,00 para o cliente João, email joao@email.com, CPF 12345678901"
```

### Consultar transações
```
"Liste as transações pagas de hoje"
```

### Verificar saldo
```
"Qual o saldo disponível da minha conta?"
```

### Estornar uma transação
```
"Estorne a transação 01JXYZ..."
```

### Atualizar rastreio
```
"Atualize o rastreio da transação para SHIPPED com código AB123456789BR"
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Watch mode
npm run dev

# Rodar localmente
NECTA_API_KEY=sua-key node dist/index.js
```
