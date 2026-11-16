import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios.js';

export default function ChatBox({ sessionId, socket, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history from REST API
  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/sessions/${sessionId}/messages`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Listen for real-time incoming chat messages
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleIncomingMessage = (msg) => {
      if (msg.session === sessionId) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('chat:message', handleIncomingMessage);

    return () => {
      socket.off('chat:message', handleIncomingMessage);
    };
  }, [socket, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    socket.emit('chat:send', {
      sessionId,
      text: text.trim(),
    });

    setText('');
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-sm font-bold text-white">Session Chat</h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {messages.length} msg{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3.5 max-h-[460px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <span className="text-2xl">👋</span>
            <p className="text-xs">No messages in this session yet.</p>
            <p className="text-[11px] text-slate-600">
              Start the discussion about the code below!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender?._id === currentUser?._id;
            const isMentor = m.sender?.role === 'mentor';

            return (
              <div
                key={m._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : m.sender?.name || 'User'}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isMentor
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {m.sender?.role}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words shadow-md ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : isMentor
                      ? 'bg-slate-800 border border-emerald-500/30 text-slate-100 rounded-tl-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a question or explain a code change..."
          className="flex-grow px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}

