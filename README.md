## Basic TypeScript AI Agent

This repository contains a minimal command-line AI agent written in TypeScript.  
It connects to OpenAI, streams responses to your terminal, and can call simple "tools"
(for example, getting the current time or returning a fake weather report).

### Features

- **TypeScript-based CLI**: Strongly typed, easy to extend.
- **Streaming responses**: See model output as it is generated.
- **Pluggable tools**: Add your own custom functions for the agent to call.

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key

### Installation

From the project root:

```bash
npm install
```

### Configuration

Create a `.env` file in the project root and set your OpenAI API key:

```bash
OPENAI_API_KEY=your_api_key_here
```

If you have an `.env.example` file, you can copy it first:

```bash
cp .env.example .env
```

Then edit `.env` and fill in the value.

### Running the agent

You can run in dev mode (TypeScript directly) or build and run the compiled JavaScript.

- **Dev mode (recommended during development):**

  ```bash
  npm run dev
  ```

- **Build then run (compiled JavaScript):**

  ```bash
  npm run build
  npm start
  ```

Once running, type messages at the `You:` prompt.  
Type `exit` (or press `Ctrl+C`) to quit.

### Customizing the agent

Most of the core logic lives in `src/index.ts`. Common customizations include:

- **Changing the system prompt** to alter the agent’s personality or role.
- **Adding tools**:
  - Extend the `ToolName` union.
  - Add implementations in the `callTool` function.
  - Register tools in the `tools` array passed to `client.chat.completions.create`.

After making changes, re-run with `npm run dev` or rebuild with `npm run build`.
