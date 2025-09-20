import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

type Id = number;
type Item = { productId: Id; quantity: number };
@Injectable()
export class CartService {
  private carts = new Map<Id, Item[]>();

  private getOrCreate(userId: Id) {
    if (!this.carts.has(userId)) this.carts.set(userId, []);
    return this.carts.get(userId)!;
  }

  async getCart(userId: Id) {
    const items = this.getOrCreate(userId);
    const total = items.reduce((acc, it) => acc + (0 * it.quantity), 0); // total 0 sem preço do /products
    return { cartId: userId, userId, items, total };
  }

  async countItems(userId: Id) {
    const items = this.getOrCreate(userId);
    const count = items.reduce((acc, it) => acc + it.quantity, 0);
    return { userId, count };
  }

  async addItem(userId: Id, productId: Id, quantity = 1) {
    if (quantity <= 0) quantity = 1;
    const items = this.getOrCreate(userId);
    const idx = items.findIndex(i => i.productId === productId);
    if (idx >= 0) items[idx].quantity += quantity;
    else items.push({ productId, quantity });
    return this.getCart(userId);
  }

  async updateItem(userId: Id, productId: Id, quantity: number) {
    const items = this.getOrCreate(userId);
    const idx = items.findIndex(i => i.productId === productId);
    if (idx < 0) throw new NotFoundException('Item não está no carrinho');
    if (quantity <= 0) items.splice(idx, 1);
    else items[idx].quantity = quantity;
    return this.getCart(userId);
  }

  async removeItem(userId: Id, productId: Id) {
    const items = this.getOrCreate(userId);
    const idx = items.findIndex(i => i.productId === productId);
    if (idx < 0) throw new NotFoundException('Item não está no carrinho');
    items.splice(idx, 1);
    return this.getCart(userId);
  }

  async clear(userId: Id) {
    this.carts.set(userId, []);
    return this.getCart(userId);
  }

  async validate(dto: { userId: number }) {
    const cart = await this.getCart(dto.userId);
    const problems = cart.items
      .filter(i => i.quantity <= 0)
      .map(i => ({ productId: i.productId, reason: 'Quantidade inválida' }));

    return { ok: problems.length === 0, problems, cart };
  }

  async checkout(dto: { userId: number }) {
    const validation = await this.validate({ userId: dto.userId });
    if (!validation.ok) throw new BadRequestException({ message: 'Falha na validação do carrinho', ...validation });
    await this.clear(dto.userId);
    return { ok: true, message: 'Checkout concluído com sucesso', userId: dto.userId };
  }
}
