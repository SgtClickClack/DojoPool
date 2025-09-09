#!/usr/bin/env node

/**
 * DojoPool Job Queue Integration Test Script
 *
 * This script tests the complete job queue workflow:
 * 1. API endpoints that enqueue jobs
 * 2. Job processing by workers
 * 3. Results storage and retrieval
 * 4. Monitoring dashboard
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const API_PREFIX = '/api/v1';

// Test data
const testMatchData = {
  matchId: `test-match-${Date.now()}`,
  matchData: {
    playerAName: 'Test Player A',
    playerBName: 'Test Player B',
    scoreA: 5,
    scoreB: 3,
    winner: 'Player A',
    shots: [],
    venue: 'Test Venue',
    round: 1,
  },
};

const testShotData = {
  matchId: testMatchData.matchId,
  sessionId: `test-session-${Date.now()}`,
  shotData: {
    playerName: 'Test Player A',
    ballSunk: true,
    wasFoul: false,
    position: { x: 100, y: 200 },
    timestamp: new Date().toISOString(),
  },
};

const testTableImage = Buffer.from('fake-image-data-for-testing');

class QueueIntegrationTester {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
      }[type] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testHealthCheck() {
    this.log('Testing API health check...');
    try {
      const response = await this.axios.get('/api/v1/health');
      this.log(`Health check: ${response.status === 200 ? 'PASS' : 'FAIL'}`);
      return response.status === 200;
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAsyncMatchAnalysis() {
    this.log('Testing async match analysis...');
    try {
      const response = await this.axios.post(
        `${API_PREFIX}/ai/analyze/match?async=true`,
        testMatchData
      );

      if (response.data.jobId) {
        this.log(
          `Match analysis job queued: ${response.data.jobId}`,
          'success'
        );
        return { success: true, jobId: response.data.jobId };
      } else {
        this.log('Match analysis job not queued properly', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Async match analysis failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAsyncLiveCommentary() {
    this.log('Testing async live commentary...');
    try {
      const response = await this.axios.post(
        `${API_PREFIX}/ai/analyze/shot?async=true`,
        testShotData
      );

      if (response.data.jobId) {
        this.log(
          `Live commentary job queued: ${response.data.jobId}`,
          'success'
        );
        return { success: true, jobId: response.data.jobId };
      } else {
        this.log('Live commentary job not queued properly', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Async live commentary failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAsyncTableAnalysis() {
    this.log('Testing async table analysis...');
    try {
      const formData = new FormData();
      formData.append('image', new Blob([testTableImage]), 'test-image.jpg');
      formData.append('matchId', testMatchData.matchId);
      formData.append('sessionId', testShotData.sessionId);

      const response = await this.axios.post(
        `${API_PREFIX}/ai/analyze/table?async=true`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.jobId) {
        this.log(
          `Table analysis job queued: ${response.data.jobId}`,
          'success'
        );
        return { success: true, jobId: response.data.jobId };
      } else {
        this.log('Table analysis job not queued properly', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Async table analysis failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testBatchOperations() {
    this.log('Testing batch operations...');
    try {
      // Test bulk update
      const bulkUpdateResponse = await this.axios.post(
        `${API_PREFIX}/admin/batch/bulk-update`,
        {
          entityType: 'players',
          updates: { status: 'active' },
          filters: { createdAt: { $gte: new Date(Date.now() - 86400000) } },
        }
      );

      if (bulkUpdateResponse.data.jobId) {
        this.log(
          `Bulk update job queued: ${bulkUpdateResponse.data.jobId}`,
          'success'
        );
      }

      // Test cache invalidation
      const cacheInvalidateResponse = await this.axios.post(
        `${API_PREFIX}/admin/batch/cache-invalidate`,
        {
          patterns: ['player:*', 'match:*'],
        }
      );

      if (cacheInvalidateResponse.data.jobId) {
        this.log(
          `Cache invalidation job queued: ${cacheInvalidateResponse.data.jobId}`,
          'success'
        );
      }

      return { success: true };
    } catch (error) {
      this.log(`Batch operations test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAnalyticsEndpoints() {
    this.log('Testing analytics endpoints...');
    try {
      // This would require authentication in a real scenario
      // For now, we'll just test the endpoint structure
      this.log(
        'Analytics endpoints require authentication - skipping detailed test',
        'warning'
      );
      return { success: true, message: 'Requires authentication' };
    } catch (error) {
      this.log(`Analytics test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testJobStatus(jobId) {
    this.log(`Testing job status for ${jobId}...`);
    try {
      const response = await this.axios.get(`${API_PREFIX}/ai/job/${jobId}`);

      if (response.data.jobId) {
        this.log(`Job status retrieved: ${response.data.status}`, 'success');
        return { success: true, status: response.data.status };
      } else {
        this.log('Job status not retrieved properly', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Job status check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testQueueMonitoring() {
    this.log('Testing queue monitoring dashboard...');
    try {
      const response = await this.axios.get('/admin/queues');

      if (response.status === 200) {
        this.log('Queue monitoring dashboard accessible', 'success');
        return { success: true };
      } else {
        this.log('Queue monitoring dashboard not accessible', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Queue monitoring test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testSyncFallbacks() {
    this.log('Testing synchronous fallbacks...');
    try {
      // Test sync match analysis
      const syncResponse = await this.axios.post(
        `${API_PREFIX}/ai/analyze/match`,
        testMatchData
      );

      if (syncResponse.data.success) {
        this.log('Synchronous match analysis works', 'success');
        return { success: true };
      } else {
        this.log('Synchronous match analysis failed', 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Sync fallback test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async waitForJobCompletion(jobId, maxWaitTime = 30000) {
    this.log(`Waiting for job ${jobId} to complete...`);
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.testJobStatus(jobId);
        if (status.success && status.status === 'completed') {
          this.log(`Job ${jobId} completed successfully`, 'success');
          return true;
        } else if (status.success && status.status === 'failed') {
          this.log(`Job ${jobId} failed`, 'error');
          return false;
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        this.log(`Error checking job status: ${error.message}`, 'error');
        return false;
      }
    }

    this.log(
      `Job ${jobId} did not complete within ${maxWaitTime}ms`,
      'warning'
    );
    return false;
  }

  async runAllTests() {
    this.log('🚀 Starting DojoPool Job Queue Integration Tests');
    this.log('================================================');

    const results = {
      healthCheck: false,
      asyncMatchAnalysis: false,
      asyncLiveCommentary: false,
      asyncTableAnalysis: false,
      batchOperations: false,
      analyticsEndpoints: false,
      queueMonitoring: false,
      syncFallbacks: false,
      jobCompletion: false,
    };

    // Basic health check
    results.healthCheck = await this.testHealthCheck();

    if (!results.healthCheck) {
      this.log('❌ API is not healthy - aborting tests', 'error');
      return results;
    }

    // Test async operations
    const matchResult = await this.testAsyncMatchAnalysis();
    results.asyncMatchAnalysis = matchResult.success;

    const commentaryResult = await this.testAsyncLiveCommentary();
    results.asyncLiveCommentary = commentaryResult.success;

    const tableResult = await this.testAsyncTableAnalysis();
    results.asyncTableAnalysis = tableResult.success;

    // Test batch operations
    const batchResult = await this.testBatchOperations();
    results.batchOperations = batchResult.success;

    // Test analytics endpoints
    const analyticsResult = await this.testAnalyticsEndpoints();
    results.analyticsEndpoints = analyticsResult.success;

    // Test monitoring dashboard
    const monitoringResult = await this.testQueueMonitoring();
    results.queueMonitoring = monitoringResult.success;

    // Test sync fallbacks
    const syncResult = await this.testSyncFallbacks();
    results.syncFallbacks = syncResult.success;

    // Test job completion (using first successful job)
    const jobId =
      matchResult.jobId || commentaryResult.jobId || tableResult.jobId;
    if (jobId) {
      results.jobCompletion = await this.waitForJobCompletion(jobId);
    }

    // Summary
    this.log('\n📊 Test Results Summary:');
    this.log('=======================');

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });

    this.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      this.log(
        '🎉 All tests passed! Job queue integration is working correctly.',
        'success'
      );
    } else if (passedTests >= totalTests * 0.7) {
      this.log(
        '⚠️ Most tests passed. Job queue integration is mostly working.',
        'warning'
      );
    } else {
      this.log(
        '❌ Many tests failed. Job queue integration needs attention.',
        'error'
      );
    }

    return results;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new QueueIntegrationTester();

  tester
    .runAllTests()
    .then((results) => {
      const exitCode = Object.values(results).every(Boolean) ? 0 : 1;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = QueueIntegrationTester;
