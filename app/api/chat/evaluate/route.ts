import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

import { createClient } from "@vercel/postgres";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING;

  if (!dbUrl) {
    return NextResponse.json(
      { error: "DB 주소를 찾을 수 없습니다." },
      { status: 500 }
    );
  }

  const client = createClient({ connectionString: dbUrl });

  try {
    const { chatHistory, finalAnswer } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // ⭐ 수정 포인트 1: AI에게 promptingScore 이름과 overall(종합평가) 항목을 명시적으로 요구합니다.
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
      console.log("JSON 파싱 실패, AI가 딴소리를 했습니다.");
    }

    // ⭐ 수정 포인트 2: 프론트엔드가 정확히 인식하도록 데이터 이름을 맞춰줍니다.
    const safeResult = {
      totalScore: parsedResult?.totalScore || 0,
      promptingScore: parsedResult?.promptingScore || parsedResult?.promptScore || 0, // 둘 다 대비
      answerScore: parsedResult?.answerScore || 0,
      feedback: {
        prompting: parsedResult?.feedback?.prompting || "평가 코멘트를 불러오는 중입니다.",
        answer: parsedResult?.feedback?.answer || "평가 코멘트를 불러오는 중입니다.",
        overall: parsedResult?.feedback?.overall || "종합 평가 코멘트를 불러오는 중입니다."
      }
    };

    await client.connect();
    
    await client.sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        chat_history TEXT,
        final_answer TEXT,
        evaluation_result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.sql`
      INSERT INTO evaluations (chat_history, final_answer, evaluation_result)
      VALUES (${JSON.stringify(chatHistory)}, ${finalAnswer}, ${rawText})
    `;

    return NextResponse.json(safeResult);

  } catch (error) {
    console.error("평가 및 DB 저장 에러:", error);
    return NextResponse.json(
      { error: "평가 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}