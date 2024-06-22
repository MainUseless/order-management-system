import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') id: number) {
    return this.cartService.getCart(id);
  }

  @Post('add')
  addToCart(
    @Body() obj: { userId: number; productId: number; quantity: number },
  ) {
    return this.cartService.addToCart(obj);
  }

  @Put('update')
  updateCart(
    @Body() obj: { userId: number; productId: number; quantity: number },
  ) {
    return this.cartService.updateCart(obj);
  }

  @Delete('remove')
  removeFromCart(@Body() obj: { userId: number; productId: number }) {
    return this.cartService.removeFromCart(obj);
  }
}
