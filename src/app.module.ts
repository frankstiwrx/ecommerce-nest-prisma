import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    // Serve arquivos estáticos da pasta "public"
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    // Seus módulos já existentes
    PrismaModule,
    ProductsModule,

    // Novo módulo do carrinho
    CartModule,
  ],
})
export class AppModule {}
