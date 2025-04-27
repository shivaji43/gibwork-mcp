import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import { getTaskById , createTask ,getTasks } from "./utils.js";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

server.tool(
  "get-tasks-by-id", "fetches and gives gibwork tasks with the given id",
  {
    id: z.string(),
  },
  async ({ id }) => ({
    content: [{
      type: "text",
      text: String(await getTaskById(id))
    }]
  })
);

server.tool(
  "get-tasks", "fetches and gives gibwork tasks according to the given parameters",
  {
    page: z.number().optional().default(1),
    limit: z.number().optional().default(15),
    pageAll: z.boolean().optional().default(false),
    search: z.string().optional().default(''),
    orderBy: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
  },
  async ({ page, limit, pageAll, search, orderBy, tags }) => ({
    content: [{
      type: "text",
      text: String(await getTasks({ page, limit, pageAll, search, orderBy, tags }))
    }]
  })
);

server.tool(
  "create-task", "creates a new gibwork task with the provided details",
  {
    title: z.string(),
    content: z.string(),
    requirements: z.string(),
    tags: z.array(z.string()),
    payer: z.string(),
    token: z.object({}).passthrough()
  },
  async ({ title, content, requirements, tags, payer, token }) => ({
    content: [{
      type: "text",
      text: String(await createTask({ title, content, requirements, tags, payer, token }))
    }]
  })
);

const transport = new StdioServerTransport();
(async () => {
  await server.connect(transport);
})();