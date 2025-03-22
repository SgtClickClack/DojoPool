import { FeedbackData } from '../components/feedback/FeedbackForm';

class FeedbackService {
  private static instance: FeedbackService;
  private readonly STORAGE_KEY = 'dojo_pool_feedback';

  private constructor() {}

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  public async submitFeedback(feedback: FeedbackData): Promise<void> {
    try {
      const existingFeedback = this.getFeedbackFromStorage();
      existingFeedback.push(feedback);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedback));

      // If we have an API endpoint, we would send the feedback there
      // await this.sendFeedbackToServer(feedback);

      this.analyzeFeedbackTrends(existingFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  public getFeedback(): FeedbackData[] {
    return this.getFeedbackFromStorage();
  }

  public getFeedbackByCategory(category: string): FeedbackData[] {
    const allFeedback = this.getFeedbackFromStorage();
    return allFeedback.filter(feedback => feedback.category === category);
  }

  public getAverageRating(): number {
    const allFeedback = this.getFeedbackFromStorage();
    if (allFeedback.length === 0) return 0;

    const totalRating = allFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
    return totalRating / allFeedback.length;
  }

  private getFeedbackFromStorage(): FeedbackData[] {
    const storedFeedback = localStorage.getItem(this.STORAGE_KEY);
    return storedFeedback ? JSON.parse(storedFeedback) : [];
  }

  private analyzeFeedbackTrends(feedback: FeedbackData[]): void {
    // Calculate trends and metrics
    const categoryDistribution = feedback.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratingTrends = feedback.reduce((acc, item) => {
      const date = item.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = { sum: 0, count: 0 };
      }
      acc[date].sum += item.rating;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    // Store analytics data
    localStorage.setItem('feedback_analytics', JSON.stringify({
      categoryDistribution,
      ratingTrends,
      lastUpdated: new Date().toISOString()
    }));
  }

  // For future implementation when backend is ready
  private async sendFeedbackToServer(feedback: FeedbackData): Promise<void> {
    // const response = await fetch('/api/feedback', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(feedback),
    // });
    // if (!response.ok) {
    //   throw new Error('Failed to send feedback to server');
    // }
  }
}

export const feedbackService = FeedbackService.getInstance(); 