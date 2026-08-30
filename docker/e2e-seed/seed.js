const http = require("node:http");

const auth = "http://auth-service:8081";
const learning = "http://learning-service:8083";
const tutor = { email: "e2e.tutor@example.test", password: "E2eTutor!Pass123" };
const student = { email: "e2e.student@example.test", password: "E2eStudent!Pass123" };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const payload = async (response, description) => {
  const body = await response.text();
  if (!response.ok) throw new Error(`${description} failed (${response.status}): ${body}`);
  return body ? JSON.parse(body) : null;
};
const request = async (url, description, options = {}) => payload(await fetch(url, options), description);
const json = (token, body, idempotencyKey) => ({
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
  body: JSON.stringify(body),
});
const decodeUserId = (token) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")).userId;

async function eventually(work, description) {
  let last;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { return await work(); } catch (error) { last = error; await wait(1000); }
  }
  throw new Error(`${description} did not become ready: ${last instanceof Error ? last.message : String(last)}`);
}

function firstQuestionNode(nodes) {
  for (const node of nodes) {
    if (node.nodeType === "TOPIC" || node.nodeType === "SUBTOPIC") return node;
    const child = firstQuestionNode(node.children || []);
    if (child) return child;
  }
  return null;
}

async function login(credentials) {
  return request(`${auth}/api/auth/login`, `login ${credentials.email}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(credentials),
  });
}

async function seed() {
  await eventually(() => request(`${auth}/actuator/health`, "auth health"), "auth service");
  await eventually(() => request(`${learning}/actuator/health`, "learning health"), "learning service");

  const tutorSession = await eventually(() => login(tutor), "bootstrap tutor");
  let studentSession;
  try {
    studentSession = await request(`${auth}/api/auth/register`, "register E2E student", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...student, fullName: "E2E Student", role: "STUDENT" }),
    });
  } catch (error) {
    studentSession = await login(student);
  }
  const tutorToken = tutorSession.token;
  const studentToken = studentSession.token;
  const classItem = await request(`${learning}/api/learning/tutor/classes`, "create E2E class", json(tutorToken, {
    className: "E2E Science Class", subject: "Science", level: "Primary 5", status: "ACTIVE", schedules: [],
  }));
  const studentItem = await request(`${learning}/api/learning/tutor/students`, "create linked E2E student", json(tutorToken, {
    fullName: "E2E Student", loginUserId: decodeUserId(studentToken), classIds: [classItem.id],
  }));
  const tree = await request(`${learning}/api/learning/shared/syllabus/tree`, "load syllabus", { headers: { authorization: `Bearer ${tutorToken}` } });
  const topic = firstQuestionNode(tree.items);
  if (!topic) throw new Error("Seeded syllabus contains no TOPIC or SUBTOPIC node.");
  const question = await request(`${learning}/api/learning/tutor/questions`, "create E2E question", json(tutorToken, {
    code: "E2E-SCI-001", syllabusTopicId: topic.id, questionType: "SHORT_ANSWER",
    prompt: "Explain why water evaporates on a hot day.", totalMarks: 2,
    modelAnswer: "Water gains energy and changes into water vapour.", archiveState: "ACTIVE",
    markingComponents: [{ description: "States that water gains energy", marks: 2, keywords: ["energy"] }], keywords: ["energy"],
  }));
  const generated = await request(`${learning}/api/learning/tutor/classes/${classItem.id}/worksheet-generation-requests`, "generate E2E worksheet", json(tutorToken, {
    targetMode: "STUDENTS", studentIds: [studentItem.id], topicIds: [topic.id], questionCount: 1,
    title: "E2E Evaporation Worksheet", instructions: "Explain your answer using the word energy.",
  }, "e2e-seed-standard-worksheet"));
  if (!generated.worksheet?.id) throw new Error(`Seed worksheet was not generated: ${JSON.stringify(generated)}`);
  const worksheet = await request(`${learning}/api/learning/tutor/worksheets/${generated.worksheet.id}/approve`, "approve E2E worksheet", json(tutorToken, {}));
  return {
    tutor, student, classId: classItem.id, studentId: studentItem.id, topicId: topic.id,
    questionId: question.id, worksheetId: worksheet.id, tutorToken, studentToken,
  };
}

let scenario = null;
let failure = null;
seed().then((result) => { scenario = result; }).catch((error) => { failure = error instanceof Error ? error.message : String(error); });

http.createServer((request, reply) => {
  if (request.url === "/health") {
    reply.writeHead(scenario ? 200 : 503, { "content-type": "application/json" });
    return reply.end(JSON.stringify(scenario ? { status: "ready" } : { status: "starting", error: failure }));
  }
  if (request.url === "/context" && scenario) {
    // Tokens are intentionally omitted: browser tests authenticate through the UI.
    const { tutorToken, studentToken, ...safeScenario } = scenario;
    reply.writeHead(200, { "content-type": "application/json" }); return reply.end(JSON.stringify(safeScenario));
  }
  reply.writeHead(404); reply.end();
}).listen(8090, "0.0.0.0");
