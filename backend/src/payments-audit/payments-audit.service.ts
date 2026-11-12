import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentTransaction } from './schemas/payment-transaction.schema.js';

@Injectable()
export class PaymentsAuditService {
  private readonly logger = new Logger(PaymentsAuditService.name);

  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly paymentTransactionModel: Model<PaymentTransaction>,
  ) {}

  async createTransaction(data: {
    membershipId: string;
    reference: string;
    amountInCents: number;
    currency: string;
    status: string;
    gatewayResponse?: Record<string, any>;
  }) {
    try {
      const transaction = new this.paymentTransactionModel(data);
      return await transaction.save();
    } catch (error: any) {
      this.logger.warn(`No se pudo registrar la auditoría de pago (MongoDB no disponible): ${error?.message ?? error}`);
      return null;
    }
  }

  async updateTransactionStatusByReference(reference: string, status: string, gatewayResponse: Record<string, any>) {
    try {
      return await this.paymentTransactionModel.findOneAndUpdate(
        { reference },
        { status, gatewayResponse },
        { returnDocument: 'after' },
      );
    } catch (error: any) {
      this.logger.warn(`No se pudo actualizar la auditoría de pago (MongoDB no disponible): ${error?.message ?? error}`);
      return null;
    }
  }
}
