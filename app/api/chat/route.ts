import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Gemini 대화 기록 형식으로 변환
    let history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Gemini는 첫 번째 메시지가 반드시 'user' 역할이어야 함
    // 첫 번째 메시지가 'model'인 경우 제거
    while (history.length > 0 && history[0].role !== "user") {
      history = history.slice(1);
    }

    // 마지막 메시지 (현재 사용자 질문)
    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ 
      role: "assistant",
      content: text 
    });
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    return NextResponse.json(
      { error: "AI 응답 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
