import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentSessionDto } from './dto/payment-session.dto'
import { Request, Response } from 'express'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto)
  }

  @Get('success')
  paymentSuccess() {
    return {
      ok: true,
      message: 'Payment successful',
    }
  }

  @Get('cancel')
  paymentCancel() {
    return {
      ok: false,
      message: 'Payment cancel',
    }
  }

  @Post('webhook')
  async stripeWebhook(@Res() res: Response, @Req() req: Request) {
    return this.paymentsService.stripeWebhook(req, res)
  }
}
