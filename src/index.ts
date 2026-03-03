import 'dotenv/config';
import readline from 'node:readline';
import { callTool, ToolName } from './tools';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in environment.');
    process.exit(1);
  }

  console.log('Basic TS AI Agent. Type "exit" to quit.\n');

  // simple memory of the conversation
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant. You can optionally call tools to get the current time or fake weather.',
    },
  ];

  while (true) {
    const userInput = await ask('You: ');
    if (userInput.trim().toLowerCase() === 'exit') {
      break;
    }

    messages.push({ role: 'user', content: userInput });

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
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

    // handle tool calls if any
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

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

      messages.push(message, ...toolMessages);

      const secondResponse = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages,
      });

      const finalMessage = secondResponse.choices[0].message;
      console.log(`Agent: ${finalMessage.content}\n`);
      messages.push(finalMessage as OpenAI.Chat.ChatCompletionMessageParam);
    } else {
      console.log(`Agent: ${message.content}\n`);
      messages.push(message as OpenAI.Chat.ChatCompletionMessageParam);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

