"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  Sparkles,
  X,
  RotateCcw,
  Send,
  Bot,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

const CHAT_SESSION_KEY = "nuvita_chat_session";

/** Minimal markdown: **bold** → <strong>, *italic* → <em>, URLs → <a> */
function renderSimpleMarkdown(text: string) {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  let html = escapeHtml(text);
  // Bold **text**
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold text-emerald-700">$1</strong>',
  );
  // Italic *text* (must not match bold leftovers)
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*/g, "$1<em>$2</em>");
  // Plain URLs
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-emerald-600 hover:text-emerald-700">$1</a>',
  );
  // Line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export default function NuvitaChat() {
  const { t, langUpper } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const SUGGESTIONS = useMemo(
    () => [t("chat.suggestions.1"), t("chat.suggestions.2"), t("chat.suggestions.3")],
    [t],
  );

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("accessToken");
      if (t) h.Authorization = `Bearer ${t}`;
    }
    return h;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load existing session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem(CHAT_SESSION_KEY);
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadSession(savedSessionId);
    }
  }, []);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen && window.matchMedia("(max-width: 640px)").matches) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [inputValue]);

  const loadSession = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/session/${sid}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        localStorage.removeItem(CHAT_SESSION_KEY);
        setSessionId(null);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const createSession = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/session`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        localStorage.setItem(CHAT_SESSION_KEY, data.sessionId);
        setMessages([
          {
            id: Date.now(),
            role: "ASSISTANT",
            content: data.greeting,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!sessionId) await createSession();
    setTimeout(() => textareaRef.current?.focus(), 250);
  };

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !sessionId || isLoading) return;

    setInputValue("");

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sessionId, content: trimmed, lang: langUpper }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        let serverMessage = "";
        try {
          const data = await response.json();
          serverMessage =
            typeof data?.message === "string"
              ? data.message
              : Array.isArray(data?.message)
                ? data.message.join(", ")
                : "";
        } catch {
          /* ignore */
        }

        if (response.status === 404) {
          localStorage.removeItem(CHAT_SESSION_KEY);
          setSessionId(null);
          await createSession();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "ASSISTANT",
              content:
                "Sessiya muddati tugagan. Yangi suhbat boshlandi — savolingizni qayta yuboring.",
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "ASSISTANT",
              content:
                serverMessage ||
                "Kechirasiz, xatolik yuz berdi. Qayta urinib ko'ring.",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ASSISTANT",
          content: "Tarmoq xatosi. Internet aloqangizni tekshiring.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => sendText(inputValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = async () => {
    localStorage.removeItem(CHAT_SESSION_KEY);
    setSessionId(null);
    setMessages([]);
    await createSession();
  };

  // Show suggestions only when chat has just the greeting
  const showSuggestions = useMemo(() => {
    if (isLoading || isInitializing) return false;
    const userMsgCount = messages.filter((m) => m.role === "USER").length;
    return userMsgCount === 0;
  }, [messages, isLoading, isInitializing]);

  return (
    <>
      {/* ───── Floating trigger button ───── */}
      <button
        onClick={handleOpen}
        className={`fixed z-40 flex items-center justify-center transition-all duration-300
          bottom-4 right-4 sm:bottom-6 sm:right-6
          w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full
          bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600
          text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)]
          hover:shadow-[0_15px_35px_-5px_rgba(16,185,129,0.6)]
          hover:-translate-y-0.5 active:scale-95
          ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}`}
        aria-label={t("chat.openChat")}
      >
        {/* pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
        <Bot size={26} strokeWidth={2.2} className="relative z-10" />
        {/* online dot */}
        <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-300 ring-2 ring-white z-10" />
      </button>

      {/* ───── Backdrop (mobile) ───── */}
      <div
        onClick={() => setIsOpen(false)}
        className={`sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ───── Chat window ───── */}
      <div
        role="dialog"
        aria-label="Nuvita AI chat"
        className={`fixed z-50 bg-white flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          /* Mobile: bottom sheet */
          left-0 right-0 bottom-0
          w-full h-[88dvh] max-h-[88dvh]
          rounded-t-[28px]
          shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.25)]
          /* Desktop: floating card */
          sm:left-auto sm:right-6 sm:bottom-6 sm:top-auto
          sm:w-[400px] sm:h-[620px] sm:max-h-[85vh]
          sm:rounded-3xl sm:shadow-[0_25px_70px_-15px_rgba(16,185,129,0.35)]
          border border-emerald-100/40
          ${
            isOpen
              ? "translate-y-0 opacity-100 sm:scale-100"
              : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95 sm:opacity-0 pointer-events-none"
          }`}
      >
        {/* ─── Header ─── */}
        <div className="relative shrink-0 bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 text-white overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 40%)",
            }}
          />
          {/* Pull handle (mobile only) */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/40" />

          <div className="relative flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center shrink-0">
                <Bot size={22} strokeWidth={2.2} />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-300 ring-2 ring-emerald-500">
                  <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-70" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[15px] sm:text-base truncate">
                    Nuvita AI
                  </h3>
                  <Sparkles size={12} className="text-yellow-200 shrink-0" />
                </div>
                <p className="text-[11px] sm:text-xs text-white/85 truncate">
                  {t("chat.subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={startNewChat}
                className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors"
                title={t("common.retry")}
                aria-label={t("common.retry")}
              >
                <RotateCcw size={17} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors"
                aria-label={t("common.close")}
              >
                <X size={19} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-gradient-to-b from-emerald-50/30 via-white to-white"
          style={{ scrollbarWidth: "thin" }}
        >
          {isInitializing && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Loader2 size={26} className="animate-spin text-emerald-500" />
              </div>
              <p className="text-xs font-medium">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  animate={i === messages.length - 1}
                />
              ))}

              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="pt-2 space-y-2 nv-chat-fadein">
                  <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
                    <Sparkles size={10} />
                    {t("chat.subtitle")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendText(s)}
                        className="group text-xs font-medium bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-3 py-2 rounded-full border border-gray-200 hover:border-emerald-200 shadow-sm active:scale-95 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-end gap-2 nv-chat-fadein">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                    <div className="flex gap-1 items-center h-[14px]">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full nv-typing" />
                      <span
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full nv-typing"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full nv-typing"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ─── Input ─── */}
        <div
          className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl px-3.5 py-2.5 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                className="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 leading-relaxed max-h-[120px]"
                disabled={isLoading || isInitializing}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || isInitializing}
              className="group relative h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center overflow-hidden"
              aria-label={t("chat.send")}
            >
              <span
                className="absolute inset-0 opacity-0 group-enabled:group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "nvChatShine 1.6s ease-in-out infinite",
                }}
              />
              {isLoading ? (
                <Loader2 size={18} className="relative z-10 animate-spin" />
              ) : (
                <Send
                  size={17}
                  className="relative z-10 group-enabled:group-hover:translate-x-0.5 transition-transform"
                />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 text-center px-1 leading-snug">
            AI xatoga yo&apos;l qo&apos;yishi mumkin. Muhim sog&apos;liq masalalarida
            shifokorga murojaat qiling.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes nvChatShine {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes nvChatFadein {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nv-chat-fadein {
          animation: nvChatFadein 0.28s ease-out both;
        }
        @keyframes nvTyping {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        .nv-typing {
          animation: nvTyping 1.1s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}

/* ──────── Bubble ──────── */

function MessageBubble({
  msg,
  animate,
}: {
  msg: ChatMessage;
  animate?: boolean;
}) {
  const isUser = msg.role === "USER";
  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} ${
        animate ? "nv-chat-fadein" : ""
      }`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm
          ${
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl rounded-br-md"
              : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md"
          }`}
      >
        <div
          className="nv-chat-content break-words"
          dangerouslySetInnerHTML={{
            __html: renderSimpleMarkdown(msg.content),
          }}
        />
      </div>
    </div>
  );
}
