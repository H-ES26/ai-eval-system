"use client"

import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export type Message = {
  id: number
  role: "user" | "assistant"
  content: string
}

type ChatPanelProps = {
  messages: Message[]
  setMessages: Dispatch<SetStateAction<Message[]>>
}

export function ChatPanel({ messages, setMessages }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = { id: Date.now(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      // API로 보낼 메시지 배열 생성 (현재 메시지 포함)
      const messagesForApi = [...messages, userMsg].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messagesForApi }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "API 요청 실패")
      }

      const data = await response.json()

      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.content,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error("채팅 오류:", error)
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: `죄송합니다. 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <section aria-label="AI 채팅" className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border px-5 py-2">
        <Bot className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">
          LLM{" "}
          <span className="font-normal text-muted-foreground">
            {"(이곳에 프롬프팅한 이력은 자동으로 저장되며, 평가에 50% 반영됩니다.)"}
          </span>
        </h2>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bot className="h-4 w-4" aria-hidden="true" />
              )}
            </div>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm border border-border bg-card text-card-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI가 응답을 생성하고 있습니다...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AI에게 질문을 입력하세요..."
            aria-label="AI 질문 입력"
            disabled={isLoading}
            className="h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-11 gap-1.5 px-4"
            aria-label="전송"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {isLoading ? "전송 중..." : "전송"}
          </Button>
        </div>
      </div>
    </section>
  )
}
