import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "DB 주소 없음" }, { status: 500 });

  const sql = neon(dbUrl);

  try {
    // DB에서 원본 데이터를 가져옵니다.
    const rows = await sql`SELECT * FROM evaluations ORDER BY created_at DESC`;

    // 프론트엔드가 기대하는 구조로 변환
    const formatted = rows.map((row) => {
      // 채팅 내역 파싱
      let chatHistoryArray = [];
      try {
        if (row.chat_history) {
          chatHistoryArray = typeof row.chat_history === 'string' 
            ? JSON.parse(row.chat_history) 
            : row.chat_history;
        }
      } catch (e) { 
        console.log("채팅내역 파싱 에러"); 
      }

      // 평가 결과는 문자열 그대로 전달 (프론트에서 파싱)
      return {
        id: row.id,
        emp_id: row.emp_id || "알 수 없음",
        name: row.name || "익명 사용자",
        chat_history: chatHistoryArray,
        final_answer: row.final_answer || "",
        evaluation_result: row.evaluation_result || "{}",
        created_at: row.created_at || new Date().toISOString()
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}