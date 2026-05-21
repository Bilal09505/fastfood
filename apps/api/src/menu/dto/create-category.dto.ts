// apps/api/src/menu/dto/create-category.dto.ts
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types/dist/partial-type.helper';

export class CreateCategoryDto {
  @IsString()
  name: string;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class RecipeItemDto {
  @IsUUID()
  materialId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantityNeeded: number;
}

export class SetRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  materials: RecipeItemDto[];
}
