import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'payment_transactions' })
export class PaymentTransaction extends Document {
  @Prop({ required: true, index: true })
  membershipId: string; // Relación lógica con la membresía en MySQL

  @Prop({ required: true, unique: true })
  reference: string; // Referencia única enviada a Wompi (ej. ATLETA-GYM-uuid)

  @Prop({ required: true })
  amountInCents: number;

  @Prop({ required: true, default: 'COP' })
  currency: string;

  @Prop({ required: true, default: 'PENDING' })
  status: string; // PENDING, APPROVED, DECLINED, ERROR

  @Prop({ type: Object, required: false })
  gatewayResponse?: Record<string, any>; // El JSON completo que devuelva o notifique Wompi
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);