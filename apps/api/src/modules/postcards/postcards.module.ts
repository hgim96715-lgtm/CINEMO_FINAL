import {Module} from "@nestjs/common";

import {OpenAiModule} from "@/integrations/openai/openai.module";
import {PostcardsController} from "./postcards.controller";
import {PostcardRepository} from "./repositories/postcard.repository";
import {PostcardService} from "./services/postcard.service";

@Module({
  imports: [OpenAiModule],
  controllers: [PostcardsController],
  providers: [
    PostcardRepository,
    PostcardService,
  ],
  exports: [PostcardService],
})
export class PostcardsModule {}
