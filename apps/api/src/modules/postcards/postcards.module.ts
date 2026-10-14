import {Module} from "@nestjs/common";

import {OpenAiModule} from "@/integrations/openai/openai.module";
import {OpenSubtitlesModule} from "@/integrations/opensubtitles/opensubtitles.module";
import {PostcardsController} from "./postcards.controller";
import {PostcardRepository} from "./repositories/postcard.repository";
import {PostcardService} from "./services/postcard.service";

@Module({
  imports: [OpenAiModule, OpenSubtitlesModule],
  controllers: [PostcardsController],
  providers: [
    PostcardRepository,
    PostcardService,
  ],
  exports: [PostcardService],
})
export class PostcardsModule {}
