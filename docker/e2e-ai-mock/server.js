const http = require("node:http");

const HEALTH_PATH = "/health";
const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";
const JSON_HEADERS = { "content-type": "application/json" };

const OCR_TRANSCRIPTION =
  "Fixture OCR transcription: water gains energy and evaporates.";
const MARKING_SUGGESTION = JSON.stringify({
  suggested_marks: 1,
  correctness: "Partially correct",
  error_category: "CONCEPT",
  missing_keywords: ["energy"],
  feedback: "Explain that water gains energy before it evaporates.",
});

function createChatCompletionResponse(content) {
  return JSON.stringify({
    choices: [{ message: { role: "assistant", content } }],
  });
}

function isVisionRequest(body) {
  return body.includes("image_url") || body.includes("vision");
}

function getMockResponseContent(body) {
  return isVisionRequest(body) ? OCR_TRANSCRIPTION : MARKING_SUGGESTION;
}

function sendJsonResponse(reply, statusCode, responseBody) {
  reply.writeHead(statusCode, JSON_HEADERS);
  reply.end(JSON.stringify(responseBody));
}

function sendChatCompletionResponse(reply, content) {
  reply.writeHead(200, JSON_HEADERS);
  reply.end(createChatCompletionResponse(content));
}

function handleChatCompletionsRequest(request, reply) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk;
  });

  request.on("end", () => {
    const content = getMockResponseContent(body);
    sendChatCompletionResponse(reply, content);
  });
}

function handleRequest(request, reply) {
  const isHealthCheck =
    request.method === "GET" && request.url === HEALTH_PATH;

  if (isHealthCheck) {
    return sendJsonResponse(reply, 200, { status: "ok" });
  }

  const isChatCompletionsRequest =
    request.method === "POST" && request.url === CHAT_COMPLETIONS_PATH;

  if (!isChatCompletionsRequest) {
    reply.writeHead(404);
    return reply.end();
  }

  return handleChatCompletionsRequest(request, reply);
}

http.createServer(handleRequest).listen(8080, "0.0.0.0");
