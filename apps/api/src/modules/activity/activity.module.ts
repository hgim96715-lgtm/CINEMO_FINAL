import { Module } from "@nestjs/common";

import { ActivityRepository } from "./activity.repository";
import { ActivityService } from "./activity.service";

@Module({
  providers: [ActivityRepository, ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
