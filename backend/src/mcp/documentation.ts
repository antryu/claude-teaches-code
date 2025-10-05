import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import NodeCache from 'node-cache';

const DEVDOCS_API = 'https://devdocs.io';
const GITHUB_API = 'https://api.github.com';

class DocumentationMCPServer {
  private server: Server;
  private cache: NodeCache;

  constructor() {
    this.server = new Server(
      {
        name: 'documentation-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Cache with 1-hour TTL
    this.cache = new NodeCache({ stdTTL: 3600 });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'fetch_docs',
          description: 'Fetch documentation from DevDocs for a specific library/framework',
          inputSchema: {
            type: 'object',
            properties: {
              library: {
                type: 'string',
                description: 'Library name (e.g., "javascript", "react", "python")',
              },
              query: {
                type: 'string',
                description: 'Specific topic to search for',
              },
            },
            required: ['library'],
          },
        },
        {
          name: 'search_examples',
          description: 'Search GitHub for code examples',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for code examples',
              },
              language: {
                type: 'string',
                description: 'Programming language filter',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'fetch_docs') {
          return await this.fetchDocs(args as { library: string; query?: string });
        } else if (name === 'search_examples') {
          return await this.searchExamples(
            args as { query: string; language?: string; limit?: number }
          );
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async fetchDocs(args: { library: string; query?: string }) {
    const cacheKey = `docs:${args.library}:${args.query || 'index'}`;
    const cached = this.cache.get<string>(cacheKey);

    if (cached) {
      return {
        content: [{ type: 'text', text: cached }],
      };
    }

    try {
      // Fetch from DevDocs API
      const url = args.query
        ? `${DEVDOCS_API}/${args.library}/${args.query}.json`
        : `${DEVDOCS_API}/${args.library}/index.json`;

      const response = await axios.get(url, { timeout: 5000 });
      const docs = JSON.stringify(response.data, null, 2);

      this.cache.set(cacheKey, docs);

      return {
        content: [{ type: 'text', text: docs }],
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: `Documentation not found for ${args.library}${args.query ? `/${args.query}` : ''}`,
            },
          ],
        };
      }
      throw error;
    }
  }

  private async searchExamples(args: {
    query: string;
    language?: string;
    limit?: number;
  }) {
    const cacheKey = `examples:${args.query}:${args.language || 'all'}`;
    const cached = this.cache.get<string>(cacheKey);

    if (cached) {
      return {
        content: [{ type: 'text', text: cached }],
      };
    }

    try {
      const searchQuery = args.language
        ? `${args.query} language:${args.language}`
        : args.query;

      const response = await axios.get(`${GITHUB_API}/search/code`, {
        params: {
          q: searchQuery,
          per_page: args.limit || 5,
        },
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      const examples = response.data.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        repository: item.repository.full_name,
        url: item.html_url,
      }));

      const result = JSON.stringify(examples, null, 2);
      this.cache.set(cacheKey, result);

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      throw new Error(
        `GitHub API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Documentation MCP Server running on stdio');
  }
}

// Export for use in main application
export { DocumentationMCPServer };

// Run as standalone MCP server if executed directly
if (require.main === module) {
  const server = new DocumentationMCPServer();
  server.run().catch(console.error);
}
