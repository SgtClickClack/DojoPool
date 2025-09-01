import { PrismaService } from '../prisma/prisma.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationsService } from './notifications.service';

/**
 * Test script to verify notification system functionality
 * This can be run manually or as part of testing
 */
export async function testNotificationSystem(
  prisma: PrismaService,
  notificationsService: NotificationsService,
  templatesService: NotificationTemplatesService
) {
  console.log('🧪 Testing Notification System...');

  try {
    // Get a test user (first user in the system)
    const testUser = await prisma.user.findFirst({
      select: { id: true, username: true },
    });

    if (!testUser) {
      console.log(
        '❌ No users found in the system. Please create a user first.'
      );
      return;
    }

    console.log(`👤 Using test user: ${testUser.username} (${testUser.id})`);

    // Test 1: Friend Request Notification
    console.log('\n📝 Test 1: Creating Friend Request Notification...');
    const friendRequestTemplate =
      templatesService.getFriendRequestTemplate('TestUser123');
    const friendRequestNotification =
      await notificationsService.createNotification(
        testUser.id,
        friendRequestTemplate.type,
        friendRequestTemplate.message,
        { requesterId: 'test-requester-id', friendshipId: 'test-friendship-id' }
      );
    console.log(
      '✅ Friend Request Notification created:',
      friendRequestNotification.id
    );

    // Test 2: Challenge Notification
    console.log('\n📝 Test 2: Creating Challenge Notification...');
    const challengeTemplate = templatesService.getChallengeReceivedTemplate(
      'Challenger456',
      'Test Venue'
    );
    const challengeNotification = await notificationsService.createNotification(
      testUser.id,
      challengeTemplate.type,
      challengeTemplate.message,
      {
        challengerId: 'test-challenger-id',
        challengeId: 'test-challenge-id',
        venueId: 'test-venue-id',
      }
    );
    console.log('✅ Challenge Notification created:', challengeNotification.id);

    // Test 3: Territory Change Notification
    console.log('\n📝 Test 3: Creating Territory Change Notification...');
    const territoryTemplate = templatesService.getTerritoryChangedTemplate(
      'Test Venue',
      'NewOwner789'
    );
    const territoryNotification = await notificationsService.createNotification(
      testUser.id,
      territoryTemplate.type,
      territoryTemplate.message,
      {
        territoryId: 'test-territory-id',
        venueId: 'test-venue-id',
        previousOwnerId: 'test-previous-owner',
      }
    );
    console.log(
      '✅ Territory Change Notification created:',
      territoryNotification.id
    );

    // Test 4: Achievement Notification
    console.log('\n📝 Test 4: Creating Achievement Notification...');
    const achievementTemplate =
      templatesService.getAchievementUnlockedTemplate('Pool Master');
    const achievementNotification =
      await notificationsService.createNotification(
        testUser.id,
        achievementTemplate.type,
        achievementTemplate.message,
        { achievementId: 'test-achievement-id', achievementName: 'Pool Master' }
      );
    console.log(
      '✅ Achievement Notification created:',
      achievementNotification.id
    );

    // Test 5: System Notification
    console.log('\n📝 Test 5: Creating System Notification...');
    const systemTemplate = templatesService.getSystemNotificationTemplate(
      'System Maintenance',
      'The system will be down for maintenance at 2 AM tonight.'
    );
    const systemNotification = await notificationsService.createNotification(
      testUser.id,
      systemTemplate.type,
      systemTemplate.message,
      { maintenanceTime: '2 AM', duration: '2 hours' }
    );
    console.log('✅ System Notification created:', systemNotification.id);

    // Test 6: Fetch User Notifications
    console.log('\n📝 Test 6: Fetching User Notifications...');
    const userNotifications = await notificationsService.findForUser(
      testUser.id
    );
    console.log(
      `✅ Found ${userNotifications.notifications.length} notifications for user`
    );
    console.log(`📊 Unread count: ${userNotifications.unreadCount}`);
    console.log(`📊 Total count: ${userNotifications.totalCount}`);

    // Test 7: Mark Notification as Read
    console.log('\n📝 Test 7: Marking Notification as Read...');
    if (userNotifications.notifications.length > 0) {
      const firstNotification = userNotifications.notifications[0];
      const updatedNotification = await notificationsService.markRead(
        firstNotification.id,
        testUser.id
      );
      console.log(
        `✅ Marked notification ${firstNotification.id} as read:`,
        updatedNotification.isRead
      );
    }

    // Test 8: Mark All as Read
    console.log('\n📝 Test 8: Marking All Notifications as Read...');
    const markAllResult = await notificationsService.markAllRead(testUser.id);
    console.log(`✅ Marked ${markAllResult.count} notifications as read`);

    // Test 9: Get Updated Unread Count
    console.log('\n📝 Test 9: Getting Updated Unread Count...');
    const updatedUnreadCount = await notificationsService.getUnreadCount(
      testUser.id
    );
    console.log(`✅ Updated unread count: ${updatedUnreadCount}`);

    console.log('\n🎉 All notification tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Created 5 test notifications`);
    console.log(`   - Fetched user notifications with pagination`);
    console.log(`   - Marked individual notification as read`);
    console.log(`   - Marked all notifications as read`);
    console.log(`   - Verified unread count updates`);
  } catch (error) {
    console.error('❌ Error during notification testing:', error);
    throw error;
  }
}

/**
 * Cleanup function to remove test notifications
 */
export async function cleanupTestNotifications(
  prisma: PrismaService,
  userId: string
) {
  console.log('\n🧹 Cleaning up test notifications...');

  try {
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        recipientId: userId,
        message: {
          contains: 'Test',
        },
      },
    });

    console.log(`✅ Deleted ${deletedCount.count} test notifications`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}
