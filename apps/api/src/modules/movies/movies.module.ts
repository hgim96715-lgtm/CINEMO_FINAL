import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./movies.controller";
import { MoviesRepository } from "./repositories/movies.repository";
import { MovieMatcherRepository } from "./repositories/movie-matcher.repository";
import { MoviesService } from "./movies.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";
import { TmdbModule } from "@/integrations/tmdb/tmdb.module";
import { TmdbMovieSyncService } from "./tmdb-movie-sync.service";
import { MoviePersonService } from "./movie-person.service";
import { MoviePersonRepository } from "./repositories/movie-person.repository";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { KmdbModule } from "@/integrations/kmdb/kmdb.module";
import { KmdbMovieEnrichmentRepository } from "./repositories/kmdb-movie-enrichment.repository";
import { TmdbMovieSyncRepository } from "./repositories/tmdb-movie-sync.repository";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import { MovieImportController } from "./movie-import.controller";
import { MovieManagementController } from "./movie-management.controller";
import { MovieCatalogSyncController } from "./movie-catalog-sync.controller";
import { UserMovieRecordRepository } from "./repositories/user-movie-record.repository";
import { UserMovieRecordService } from "./user-movie-record.service";
import { UserMovieNotificationService } from "./user-movie-notification.service";
import { UserMovieNotificationRepository } from "./repositories/user-movie-notification.repository";
import { PeopleRepository } from "./repositories/people.repository";
import { PeopleService } from "./people.service";
import { PeopleController } from "./people.controller";
import { UserPersonBookmarkService } from "./user-person-bookmark.service";
import { UserPersonBookmarkRepository } from "./repositories/user-person-bookmark.repository";
import { MovieSyncRepository } from "@/modules/movies/repositories/movie-sync.repository";
import { MovieSyncService } from "@/modules/movies/movie-sync.service";
import { MovieRankingSyncService } from "@/modules/movies/movie-ranking-sync.service";
import { MovieUpcomingSyncService } from "@/modules/movies/movie-upcoming-sync.service";
import { MoviePersonEnrichmentService } from "./movie-person-enrichment.service";
import { MoviePersonEnrichmentRepository } from "./repositories/movie-person-enrichment.repository";
import { MovieReleaseNotificationService } from "@/modules/movies/movie-release-notification.service";
import { MailService } from "@/modules/auth/mail.service";
import { NotificationsModule } from "@/modules/notifications/notifications.module";

@Module({
  imports: [KobisModule, TmdbModule, KmdbModule, NotificationsModule],
  controllers: [
    MoviesController,
    MovieImportController,
    MovieManagementController,
    MovieCatalogSyncController,
    PeopleController,
  ],
  providers: [
    MoviesRepository,
    MovieMatcherRepository,
    MoviesService,
    KobisMovieImportService,
    KobisMovieBatchImportService,
    TmdbMovieSyncService,
    TmdbMovieSyncRepository,
    TmdbMovieBatchImportService,
    KmdbMovieEnrichmentRepository,
    KmdbMovieEnrichmentService,
    MoviePersonService,
    MoviePersonRepository,
    UserMovieRecordRepository,
    UserMovieRecordService,
    PeopleRepository,
    PeopleService,
    UserPersonBookmarkRepository,
    UserPersonBookmarkService,
    MovieSyncRepository,
    MovieSyncService,
    MovieRankingSyncService,
    MovieUpcomingSyncService,
    MoviePersonEnrichmentRepository,
    MoviePersonEnrichmentService,
    UserMovieNotificationRepository,
    UserMovieNotificationService,
    MovieReleaseNotificationService,
    MailService,
  ],
  exports: [
    MoviesService,
    KobisMovieImportService,
    KobisMovieBatchImportService,
    TmdbMovieSyncService,
    TmdbMovieBatchImportService,
    KmdbMovieEnrichmentService,
    MoviePersonService,
    UserMovieRecordService,
    UserMovieNotificationService,
    PeopleService,
    UserPersonBookmarkService,
    MovieSyncService,
    MovieRankingSyncService,
    MovieUpcomingSyncService,
    MoviePersonEnrichmentService,
    UserMovieNotificationRepository,
    MovieReleaseNotificationService,
    MailService,
  ],
})
export class MoviesModule {}
