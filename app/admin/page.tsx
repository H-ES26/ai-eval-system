"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Award, 
  MessageSquare, 
  FileText, 
  X, 
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

type EvaluationItem = {
  code: string
  name: string
  result: "O" | "X"
  reason: string
}

type EvaluationSection = {
  items: EvaluationItem[]
  passCount: number
  totalCount: number
  passRate: number
  result: "PASS" | "FAIL"
}

type Feedback = {
  prompting: string
  answer: string
  overall: string
}

type EvaluationResult = {
  prompting: EvaluationSection
  answer: EvaluationSection
  finalResult: "PASS" | "FAIL"
  feedback: Feedback
}

type Evaluation = {
  id: number
  emp_id: string
  name: string
  chat_history: string | { role: string; content: string }[]
  final_answer: string
  evaluation_result: string | EvaluationResult
  created_at: string
}

export default function AdminPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchEvaluations() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/evaluations")
      if (!response.ok) {
        throw new Error("데이터를 가져오는데 실패했습니다.")
      }
      const data = await response.json()
      setEvaluations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvaluations()
  }, [])

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function parseEvaluationResult(result: string | EvaluationResult): EvaluationResult | null {
    if (typeof result === "object") return result
    try {
      return JSON.parse(result)
    } catch {
      return null
    }
  }

  function parseChatHistory(history: string | { role: string; content: string }[]): { role: string; content: string }[] {
    if (Array.isArray(history)) return history
    try {
      return JSON.parse(history)
    } catch {
      return []
    }
  }

  function getResultBadge(result: "PASS" | "FAIL" | undefined) {
    if (result === "PASS") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
          <CheckCircle className="h-3 w-3" />
          PASS
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
        <XCircle className="h-3 w-3" />
        FAIL
      </span>
    )
  }

  function getPassRateBadge(passCount: number, totalCount: number) {
    const rate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0
    const isPassing = rate >= 70
    return (
      <span className={`text-xs font-medium ${isPassing ? "text-green-600" : "text-red-600"}`}>
        {passCount}/{totalCount} ({rate}%)
      </span>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI 역량 평가 관리자</h1>
            <p className="text-xs text-gray-500">전체 평가 내역 대시보드 (O/X PASS/FAIL)</p>
          </div>
        </div>
        <Button
          onClick={fetchEvaluations}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Table Section */}
        <div className={`flex flex-1 flex-col transition-all ${selectedEvaluation ? "lg:w-1/2" : "w-full"}`}>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                전체 평가 내역 ({evaluations.length}건)
              </h2>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchEvaluations} variant="outline">
                  다시 시도
                </Button>
              </div>
            ) : evaluations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-500">
                <Users className="h-12 w-12 text-gray-300" />
                <p>아직 제출된 평가가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        사번
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        이름
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                        최종결과
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                        프롬프팅
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                        답안
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        제출 시간
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                        상세
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {evaluations.map((evaluation) => {
                      const evalResult = parseEvaluationResult(evaluation.evaluation_result)
                      return (
                        <tr
                          key={evaluation.id}
                          onClick={() => setSelectedEvaluation(evaluation)}
                          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedEvaluation?.id === evaluation.id ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {evaluation.emp_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {evaluation.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getResultBadge(evalResult?.finalResult)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {evalResult?.prompting ? (
                              <div className="flex flex-col items-center gap-0.5">
                                {getResultBadge(evalResult.prompting.result)}
                                {getPassRateBadge(evalResult.prompting.passCount, evalResult.prompting.totalCount)}
                              </div>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {evalResult?.answer ? (
                              <div className="flex flex-col items-center gap-0.5">
                                {getResultBadge(evalResult.answer.result)}
                                {getPassRateBadge(evalResult.answer.passCount, evalResult.answer.totalCount)}
                              </div>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(evaluation.created_at)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ChevronRight className="mx-auto h-4 w-4 text-gray-400" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedEvaluation && (() => {
          const evalResult = parseEvaluationResult(selectedEvaluation.evaluation_result)
          const chatHistory = parseChatHistory(selectedEvaluation.chat_history)
          
          return (
            <div className="hidden w-1/2 border-l border-gray-200 bg-white lg:block">
              <div className="flex h-full flex-col">
                {/* Detail Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedEvaluation.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      사번: {selectedEvaluation.emp_id} · {formatDate(selectedEvaluation.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="rounded-full p-2 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Final Result Summary */}
                  <div className="mb-6">
                    <div className={`rounded-xl p-6 text-center ${evalResult?.finalResult === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      <div className={`mb-2 text-4xl font-bold ${evalResult?.finalResult === "PASS" ? "text-green-600" : "text-red-600"}`}>
                        {evalResult?.finalResult || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">최종 평가 결과</div>
                    </div>
                  </div>

                  {/* Section Results */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-4 ${evalResult?.prompting?.result === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">프롬프팅</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {getResultBadge(evalResult?.prompting?.result)}
                        <span className="text-sm text-gray-600">
                          {evalResult?.prompting?.passCount || 0}/{evalResult?.prompting?.totalCount || 7} 
                          ({evalResult?.prompting?.passRate || 0}%)
                        </span>
                      </div>
                    </div>
                    <div className={`rounded-xl p-4 ${evalResult?.answer?.result === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">답안</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {getResultBadge(evalResult?.answer?.result)}
                        <span className="text-sm text-gray-600">
                          {evalResult?.answer?.passCount || 0}/{evalResult?.answer?.totalCount || 7}
                          ({evalResult?.answer?.passRate || 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prompting Items Detail */}
                  {evalResult?.prompting?.items && (
                    <div className="mb-6">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        프롬프팅 역량 상세 (O/X)
                      </h4>
                      <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        {evalResult.prompting.items.map((item: EvaluationItem, idx: number) => (
                          <div key={idx} className="rounded-lg bg-white p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{item.code}. {item.name}</span>
                              <span className={`font-bold text-lg ${item.result === "O" ? "text-green-600" : "text-red-600"}`}>
                                {item.result}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answer Items Detail */}
                  {evalResult?.answer?.items && (
                    <div className="mb-6">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <FileText className="h-4 w-4 text-green-600" />
                        답안 작성 역량 상세 (O/X)
                      </h4>
                      <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        {evalResult.answer.items.map((item: EvaluationItem, idx: number) => (
                          <div key={idx} className="rounded-lg bg-white p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{item.code}. {item.name}</span>
                              <span className={`font-bold text-lg ${item.result === "O" ? "text-green-600" : "text-red-600"}`}>
                                {item.result}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {evalResult?.feedback && (
                    <div className="mb-6 space-y-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Award className="h-4 w-4 text-primary" />
                        AI 종합 피드백
                      </h4>
                      <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                        <div>
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                            <MessageSquare className="h-3 w-3" />
                            프롬프팅 피드백
                          </div>
                          <p className="text-sm text-gray-700">{evalResult.feedback.prompting}</p>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-green-600">
                            <FileText className="h-3 w-3" />
                            답안 피드백
                          </div>
                          <p className="text-sm text-gray-700">{evalResult.feedback.answer}</p>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                            <Award className="h-3 w-3" />
                            종합 피드백
                          </div>
                          <p className="text-sm text-gray-700">{evalResult.feedback.overall}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Answer */}
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <FileText className="h-4 w-4 text-green-600" />
                      제출한 최종 답안
                    </h4>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {selectedEvaluation.final_answer}
                      </p>
                    </div>
                  </div>

                  {/* Chat History */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      전체 채팅 내역
                    </h4>
                    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      {chatHistory.map((msg: { role: string; content: string }, index: number) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              msg.role === "user"
                                ? "rounded-tr-sm bg-primary text-white"
                                : "rounded-tl-sm border border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Mobile Modal */}
        {selectedEvaluation && (() => {
          const evalResult = parseEvaluationResult(selectedEvaluation.evaluation_result)
          const chatHistory = parseChatHistory(selectedEvaluation.chat_history)
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 lg:hidden">
              <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedEvaluation.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      사번: {selectedEvaluation.emp_id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="rounded-full p-2 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Final Result */}
                  <div className={`mb-4 rounded-xl p-4 text-center ${evalResult?.finalResult === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                    <div className={`text-3xl font-bold ${evalResult?.finalResult === "PASS" ? "text-green-600" : "text-red-600"}`}>
                      {evalResult?.finalResult || "N/A"}
                    </div>
                  </div>

                  {/* Section Results */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className={`rounded-xl p-3 text-center ${evalResult?.prompting?.result === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="text-xs text-gray-600 mb-1">프롬프팅</div>
                      {getResultBadge(evalResult?.prompting?.result)}
                      <div className="text-xs text-gray-500 mt-1">
                        {evalResult?.prompting?.passCount || 0}/{evalResult?.prompting?.totalCount || 7}
                      </div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${evalResult?.answer?.result === "PASS" ? "bg-green-50" : "bg-red-50"}`}>
                      <div className="text-xs text-gray-600 mb-1">답안</div>
                      {getResultBadge(evalResult?.answer?.result)}
                      <div className="text-xs text-gray-500 mt-1">
                        {evalResult?.answer?.passCount || 0}/{evalResult?.answer?.totalCount || 7}
                      </div>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {evalResult?.feedback && (
                    <div className="mb-4 space-y-3 rounded-xl bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">AI 피드백</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-blue-600">프롬프팅: </span>
                          <span className="text-gray-700">{evalResult.feedback.prompting}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-600">답안: </span>
                          <span className="text-gray-700">{evalResult.feedback.answer}</span>
                        </div>
                        <div>
                          <span className="font-medium text-primary">종합: </span>
                          <span className="text-gray-700">{evalResult.feedback.overall}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Answer */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">최종 답안</h4>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {selectedEvaluation.final_answer}
                      </p>
                    </div>
                  </div>

                  {/* Chat History */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">채팅 내역</h4>
                    <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                      {chatHistory.map((msg: { role: string; content: string }, index: number) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                              msg.role === "user"
                                ? "bg-primary text-white"
                                : "border border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
