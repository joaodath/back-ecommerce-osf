import { Injectable } from '@nestjs/common';
import { Prisma, ShoppingCart } from '.prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShoppingCartItemsService } from 'src/cart-items/cart-items.service';
import { BooksService } from 'src/books/books.service';
import { AddItemDto } from './dto/add-item.dto';
import { CreateCartItemsDto } from 'src/cart-items/dto/create-cart-items.dto';
import { UpdateCartItemsDto } from 'src/cart-items/dto/update-cart-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ShoppingCartService {
  constructor(
    private db: PrismaService,
    private cartItems: ShoppingCartItemsService,
    private book: BooksService,
  ) {}

  async createCart(
    createCartDto: Prisma.ShoppingCartCreateInput,
  ): Promise<ShoppingCart> {
    if (createCartDto.userId) {
      const newCart = await this.db.shoppingCart.create({
        data: {
          ...createCartDto,
          isAnonymous: false,
        },
      });
      return await this.db.shoppingCart.update({
        where: { id: newCart.id },
        data: {
          user: {
            connect: {
              id: createCartDto.userId,
            },
          },
        },
      });
    } else {
      return await this.db.shoppingCart.create({
        data: { ...createCartDto, isAnonymous: true },
      });
    }
  }

  async addItem(addItemDto: AddItemDto): Promise<ShoppingCart> {
    const cartItem = await this.cartItems.findMany(
      addItemDto.shoppingCartId,
      addItemDto.bookId,
    );
    if (cartItem === -1) {
      const bookObject = await this.book.findUnique(addItemDto.bookId);
      const bookPrice =
        bookObject.discountCheck === true
          ? bookObject.discountedPrice
          : bookObject.price;
      const createCartItemsDto: CreateCartItemsDto = {
        shoppingCartId: addItemDto.shoppingCartId,
        bookId: addItemDto.bookId,
        price: bookPrice,
        quantity: addItemDto.quantity,
      };
      await this.cartItems.createItem(createCartItemsDto, addItemDto.bookId);
      return this.db.shoppingCart.findUnique({
        where: { id: addItemDto.shoppingCartId },
        include: { shoppingCartItems: true },
      });
    } else {
      const updateCartItem: UpdateCartItemsDto = {
        shoppingCartId: addItemDto.shoppingCartId,
        bookId: addItemDto.bookId,
        quantity: addItemDto.quantity,
      };
      const cartUpdate = await this.cartItems.updateItem(updateCartItem);
      return await this.findUnique(addItemDto.shoppingCartId);
    }
  }

  async updateItem(updateItemDto: UpdateItemDto): Promise<ShoppingCart> {
    const cartItem = await this.cartItems.findUnique(
      updateItemDto.shoppingCartItemId,
    );
    if (cartItem) {
      const updateItem = await this.cartItems.updateItem(updateItemDto);
      return await this.findUnique(updateItemDto.shoppingCartId);
    }
  }

  async findUnique(id: number): Promise<ShoppingCart> {
    return await this.db.shoppingCart.findUnique({
      where: { id: id },
      include: {
        shoppingCartItems: {
          include: {
            book: {
              select: {
                title: true,
                author: true,
                publisher: true,
                coverImg: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteItem(id: number): Promise<ShoppingCart> {
    const cartItem = await this.cartItems.removeItem(id);
    return await this.deleteItem(id);
  }

//   async updateCart(
//     updateCartDto: Prisma.ShoppingCartUpdateInput,
//     id: number,
//   ): Promise<ShoppingCart> {
//     if (updateCartDto.userId) {
//       return await this.db.shoppingCart.update({
//         where: { id },
//         data: {
//           ...updateCartDto,
//           isAnonymous: false,
//           user: {
//             update: {
//               where: {
//                 id: updateCartDto.userId,
//               },
//             },
//           },
//         },
//       });
//     } else {
//       return await this.db.shoppingCart.update({
//         where: { id },
//         data: {
//           ...updateCartDto,
//           isAnonymous: true,
//         },
//       });
//     }
//   }
// }