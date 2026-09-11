import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(userId: string, title: string, body: string, href?: string) {
    return this.prisma.notification.create({
      data: { userId, title, body, href },
    })
  }

  async notifyMany(
    userIds: string[],
    title: string,
    body: string,
    href?: string,
  ) {
    if (userIds.length === 0) return { count: 0 }
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, body, href })),
    })
    return { count: userIds.length }
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    })
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    })
  }

  async markRead(userId: string, id?: string) {
    if (id) {
      await this.prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true },
      })
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
    }
    return { ok: true }
  }
}
