const http = require("node:http");

const response = (content) => JSON.stringify({ choices: [{ message: { role: "assistant", content } }] });

http.createServer((request, reply) => {
  if (request.method === "GET" && request.url === "/health") {
    reply.writeHead(200, { "content-type": "application/json" });
    return reply.end(JSON.stringify({ status: "ok" }));
  }
  if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
    reply.writeHead(404); return reply.end();
  }
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    const isVision = body.includes("image_url") || body.includes("vision");
    const content = isVision
      ? "Fixture OCR transcription: water gains energy and evaporates."
      : JSON.stringify({ suggested_marks: 1, correctness: "Partially correct", error_category: "CONCEPT", missing_keywords: ["energy"], feedback: "Explain that water gains energy before it evaporates." });
    reply.writeHead(200, { "content-type": "application/json" });
    reply.end(response(content));
  });
}).listen(8080, "0.0.0.0");
