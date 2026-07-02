import { BrainCircuit } from "lucide-react"

export function AssessmentHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BrainCircuit className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">AI 역량 평가</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-sm font-medium text-foreground">홍길동</span>
          <span className="text-xs text-muted-foreground">사번: 12345</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          홍
        </div>
      </div>
    </header>
  )
}
