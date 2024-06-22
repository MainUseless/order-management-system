import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Status } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() obj: { userId: number }) {
    return this.ordersService.createOrder(obj.userId);
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: number) {
    return this.ordersService.getOrder(orderId);
  }

  @Put(':orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: number,
    @Body() obj: { status: Status },
  ) {
    return this.ordersService.updateOrderStatus(orderId, obj.status);
  }

  @Put('apply-coupon')
  applyCoupon(@Body() obj: { orderId: number; couponId: number }) {
    return this.ordersService.applyCoupon(obj);
  }

  @Get(':userId/orders')
  getUserOrders(@Param('userId') userId: number) {
    return this.ordersService.getUserOrders(userId);
  }
}
