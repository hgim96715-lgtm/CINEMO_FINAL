import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateDailyMoviePushRequestDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsString()
  @MaxLength(60)
  title!: string;

  @IsString()
  @MaxLength(180)
  body!: string;
}
