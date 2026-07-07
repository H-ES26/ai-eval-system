import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// ============================================================
// 📋 평가 루브릭 정의 (O/X 기반 PASS/FAIL 평가)
// ============================================================

const EVALUATION_RUBRIC = `
# AI 역량 평가 루브릭 (O/X 판정 기반)

## 📌 평가 원칙
- 각 평가 요소를 O(충족) 또는 X(미충족)로 판정
- 각 영역별로 O가 70% 이상이면 해당 영역 PASS
- 모든 영역이 PASS여야 최종 PASS, 하나라도 FAIL이면 최종 FAIL
- **모호한 경우 판정 원칙**: 아래 "경계선 판정 기준"을 참고하여 O/X 결정

---

## 🗣️ [영역 1] 프롬프팅 역량 (7개 항목)

### P1. 맥락 제공
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 문제 상황, 목적, 배경 중 1개 이상을 명시하며 질문 | "고객 문의 자동 분류 시스템을 만들려고 하는데, 12개 카테고리로 분류해야 합니다. 어떤 모델이 좋을까요?" |
| **X** | 배경 없이 단편적 질문만 함 | "좋은 모델 추천해줘", "이거 어떻게 해?" |
| **경계선** | 암묵적 맥락만 있는 경우 → **X** | "분류 모델 뭐가 좋아?" (무엇을 분류하는지 불명확) |

### P2. 구체적 질문
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 5W1H(누가/무엇을/언제/어디서/왜/어떻게) 중 2개 이상 포함 | "Python으로 텍스트 분류할 때 BERT와 GPT 중 어느 것이 학습 시간이 더 짧나요?" |
| **X** | 범위가 너무 넓거나 해석이 여러 가지인 질문 | "AI 어떻게 활용해?", "좋은 방법 알려줘" |
| **경계선** | 1개만 구체적인 경우 → **X** | "Python으로 어떻게 해?" (무엇을 하려는지 불명확) |

### P3. 후속 질문
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | AI 응답 후 심화/확장/명확화 질문을 1회 이상 함 | "그 방법의 단점은?", "구체적인 코드 예시 보여줘", "다른 대안은?" |
| **X** | AI 첫 응답 후 추가 질문 없이 대화 종료 | (1회 질문 → 1회 응답으로 끝) |
| **경계선** | 단순 확인 질문만 한 경우 → **X** | "알겠어", "고마워" (발전적 질문 아님) |

### P4. 효율적 대화
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 목표를 향해 점진적으로 수렴하는 대화 진행 | 문제정의 → 해결방안 탐색 → 구체화 → 검증 |
| **X** | 같은 내용 반복, 주제 이탈, 방향 없이 산발적 질문 | 동일 질문 2회 이상 반복, 관련 없는 주제로 전환 |
| **경계선** | 약간의 우회가 있으나 결국 목표 도달 → **O** | 중간에 관련 개념 질문 후 본론 복귀 |

### P5. 응답 검증
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | AI 응답에 대해 확인/검증/반박/수정 요청을 함 | "이 정보가 정확해?", "~한 경우에도 적용돼?", "출처 알려줘" |
| **X** | AI 응답을 그대로 수용, 검증 시도 없음 | (응답 받고 바로 다음 주제로 이동) |
| **경계선** | 간접적 검증 (다른 방법 요청) → **O** | "다른 접근법도 알려줘" (비교를 통한 검증 의도) |

### P6. 형식 지정
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 출력 형식을 명시적으로 요청 | "표로 정리해줘", "3가지로 요약해줘", "코드로 보여줘", "JSON 형식으로" |
| **X** | 형식 요구 없이 열린 질문만 함 | "설명해줘", "알려줘" |
| **경계선** | 암묵적 형식 기대 → **X** | "장단점 알려줘" (표/목록 등 형식 미지정) |

### P7. 제약조건 설정
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 범위/조건/제한/대상을 1개 이상 명시 | "초보자 기준으로", "Python만 사용해서", "500자 이내로", "비용 최소화 관점에서" |
| **X** | 아무 조건 없이 넓은 질문 | "방법 알려줘", "어떻게 하면 돼?" |
| **경계선** | 조건이 너무 일반적인 경우 → **X** | "쉽게 알려줘" (구체적 제약 아님) |

---

## 📝 [영역 2] 답안 작성 역량 (7개 항목)

### A1. 요구사항 충족
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 문제에서 명시한 필수 항목을 모두 다룸 | 문제가 "원인, 해결책, 기대효과" 요구 시 3가지 모두 포함 |
| **X** | 필수 요구 항목 중 1개 이상 누락 | 위 문제에서 "기대효과" 미작성 |
| **경계선** | 간접적으로만 언급된 경우 → **X** | 해결책 설명 중 기대효과를 암시만 함 (별도 서술 없음) |

### A2. 논리적 전개
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 주장 → 이유 → 근거의 흐름이 명확 | "A를 제안한다. 왜냐하면 B이기 때문이다. 실제로 C 사례에서 입증되었다." |
| **X** | 주장만 있고 이유/근거 없음, 또는 논리적 비약 | "A가 좋다. 따라서 A를 해야 한다." (이유 없음) |
| **경계선** | 이유는 있으나 근거가 약한 경우 → **O** | 논리 흐름은 있으나 데이터 부재 (A5에서 감점) |

### A3. 구조화
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 서론(도입)-본론(핵심)-결론(정리) 구조가 인식됨 | 문단 구분, 소제목, 번호 매김 등으로 구조화 |
| **X** | 구조 없이 나열식, 의식의 흐름대로 작성 | 하나의 긴 문단에 모든 내용 혼재 |
| **경계선** | 2개 구조만 있는 경우 (예: 본론+결론) → **O** | 서론 없이 바로 본론 시작했으나 결론으로 마무리 |

### A4. 독창적 재구성
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | AI 응답을 자신의 언어로 재해석/요약/적용 | AI가 5가지 방안 제시 → 상황에 맞는 2가지 선택 후 이유 설명 |
| **X** | AI 응답 문장을 그대로 복사-붙여넣기 | 채팅의 AI 응답과 답안 내용이 90% 이상 동일 |
| **경계선** | 일부만 수정한 경우 → 50% 이상 동일하면 **X** | 어순 변경, 조사 수정 정도만 변경 |

### A5. 근거 제시
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 수치, 사례, 출처, 데이터 중 1개 이상 포함 | "업계 평균 30% 비용 절감", "A사의 도입 사례", "2024년 연구에 따르면" |
| **X** | 주장만 있고 뒷받침 근거 전무 | "이 방법이 효과적이다." (수치/사례 없음) |
| **경계선** | 일반적 상식 수준의 근거 → **O** | "클라우드가 초기 비용이 낮은 것은 일반적으로 알려진 사실이다" |

### A6. 실현 가능성
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 현실적 자원/시간/기술로 실행 가능한 방안 | 기존 인프라 활용, 단계적 도입, 현실적 일정 제시 |
| **X** | 이상적이나 현실 제약 무시 | "모든 시스템을 완전 자동화", 비용/시간 고려 없음 |
| **경계선** | 조건부 실현 가능 → **O** | "추가 예산 확보 시 가능" (조건 명시) |

### A7. 충분한 분량
| 판정 | 기준 | 예시 |
|------|------|------|
| **O** | 핵심 내용이 구체적으로 서술됨 (최소 200자 이상) | 각 항목별 2-3문장 이상의 설명 포함 |
| **X** | 지나치게 빈약하여 평가 불가 (200자 미만) | "A를 하면 된다. 끝." |
| **경계선** | 간결하나 핵심은 담은 경우 → **O** | 200자 내외지만 필수 내용 모두 포함 |

---

## 📊 평가 결과 JSON 형식

\`\`\`json
{
  "prompting": {
    "items": [
      { "code": "P1", "name": "맥락 제공", "result": "O", "reason": "판정 근거" },
      { "code": "P2", "name": "구체적 질문", "result": "X", "reason": "판정 근거" },
      ...
    ],
    "passCount": 5,
    "totalCount": 7,
    "passRate": 71,
    "result": "PASS"
  },
  "answer": {
    "items": [
      { "code": "A1", "name": "요구사항 충족", "result": "O", "reason": "판정 근거" },
      ...
    ],
    "passCount": 6,
    "totalCount": 7,
    "passRate": 86,
    "result": "PASS"
  },
  "finalResult": "PASS",
  "feedback": {
    "prompting": "프롬프팅 역량 피드백 (잘한 점 + 개선점)",
    "answer": "답안 작성 역량 피드백 (잘한 점 + 개선점)",
    "overall": "종합 피드백 및 성장 제언"
  }
}
\`\`\`
`;

