import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "DB 주소 없음" }, { status: 500 });

  const sql = neon(dbUrl);

  try {
    // 1. DB에서 원본 데이터를 가져옵니다.
    const rows = await sql`SELECT * FROM evaluations ORDER BY created_at DESC`;

    // 2. 프론트엔드 화면이 찾는 '정확한 이름표'로 바꿔서 포장합니다.
    const formatted = rows.map((row) => {
      // 점수와 코멘트 파싱
      let parsedResult: any = {};
      try {
        if (row.evaluation_result) parsedResult = JSON.parse(row.evaluation_result);
      } catch (e) { console.log("평가결과 파싱 에러"); }

      // 채팅 내역 파싱
      let chatHistoryArray = [];
      try {
        if (row.chat_history) {
          chatHistoryArray = typeof row.chat_history === 'string' ? JSON.parse(row.chat_history) : row.chat_history;
        }
      } catch (e) { console.log("채팅내역 파싱 에러"); }

      // ⭐ 프론트엔드 코드가 애타게 찾고 있는 바로 그 이름표들입니다!
      return {
        id: row.id,
        employee_id: row.emp_id || "알 수 없음",
        employee_name: row.name || "익명 사용자",
        chat_history: chatHistoryArray,
        final_answer: row.final_answer || "",
        total_score: parsedResult.totalScore || parsedResult.total_score || 0,
        prompting_score: parsedResult.promptingScore || parsedResult.promptScore || 0,
        answer_score: parsedResult.answerScore || 0,
        // 화면에서 JSON.parse를 하므로 반드시 문자열로 넘깁니다.
        ai_comment: JSON.stringify(parsedResult.feedback || { prompting: "-", answer: "-", overall: "-" }),
        submitted_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}