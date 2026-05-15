// apps/api/src/purchases/dto/create-purchase.dto.ts
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseDto {
  @IsUUID()
  materialId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPerUnit: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
