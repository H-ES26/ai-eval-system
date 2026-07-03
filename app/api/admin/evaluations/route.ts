import { GoogleGenerativeAI } from "@google/generative-ai";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// 1. Vercel 배포(Build) 검사 통과를 위한 깐깐한 사전 선언
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 2. 관리자 페이지에서 DB의 평가 내역을 불러오는 API (Neon 최신 부품 적용)
export async function GET() {
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json(
      { error: "DB 주소를 찾을 수 없습니다." },
      { status: 500 }
    );
  }

  // 구형 createClient 대신 최신 neon() 사용
  const sql = neon(dbUrl);

  try {
    // 평가 데이터를 최신순으로 정렬해서 가져오기
    const evaluations = await sql`
      SELECT * FROM evaluations ORDER BY created_at DESC
    `;
    return NextResponse.json({ success: true, data: evaluations });
  } catch (error) {
    console.error("관리자 데이터 로딩 에러:", error);
    return NextResponse.json(
      { error: "데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}