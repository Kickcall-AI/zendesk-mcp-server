import express from "express";
import { v4 as uuidv4 } from "uuid";
import { server } from "./server.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { transportContext } from "./transportContext.js";

console.log("Starting Zendesk API MCP server...");

const app = express();
app.use(express.json());

function extractRelevantHeaders(headers) {
  const requiredHeaders = new Set([
    'api_key',
    'email',
    'subdomain'
  ]);
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (requiredHeaders.has(lower)) {
      result[lower] = value;
    }
  }
  return result;
}

// Session-based transport map
const transports = {};

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // Create a new transport
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => uuidv4(),
      onsessioninitialized: (generatedSessionId) => {
        transports[generatedSessionId] = transport;

        // Store headers in global transportContext
        const creds = extractRelevantHeaders(req.headers);
        transportContext[generatedSessionId] = creds;
        console.log("Session initialized:", generatedSessionId);
      }
    });

    // Fallback for immediately available session ID
    if (transport.sessionId) {
      const creds = extractRelevantHeaders(req.headers);
      transportContext[transport.sessionId] = creds;
      transports[transport.sessionId] = transport;
      console.log("Immediate transport session:", transport.sessionId);
    }

    // Clean up on close
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
        delete transportContext[transport.sessionId];
      }
    };

    // Connect to MCP server
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`HTTP MCP server is running on http://localhost:${PORT}/mcp`);
});
