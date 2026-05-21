// create-deal.dto.ts
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types/dist/partial-type.helper';

export class DealItemDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateDealDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DealItemDto)
  items: DealItemDto[];
}
export class UpdateDealDto extends PartialType(CreateDealDto) {}