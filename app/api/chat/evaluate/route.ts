import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { insertEvaluation } = require("../../../../database.js"); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `너는 사내 AI 역량 평가자야. 제공된 [채팅 내역]을 보고 질문의 구체성과 프롬프트 활용 능력을 50점 만점으로 채점해 줘. 그리고 [최종 답안]을 보고 문제 해결 능력을 50점 만점으로 채점해 줘. 결과는 반드시 총점(100점 만점), 프롬프팅 점수, 답안 점수, 그리고 상세한 평가 이유를 포함한 깔끔한 JSON 객체 형식으로만 반환해 줘. 다른 부연 설명은 하지 마.

JSON 형식:
{
  "totalScore": number,
  "promptingScore": number,
  "answerScore": number,
  "feedback": {
    "prompting": "프롬프팅 평가 이유",
    "answer": "답안 평가 이유",
    "overall": "종합 평가"
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { chatHistory, finalAnswer, employeeId, employeeName } = await request.json();

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: "chatHistory 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (!finalAnswer || typeof finalAnswer !== "string") {
      return NextResponse.json(
        { error: "finalAnswer 문자열이 필요합니다." },
        { status: 400 }
      );
    }

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { error: "사번(employeeId)과 이름(employeeName)이 필요합니다." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // 채팅 내역을 문자열로 포맷팅
    const chatHistoryText = chatHistory
      .map(
        (msg: { role: string; content: string }) =>
          `[${msg.role === "user" ? "사용자" : "AI"}]: ${msg.content}`
      )
      .join("\n");

    // 평가 요청 프롬프트 구성
    const evaluationPrompt = `${SYSTEM_PROMPT}

[채팅 내역]
${chatHistoryText}

[최종 답안]
${finalAnswer}`;

    const result = await model.generateContent(evaluationPrompt);
    const response = result.response;
    const text = response.text();

    // Gemini 응답에서 JSON 파싱
    // 응답이 마크다운 코드 블록으로 감싸져 있을 수 있음
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const evaluationResult = JSON.parse(jsonText);

    // DB에 평가 결과 저장
    const aiComment = JSON.stringify(evaluationResult.feedback);
    await insertEvaluation({
      employeeId,
      employeeName,
      chatHistory,
      finalAnswer,
      totalScore: evaluationResult.totalScore,
      promptingScore: evaluationResult.promptingScore,
      answerScore: evaluationResult.answerScore,
      aiComment,
    });

    return NextResponse.json(evaluationResult);
  } catch (error) {
    console.error("평가 API 오류:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 응답을 파싱하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "평가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
