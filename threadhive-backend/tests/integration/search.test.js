import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import "../setup.js";
import app from "../../src/app.js";
import Thread from "../../src/models/Thread.js";
import Subreddit from "../../src/models/Subreddit.js";
import dotenv from "dotenv";
dotenv.config();

let jwtToken;
let mockUser;

beforeAll(async () => {
  ({ mockUser, jwtToken } = await createUserAndLogin());
});

async function createUserAndLogin() {
  const email = `searchuser+${Date.now()}@example.com`;
  const password = "password123";

  const userRes = await request(app).post("/api/auth/register").send({
    name: "Search User",
    email,
    password,
    isAdmin: false,
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

describe("Search API", () => {
  let subreddit;

  beforeEach(async () => {
    await Thread.deleteMany({});
    await Subreddit.deleteMany({});

    subreddit = await Subreddit.create({
      name: "test-subreddit-search",
      description: "Subreddit for search tests",
      author: mockUser._id,
    });

    // One thread containing a known unique word, one that does not.
    await Thread.create({
      title: "A thread about uniqueword123",
      content: "This thread mentions a very specific term.",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    await Thread.create({
      title: "Completely unrelated thread",
      content: "Nothing special here at all.",
      author: mockUser._id,
      subreddit: subreddit._id,
    });
  });

  // 1
  it("GET /api/search?q=uniqueword123 -> returns 200 and the matching thread", async () => {
    const response = await request(app)
      .get("/api/search?q=uniqueword123")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toContain("uniqueword123");
  });

  // 2
  it("GET /api/search?q=zzznomatchzzz -> returns 200 and an empty array", async () => {
    const response = await request(app)
      .get("/api/search?q=zzznomatchzzz")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  // 3
  it("GET /api/search?q= (blank) -> returns 400", async () => {
    const response = await request(app)
      .get("/api/search?q=")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  // 4
  it("GET /api/search (no q param) -> returns 400", async () => {
    const response = await request(app)
      .get("/api/search")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  // 5
  it("GET /api/search?q=word -> returns 401 when unauthenticated", async () => {
    const response = await request(app).get("/api/search?q=word");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // 6
  it("GET /api/search -> results contain populated author.name and subreddit.name", async () => {
    const response = await request(app)
      .get("/api/search?q=uniqueword123")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(typeof response.body.data[0].author.name).toBe("string");
    expect(typeof response.body.data[0].subreddit.name).toBe("string");
  });

  // 7
  it("GET /api/search -> results are sorted by relevance (best match first)", async () => {
    const response = await request(app)
      .get("/api/search?q=uniqueword123")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].title).toContain("uniqueword123");
  });

  // 8 — a query longer than 200 chars (after trimming) is rejected
  it("GET /api/search -> returns 400 when the trimmed query exceeds 200 chars", async () => {
    const longQuery = "a".repeat(201);
    const response = await request(app)
      .get(`/api/search?q=${longQuery}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  // 9 — a leading "-" must not be treated as a $text negation operator
  it("GET /api/search?q=-uniqueword123 -> treats the term as plain text, not negation", async () => {
    const response = await request(app)
      .get("/api/search?q=-uniqueword123")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toContain("uniqueword123");
  });

  // 10 — an operator-only query returns an empty result set, not an error
  it('GET /api/search?q=" -> returns 200 with an empty array for operator-only input', async () => {
    const response = await request(app)
      .get("/api/search?q=%22")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
