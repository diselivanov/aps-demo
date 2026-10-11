"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import styles from "./index.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "chat-history";
const WIDTH_KEY = "chat-width";
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 400;

const GREETING =
  "Здравствуйте! Я Даниил, консультант приложения. Если у вас есть вопросы, я с радостью помогу!";

const SUGGESTIONS = [
  "Как создать таблицу?",
  "Как настроить таблицу?",
  "Как сделать импорт?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {}
    }
    const storedWidth = localStorage.getItem(WIDTH_KEY);
    if (storedWidth) {
      const n = Number(storedWidth);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) setWidth(n);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages, mounted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, window.innerWidth - e.clientX),
      );
      setWidth(next);
    };
    const onUp = () => {
      setDragging(false);
      localStorage.setItem(WIDTH_KEY, String(width));
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, width]);

  const send = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const next: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(0, -1),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Консультант недоступен. Проверьте, запущен ли Ollama.",
          };
          return copy;
        });
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          try {
            const json = JSON.parse(trimmedLine);
            const chunk = json?.message?.content;
            if (chunk) {
              assistant += chunk;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistant,
                };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      // aborted or network error
    }

    setLoading(false);
    abortRef.current = null;
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Консультант"
      >
        <Icon name="bot" size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className={styles.panel}
              style={{ width }}
              initial={{ x: width }}
              animate={{ x: 0 }}
              exit={{ x: width }}
              transition={
                dragging ? { duration: 0 } : { duration: 0.2, ease: "linear" }
              }
            >
              <div
                className={styles.resizer}
                onMouseDown={() => setDragging(true)}
              />

              <header className={styles.header}>
                <span className={styles.title}>Чат-бот</span>
                <div className={styles.headerActions}>
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={clear}
                  >
                    Очистить чат
                  </button>
                  <button
                    type="button"
                    className={styles.headerBtn}
                    onClick={() => setOpen(false)}
                    aria-label="Закрыть"
                  >
                    <Icon name="cross" size={16} />
                  </button>
                </div>
              </header>

              <div className={styles.body} ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className={`${styles.msg} ${styles.assistant}`}>
                    {GREETING}
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`${styles.msg} ${
                        m.role === "user" ? styles.user : styles.assistant
                      }`}
                    >
                      {m.content ||
                        (loading && i === messages.length - 1 ? "…" : "")}
                    </div>
                  ))
                )}
              </div>

              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => send(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className={styles.form}>
                <input
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ваш вопрос"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.send}
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  aria-label="Отправить"
                >
                  <Icon name="send" size={20} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
