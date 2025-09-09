import { ContentService } from '../content.service';

describe('ContentService - shareContent', () => {
  const prisma: any = {
    content: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentShare: {
      upsert: jest.fn(),
    },
  };

  const notificationsService: any = {
    createNotification: jest.fn(),
  };

  const cacheHelper: any = {};

  let service: ContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentService(prisma, notificationsService, cacheHelper);
  });

  it('shares content with multiple users and sends notifications', async () => {
    prisma.content.findUnique.mockResolvedValue({
      contentId: 'c1',
      title: 'Test',
    });
    prisma.contentShare.upsert.mockResolvedValue({});
    prisma.content.update.mockResolvedValue({});

    const recipients = ['u2', 'u3'];

    await service.shareContent('c1', 'u1', recipients);

    expect(prisma.content.findUnique).toHaveBeenCalledWith({
      where: { contentId: 'c1' },
    });

    // upsert called for each recipient
    expect(prisma.contentShare.upsert).toHaveBeenCalledTimes(recipients.length);

    // shares count increment
    expect(prisma.content.update).toHaveBeenCalledWith({
      where: { contentId: 'c1' },
      data: { shares: { increment: recipients.length } },
    });

    // notification per recipient
    expect(notificationsService.createNotification).toHaveBeenCalledTimes(
      recipients.length
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      'u2',
      'CONTENT_SHARED_WITH_YOU',
      'Content shared with you: Test',
      expect.objectContaining({ contentId: 'c1', sharerId: 'u1' })
    );
  });
});
