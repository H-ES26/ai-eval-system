import { FileText } from "lucide-react"

export function ProblemPanel() {
  return (
    <section
      aria-label="평가 문제"
      className="flex h-full min-h-0 flex-col border-r border-border bg-card"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-5">
        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">평가 문제</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <article className="prose-sm max-w-none text-sm leading-relaxed text-foreground">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            문제 1 / 실무 시나리오
          </span>

          <h3 className="mt-4 text-base font-semibold text-foreground">문제 상황</h3>
          <p className="mt-2 text-muted-foreground">
            당신은 사내 고객지원팀의 데이터 분석가입니다. 최근 3개월간 고객 문의(CS) 티켓이 급증하여 응대
            지연이 발생하고 있습니다. 경영진은 AI를 활용해 반복 문의를 자동 분류하고 우선순위를 지정하는
            시스템의 도입 타당성을 검토하라고 요청했습니다.
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">주어진 데이터</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>월별 문의 티켓 로그 (약 42,000건)</li>
            <li>문의 유형 태그 (배송, 환불, 제품결함, 계정 등 12종)</li>
            <li>담당자별 평균 응대 시간 및 만족도 점수(CSAT)</li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-foreground">요구 사항</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>AI 자동 분류 도입 시 기대되는 효과를 정량적 지표로 제시하세요.</li>
            <li>도입에 필요한 데이터 전처리 및 모델 선택 근거를 설명하세요.</li>
            <li>예상되는 리스크와 그에 대한 완화 방안을 최소 2가지 이상 서술하세요.</li>
          </ol>

          <h3 className="mt-6 text-base font-semibold text-foreground">제약 조건</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>개인정보(PII)는 반드시 비식별화 처리되어야 합니다.</li>
            <li>기존 CS 인력의 재배치 계획을 함께 고려해야 합니다.</li>
            <li>초기 도입 예산은 5,000만 원을 초과할 수 없습니다.</li>
            <li>답안은 우측 답안 작성란에 논리적 근거와 함께 작성합니다.</li>
          </ul>

          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              힌트: 중앙의 AI 어시스턴트에게 자유롭게 질문하며 아이디어를 정리할 수 있습니다. 단, 최종 판단과
              작성은 본인이 직접 수행해야 합니다.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
