import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

      return {
        id: row.id,
        // 💡 DB에 실제 저장된 사번과 이름을 매핑합니다.
        empId: row.emp_id || "알 수 없음", 
        name: row.name || "익명 사용자",
        totalScore: parsedResult.totalScore || 0,
        promptingScore: parsedResult.promptingScore || 0,
        answerScore: parsedResult.answerScore || 0,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error("관리자 데이터 로딩 에러:", error);
    return NextResponse.json({ error: "데이터를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}