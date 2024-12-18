import { Inject, Injectable, Logger } from '@nestjs/common'
import { envs } from 'src/config/envs'
import Stripe from 'stripe'
import { PaymentSessionDto } from './dto/payment-session.dto'
import { Request, Response } from 'express'
import { ClientProxy } from '@nestjs/microservices'
import { NATS_SERVICE } from 'src/config/services'

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecretKey)
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) { }

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto

    const line_items = items.map(item => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId
        },
      },
      line_items,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    })

    // return session
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    }
  }

  async stripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature']

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(req['rawBody'], signature, envs.stripeEndpointSecret)
    } catch (err) {
      console.log(err)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSuccess = event.data.object

        const payload = {
          stripePaymentId: chargeSuccess.id,
          orderId: chargeSuccess.metadata.orderId,
          receiptUrl: chargeSuccess.receipt_url,
        }

        this.client.emit('payment.succeeded', payload)
        break
      default:
        console.log(`Event ${event.type} not handled`)
    }

    return res.status(200).json({ signature })
  }
}
