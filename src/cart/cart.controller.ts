import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.service.getCart(Number(userId));
  }

  @Get(':userId/count')
  count(@Param('userId') userId: string) {
    return this.service.countItems(Number(userId));
  }

  @Post('add')
  add(@Body() dto: { userId: number; productId: number; quantity?: number }) {
    const { userId, productId, quantity = 1 } = dto;
    return this.service.addItem(Number(userId), Number(productId), Number(quantity));
  }

  @Patch('update')
  update(@Body() dto: { userId: number; productId: number; quantity: number }) {
    const { userId, productId, quantity } = dto;
    return this.service.updateItem(Number(userId), Number(productId), Number(quantity));
  }

  @Delete('remove')
  remove(@Body() dto: { userId: number; productId: number }) {
    const { userId, productId } = dto;
    return this.service.removeItem(Number(userId), Number(productId));
  }

  @Delete(':userId/clear')
  clear(@Param('userId') userId: string) {
    return this.service.clear(Number(userId));
  }

  @Post('validate')
  validate(@Body() dto: { userId: number }) {
    return this.service.validate(dto);
  }

  @Post('checkout')
  checkout(@Body() dto: { userId: number }) {
    return this.service.checkout(dto);
  }
}
