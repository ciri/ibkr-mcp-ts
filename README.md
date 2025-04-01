# IBKR MCP Server

This is an example MCP server that retrieves account positions from IBKR.

## Prerequisites

*   Node.js
*   An IBKR account with API access enabled, a desktop running either IBKR Gateway or TWS
*   MCPHost ([https://github.com/mark3labs/mcphost](https://github.com/mark3labs/mcphost))
*   Ollama ([https://ollama.com/](https://ollama.com/))

## Installation


1.  Clone this repository:

    ```bash
    git clone [repository URL]
    cd ibkr-mcp-ts
    npm install
    ```

2.  Configure your IBKR connection:

    *   Edit the `server.ts` file to set the correct port for your IBKR TWS (7496) or IB Gateway (4001).

3.  Set up MCPHost:

    ```bash
    go install github.com/mark3labs/mcphost@latest
    ```

4.  Configure Ollama:

    ```bash
    ollama pull qwen2.5
    ollama serve
    ```

## Running the Server

Start MCPHost with the configuration file:

```bash
mcphost -m ollama:qwen2.5 --config  ./config.json
```

## MCP Configuration

Add the following to your MCP configuration file (`config.json`):

```json
{
  "mcpServers": {
    
    "ibkr": {
      "command": "node",
      "args": ["/path/to/ibkr-mcp-ts/dist/server.js"],
      "env": {}
    }
  }
}
```

**Note:** Replace `/path/to/ibkr-mcp-ts/dist/server.js` with the actual path to the `server.js` file.

## Disclaimer

This is an example implementation and may require further configuration and adjustments to work correctly in your environment. You probably want to try this with your paper trading account first or ensure you only allow read access to the API.