import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// ⭐ Next.js의 지독한 서버 캐시를 영구적으로 완전히 차단합니다.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json({ error: "DB 주소를 찾을 수 없습니다." }, { status: 500 });
  }

  const sql = neon(dbUrl);

  try {
    const rawEvaluations = await sql`SELECT * FROM evaluations ORDER BY created_at DESC`;

    const formattedData = rawEvaluations.map((row) => {
      let parsedResult: any = {};
      try {
        parsedResult = JSON.parse(row.evaluation_result);
      } catch (e) {
        console.log("JSON 파싱 에러");
      }

      let chatHistory = [];
      try {
        chatHistory = typeof row.chat_history === 'string' ? JSON.parse(row.chat_history) : row.chat_history;
      } catch (e) {
        console.log("채팅 내역 파싱 에러");
      }

      return {
        id: row.id,
        employee_id: row.emp_id || "알 수 없음", 
        employee_name: row.name || "익명 사용자",
        chat_history: chatHistory || [],
        final_answer: row.final_answer || "",
        total_score: parsedResult.totalScore || 0,
        prompting_score: parsedResult.promptingScore || parsedResult.promptScore || 0,
        answer_score: parsedResult.answerScore || 0,
        ai_comment: JSON.stringify(parsedResult.feedback || { 
          prompting: "평가 없음", answer: "평가 없음", overall: "평가 없음" 
        }),
        submitted_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error("관리자 데이터 로딩 에러:", error);
    return NextResponse.json({ error: "데이터를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}