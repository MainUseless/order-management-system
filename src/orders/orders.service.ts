import { HttpException, Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

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

  async getUserOrders(userId: number) {
    return await this.databaseService.order.findMany({
      where: {
        userId: +userId,
      },
      include: { products: { include: { product: true } } },
    });
  }

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
