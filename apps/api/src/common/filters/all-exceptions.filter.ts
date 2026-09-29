import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ExceptionResponse {
  code?: string;
  message?: string | string[];
  details?: unknown;
}

function isExceptionResponse(value: unknown): value is ExceptionResponse {
  return typeof value === "object" && value !== null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = `HTTP_${status}`;
    let message = "요청 처리 중 오류가 발생했습니다.";
    let details: unknown;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      }

      if (isExceptionResponse(exceptionResponse)) {
        if (typeof exceptionResponse.code === "string") {
          code = exceptionResponse.code;
        }

        if (typeof exceptionResponse.message === "string") {
          message = exceptionResponse.message;
        }

        if (Array.isArray(exceptionResponse.message)) {
          message = "요청 값이 올바르지 않습니다.";
          details = exceptionResponse.message;
        }

        if (exceptionResponse.details !== undefined) {
          details = exceptionResponse.details;
        }
      }
    }

    const requestIdHeader = request.headers["x-request-id"];

    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader;

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(details !== undefined && { details }),
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    });
  }
}
