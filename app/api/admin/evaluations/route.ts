import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getAllEvaluations } = require("../../../../database.js");

export async function GET() {
  try {
    const evaluations = await getAllEvaluations();
    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("평가 내역 조회 오류:", error);
    return NextResponse.json(
      { error: "평가 내역을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
// 환경변수에 등록된 모델을 쓰고, 만약 없다면 기본값으로 gemini-2.5-flash를 쓴다는 뜻입니다.
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash" 
});