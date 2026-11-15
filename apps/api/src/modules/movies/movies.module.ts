import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./controllers/movies.controller";
import { MoviesRepository } from "./repositories/movies.repository";
import { MovieMatcherRepository } from "./repositories/movie-matcher.repository";
import { MoviesService } from "./services/movies.service";
import { KobisMovieImportService } from "./services/kobis-movie-import.service";
import { KobisMovieBatchImportService } from "./services/kobis-movie-batch-import.service";
import { TmdbModule } from "@/integrations/tmdb/tmdb.module";
import { TmdbMovieSyncService } from "./services/tmdb-movie-sync.service";
import { MoviePersonResolverRepository } from "./repositories/movie-person-resolver.repository";
import { MoviePersonRepository } from "./repositories/movie-person.repository";
import { KmdbMovieEnrichmentService } from "./services/kmdb-movie-enrichment.service";
import { KmdbModule } from "@/integrations/kmdb/kmdb.module";
import { KmdbMovieEnrichmentRepository } from "./repositories/kmdb-movie-enrichment.repository";
import { TmdbMovieSyncRepository } from "./repositories/tmdb-movie-sync.repository";
import { TmdbMovieBatchImportService } from "./services/tmdb-movie-batch-import.service";
import { MovieImportController } from "./controllers/movie-import.controller";
import { MovieManagementController } from "./controllers/movie-management.controller";
import { MovieCatalogSyncController } from "./controllers/movie-catalog-sync.controller";
import { UserMovieRecordRepository } from "./repositories/user-movie-record.repository";
import { UserMovieRecordService } from "./services/user-movie-record.service";
import { UserMovieNotificationService } from "./services/user-movie-notification.service";
import { UserMovieNotificationRepository } from "./repositories/user-movie-notification.repository";
import { PeopleRepository } from "./repositories/people.repository";
import { PeopleService } from "./services/people.service";
import { PeopleController } from "./controllers/people.controller";
import { UserPersonBookmarkService } from "./services/user-person-bookmark.service";
import { UserPersonBookmarkRepository } from "./repositories/user-person-bookmark.repository";
import { MovieSyncRepository } from "@/modules/movies/repositories/movie-sync.repository";
import { MovieSyncService } from "./services/movie-sync.service";
import { MovieRankingSyncService } from "./services/movie-ranking-sync.service";
import { MovieUpcomingSyncService } from "./services/movie-upcoming-sync.service";
import { MoviePersonEnrichmentService } from "./services/movie-person-enrichment.service";
import { MoviePersonEnrichmentRepository } from "./repositories/movie-person-enrichment.repository";
import { MovieReleaseNotificationService } from "./services/movie-release-notification.service";
import { MailService } from "@/modules/auth/services/mail.service";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { ActivityModule } from "@/modules/activity/activity.module";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";

@Module({
  imports: [
    KobisModule,
    TmdbModule,
    KmdbModule,
    NotificationsModule,
    ActivityModule,
  ],
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
    MoviePersonResolverRepository,
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
    AdminGuard,
  ],
  exports: [
    MoviesRepository,
    MoviesService,
    KobisMovieImportService,
    KobisMovieBatchImportService,
    TmdbMovieSyncService,
    TmdbMovieBatchImportService,
    KmdbMovieEnrichmentService,
    MoviePersonResolverRepository,
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
