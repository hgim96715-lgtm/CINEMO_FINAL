import {Module} from "@nestjs/common";

import {OpenAiModule} from "@/integrations/openai/openai.module";
import {OpenSubtitlesModule} from "@/integrations/opensubtitles/opensubtitles.module";
import {SubdlModule} from "@/integrations/subdl/subdl.module";
import {MoviesModule} from "@/modules/movies/movies.module";
import {PostcardsController} from "./postcards.controller";
import {PostcardRepository} from "./repositories/postcard.repository";
import {PostcardService} from "./services/postcard.service";

@Module({
  imports: [OpenAiModule, OpenSubtitlesModule, SubdlModule, MoviesModule],
  controllers: [PostcardsController],
  providers: [
    PostcardRepository,
    PostcardService,
  ],
  exports: [PostcardService],
})
export class PostcardsModule {}
