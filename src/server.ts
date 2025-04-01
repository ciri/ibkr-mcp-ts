import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IBApi, EventName, ErrorCode, Contract } from '@stoqey/ib';
import { z } from 'zod';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

const GET_POSITIONS_TOOL: Tool = {
  name: "getPositions",
  description: "Retrieves current account positions from IBKR.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Initialize the MCP server
const server = new Server(
  {
    name: 'IBKRServer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Initialize the IBKR API client
const ib = new IBApi({ port: 4001 }); 

// Connect to IBKR TWS or IB Gateway
ib.connect();

// Handle connection errors
ib.on(EventName.error, (err: Error, code: ErrorCode, reqId: number) => {
  console.error(`Error: ${err.message} - Code: ${code} - ReqId: ${reqId}`);
});

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [GET_POSITIONS_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name } = request.params;

    if (name !== "getPositions") {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    const positions: string[] = [];
    positions.push("| type | symbol | position | avg cost | market value | PnL | PnL% |");
    positions.push("|---|---|---|---|---|---|---|");

    ib.on(EventName.position, (account, contract:Contract, pos:number, avgCost?:number) => {
      positions.push(
        `| ${contract.secType} | ${contract.symbol} | ${pos} | ${avgCost || 0} | N/A | N/A | N/A | Account: ${account}`
      );
    });

    ib.once(EventName.positionEnd, () => {
      return {
        content: [{ type: 'text', text: positions.join('\n') }],
        isError: false
      }
    });

    ib.reqPositions();

    return new Promise((resolve) => {
      ib.once(EventName.positionEnd, () => {
        resolve({ content: [{ type: 'text', text: positions.join('\n') }] });
      });
    });
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Set up the transport layer
const transport = new StdioServerTransport();

// Connect the server to the transport
server.connect(transport).catch(console.error);
