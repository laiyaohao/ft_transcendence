import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMasteryMap, fetchMasteryTopic, MasteryApiError, parseMasteryMap, parseMasteryTopicDetail } from "./mastery";

const map = {
  studentId: 31,
  overallScore: 68,
  nodes: [{
    topicId: 41,
    topicCode: "SCI-P5-01",
    topicName: "Adaptation",
    parentTopicId: 9,
    parentDepth: 2,
    depth: 3,
    nodeType: "TOPIC",
    score: 68,
    status: "IMPROVING",
    attemptCount: 4,
    calculatedAt: "2026-09-02T10:00:00",
  }],
};

describe("mastery client", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); localStorage.clear(); });

  it("uses the self-scoped and owner-scoped canonical map endpoints", async () => {
    localStorage.setItem("jwt_token", "stored-token");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(map), { status: 200 }));
    await expect(fetchMasteryMap()).resolves.toEqual(map);
    expect(fetch).toHaveBeenLastCalledWith("http://localhost:8083/api/learning/student/mastery-map", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer stored-token" }) }));

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(map), { status: 200 }));
    await expect(fetchMasteryMap(31)).resolves.toEqual(map);
    expect(fetch).toHaveBeenLastCalledWith("http://localhost:8083/api/learning/tutor/students/31/mastery-map", expect.anything());
  });

  it("requests topic drill-down and rejects invalid IDs before fetching", async () => {
    const detail = { studentId: 31, node: map.nodes[0], history: [] };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }));
    await expect(fetchMasteryTopic(41, 31)).resolves.toEqual(detail);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8083/api/learning/tutor/students/31/mastery-map/topics/41", expect.anything());

    vi.mocked(fetch).mockClear();
    await expect(fetchMasteryMap(0)).rejects.toBeInstanceOf(MasteryApiError);
    await expect(fetchMasteryTopic(0)).rejects.toBeInstanceOf(MasteryApiError);
    expect(fetch).not.toHaveBeenCalled();

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }));
    await expect(fetchMasteryTopic(41)).resolves.toEqual(detail);
    expect(fetch).toHaveBeenLastCalledWith("http://localhost:8083/api/learning/student/mastery-map/topics/41", expect.anything());
  });

  it("preserves structured failures and refuses malformed or out-of-range payloads", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Mastery data was not found" }), { status: 404 }));
    await expect(fetchMasteryMap(31)).rejects.toMatchObject({ status: 404, message: "Mastery data was not found" });
    expect(() => parseMasteryMap({ ...map, nodes: [{ ...map.nodes[0], score: 101 }] })).toThrow("mastery response is invalid");
    expect(() => parseMasteryMap({ ...map, nodes: [{ ...map.nodes[0], status: "LOCKED" }] })).toThrow("mastery response is invalid");
    expect(() => parseMasteryTopicDetail({ studentId: 31, node: map.nodes[0], history: [{ previousScore: null }] })).toThrow("mastery response is invalid");
  });
});
