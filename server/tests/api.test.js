const test = require('node:test');
const assert = require('node:assert/strict');
const publicController = require('../src/controllers/publicController');
const app = require('../src/app');

test('GET /api/health route is registered on express app', () => {
    const healthRoute = app._router.stack.find(
        (layer) => layer.route && layer.route.path === '/api/health'
    );
    assert.ok(healthRoute, 'Health route should be registered');
    assert.equal(healthRoute.route.methods.get, true);
});

test('publicController.getPlatformStats returns telemetry structure', async () => {
    let responseStatus = null;
    let responseJson = null;

    const mockReq = {};
    const mockRes = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseJson = data;
            return this;
        },
    };
    const mockNext = (err) => {
        if (err) throw err;
    };

    await publicController.getPlatformStats(mockReq, mockRes, mockNext);

    assert.equal(responseStatus, 200);
    assert.equal(responseJson.success, true);
    assert.ok(responseJson.data, 'Expected body.data to exist');
    assert.equal(typeof responseJson.data.githubStars, 'number');
    assert.equal(typeof responseJson.data.commitsAnalyzed, 'number');
    assert.equal(typeof responseJson.data.activeDevelopers, 'number');
    assert.ok(responseJson.data.habitRetention !== undefined);
});

test('publicController.getProfileByUsername rejects missing username with 400', async () => {
    let capturedError = null;
    const mockReq = { params: {} };
    const mockRes = {
        status() { return this; },
        json() { return this; }
    };
    const mockNext = (err) => {
        capturedError = err;
    };

    await publicController.getProfileByUsername(mockReq, mockRes, mockNext);

    assert.ok(capturedError, 'Should invoke next with an error');
    assert.equal(capturedError.statusCode, 400);
    assert.equal(capturedError.message, 'Username is required');
});

test('Rate limiting and public routes are mounted', () => {
    const publicMount = app._router.stack.find(
        (layer) => layer.regexp && layer.regexp.test('/api/public')
    );
    assert.ok(publicMount, 'Public router should be mounted');
});
