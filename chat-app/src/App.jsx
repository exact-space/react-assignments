import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const user_list = ['Alan', 'Bob', 'Carol', 'Dean', 'Elin'];

// Pastel avatar colors matching the team-chat reference
const USER_COLORS = {
  Alan: '#e06666',
  Bob: '#6fa8dc',
  Carol: '#93c47d',
  Dean: '#f6b26b',
  Elin: '#d5a6bd'
};

// Initial welcome messages matching the reference gif atmosphere
const INITIAL_MESSAGES = [
  {
    id: 1,
    user: 'Alan',
    text: 'Welcome to the chat room! Feel free to say hello.',
    time: '12:16',
    likes: 2
  },
  {
    id: 2,
    user: 'Carol',
    text: 'Hey everyone!',
    time: '12:18',
    likes: 1
  },
  {
    id: 3,
    user: 'Bob',
    text: 'Glad to be here! The interface looks clean.',
    time: '12:20',
    likes: 3
  }
];

function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Randomly assign a username from user_list
    const randomUser = user_list[Math.floor(Math.random() * user_list.length)];

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const newMessage = {
      id: Date.now(),
      user: randomUser,
      text: trimmed,
      time: timeString,
      likes: 0
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleLike = (id) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg
      )
    );
  };

  // Helper to get 2-letter initials (e.g. Alan -> AL)
  const getInitials = (name) => {
    if (!name) return '??';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="chat-app-wrapper">
      <div className="chat-main-container">
        {/* Header matching team chat intro */}
        <header className="chat-header">
          <div className="header-text">
            <h2>Introductions</h2>
            <p className="header-subtitle">This Channel Is For Company Wide Chatter</p>
          </div>
          <div className="header-members">
            <span className="member-count">{user_list.length} | 100</span>
            <span className="members-icon" aria-hidden="true">👥</span>
          </div>
        </header>

        {/* Message Thread */}
        <div className="chat-thread" aria-label="Chat messages thread">
          {messages.map((msg) => {
            const avatarBg = USER_COLORS[msg.user] || '#999999';
            return (
              <div key={msg.id} className="chat-message-row">
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: avatarBg }}
                  title={msg.user}
                >
                  {getInitials(msg.user)}
                </div>

                <div className="chat-message-content">
                  <div className="chat-message-meta">
                    <span className="chat-username">{msg.user}</span>
                    <span className="chat-time">{msg.time}</span>
                  </div>

                  <div className="chat-bubble-container">
                    <div className="chat-bubble">
                      <p className="chat-text">{msg.text}</p>
                    </div>

                    {/* Like button positioned at the right end of the chat message */}
                    <button
                      type="button"
                      className="chat-like-btn"
                      onClick={() => handleLike(msg.id)}
                      aria-label={`Like message from ${msg.user}. Current likes: ${msg.likes}`}
                    >
                      <span className="like-icon" aria-hidden="true">👍</span>
                      <span className="like-counter">{msg.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Send Form at bottom */}
        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input-box"
            placeholder="Type Message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            aria-label="Type Message"
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputText.trim()}
            aria-label="Send Message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
