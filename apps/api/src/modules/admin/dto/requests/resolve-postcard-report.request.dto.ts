import { IsIn } from "class-validator";

export class ResolvePostcardReportRequestDto {
  @IsIn(["hide", "dismiss"])
  action!: "hide" | "dismiss";
}
