const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "evaluations.json");

// 데이터베이스 초기화 (파일이 없으면 생성)
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ evaluations: [] }, null, 2));
  }
}

// 데이터베이스 읽기
function readDb() {
  initDb();
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

// 데이터베이스 쓰기
function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
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
  const db = readDb();
  
  const newEvaluation = {
    id: db.evaluations.length > 0 ? Math.max(...db.evaluations.map(e => e.id)) + 1 : 1,
    employee_id: employeeId,
    employee_name: employeeName,
    chat_history: chatHistory,
    final_answer: finalAnswer,
    total_score: totalScore,
    prompting_score: promptingScore,
    answer_score: answerScore,
    ai_comment: aiComment,
    submitted_at: new Date().toISOString(),
  };

  db.evaluations.push(newEvaluation);
  writeDb(db);
  
  return newEvaluation;
}

// 모든 평가 결과 조회
async function getAllEvaluations() {
  const db = readDb();
  // 최신순 정렬
  return db.evaluations.sort((a, b) => 
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
}

// 특정 평가 결과 조회
async function getEvaluationById(id) {
  const db = readDb();
  return db.evaluations.find(e => e.id === id) || null;
}

module.exports = {
  insertEvaluation,
  getAllEvaluations,
  getEvaluationById,
};
