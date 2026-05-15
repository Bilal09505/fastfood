// apps/api/src/materials/dto/create-material.dto.ts
import { IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  unit: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  currentStock: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minStockLevel: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPerUnit: number;
}
