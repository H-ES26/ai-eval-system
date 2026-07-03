import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "DB 주소 없음" }, { status: 500 });
  
  const sql = neon(dbUrl);

  try {
    const body = await req.json();
    
    // ⭐ 프론트엔드가 보내는 'employeeId'와 'employeeName'을 완벽하게 매핑합니다!
    const empId = body.employeeId || body.empId || body.employee_id || "알 수 없음";
    const empName = body.employeeName || body.name || body.employee_name || "익명 사용자";
    const chatHistory = body.chatHistory || body.chat_history || [];
    const finalAnswer = body.finalAnswer || body.final_answer || "";

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      채팅내역: ${JSON.stringify(chatHistory)}
      최종답안: ${finalAnswer}
      위 내용을 프롬프팅(50점), 답안(50점)으로 평가해 JSON으로만 답해.
      { "totalScore": 80, "promptingScore": 40, "answerScore": 40, "feedback": { "prompting": "...", "answer": "...", "overall": "..." } }
    `;
    
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    // DB 구조 보정
    await sql`CREATE TABLE IF NOT EXISTS evaluations (id SERIAL PRIMARY KEY, emp_id TEXT, name TEXT, chat_history TEXT, final_answer TEXT, evaluation_result TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS emp_id TEXT;`;
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS name TEXT;`;

    // 완벽하게 받아낸 사번과 이름을 DB에 저장!
    await sql`
      INSERT INTO evaluations (emp_id, name, chat_history, final_answer, evaluation_result)
      VALUES (${empId}, ${empName}, ${JSON.stringify(chatHistory)}, ${finalAnswer}, ${rawText})
    `;

    return NextResponse.json(JSON.parse(rawText));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}