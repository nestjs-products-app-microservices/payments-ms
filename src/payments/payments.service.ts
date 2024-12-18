import { Injectable } from '@nestjs/common'
import { envs } from 'src/config/envs'
import Stripe from 'stripe'
import { PaymentSessionDto } from './dto/payment-session.dto'
import { Request, Response } from 'express'

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe(envs.stripeSecretKey)

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

    return session
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

    switch(event.type) {
      case 'charge.succeeded':
        const chargeSuccess = event.data.object

        const { metadata } = chargeSuccess

        console.log({ metadata })
        console.log({ message: `Charge ${chargeSuccess.id} succeeded for order ${metadata.orderId}`})
        break
      default:
        console.log(`Event ${event.type} not handled`)
    }

    return res.status(200).json({ signature })
  }
}
