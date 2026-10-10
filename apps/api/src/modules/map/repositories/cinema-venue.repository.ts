import {MapProvider, Prisma, VenueType} from "@prisma/client";
import {Injectable} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";

export type UpsertVenueInput = {
    type: VenueType;
    provider:MapProvider;
    externalId:string;
    name:string;
    brandName:string|null;

    region1Code:string;
    region1Name:string;
    region2Code:string|null;
    region2Name:string|null;
    region3Code:string|null;
    region3Name:string |null;

    hCode:string|null;
    bCode:string|null;

    roadAddress:string|null;
    jibunAddress:string|null;
    latitude:Prisma.Decimal |number| string;
    longitude:Prisma.Decimal |number| string;

    phone:string|null;
    placeUrl:string|null;
}

@Injectable()
export class VenueRepository {
    constructor(private readonly prisma:PrismaService) {}

    findByProviderAndExternalId(provider:MapProvider,externalId:string){
        return this.prisma.venue.findUnique({
            where:{
                provider_externalId:{
                    provider,
                    externalId,
                }
            }
        })
    }

    upsert(input:UpsertVenueInput){
        const {provider,externalId,...data} = input;
        return this.prisma.venue.upsert({
            where:{
                provider_externalId:{
                    provider,
                    externalId,
                }
            },
            create:{
                provider,
                externalId,
                ...data
            },
            update:{
                ...data,
                checkedAt:new Date(),
            }
        })
    }
}
