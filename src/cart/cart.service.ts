import { HttpException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
/**
 * Service responsible for managing the user's cart.
 */
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retrieves the cart for the specified user.
   * @param userId - The ID of the user.
   * @returns A Promise that resolves to the user's cart.
   */
  async getCart(userId: number) {
    return this.databaseService.cart.findUnique({
      where: { userId: +userId },
      include: { products: { include: { product: true } } },
    });
  }

  /**
   * Adds a product to the user's cart.
   * @param obj - An object containing the user ID, product ID, and quantity.
   * @throws HttpException if the quantity is invalid.
   * @returns A Promise that resolves to the updated cart.
   */
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

  /**
   * Removes a product from the user's cart.
   * @param obj - An object containing the user ID and product ID.
   * @returns A Promise that resolves when the product is removed from the cart.
   */
  async removeFromCart(obj: { userId: number; productId: number }) {
    await this.databaseService.cartProduct.delete({
      where: {
        cartId_productId: { cartId: obj.userId, productId: obj.productId },
      },
    });
  }

  /**
   * Updates the quantity of a product in the user's cart.
   * @param obj - An object containing the user ID, product ID, and new quantity.
   * @throws HttpException if the quantity is invalid.
   * @returns A Promise that resolves to the updated cart.
   */
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
