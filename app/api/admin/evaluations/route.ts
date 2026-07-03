import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

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
    return NextResponse.json({ success: true, data: evaluations });
  } catch (error) {
    return NextResponse.json(
      { error: "데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}