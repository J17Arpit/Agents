import { FormEvent, useState } from 'react';
import './App.css';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ApiMessage = ChatMessage & {
  tool_call_id?: string;
};

type ApiResponse = {
  messages: ApiMessage[];
};

const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content:
        'You are a helpful assistant. You can optionally call tools to get the current time or fake weather.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data: ApiResponse = await response.json();
      const assistantMessages = data.messages.filter(
        (m) => m.role === 'assistant',
      );
      setMessages((prev) => [
        ...prev,
        ...assistantMessages.slice(prev.filter((m) => m.role === 'assistant').length),
      ]);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>TypeScript AI Agent</h1>
        <p>Chat with your local OpenAI-powered agent in the browser.</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages
            .filter((m) => m.role !== 'system')
            .map((message, index) => (
              <div
                key={index}
                className={`message message-${message.role}`}
              >
                <div className="message-role">
                  {message.role === 'user' ? 'You' : 'Agent'}
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          {isLoading && (
            <div className="message message-assistant message-loading">
              <div className="message-role">Agent</div>
              <div className="message-content">Thinking...</div>
            </div>
          )}
        </div>

        <form className="input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask the agent something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}
      </main>
    </div>
  );
}

export default App;
