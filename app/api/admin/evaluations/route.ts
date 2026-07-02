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
