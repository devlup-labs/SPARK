"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { 
  IconMessage, 
  IconX, 
  IconSend, 
  IconLoader2, 
  IconTerminal2 
} from "@tabler/icons-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dragControls = useDragControls();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: Could not reach SPARK AI." }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection failed. Please ensure Ollama is running." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragListener={false}
            dragControls={dragControls as any}
            dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden touch-none"
            style={{
              background: "var(--bg-layer)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 0 30px rgba(0,245,255,0.15)",
              clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
          >
            {/* Header - Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-black/40 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <IconTerminal2 className="text-[var(--neon-cyan)] animate-pulse" size={20} />
                <span className="font-bold text-xs tracking-[0.2em] text-[var(--neon-cyan)] uppercase" style={{ fontFamily: "var(--font-syne)" }}>
                  SPARK AI v1.0
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors relative z-10"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center mt-20 opacity-40">
                  <IconTerminal2 size={40} className="mx-auto text-[var(--neon-cyan)] mb-4" />
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Awaiting encryption key... System Ready.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 text-[12px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)]"
                        : "bg-white/5 border border-white/10 text-[var(--text-primary)]"
                    }`}
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      clipPath: msg.role === "user" 
                        ? "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)"
                        : "polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                    <IconLoader2 className="animate-spin text-[var(--neon-cyan)]" size={14} />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--neon-cyan)]">Syncing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--glass-border)] bg-black/20">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="QUERY SPARK SYSTEM..."
                  className="w-full bg-white/5 border border-white/10 p-3 pr-12 text-[10px] tracking-wider focus:outline-none focus:border-[var(--neon-cyan)]/50 transition-all text-[var(--text-primary)] uppercase"
                  style={{
                    fontFamily: "var(--font-syne)",
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 p-2 text-[var(--neon-cyan)] hover:scale-110 transition-transform disabled:opacity-30"
                >
                  <IconSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,245,255,0.6)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 flex items-center justify-center relative overflow-hidden group"
        style={{
          background: "var(--neon-cyan)",
          clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? (
          <IconX className="text-black" size={24} />
        ) : (
          <IconMessage className="text-black" size={28} />
        )}
      </motion.button>
    </div>
  );
}
