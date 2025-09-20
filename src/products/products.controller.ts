import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // GET /products?q=barcelona&skip=0&take=20
  @Get()
  list(
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.products.findAll({
      q,
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
    });
  }

  // GET /products/:slug
  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
