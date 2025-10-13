import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Notification, NotificationType } from '../../../notifications/entities/notification.entity';
import { User } from '../../../users/entities/user.entity';

type NotificationData = {
  relatedEntityType?: 'book' | 'loan' | 'request';
  relatedEntityId?: string | number;
  [key: string]: any;
};

export class NotificationsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding notifications...');
    const notificationRepository = dataSource.getRepository(Notification);
    const userRepository = dataSource.getRepository(User);

    // Get regular users (non-admins)
    const users = await userRepository.find({
      where: { role: { name: 'Member' } },
      take: 10 // Limit to first 10 members
    });

    if (users.length === 0) {
      console.warn('No users found. Please seed users first.');
      return { entity: 'Notification', count: 0 };
    }

    const notifications: Notification[] = [];
    const notificationTypes = [
      NotificationType.BOOK_REQUEST_STATUS,
      NotificationType.BORROWED_BOOK_DUE,
      NotificationType.DUE_SOON,
      NotificationType.OVERDUE,
      NotificationType.GENERAL
    ];

    // Create 2-5 notifications per user
    for (const user of users) {
      const notificationCount = 2 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < notificationCount; i++) {
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const isRead = Math.random() > 0.5;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Up to 30 days ago

        const data: NotificationData = {};
        let title = '';
        let message = '';

        switch (type) {
          case NotificationType.BOOK_REQUEST_STATUS:
            title = 'Book Request Update';
            message = 'The status of your book request has been updated.';
            data.relatedEntityType = 'request';
            data.relatedEntityId = 1 + Math.floor(Math.random() * 20);
            break;
          case NotificationType.BORROWED_BOOK_DUE:
            title = 'Book Due Soon';
            message = 'You have a book due tomorrow. Please return or renew it.';
            data.relatedEntityType = 'loan';
            data.relatedEntityId = 1 + Math.floor(Math.random() * 20);
            break;
          case NotificationType.DUE_SOON:
            title = 'Due Date Reminder';
            message = 'You have a book due in 2 days. Please return or renew it soon.';
            data.relatedEntityType = 'loan';
            data.relatedEntityId = 1 + Math.floor(Math.random() * 20);
            break;
          case NotificationType.OVERDUE:
            title = 'Overdue Notice';
            message = 'You have an overdue book. Please return it as soon as possible to avoid additional fees.';
            data.relatedEntityType = 'loan';
            data.relatedEntityId = 1 + Math.floor(Math.random() * 20);
            break;
          case NotificationType.GENERAL:
          default:
            title = 'Library Announcement';
            message = 'The library will be closed next Monday for maintenance.';
            break;
        }

        const notification = notificationRepository.create({
          user: user,
          userId: user.id,
          title,
          message,
          type,
          data: Object.keys(data).length > 0 ? data : null,
          readAt: isRead ? new Date(createdAt.getTime() + 1000 * 60 * 60) : null, // Read 1 hour after creation
          createdAt,
          updatedAt: createdAt
        });

        notifications.push(notification);
      }
    }

    let created = 0;
    if (notifications.length > 0) {
      const saved = await notificationRepository.save(notifications);
      created = saved.length;
    }

    return {
      entity: 'Notification',
      count: created
    };
  }
}
