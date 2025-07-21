const request = require('supertest');
const express = require('express');

let app;
beforeAll(() => {
  app = require('../server');
});

describe('GET /health', () => {
  it('should return health message', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Still working... on *my* machine 🧃');
  });
});