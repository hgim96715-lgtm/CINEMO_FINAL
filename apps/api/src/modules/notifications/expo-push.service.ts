import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_BATCH_SIZE = 100;

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  data?: Record<string, string>;
};

type ExpoPushTicket =
  | {
      status: "ok";
      id: string;
    }
  | {
      status: "error";
      message: string;
      details?: {
        error?: string;
      };
    };

type ExpoPushResponse = {
  data: ExpoPushTicket[];
};

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const validMessages = messages.filter(({ to }) =>
      /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(to),
    );
    if (validMessages.length === 0) return [];
    const tickets: ExpoPushTicket[] = [];
    for (
      let index = 0;
      index < validMessages.length;
      index += EXPO_PUSH_BATCH_SIZE
    ) {
      const batch = validMessages.slice(index, index + EXPO_PUSH_BATCH_SIZE);
      try {
        const response = await axios.post<ExpoPushResponse>(
          EXPO_PUSH_API_URL,
          batch,
          {
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
              ...(process.env.EXPO_ACCESS_TOKEN
                ? {
                    Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
                  }
                : {}),
            },
            timeout: 10_000,
          },
        );
        tickets.push(...response.data.data);
        for (const ticket of response.data.data) {
          if (ticket.status === "error") {
            this.logger.error(`Expo 푸시 발송 실패: ${ticket.message}`);
          }
        }
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.message ?? error.message)
          : error instanceof Error
            ? error.message
            : String(error);
        this.logger.error(`Expo Push API 호출 실패: ${message}`);
        throw error;
      }
    }
    return tickets;
  }
}
