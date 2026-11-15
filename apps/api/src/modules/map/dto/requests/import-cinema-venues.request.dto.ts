import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class ImportCinemaVenuesRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  searchQueries!: string[];
}
