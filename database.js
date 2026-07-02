const { sql } = require("@vercel/postgres");

// 테이블 초기화 (없으면 생성)
async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      chat_history JSONB NOT NULL,
      final_answer TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      prompting_score INTEGER NOT NULL,
      answer_score INTEGER NOT NULL,
      ai_comment TEXT NOT NULL,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// 평가 결과 저장
async function insertEvaluation({
  employeeId,
  employeeName,
  chatHistory,
  finalAnswer,
  totalScore,
  promptingScore,
  answerScore,
  aiComment,
}) {
  // 테이블이 없으면 생성
  await initDb();

  const result = await sql`
    INSERT INTO evaluations (
      employee_id,
      employee_name,
      chat_history,
      final_answer,
      total_score,
      prompting_score,
      answer_score,
      ai_comment
    ) VALUES (
      ${employeeId},
      ${employeeName},
      ${JSON.stringify(chatHistory)},
      ${finalAnswer},
      ${totalScore},
      ${promptingScore},
      ${answerScore},
      ${aiComment}
    )
    RETURNING *
  `;

  return result.rows[0];
}

// 모든 평가 결과 조회
async function getAllEvaluations() {
  // 테이블이 없으면 생성
  await initDb();

  const result = await sql`
    SELECT * FROM evaluations 
    ORDER BY submitted_at DESC
  `;

  return result.rows;
}

// 특정 평가 결과 조회
async function getEvaluationById(id) {
  // 테이블이 없으면 생성
  await initDb();

  const result = await sql`
    SELECT * FROM evaluations 
    WHERE id = ${id}
  `;

  return result.rows[0] || null;
}

module.exports = {
  initDb,
  insertEvaluation,
  getAllEvaluations,
  getEvaluationById,
};

