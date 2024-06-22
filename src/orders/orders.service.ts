import { HttpException, Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
/**
 * Service responsible for managing orders.
 */
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Creates a new order for the specified user.
   * @param userId - The ID of the user placing the order.
   * @returns The total amount of the order.
   * @throws {HttpException} If there is an error creating the order.
   */
  async createOrder(userId: number) {
    try {
      return await this.databaseService.$transaction(
        async (databaseService) => {
          const cart = await databaseService.cart.findUnique({
            where: {
              userId,
            },
            include: { products: { include: { product: true } } },
          });

          if (!cart || cart.products.length === 0) {
            throw new Error('Cart not found');
          }

          if (cart.products.some((cartProduct) => cartProduct.quantity < 1)) {
            throw new Error('Invalid quantity');
          }

          if (
            cart.products.some(
              (cartProduct) => cartProduct.product.stock < cartProduct.quantity,
            )
          ) {
            throw new Error('Not enough stock');
          }

          const order = await databaseService.order.create({
            data: {
              status: Status.PENDING,
              userId,
              products: {
                create: cart.products.map((cartProduct) => ({
                  quantity: cartProduct.quantity,
                  product: {
                    connect: {
                      id: cartProduct.productId,
                    },
                  },
                })),
              },
            },
          });

          await databaseService.cartProduct.deleteMany({
            where: {
              cartId: cart.id,
            },
          });

          await databaseService.cart.delete({
            where: {
              id: cart.id,
            },
          });

          await databaseService.product.updateMany({
            where: {
              id: {
                in: cart.products.map((cartProduct) => cartProduct.productId),
              },
            },
            data: {
              stock: {
                decrement: cart.products.reduce(
                  (acc, cartProduct) => acc + cartProduct.quantity,
                  0,
                ),
              },
            },
          });

          return (order.total = this.calculateTotal(cart.products));
        },
      );
    } catch (e: any) {
      throw new HttpException('Error creating the order', 400);
    }
  }

  /**
   * Calculates the total amount of an order.
   * @param products - The products in the order.
   * @param discount - The discount to apply to the order (default: 0).
   * @returns The total amount of the order.
   */
  calculateTotal(products: any[], discount: number = 0) {
    return (
      products.reduce(
        (total, orderProduct) =>
          total + orderProduct.product.price * orderProduct.quantity,
        0,
      ) *
      (1 - discount)
    );
  }

  /**
   * Retrieves an order by its ID.
   * @param orderId - The ID of the order to retrieve.
   * @returns The retrieved order.
   * @throws {HttpException} If there is an error finding the order.
   */
  async getOrder(orderId: number) {
    try {
      const order = await this.databaseService.order.findUnique({
        where: {
          id: +orderId,
        },
        include: { products: { include: { product: true } } },
      });
      let discount = 0;
      if (order.couponId) {
        const coupon = await this.databaseService.coupon.findUnique({
          where: {
            id: order.couponId,
          },
        });
        if (coupon.isActive) {
          discount = coupon.discount;
        }
      }
      order.total = this.calculateTotal(order.products, discount);
      return order;
    } catch (e: any) {
      throw new HttpException(
        'Error finding the order the id might be invalid',
        400,
      );
    }
  }

  /**
   * Updates the status of an order.
   * @param orderId - The ID of the order to update.
   * @param status - The new status of the order.
   * @returns The updated order.
   */
  async updateOrderStatus(orderId: number, status: Status) {
    return await this.databaseService.order.update({
      where: {
        id: +orderId,
      },
      data: {
        status: Status[status as Status],
      },
    });
  }

  /**
   * Retrieves all orders for a given user.
   * @param userId - The ID of the user.
   * @returns The list of orders for the user.
   */
  async getUserOrders(userId: number) {
    return await this.databaseService.order.findMany({
      where: {
        userId: +userId,
      },
      include: { products: { include: { product: true } } },
    });
  }

  /**
   * Applies a coupon to an order.
   * @param obj - An object containing the order ID and coupon ID.
   * @returns The updated order.
   */
  async applyCoupon(obj: { orderId: number; couponId: number }) {
    return await this.databaseService.order.update({
      where: {
        id: +obj.orderId,
      },
      data: {
        couponId: +obj.couponId,
      },
    });
  }
}
