import {HttpModule} from "@nestjs/axios";
import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {KakaoService} from "@/integrations/kakao/kakao.service";
import {KakaoController} from "./kakao.controller";

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                baseURL: "https://dapi.kakao.com",
                timeout: 10_000,
                maxRedirects: 3,
                headers: {
                    Authorization: `KakaoAK ${configService.getOrThrow<string>(
                        "map.kakaoRestApiKey",
                    )}`,
                },
            }),
        }),
    ],
    controllers: [KakaoController],
    providers: [KakaoService],
    exports: [HttpModule,KakaoService],
})
export class KakaoModule {}