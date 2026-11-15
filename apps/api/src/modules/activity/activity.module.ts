import { Module } from "@nestjs/common";

import { ActivityRepository } from "./repositories/activity.repository";
import { ActivityService } from "./services/activity.service";

@Module({
  providers: [ActivityRepository, ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
