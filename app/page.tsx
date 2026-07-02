"use client"

import { useState } from "react"
import { AssessmentHeader } from "@/components/assessment/assessment-header"
import { ProblemPanel } from "@/components/assessment/problem-panel"
import { ChatPanel, Message } from "@/components/assessment/chat-panel"
import { AnswerPanel } from "@/components/assessment/answer-panel"

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "안녕하세요. AI 역량 평가 어시스턴트입니다. 문제 해결에 도움이 필요하면 무엇이든 물어보세요. 예를 들어 데이터 전처리 방향이나 지표 산정 방법을 함께 정리할 수 있습니다.",
  },
]

export default function Page() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AssessmentHeader />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[3fr_4fr_3fr]">
        <ProblemPanel />
        <ChatPanel messages={messages} setMessages={setMessages} />
        <AnswerPanel chatHistory={messages} />
      </main>
    </div>
  )
}
