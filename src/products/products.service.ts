import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(params?: { q?: string; skip?: number; take?: number }) {
    const { q, skip = 0, take = 20 } = params || {};
    return this.prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { id: 'asc' },
      skip,
      take,
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  // (opcional) criar item — útil para admin futuramente
  create(data: { name: string; slug: string; priceCents: number; stock: number }) {
    return this.prisma.product.create({ data });
  }
}
