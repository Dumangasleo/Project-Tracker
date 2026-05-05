import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ProjectService} from "./project.service";
import {ProjectController} from "./project.controller";
import {ProjectEntity} from "./entities/project.entities";

@Module({
    imports: [TypeOrmModule.forFeature([ProjectEntity])],
    providers: [ProjectService],
    controllers: [ProjectController],
    exports: [TypeOrmModule]
})
export class ProjectModule {}
