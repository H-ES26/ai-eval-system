import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json({ error: "DB 주소가 설정되지 않았습니다." }, { status: 500 });
  }

  const sql = neon(dbUrl);

  try {
    const body = await req.json();

    const empId = body.empId || body.employee_id || body.employeeId || "알 수 없음";
    const empName = body.name || body.employee_name || body.employeeName || "익명 사용자";
    const chatHistory = body.chatHistory || body.chat_history || [];
    const finalAnswer = body.finalAnswer || body.final_answer || body.answer || "";

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("Gemini API 키가 Vercel에 설정되지 않았습니다.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      너는 사내 AI 역량 평가자야.
      [채팅 내역]: ${JSON.stringify(chatHistory)}
      [최종 답안]: ${finalAnswer}
      위 내용을 바탕으로 프롬프팅 스킬(50점 만점)과 문제 해결력(50점 만점)을 평가해줘.
      결과는 반드시 아래 JSON 양식에 맞춰서 답변해.
      {
        "totalScore": 80,
        "promptingScore": 40,
        "answerScore": 40,
        "feedback": {
          "prompting": "코멘트",
          "answer": "코멘트",
          "overall": "코멘트"
        }
      }
    `;
    
    // 1. AI 평가 요청
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`AI가 JSON 양식을 지키지 않았습니다. AI 응답: ${rawText}`);
    }

    const safeResult = {
      totalScore: parsedResult?.totalScore || 0,
      promptingScore: parsedResult?.promptingScore || parsedResult?.promptScore || 0,
      answerScore: parsedResult?.answerScore || 0,
      feedback: {
        prompting: parsedResult?.feedback?.prompting || "내용 없음",
        answer: parsedResult?.feedback?.answer || "내용 없음",
        overall: parsedResult?.feedback?.overall || "내용 없음"
      }
    };

    // 2. DB 테이블 생성 및 컬럼 추가
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        emp_id TEXT,
        name TEXT,
        chat_history TEXT,
        final_answer TEXT,
        evaluation_result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS emp_id TEXT;`;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS name TEXT;`;

    // 3. DB 저장
    await sql`
      INSERT INTO evaluations (emp_id, name, chat_history, final_answer, evaluation_result)
      VALUES (${empId}, ${empName}, ${JSON.stringify(chatHistory)}, ${finalAnswer}, ${rawText})
    `;

    return NextResponse.json(safeResult);

  } catch (error: any) {
    // ⭐ 핵심: 두루뭉술한 에러 메시지 대신, "진짜 원인"을 화면에 바로 쏴줍니다!
    const realErrorMessage = error instanceof Error ? error.message : String(error);
    console.error("진짜 에러 원인:", realErrorMessage);
    
    return NextResponse.json(
      { error: `상세 에러: ${realErrorMessage}` },
      { status: 500 }
    );
  }
}