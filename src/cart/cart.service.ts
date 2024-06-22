import { HttpException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCart(userId: number) {
    return this.databaseService.cart.findUnique({
      where: { userId: +userId },
      include: { products: { include: { product: true } } },
    });
  }

  async addToCart(obj: {
    userId: number;
    productId: number;
    quantity: number;
  }) {
    if (obj.quantity < 1) throw new HttpException('Invalid quantity', 400);

    try {
      const cart = await this.databaseService.cart.upsert({
        where: { id: obj.userId },
        update: {},
        create: {
          userId: obj.userId,
        },
      });

      return await this.databaseService.cartProduct.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: obj.productId },
        },
        update: {
          quantity: { increment: obj.quantity },
        },
        create: {
          cartId: cart.id,
          productId: obj.productId,
          quantity: obj.quantity,
        },
      });
    } catch (e: any) {
      throw new HttpException(
        'Error adding the product the id might be invalid',
        400,
      );
    }
  }

  async removeFromCart(obj: { userId: number; productId: number }) {
    await this.databaseService.cartProduct.delete({
      where: {
        cartId_productId: { cartId: obj.userId, productId: obj.productId },
      },
    });
  }

  async updateCart(obj: {
    userId: number;
    productId: number;
    quantity: number;
  }) {
    try {
      if (obj.quantity < 1) throw new HttpException('Invalid quantity', 400);
      return await this.databaseService.cartProduct.update({
        where: {
          cartId_productId: { cartId: obj.userId, productId: obj.productId },
        },
        data: { quantity: obj.quantity },
      });
    } catch (e: any) {
      throw new HttpException(
        'Error updating the product the id might be invalid',
        400,
      );
    }
  }
}