// ============================================================
// 📋 평가 프롬프트 생성 함수
// ============================================================

function buildEvaluationPrompt(chatHistory: any[], finalAnswer: string): string {
  // 채팅 내역을 읽기 쉬운 형태로 변환
  const formattedChatHistory = chatHistory.length > 0 
    ? chatHistory.map((msg: any, idx: number) => {
        const role = msg.role === "user" ? "👤 사용자" : "🤖 AI";
        return `[${idx + 1}] ${role}:\n${msg.content}`;
      }).join("\n\n---\n\n")
    : "(대화 내역 없음)";

  return `
당신은 사내 AI 역량 평가 전문가입니다. 

## 🎯 평가 목표
제공된 [대화 로그]와 [최종 답안]을 분석하여, 아래 [평가 기준]에 따라 각 항목을 O/X로 판정하세요.

---

## 📥 [대화 로그] - 사용자와 AI 간의 전체 대화

${formattedChatHistory}

---

## 📝 [최종 답안] - 사용자가 제출한 답안

${finalAnswer || "(답안 없음)"}

---

${EVALUATION_RUBRIC}

---

## ⚠️ 평가 수행 지침

### 1️⃣ 프롬프팅 역량 평가 방법
- **대화 로그에서 "👤 사용자" 발언만 분석**하여 P1~P7 각 항목 판정
- 각 항목의 O/X 기준과 경계선 판정 규칙을 엄격히 적용
- 대화가 없으면 모든 항목 X 처리

### 2️⃣ 답안 작성 역량 평가 방법  
- **[최종 답안]만 분석**하여 A1~A7 각 항목 판정
- AI 응답과 최종 답안을 비교하여 A4(독창적 재구성) 판정
- 답안이 없으면 모든 항목 X 처리

### 3️⃣ 판정 원칙
- **O 판정**: 해당 기준을 명확히 충족하는 증거가 있음
- **X 판정**: 기준 미충족 또는 경계선에서 X로 판정되는 경우
- **reason**: 반드시 대화/답안의 구체적 내용을 인용하여 근거 제시

### 4️⃣ PASS/FAIL 기준
- 각 영역 7개 항목 중 5개 이상 O (≥70%) → PASS
- 프롬프팅 PASS + 답안 PASS → 최종 PASS
- 하나라도 FAIL → 최종 FAIL

---

위 루브릭에 정의된 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 출력하지 마세요.
`;
}

