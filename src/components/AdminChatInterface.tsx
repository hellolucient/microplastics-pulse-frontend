import React, { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp?: string;
}

interface AdminChatInterfaceProps {
  backendUrl: string;
}

const AdminChatInterface: React.FC<AdminChatInterfaceProps> = ({ backendUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'microplastics-research'>('microplastics-research');
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openAIModels = [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' }
  ];

  const anthropicModels = [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Budget)' }
  ];

  const getCurrentModels = () => {
    return selectedProvider === 'openai' ? openAIModels : anthropicModels;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/admin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatMode: chatMode,
          model: selectedModel,
          provider: selectedProvider,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.reply,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { 
        role: 'error', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Research Assistant</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Chat Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat Mode
            </label>
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value as 'general' | 'microplastics-research')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="microplastics-research">Microplastics Research Chat</option>
              <option value="general">General Chat</option>
            </select>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value as 'openai' | 'anthropic');
                // Reset to first model of new provider
                const models = e.target.value === 'openai' ? openAIModels : anthropicModels;
                setSelectedModel(models[0].value);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getCurrentModels().map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Chat Button */}
        <div className="mb-4">
          <button
            onClick={clearChat}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="border border-gray-300 rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">🔬</div>
            <p>Start a conversation with the AI Research Assistant!</p>
            <p className="text-sm mt-2">
              {chatMode === 'microplastics-research' 
                ? 'Ask questions about microplastics research using our article database.'
                : 'Ask general questions or get help with various topics.'
              }
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : message.role === 'assistant'
                    ? 'bg-white border border-gray-200 mr-auto'
                    : 'bg-red-100 border border-red-300 text-red-800 mr-auto'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase">
                    {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Assistant' : 'Error'}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-4 p-3 rounded-lg max-w-3xl bg-white border border-gray-200 mr-auto">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase">AI Assistant</span>
                  <span className="text-xs opacity-75">Thinking...</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <TextareaAutosize
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={
            isLoading 
              ? `${selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} is thinking...`
              : chatMode === 'microplastics-research'
              ? 'Ask about microplastics research...'
              : 'Type your message...'
          }
          className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          minRows={1}
          maxRows={4}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px]"
        >
          {isLoading ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>

      {/* Usage Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Current Mode:</strong> {chatMode === 'microplastics-research' ? 'Microplastics Research Chat' : 'General Chat'} | 
          <strong> Provider:</strong> {selectedProvider} | 
          <strong> Model:</strong> {selectedModel}
        </p>
        {chatMode === 'microplastics-research' && (
          <p className="mt-1">
            💡 This mode searches through your article database to provide research-backed answers.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminChatInterface;
