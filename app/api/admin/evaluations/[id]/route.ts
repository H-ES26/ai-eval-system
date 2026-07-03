import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const sql = neon(dbUrl!);

  try {
    const data = await sql`SELECT * FROM evaluations WHERE id = ${params.id}`;
    if (!data.length) return NextResponse.json({ error: "없음" }, { status: 404 });
    
    const row = data[0];
    let res: any = {};
    try { res = JSON.parse(row.evaluation_result); } catch (e) { res = {}; }

    return NextResponse.json({
      id: row.id,
      employee_id: row.emp_id || "알 수 없음",
      employee_name: row.name || "익명 사용자",
      chat_history: typeof row.chat_history === 'string' ? JSON.parse(row.chat_history) : row.chat_history,
      final_answer: row.final_answer || "",
      total_score: res.totalScore || 0,
      prompting_score: res.promptingScore || 0,
      answer_score: res.answerScore || 0,
      ai_comment: JSON.stringify(res.feedback || {}),
      submitted_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}