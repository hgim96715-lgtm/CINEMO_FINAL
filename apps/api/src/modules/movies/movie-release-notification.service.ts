import {Injectable, Logger} from "@nestjs/common";

import {MailService} from "@/modules/auth/mail.service";

import {UserMovieNotificationRepository} from "./repositories/user-movie-notification.repository";

@Injectable()
export class MovieReleaseNotificationService {
  private readonly logger = new Logger(MovieReleaseNotificationService.name);
  constructor (private readonly notificationRepository:UserMovieNotificationRepository,
               private readonly mailService: MailService) {}
  
  async sendDueReleaseNotifications(now=new Date()){
    const notifications=await this.notificationRepository.findDueReleaseNotifications(now);
    this.logger.log(notifications);
    let sendCount=0;
    let failedCount=0;
    
    for(const notification of notifications){
      const email=notification.user.email;
      const releaseDate=notification.release?.releaseDate;
      const movieTitle=notification.movie.titles[0]?.title??'영화';
      
      if(!email || !releaseDate) continue
      try{
        await this.mailService.sendMovieReleaseNotificationEmail({
          to:email,
          movieId:notification.movie.id,
          movieTitle,
          releaseDate,
        });
        await this.notificationRepository.marksNotified(notification.id);
        sendCount+=1;
      }catch(error){
        failedCount+=1;
        const message=error instanceof  Error ? error.message:String(error);
       this.logger.error(`개봉 알림 발송 실패: ${notification.id} - ${message}`);
      }
    }
    if (failedCount > 0) {
      throw new Error(`개봉 알림 ${failedCount}건 발송 실패`);
    }
    return {
      totalCount:notifications.length,
      sendCount,
      failedCount,
    }
    
  }
}