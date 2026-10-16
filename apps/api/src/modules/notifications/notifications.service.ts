import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>
  private running = false
  private readonly logger = new Logger(NotificationsService.name)

  onModuleInit() {
    this.timer = setInterval(() => { void this.deliverDue() }, 60000)
    this.timer.unref()
    void this.deliverDue()
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer) }

  async deliverDue() {
    if (this.running) return
    this.running = true
    try {
      const now = new Date()
      const reminders = await this.prisma.classReminder.findMany({
        where: { deliveredAt: null, remindAt: { lte: now } }, include: { class: true }, take: 100,
      })
      for (const reminder of reminders) {
        await this.prisma.$transaction(async tx => {
          const current = await tx.classReminder.findUnique({ where: { id: reminder.id }, include: { class: true } })
          if (!current || current.deliveredAt || current.remindAt.getTime() !== reminder.remindAt.getTime()) return
          if (!['Completed', 'Cancelled'].includes(current.class.status) && current.class.endsAt > now) {
            await tx.notification.upsert({
              where: { id: `class-reminder-${reminder.id}-${reminder.remindAt.getTime()}` },
              create: { id: `class-reminder-${reminder.id}-${reminder.remindAt.getTime()}`, userId: reminder.userId, title: 'Class reminder', body: reminder.class.title, href: `/classes/${reminder.classId}` },
              update: {},
            })
          }
          await tx.classReminder.updateMany({ where: { id: reminder.id, remindAt: reminder.remindAt, deliveredAt: null }, data: { deliveredAt: now } })
        })
      }
      await this.prisma.classNote.deleteMany({ where: { expiresAt: { lte: now } } })
    } catch { this.logger.error('Class reminder delivery failed; retrying on the next cycle') }
    finally { this.running = false }
  }

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
