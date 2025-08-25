import { analyticsService } from './analytics';

interface TestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

interface Test {
  id: string;
  name: string;
  description: string;
  variants: TestVariant[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  targetAudience?: {
    userTypes?: string[];
    regions?: string[];
    deviceTypes?: string[];
  };
}

interface TestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
}

interface TestMetric {
  testId: string;
  variantId: string;
  userId: string;
  metricName: string;
  value: number;
  timestamp: Date;
}

class ABTestingService {
  private tests: Map<string, Test> = new Map();
  private assignments: Map<string, TestAssignment> = new Map();
  private metrics: TestMetric[] = [];
  private readonly storageKey = 'ab_test_assignments';

  constructor() {
    this.loadAssignments();
    this.setupCleanup();
  }

  private loadAssignments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const assignments = JSON.parse(stored);
        assignments.forEach((assignment: TestAssignment) => {
          this.assignments.set(
            this.getAssignmentKey(assignment.testId, assignment.userId),
            assignment
          );
        });
      }
    } catch (error) {
      console.error('Failed to load A/B test assignments:', error);
    }
  }

  private saveAssignments() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(Array.from(this.assignments.values()))
      );
    } catch (error) {
      console.error('Failed to save A/B test assignments:', error);
    }
  }

  private setupCleanup() {
    // Clean up expired tests daily
    setInterval(
      () => {
        const now = new Date();
        this.tests.forEach((test, testId) => {
          if (test.endDate && test.endDate < now) {
            this.endTest(testId);
          }
        });
      },
      24 * 60 * 60 * 1000
    );
  }

  private getAssignmentKey(testId: string, userId: string): string {
    return `${testId}:${userId}`;
  }

  private isUserEligible(userId: string, test: Test): boolean {
    if (!test.targetAudience) return true;

    // Add your user targeting logic here
    // Example: check user type, region, device type, etc.
    return true;
  }

  private assignVariant(test: Test): TestVariant {
    const totalWeight = test.variants.reduce(
      (sum, variant) => sum + variant.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const variant of test.variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return test.variants[0];
  }

  createTest(test: Omit<Test, 'isActive'>): string {
    const testId = crypto.randomUUID();
    this.tests.set(testId, {
      ...test,
      id: testId,
      isActive: true,
    });

    analyticsService.trackEvent('ab_test_created', {
      userId: 'system',
      testId,
      testName: test.name,
      variants: test.variants.map((v) => v.name),
    });

    return testId;
  }

  getVariantForUser(testId: string, userId: string): TestVariant | null {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) return null;

    const assignmentKey = this.getAssignmentKey(testId, userId);
    const existingAssignment = this.assignments.get(assignmentKey);

    if (existingAssignment) {
      const variant = test.variants.find(
        (v) => v.id === existingAssignment.variantId
      );
      return variant || null;
    }

    if (!this.isUserEligible(userId, test)) return null;

    const variant = this.assignVariant(test);
    const assignment: TestAssignment = {
      testId,
      variantId: variant.id,
      userId,
      timestamp: new Date(),
    };

    this.assignments.set(assignmentKey, assignment);
    this.saveAssignments();

    analyticsService.trackEvent('ab_test_assignment', {
      userId,
      testId,
      variantId: variant.id,
      testName: test.name,
      variantName: variant.name,
    });

    return variant;
  }

  trackMetric(
    testId: string,
    userId: string,
    metricName: string,
    value: number
  ) {
    const assignment = this.assignments.get(
      this.getAssignmentKey(testId, userId)
    );
    if (!assignment) return;

    const metric: TestMetric = {
      testId,
      variantId: assignment.variantId,
      userId,
      metricName,
      value,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    analyticsService.trackEvent('ab_test_metric', {
      userId,
      testId,
      variantId: assignment.variantId,
      metricName,
      value,
    });
  }

  getTestResults(testId: string): Record<string, any> {
    const test = this.tests.get(testId);
    if (!test) throw new Error(`Test ${testId} not found`);

    const results: Record<string, any> = {
      testId,
      testName: test.name,
      variants: {},
    };

    const testMetrics = this.metrics.filter((m) => m.testId === testId);
    const assignments = Array.from(this.assignments.values()).filter(
      (a) => a.testId === testId
    );

    test.variants.forEach((variant) => {
      const variantMetrics = testMetrics.filter(
        (m) => m.variantId === variant.id
      );
      const variantAssignments = assignments.filter(
        (a) => a.variantId === variant.id
      );

      results.variants[variant.name] = {
        users: variantAssignments.length,
        metrics: {},
      };

      // Calculate metrics
      const metricNames = new Set(variantMetrics.map((m) => m.metricName));
      metricNames.forEach((metricName) => {
        const metricValues = variantMetrics
          .filter((m) => m.metricName === metricName)
          .map((m) => m.value);

        results.variants[variant.name].metrics[metricName] = {
          count: metricValues.length,
          sum: metricValues.reduce((a, b) => a + b, 0),
          average:
            metricValues.reduce((a, b) => a + b, 0) / metricValues.length,
          min: Math.min(...metricValues),
          max: Math.max(...metricValues),
        };
      });
    });

    return results;
  }

  endTest(testId: string) {
    const test = this.tests.get(testId);
    if (!test) return;

    test.isActive = false;
    test.endDate = new Date();

    const results = this.getTestResults(testId);
    analyticsService.trackEvent('ab_test_completed', {
      userId: 'system',
      testId,
      testName: test.name,
      results,
    });
  }
}

export const abTestingService = new ABTestingService();
