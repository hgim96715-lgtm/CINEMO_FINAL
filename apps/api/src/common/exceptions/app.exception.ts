import { HttpException, HttpStatus } from "@nestjs/common";

interface AppExceptionOptions {
  code: string;
  message: string;
  status: HttpStatus;
  details?: unknown;
}

export class AppException extends HttpException {
  constructor(options: AppExceptionOptions) {
    super(
      {
        code: options.code,
        message: options.message,
        details: options.details,
      },
      options.status,
    );
  }
}
