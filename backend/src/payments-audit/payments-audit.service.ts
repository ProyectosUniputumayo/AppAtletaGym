import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentTransaction } from './schemas/payment-transaction.schema.js';

@Injectable()
export class PaymentsAuditService {
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
    const transaction = new this.paymentTransactionModel(data);
    return await transaction.save();
  }

  async updateTransactionStatusByReference(reference: string, status: string, gatewayResponse: Record<string, any>) {
    return await this.paymentTransactionModel.findOneAndUpdate(
      { reference },
      { status, gatewayResponse },
      { returnDocument: 'after' },
    );
  }
}