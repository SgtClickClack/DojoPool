import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CheckInDto {
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value
  )
  lat!: number;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value
  )
  lng!: number;
}
