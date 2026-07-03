import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// ⭐ 방어 1: AI가 대답을 늦게 해도 Vercel이 강제로 끊지 못하도록 최대 60초 대기 허용
export const maxDuration = 60;

export async function POST(req: Request) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json({ error: "DB 주소를 찾을 수 없습니다." }, { status: 500 });
  }

  const sql = neon(dbUrl);

  try {
    const body = await req.json();

    // ⭐ 방어 2: 화면에서 어떤 이름표로 보내든, 비어서 오든(undefined) 완벽하게 캐치해서 채워 넣습니다!
    const empId = body.empId || body.employee_id || body.employeeId || "알 수 없음";
    const empName = body.name || body.employee_name || body.employeeName || "익명 사용자";
    const chatHistory = body.chatHistory || body.chat_history || [];
    const finalAnswer = body.finalAnswer || body.final_answer || body.answer || "";

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      너는 사내 AI 역량 평가자야.
      [채팅 내역]: ${JSON.stringify(chatHistory)}
      [최종 답안]: ${finalAnswer}
      위 내용을 바탕으로 프롬프팅 스킬(50점 만점)과 문제 해결력(50점 만점)을 평가해줘.
      결과는 반드시 아래 JSON 양식에 맞춰서 답변해. 백틱(\`\`\`)이나 다른 부연 설명은 절대 쓰지 마.
      {
        "totalScore": 80,
        "promptingScore": 40,
        "answerScore": 40,
        "feedback": {
          "prompting": "프롬프팅에 대한 상세 평가 코멘트",
          "answer": "답안에 대한 상세 평가 코멘트",
          "overall": "전체적인 종합 평가 및 조언 코멘트"
        }
      }
    `;
    
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(rawText);
    } catch (e) {
      console.log("JSON 파싱 실패");
    }

    const safeResult = {
      totalScore: parsedResult?.totalScore || 0,
      promptingScore: parsedResult?.promptingScore || parsedResult?.promptScore || 0,
      answerScore: parsedResult?.answerScore || 0,
      feedback: {
        prompting: parsedResult?.feedback?.prompting || "평가 코멘트를 불러오는 중입니다.",
        answer: parsedResult?.feedback?.answer || "평가 코멘트를 불러오는 중입니다.",
        overall: parsedResult?.feedback?.overall || "종합 평가 코멘트를 불러오는 중입니다."
      }
    };

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

    // 방어 3: undefined가 하나도 섞여 있지 않은 완벽하게 안전한 값만 DB에 삽입!
    await sql`
      INSERT INTO evaluations (emp_id, name, chat_history, final_answer, evaluation_result)
      VALUES (${empId}, ${empName}, ${JSON.stringify(chatHistory)}, ${finalAnswer}, ${rawText || '{}'})
    `;

    return NextResponse.json(safeResult);

  } catch (error) {
    // Vercel 로그(Logs) 탭에서 정확한 에러 원인을 파악할 수 있도록 기록
    console.error("평가 및 DB 저장 에러의 진짜 원인:", error);
    return NextResponse.json(
      { error: "평가 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}