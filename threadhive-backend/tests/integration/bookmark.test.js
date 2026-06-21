import { beforeAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import '../setup.js';
import app from '../../src/app.js';
import dotenv from 'dotenv';
dotenv.config();
import Thread from '../../src/models/Thread.js';
import Subreddit from '../../src/models/Subreddit.js';
import User from '../../src/models/User.js';

let jwtToken;
let mockUser;
let thread;
let subreddit;

async function createUserAndLogin() {
  const email = `bookmark+${Date.now()}@example.com`;
  const password = 'password123';

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bookmark User', email, password });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

beforeAll(async () => {
  ({ mockUser, jwtToken } = await createUserAndLogin());

  subreddit = await Subreddit.create({
    name: 'bookmark-test-sub',
    description: 'Subreddit for bookmark tests',
    author: mockUser._id,
  });

  thread = await Thread.create({
    title: 'Bookmark test thread',
    content: 'Content for bookmark tests',
    author: mockUser._id,
    subreddit: subreddit._id,
  });
});

beforeEach(async () => {
  // Reset user's savedThreads before each test
  await User.findByIdAndUpdate(mockUser._id, { savedThreads: [] });
});

describe('Bookmarks API', () => {
  const FAKE_ID = '507f1f77bcf86cd799439011';

  // -------------------
  // POST /api/bookmarks/:threadId
  // -------------------
  it('POST /api/bookmarks/:threadId — authenticated → 200, thread in savedThreads', async () => {
    const res = await request(app)
      .post(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Thread saved successfully');
    expect(res.body.data.savedThreads).toContain(thread._id.toString());
  });

  it('POST /api/bookmarks/:threadId — duplicate save → 200, no duplicate', async () => {
    // Save once
    await request(app)
      .post(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    // Save again
    const res = await request(app)
      .post(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.savedThreads;
    const occurrences = ids.filter((id) => id === thread._id.toString()).length;
    expect(occurrences).toBe(1);
  });

  it('POST /api/bookmarks/:threadId — unauthenticated → 401', async () => {
    const res = await request(app).post(`/api/bookmarks/${thread._id}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/bookmarks/:threadId — thread not found → 404', async () => {
    const res = await request(app)
      .post(`/api/bookmarks/${FAKE_ID}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Thread not found');
  });

  // -------------------
  // DELETE /api/bookmarks/:threadId
  // -------------------
  it('DELETE /api/bookmarks/:threadId — authenticated → 200, thread removed', async () => {
    // Save first
    await request(app)
      .post(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    const res = await request(app)
      .delete(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Thread unsaved successfully');
    expect(res.body.data.savedThreads).not.toContain(thread._id.toString());
  });

  it('DELETE /api/bookmarks/:threadId — not in list → 404', async () => {
    const res = await request(app)
      .delete(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Thread not in saved list');
  });

  it('DELETE /api/bookmarks/:threadId — unauthenticated → 401', async () => {
    const res = await request(app).delete(`/api/bookmarks/${thread._id}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // -------------------
  // GET /api/bookmarks
  // -------------------
  it('GET /api/bookmarks — authenticated, threads saved → 200, populated array', async () => {
    await request(app)
      .post(`/api/bookmarks/${thread._id}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    const res = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Saved threads fetched successfully');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);

    const saved = res.body.data[0];
    expect(saved._id).toBe(thread._id.toString());
    expect(saved).toHaveProperty('title');
    expect(saved).toHaveProperty('content');
    expect(saved).toHaveProperty('voteCount');
    expect(saved).toHaveProperty('createdAt');
    expect(saved.author).toHaveProperty('name');
    expect(saved.subreddit).toHaveProperty('name');
  });

  it('GET /api/bookmarks — authenticated, none saved → 200, empty array', async () => {
    const res = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('GET /api/bookmarks — unauthenticated → 401', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
