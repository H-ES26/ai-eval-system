import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json({ error: "DB 주소를 찾을 수 없습니다." }, { status: 500 });
  }

  const sql = neon(dbUrl);

  try {
    const rawData = await sql`SELECT * FROM evaluations WHERE id = ${params.id}`;

    if (rawData.length === 0) {
      return NextResponse.json({ error: "해당 평가 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const row = rawData[0];
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(row.evaluation_result);
    } catch (e) {
      console.log("JSON 파싱 에러");
    }

    const formattedDetail = {
      id: row.id,
      // 💡 상세 보기 데이터에도 실제 사번과 이름을 전달합니다.
      empId: row.emp_id || "알 수 없음",
      name: row.name || "익명 사용자",
      totalScore: parsedResult.totalScore || 0,
      promptingScore: parsedResult.promptingScore || 0,
      answerScore: parsedResult.answerScore || 0,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      chatHistory: row.chat_history,
      finalAnswer: row.final_answer,
      feedback: parsedResult.feedback || {}
    };

    return NextResponse.json(formattedDetail);

  } catch (error) {
    console.error("상세 데이터 로딩 에러:", error);
    return NextResponse.json({ error: "상세 데이터를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}