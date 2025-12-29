import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const COLORS = {
  bgBase: '#000000',
  bgSurface: '#0a0a0a',
  bgElevated: '#141414',
  bgHover: '#1a1a1a',
  bgInput: '#1a1a1a',
  textPrimary: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#808080',
  accent: '#ffffff',
  accentHover: '#e0e0e0',
  accentMuted: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.12)',
  codeText: '#b3b3b3',
  codeKeyword: '#ffffff',
  codeString: '#ffffff',
};

function ChatView({ filePath, projectPath, explanation, apiKey, model, analysisMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      if (window.electronAPI && window.electronAPI.chatAboutCode) {
        const response = await window.electronAPI.chatAboutCode(
          userMessage,
          filePath || projectPath,
          filePath ? 'file' : 'project',
          apiKey,
          model,
          analysisMode,
          explanation // Pass the existing explanation for context
        );

        setMessages([...newMessages, { role: 'assistant', content: response }]);
      } else {
        throw new Error('Chat functionality not available');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to get response. Please check your API key and try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: COLORS.bgBase,
    }}>
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.textMuted,
            textAlign: 'center',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.5,
            }}>💬</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: COLORS.textPrimary,
              marginBottom: '8px',
            }}>
              Ask questions about your code
            </h3>
            <p style={{
              fontSize: '14px',
              color: COLORS.textMuted,
              maxWidth: '400px',
              lineHeight: '1.6',
            }}>
              Get specific answers about functions, classes, architecture, or any aspect of your codebase.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor:
                    message.role === 'user'
                      ? COLORS.accentMuted
                      : COLORS.bgElevated,
                  border: `1px solid ${COLORS.borderSubtle}`,
                  color: COLORS.textPrimary,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  animation: 'slideInContent 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          style={{
                            color: COLORS.textPrimary,
                            fontSize: '18px',
                            marginTop: '16px',
                            marginBottom: '12px',
                            fontWeight: '600',
                          }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          style={{
                            color: COLORS.accent,
                            fontSize: '16px',
                            marginTop: '14px',
                            marginBottom: '10px',
                            fontWeight: '600',
                          }}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          style={{
                            color: COLORS.textSecondary,
                            fontSize: '14px',
                            marginTop: '12px',
                            marginBottom: '8px',
                            fontWeight: '600',
                          }}
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          style={{
                            marginBottom: '12px',
                            lineHeight: '1.7',
                            color: COLORS.textSecondary,
                          }}
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code
                            style={{
                              backgroundColor: COLORS.bgHover,
                              color: COLORS.codeText,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                              border: `1px solid ${COLORS.borderSubtle}`,
                            }}
                            {...props}
                          />
                        ) : (
                          <code
                            style={{
                              display: 'block',
                              backgroundColor: COLORS.bgHover,
                              color: COLORS.textPrimary,
                              padding: '12px',
                              borderRadius: '6px',
                              overflow: 'auto',
                              fontSize: '12px',
                              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                              margin: '12px 0',
                              border: `1px solid ${COLORS.borderSubtle}`,
                              lineHeight: '1.6',
                            }}
                            {...props}
                          />
                        ),
                      ul: ({ node, ...props }) => (
                        <ul
                          style={{
                            marginLeft: '20px',
                            marginBottom: '12px',
                            color: COLORS.textSecondary,
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          style={{
                            marginLeft: '20px',
                            marginBottom: '12px',
                            color: COLORS.textSecondary,
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li style={{ marginBottom: '6px', lineHeight: '1.7' }} {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          style={{
                            fontWeight: '600',
                            color: COLORS.textPrimary,
                          }}
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          style={{
                            color: COLORS.accent,
                            textDecoration: 'none',
                          }}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: COLORS.bgElevated,
                border: `1px solid ${COLORS.borderSubtle}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.accent,
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.accent,
                    animation: 'pulse 1.4s ease-in-out 0.2s infinite',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.accent,
                    animation: 'pulse 1.4s ease-in-out 0.4s infinite',
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: `1px solid ${COLORS.borderSubtle}`,
          backgroundColor: COLORS.bgSurface,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            maxWidth: '100%',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={handleKeyPress}
            placeholder={
              !apiKey
                ? 'Please add your OpenAI API key in Settings'
                : filePath || projectPath
                ? 'Ask a question about your code...'
                : 'Select a file or project first to ask questions'
            }
            disabled={loading || !apiKey || (!filePath && !projectPath)}
            style={{
              flex: 1,
              height: '44px',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px 16px',
              backgroundColor: COLORS.bgInput,
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '8px',
              color: COLORS.textPrimary,
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowY: 'auto',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.accent;
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.borderDefault;
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !apiKey || (!filePath && !projectPath)}
            style={{
              height: '44px',
              padding: '0 24px',
              backgroundColor:
                !input.trim() || loading || !apiKey || (!filePath && !projectPath)
                  ? COLORS.bgHover
                  : COLORS.accent,
              color:
                !input.trim() || loading || !apiKey || (!filePath && !projectPath)
                  ? COLORS.textMuted
                  : COLORS.bgBase,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor:
                !input.trim() || loading || !apiKey || (!filePath && !projectPath)
                  ? 'not-allowed'
                  : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity:
                !input.trim() || loading || !apiKey || (!filePath && !projectPath) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (
                input.trim() &&
                !loading &&
                apiKey &&
                (filePath || projectPath)
              ) {
                e.target.style.backgroundColor = COLORS.accentHover;
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (
                input.trim() &&
                !loading &&
                apiKey &&
                (filePath || projectPath)
              ) {
                e.target.style.backgroundColor = COLORS.accent;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatView;

