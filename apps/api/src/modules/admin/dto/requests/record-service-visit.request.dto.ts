import { IsIn, IsUUID } from "class-validator";

export class RecordServiceVisitRequestDto {
  @IsIn(["web", "app"])
  channel!: "web" | "app";

  @IsUUID("4")
  visitorId!: string;

  @IsUUID("4")
  visitId!: string;
}
