import {Injectable} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";
import type {
    KakaoAddressSearchResponse,
    KakaoLocalSearchResponse,
} from "./types/kakao-local-response.type";


@Injectable()
export class KakaoService {
    constructor(private readonly httpService: HttpService) {
    }

    async searchMovieTheaters(
        query: string,
        page=1,
        size=15,
    ):Promise<KakaoLocalSearchResponse>{
        const {data}=await firstValueFrom(
            this.httpService.get<KakaoLocalSearchResponse>(
                '/v2/local/search/keyword.json',{
                    params:{
                        query,
                        category_group_code:'CT1',
                        page,
                        size,
                    }
                }
            )
        )
        return  data;
    }

    async searchAddress(query:string,page=1,size=10):Promise<KakaoAddressSearchResponse>{
        const {data}=await firstValueFrom(
            this.httpService.get<KakaoAddressSearchResponse>('/v2/local/search/address.json',{
                params:{
                    query,
                    page,
                    size,
                }
            })
        );
        return data;
    }
}
