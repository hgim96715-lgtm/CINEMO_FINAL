import {Module} from "@nestjs/common";

import {OpenAiModule} from "@/integrations/openai/openai.module";
import {OpenSubtitlesModule} from "@/integrations/opensubtitles/opensubtitles.module";
import {SubdlModule} from "@/integrations/subdl/subdl.module";
import {TmdbModule} from "@/integrations/tmdb/tmdb.module";
import {MoviesModule} from "@/modules/movies/movies.module";
import {PostcardsController} from "./postcards.controller";
import {PostcardRepository} from "./repositories/postcard.repository";
import {PostcardService} from "./services/postcard.service";
import {ActivityModule} from "@/modules/activity/activity.module";

@Module({
  imports: [
    OpenAiModule,
    OpenSubtitlesModule,
    SubdlModule,
    TmdbModule,
    MoviesModule,
    ActivityModule,
  ],
  controllers: [PostcardsController],
  providers: [
    PostcardRepository,
    PostcardService,
  ],
  exports: [PostcardService],
})
export class PostcardsModule {}
