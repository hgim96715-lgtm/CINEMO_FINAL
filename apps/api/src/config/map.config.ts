import {registerAs} from "@nestjs/config";
import {EnvKeys} from "@/config/env-keys";

export const mapConfig = registerAs("map", () => ({
    provider: "KAKAO",
    kakaoRestApiKey: process.env[EnvKeys.KAKAO_REST_API_KEY],
}));