export async function POST(req: Request) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "DB 주소 없음" }, { status: 500 });
  
  const sql = neon(dbUrl);

  try {
    const body = await req.json();
    
    const empId = body.employeeId || body.empId || body.employee_id || "알 수 없음";
    const empName = body.employeeName || body.name || body.employee_name || "익명 사용자";
    const chatHistory = body.chatHistory || body.chat_history || [];
    const finalAnswer = body.finalAnswer || body.final_answer || "";

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 루브릭 기반 평가 프롬프트 생성
    const prompt = buildEvaluationPrompt(chatHistory, finalAnswer);
    
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    // JSON 파싱 및 결과 검증
    let evaluationResult;
    try {
      evaluationResult = JSON.parse(rawText);
      
      // PASS 비율 재계산 및 검증
      if (evaluationResult.prompting?.items) {
        const passCount = evaluationResult.prompting.items.filter((item: any) => item.result === "O").length;
        const totalCount = evaluationResult.prompting.items.length;
        evaluationResult.prompting.passCount = passCount;
        evaluationResult.prompting.totalCount = totalCount;
        evaluationResult.prompting.passRate = Math.round((passCount / totalCount) * 100);
        evaluationResult.prompting.result = evaluationResult.prompting.passRate >= 70 ? "PASS" : "FAIL";
      }
      
      if (evaluationResult.answer?.items) {
        const passCount = evaluationResult.answer.items.filter((item: any) => item.result === "O").length;
        const totalCount = evaluationResult.answer.items.length;
        evaluationResult.answer.passCount = passCount;
        evaluationResult.answer.totalCount = totalCount;
        evaluationResult.answer.passRate = Math.round((passCount / totalCount) * 100);
        evaluationResult.answer.result = evaluationResult.answer.passRate >= 70 ? "PASS" : "FAIL";
      }
      
      // 최종 판정: 모든 영역 PASS여야 최종 PASS
      evaluationResult.finalResult = 
        (evaluationResult.prompting?.result === "PASS" && evaluationResult.answer?.result === "PASS") 
          ? "PASS" 
          : "FAIL";
      
    } catch (parseError) {
      // 파싱 실패 시 기본 구조 반환
      evaluationResult = {
        prompting: {
          items: [],
          passCount: 0,
          totalCount: 7,
          passRate: 0,
          result: "FAIL"
        },
        answer: {
          items: [],
          passCount: 0,
          totalCount: 7,
          passRate: 0,
          result: "FAIL"
        },
        finalResult: "FAIL",
        feedback: {
          prompting: "평가 중 오류가 발생했습니다.",
          answer: "평가 중 오류가 발생했습니다.",
          overall: "다시 시도해 주세요."
        }
      };
    }

    // DB 구조 보정
    await sql`CREATE TABLE IF NOT EXISTS evaluations (id SERIAL PRIMARY KEY, emp_id TEXT, name TEXT, chat_history TEXT, final_answer TEXT, evaluation_result TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS emp_id TEXT;`;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS name TEXT;`;

    // DB 저장
    await sql`
      INSERT INTO evaluations (emp_id, name, chat_history, final_answer, evaluation_result)
      VALUES (${empId}, ${empName}, ${JSON.stringify(chatHistory)}, ${finalAnswer}, ${JSON.stringify(evaluationResult)})
    `;

    return NextResponse.json(evaluationResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}