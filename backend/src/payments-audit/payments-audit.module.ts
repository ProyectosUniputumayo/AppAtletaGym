import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema.js';
import { PaymentsAuditService } from './payments-audit.service.js';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
  ],
  providers: [PaymentsAuditService],
  exports: [PaymentsAuditService], 
})
export class PaymentsAuditModule {}