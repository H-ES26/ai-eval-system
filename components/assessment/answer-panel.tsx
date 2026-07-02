"use client"

import { useState } from "react"
import { PenLine, CheckCircle2, Loader2, Award, MessageSquare, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Message } from "@/components/assessment/chat-panel"

type EvaluationResult = {
  totalScore: number
  promptingScore: number
  answerScore: number
  feedback: {
    prompting: string
    answer: string
    overall: string
  }
}

type AnswerPanelProps = {
  chatHistory: Message[]
}

export function AnswerPanel({ chatHistory }: AnswerPanelProps) {
  const [answer, setAnswer] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const charCount = answer.length

  async function handleSubmit() {
    if (!employeeId.trim() || !employeeName.trim()) {
      setError("사번과 이름을 입력해 주세요.")
      return
    }

    if (!answer.trim()) {
      setError("답안을 작성해 주세요.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setEvaluationResult(null)

    try {
      const response = await fetch("/api/chat/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatHistory: chatHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          finalAnswer: answer,
          employeeId: employeeId.trim(),
          employeeName: employeeName.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "평가 요청 실패")
      }

      const result = await response.json()
      setEvaluationResult(result)
    } catch (err) {
      console.error("평가 오류:", err)
      setError(err instanceof Error ? err.message : "평가 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function getScoreColor(score: number, maxScore: number) {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <section
      aria-label="답안 작성"
      className="flex h-full min-h-0 flex-col border-l border-border bg-card"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">답안 작성</h2>
        </div>
        <span className="text-xs text-muted-foreground">{charCount.toLocaleString()}자</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="employeeId" className="mb-1 block text-xs font-medium text-muted-foreground">
              사번
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="사번 입력"
              disabled={isSubmitting}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="employeeName" className="mb-1 block text-xs font-medium text-muted-foreground">
              이름
            </label>
            <input
              id="employeeName"
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="이름 입력"
              disabled={isSubmitting}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="여기에 최종 답안을 작성하세요. 문제의 요구 사항과 제약 조건을 모두 반영하여 논리적 근거와 함께 서술해 주세요."
          aria-label="최종 답안 입력"
          disabled={isSubmitting}
          className="h-full min-h-[200px] w-full resize-none rounded-lg border border-input bg-background p-4 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="shrink-0 space-y-4 border-t border-border p-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {evaluationResult && (
          <div className="space-y-4 rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Award className="h-5 w-5 text-primary" />
                평가 결과
              </h3>
              <button
                onClick={() => setEvaluationResult(null)}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="결과 닫기"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className={`text-2xl font-bold ${getScoreColor(evaluationResult.totalScore, 100)}`}>
                  {evaluationResult.totalScore}
                </div>
                <div className="text-xs text-muted-foreground">총점 / 100</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className={`text-2xl font-bold ${getScoreColor(evaluationResult.promptingScore, 50)}`}>
                  {evaluationResult.promptingScore}
                </div>
                <div className="text-xs text-muted-foreground">프롬프팅 / 50</div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className={`text-2xl font-bold ${getScoreColor(evaluationResult.answerScore, 50)}`}>
                  {evaluationResult.answerScore}
                </div>
                <div className="text-xs text-muted-foreground">답안 / 50</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  프롬프팅 평가
                </div>
                <p className="text-muted-foreground">{evaluationResult.feedback.prompting}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <FileText className="h-4 w-4 text-green-500" />
                  답안 평가
                </div>
                <p className="text-muted-foreground">{evaluationResult.feedback.answer}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Award className="h-4 w-4 text-primary" />
                  종합 평가
                </div>
                <p className="text-muted-foreground">{evaluationResult.feedback.overall}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !answer.trim() || !employeeId.trim() || !employeeName.trim()}
          className="h-12 w-full gap-2 bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              평가 중...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              제출 및 평가받기
            </>
          )}
        </Button>
      </div>
    </section>
  )
}
