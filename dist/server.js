"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const ib_1 = require("@stoqey/ib");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const GET_POSITIONS_TOOL = {
    name: "getPositions",
    description: "Retrieves current account positions from IBKR.",
    inputSchema: {
        type: "object",
        properties: {},
        required: []
    }
};
// Initialize the MCP server
const server = new index_js_1.Server({
    name: 'IBKRServer',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize the IBKR API client
const ib = new ib_1.IBApi({ port: 4001 }); // for IBKR gateway
// Connect to IBKR TWS or IB Gateway
ib.connect();
// Handle connection errors
ib.on(ib_1.EventName.error, (err, code, reqId) => {
    console.error(`Error: ${err.message} - Code: ${code} - ReqId: ${reqId}`);
});
// Tool handlers
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [GET_POSITIONS_TOOL],
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    try {
        const { name } = request.params;
        if (name !== "getPositions") {
            return {
                content: [{ type: "text", text: `Unknown tool: ${name}` }],
                isError: true,
            };
        }
        const positions = [];
        positions.push("| type | symbol | position | avg cost | market value | PnL | PnL% |");
        positions.push("|---|---|---|---|---|---|---|");
        ib.on(ib_1.EventName.position, (account, contract, pos, avgCost) => {
            positions.push(`| ${contract.secType} | ${contract.symbol} | ${pos} | ${avgCost || 0} | N/A | N/A | N/A | Account: ${account}`);
        });
        ib.once(ib_1.EventName.positionEnd, () => {
            return {
                content: [{ type: 'text', text: positions.join('\n') }],
                isError: false
            };
        });
        ib.reqPositions();
        return new Promise((resolve) => {
            ib.once(ib_1.EventName.positionEnd, () => {
                resolve({ content: [{ type: 'text', text: positions.join('\n') }] });
            });
        });
    }
    catch (error) {
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
const transport = new stdio_js_1.StdioServerTransport();
// Connect the server to the transport
server.connect(transport).catch(console.error);
