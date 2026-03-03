import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import OpenAI from 'openai';
import { callTool, ToolName } from './tools';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

type ChatRequestBody = {
  messages: ChatMessage[];
};

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment.');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  // Basic CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed: ChatRequestBody = JSON.parse(body || '{}');
        const incomingMessages: ChatMessage[] = (parsed.messages ?? []).map(
          (message) => {
            if (message.role === 'assistant') {
              return {
                role: 'assistant',
                content:
                  typeof message.content === 'string'
                    ? message.content
                    : JSON.stringify(message.content),
              } as ChatMessage;
            }

            return message;
          },
        );

        const response = await client.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: incomingMessages,
          tools: [
            {
              type: 'function',
              function: {
                name: 'getTime',
                description: 'Get the current local time.',
                parameters: {
                  type: 'object',
                  properties: {},
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'getWeather',
                description: 'Get (fake) weather for a city.',
                parameters: {
                  type: 'object',
                  properties: {
                    city: {
                      type: 'string',
                      description: 'City name, e.g. "Berlin".',
                    },
                  },
                  required: ['city'],
                },
              },
            },
          ],
          tool_choice: 'auto',
        });

        const choice = response.choices[0];
        const message = choice.message;

        const updatedMessages: ChatMessage[] = [...incomingMessages];

        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolMessages: ChatMessage[] = [];

          for (const toolCall of message.tool_calls) {
            const args =
              typeof toolCall.function.arguments === 'string'
                ? JSON.parse(toolCall.function.arguments || '{}')
                : toolCall.function.arguments ?? {};

            const result = await callTool({
              name: toolCall.function.name as ToolName,
              arguments: args,
            });

            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result,
            });
          }

          updatedMessages.push(
            message as ChatMessage,
            ...toolMessages,
          );

          const secondResponse = await client.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: updatedMessages,
          });

          const finalMessage = secondResponse.choices[0].message;
          updatedMessages.push(finalMessage as ChatMessage);
        } else {
          updatedMessages.push(message as ChatMessage);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ messages: updatedMessages }));
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : 'Invalid request or upstream error.';
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
      }
    });

    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

server.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

