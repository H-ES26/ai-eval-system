const { createClient } = require("@vercel/postgres");

// 클라이언트 생성 헬퍼 함수
function getClient() {
  return createClient({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
}

// 테이블 초기화 (없으면 생성)
async function initDb() {
  const client = getClient();
  await client.connect();
  
  try {
    await client.query(`
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
    `);
  } finally {
    await client.end();
  }
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

  const client = getClient();
  await client.connect();

  try {
    const result = await client.query(
      `INSERT INTO evaluations (
        employee_id,
        employee_name,
        chat_history,
        final_answer,
        total_score,
        prompting_score,
        answer_score,
        ai_comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        employeeId,
        employeeName,
        JSON.stringify(chatHistory),
        finalAnswer,
        totalScore,
        promptingScore,
        answerScore,
        aiComment,
      ]
    );

    return result.rows[0];
  } finally {
    await client.end();
  }
}

// 모든 평가 결과 조회
async function getAllEvaluations() {
  // 테이블이 없으면 생성
  await initDb();

  const client = getClient();
  await client.connect();

  try {
    const result = await client.query(`
      SELECT * FROM evaluations 
      ORDER BY submitted_at DESC
    `);

    return result.rows;
  } finally {
    await client.end();
  }
}

// 특정 평가 결과 조회
async function getEvaluationById(id) {
  // 테이블이 없으면 생성
  await initDb();

  const client = getClient();
  await client.connect();

  try {
    const result = await client.query(
      `SELECT * FROM evaluations WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  } finally {
    await client.end();
  }
}

module.exports = {
  initDb,
  insertEvaluation,
  getAllEvaluations,
  getEvaluationById,
};
