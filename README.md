# Basic TypeScript AI Agent

This is a minimal command-line AI agent written in TypeScript. It talks to OpenAI and can optionally call simple "tools" (functions) like getting the current time or a fake weather report.

## Setup

1. **Install dependencies**

   ```bash
   cd /Users/aj/Documents/Agents/Agents
   npm install
   ```

2. **Configure your API key**

   Copy `.env.example` to `.env` and fill in your key:

   ```bash
   cp .env.example .env
   # then edit .env and set OPENAI_API_KEY
   ```

## Running the agent

You can run in dev mode (TypeScript directly) or build and run the compiled JavaScript.

**Dev mode:**

```bash
npm run dev
```

**Build then run:**

```bash
npm run build
npm start
```

Then type messages at the `You:` prompt. Type `exit` to quit.

## Customizing the agent

- Edit `src/index.ts` to:
  - Change the system prompt.
  - Add more tools in the `ToolName` union, `callTool` function, and the `tools` array passed to `client.chat.completions.create`.

