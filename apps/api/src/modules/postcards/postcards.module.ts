import {Module} from "@nestjs/common";

import {PostcardsController} from "./postcards.controller";
import {PostcardRepository} from "./repositories/postcard.repository";
import {PostcardService} from "./services/postcard.service";

@Module({
  controllers: [PostcardsController],
  providers: [
    PostcardRepository,
    PostcardService,
  ],
  exports: [PostcardService],
})
export class PostcardsModule {}