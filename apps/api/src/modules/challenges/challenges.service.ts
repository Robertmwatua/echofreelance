import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateChallengeDto, SubmitFlagDto } from './dto/challenge.dto'

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 48) || 'challenge'
  )
}

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId?: string, category?: string) {
    const challenges = await this.prisma.challenge.findMany({
      where: {
        published: true,
        ...(category ? { category: category as never } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
        _count: { select: { solves: true } },
      },
      orderBy: [{ category: 'asc' }, { points: 'asc' }],
    })

    const solvedIds = userId
      ? new Set(
          (
            await this.prisma.challengeSolve.findMany({
              where: {
                userId,
                challengeId: { in: challenges.map((c) => c.id) },
              },
              select: { challengeId: true },
            })
          ).map((s) => s.challengeId),
        )
      : new Set<string>()

    return challenges.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      description: c.description,
      hint: c.hint,
      course: c.course,
      author: c.author,
      solveCount: c._count.solves,
      solved: solvedIds.has(c.id),
    }))
  }

  async findBySlug(slug: string, userId?: string) {
    const c = await this.prisma.challenge.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
        _count: { select: { solves: true } },
      },
    })
    if (!c || !c.published) throw new NotFoundException('Challenge not found')

    const solved = userId
      ? Boolean(
          await this.prisma.challengeSolve.findUnique({
            where: { challengeId_userId: { challengeId: c.id, userId } },
          }),
        )
      : false

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      description: c.description,
      hint: c.hint,
      course: c.course,
      author: c.author,
      solveCount: c._count.solves,
      solved,
    }
  }

  async create(user: AuthUser, dto: CreateChallengeDto) {
    if (user.role !== Role.Tutor && user.role !== Role.Admin) {
      throw new ForbiddenException('Only tutors can create challenges')
    }
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
      if (!course) throw new NotFoundException('Course not found')
      if (user.role !== Role.Admin && course.tutorId !== user.id) {
        throw new ForbiddenException('You can only attach challenges to your courses')
      }
    }

    let slug = slugify(dto.title)
    const existing = await this.prisma.challenge.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const flagHash = await bcrypt.hash(dto.flag.trim(), 10)
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        slug,
        category: dto.category as never,
        difficulty: dto.difficulty ?? 'Easy',
        points: dto.points ?? 100,
        description: dto.description,
        hint: dto.hint,
        flagHash,
        published: dto.published ?? true,
        authorId: user.id,
        courseId: dto.courseId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        points: true,
        description: true,
        hint: true,
        published: true,
        courseId: true,
      },
    })
  }

  async submitFlag(slug: string, user: AuthUser, dto: SubmitFlagDto) {
    const challenge = await this.prisma.challenge.findUnique({ where: { slug } })
    if (!challenge || !challenge.published) {
      throw new NotFoundException('Challenge not found')
    }

    const already = await this.prisma.challengeSolve.findUnique({
      where: {
        challengeId_userId: { challengeId: challenge.id, userId: user.id },
      },
    })
    if (already) {
      throw new ConflictException('Already solved')
    }

    const ok = await bcrypt.compare(dto.flag.trim(), challenge.flagHash)
    if (!ok) {
      throw new UnauthorizedException('Incorrect flag')
    }

    const solve = await this.prisma.challengeSolve.create({
      data: { challengeId: challenge.id, userId: user.id },
    })

    return {
      ok: true,
      message: 'Correct flag! Nice pwn.',
      points: challenge.points,
      solvedAt: solve.solvedAt,
    }
  }

  async leaderboard(limit = 20) {
    const solves = await this.prisma.challengeSolve.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        challenge: { select: { points: true, category: true } },
      },
    })

    const map = new Map<
      string,
      { user: { id: string; name: string | null; email: string }; points: number; solves: number }
    >()

    for (const s of solves) {
      const cur = map.get(s.userId) || {
        user: s.user,
        points: 0,
        solves: 0,
      }
      cur.points += s.challenge.points
      cur.solves += 1
      map.set(s.userId, cur)
    }

    return Array.from(map.values())
      .sort((a, b) => b.points - a.points || b.solves - a.solves)
      .slice(0, limit)
      .map((row, i) => ({ rank: i + 1, ...row }))
  }

  async mine(userId: string) {
    return this.prisma.challenge.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        points: true,
        published: true,
        _count: { select: { solves: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
