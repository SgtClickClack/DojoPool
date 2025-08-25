import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateClanDto {
  @IsString()
  @Length(3, 32)
  name!: string;

  @IsString()
  @Length(2, 5)
  @Matches(/^[A-Z0-9]+$/i, { message: 'Tag must be alphanumeric' })
  tag!: string;

  @IsOptional()
  @IsString()
  @Length(0, 256)
  description?: string;
}
