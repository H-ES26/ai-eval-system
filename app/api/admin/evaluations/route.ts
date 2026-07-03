import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// ⭐ 핵심 1: Next.js가 옛날 에러를 기억(캐시)하지 못하도록 매번 새롭게 강제 호출!
export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json(
      { error: "DB 주소를 찾을 수 없습니다." },
      { status: 500 }
    );
  }

  const sql = neon(dbUrl);

  try {
    const evaluations = await sql`
      SELECT * FROM evaluations ORDER BY created_at DESC
    `;
    
    // ⭐ 핵심 2: 포장지({ success: true, data: ... })를 벗기고, 알맹이(배열)만 바로 던져줍니다!
    return NextResponse.json(evaluations);
    
  } catch (error) {
    console.error("관리자 데이터 로딩 에러:", error);
    return NextResponse.json(
      { error: "데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}