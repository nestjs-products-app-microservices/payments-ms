import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator'

export class PaymentSessionDto {
  @IsString()
  orderId: string

  @IsString()
  @IsNotEmpty()
  currency: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentSessionItemDto)
  items: PaymentSessionItemDto[]
}

export class PaymentSessionItemDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsNumber()
  @IsPositive()
  price: number

  @IsNumber()
  @IsPositive()
  quantity: number
}