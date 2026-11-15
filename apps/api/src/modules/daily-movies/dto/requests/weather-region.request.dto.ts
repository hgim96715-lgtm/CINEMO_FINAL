import { IsInt, Max, Min } from "class-validator";

export class WeatherRegionRequestDto {
  @IsInt()
  @Min(1)
  @Max(149)
  nx!: number;

  @IsInt()
  @Min(1)
  @Max(253)
  ny!: number;
}
