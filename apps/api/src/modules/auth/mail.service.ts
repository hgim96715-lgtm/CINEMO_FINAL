import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

type SendVerificationEmailInput = {
  to: string;
  token: string;
  expiresAt: Date;
};

type SendPasswordResetEmailInput = {
  to: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly apiUrl: string;
  private readonly frontendUrl: string;

  private readonly koreanDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });

  private formatExpiresAt(date: Date) {
    return this.koreanDateTimeFormatter.format(date);
  }

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>("mail.apiKey"),
    );
    this.from = this.configService.getOrThrow<string>("mail.from");
    this.apiUrl = this.configService.getOrThrow<string>("app.apiUrl");
    this.frontendUrl = this.configService.getOrThrow<string>("app.frontendUrl");
  }

  async sendSignupVerificationEmail(input: SendVerificationEmailInput) {
    const verifyUrl = new URL(`/v1/auth/verify-email`, this.apiUrl);
    verifyUrl.searchParams.set("token", input.token);

    const expiresAtLabel = this.formatExpiresAt(input.expiresAt);

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [input.to],
      subject: "CINEMO 이메일 인증",
      text: `CINEMO 이메일 인증\n\n아래 링크를 열어 회원가입을 완료하세요.\n${verifyUrl.toString()}\n\n인증 링크는 ${expiresAtLabel}까지 유효합니다.`,
      html: `
        <!doctype html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>CINEMO 이메일 인증</title>
          </head>
          <body style="margin:0; padding:0; background:#061719; color:#f7f3ea; font-family:Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#061719;">
              <tr>
                <td align="center" style="padding:40px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background:#10292b; border:1px solid #29484a; border-radius:24px; overflow:hidden;">
                    <tr>
                      <td style="padding:34px 36px 30px; background:linear-gradient(135deg, #10292b 0%, #173d3d 100%);">
                        <div style="color:#d5aa58; font-size:13px; font-weight:700; letter-spacing:4px;">CINEMO</div>
                        <h1 style="margin:22px 0 0; color:#fffaf0; font-size:30px; line-height:1.35; font-weight:700;">영화로운 취향을<br />시작하는 한 걸음</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:34px 36px 38px;">
                        <div style="display:inline-block; padding:7px 12px; border:1px solid #806634; border-radius:999px; color:#e0b966; font-size:12px; font-weight:700; letter-spacing:1px;">EMAIL VERIFICATION</div>
                        <h2 style="margin:22px 0 12px; color:#fffaf0; font-size:24px; line-height:1.4;">이메일 인증을 완료해주세요</h2>
                        <p style="margin:0; color:#b6c3c0; font-size:16px; line-height:1.8;">CINEMO 회원가입을 완료하려면<br />아래 버튼을 눌러 이메일 인증을 완료해주세요.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
                          <tr>
                            <td align="center" style="border-radius:12px; background:#d5aa58;">
                              <a href="${verifyUrl.toString()}" style="display:inline-block; padding:15px 26px; color:#071719; font-size:16px; font-weight:700; text-decoration:none;">이메일 인증하기&nbsp; →</a>
                            </td>
                          </tr>
                        </table>
                        <div style="padding:16px 18px; border-left:3px solid #d5aa58; background:#0b2123; color:#aebdb9; font-size:13px; line-height:1.7;">
                          인증 링크는<br /><strong style="color:#f2d38c;">${expiresAtLabel}</strong>까지 유효합니다.
                        </div>
                        <p style="margin:28px 0 0; color:#738a87; font-size:12px; line-height:1.7;">본인이 요청하지 않은 메일이라면 이 메일을 무시해주세요.<br />이 링크는 한 번만 사용할 수 있습니다.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 36px; border-top:1px solid #29484a; color:#6f8582; font-size:12px; line-height:1.6;">CINEMO · 당신의 다음 영화를 찾는 곳</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
    if (error) {
      this.logger.error(
        `[Resend] 인증 메일 발송 실패: ${error.name} ${error.message}`,
      );
      throw new InternalServerErrorException("인증 메일 발송에 실패했습니다.");
    }
  }

  async sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
    const resetUrl = new URL("/reset-password", this.frontendUrl);
    resetUrl.searchParams.set("token", input.token);

    const expiresAtLabel = this.formatExpiresAt(input.expiresAt);

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [input.to],
      subject: "CINEMO 비밀번호 재설정",
      text: [
        "CINEMO 비밀번호 재설정",
        "",
        "아래 링크를 눌러 비밀번호를 재설정해주세요.",
        resetUrl.toString(),
        "",
        `재설정 링크는 ${expiresAtLabel}까지 유효합니다.`,
        "본인이 요청하지 않은 메일이라면 이 메일을 무시해주세요.",
      ].join("\n"),
      html: `
        <!doctype html>
        <html lang="ko">
          <body style="margin:0; padding:40px 16px; background:#061719; color:#f7f3ea; font-family:Arial, sans-serif;">
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="max-width:600px; margin:0 auto; background:#10292b; border:1px solid #29484a; border-radius:24px;"
            >
              <tr>
                <td style="padding:36px;">
                  <div style="color:#d5aa58; font-size:13px; font-weight:700; letter-spacing:4px;">
                    CINEMO
                  </div>

                  <h1 style="margin:24px 0 14px; color:#fffaf0; font-size:28px;">
                    비밀번호를 재설정해주세요
                  </h1>

                  <p style="color:#b6c3c0; font-size:16px; line-height:1.8;">
                    아래 버튼을 눌러 새로운 비밀번호를 설정해주세요.
                  </p>

                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
                    <tr>
                      <td style="border-radius:12px; background:#d5aa58;">
                        <a
                          href="${resetUrl.toString()}"
                          style="display:inline-block; padding:15px 26px; color:#071719; font-size:16px; font-weight:700; text-decoration:none;"
                        >
                          비밀번호 재설정하기 →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="padding:16px 18px; border-left:3px solid #d5aa58; background:#0b2123; color:#aebdb9; font-size:13px; line-height:1.7;">
                    재설정 링크는<br />
                    <strong style="color:#f2d38c;">${expiresAtLabel}</strong>까지 유효합니다.
                  </div>

                  <p style="margin:28px 0 0; color:#738a87; font-size:12px; line-height:1.7;">
                    본인이 요청하지 않은 메일이라면 이 메일을 무시해주세요.<br />
                    이 링크는 한 번만 사용할 수 있습니다.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      this.logger.error(
        `[Resend] 비밀번호 재설정 메일 발송 실패: ${error.name} ${error.message}`,
      );

      throw new InternalServerErrorException(
        "비밀번호 재설정 메일 발송에 실패했습니다.",
      );
    }
  }
}
