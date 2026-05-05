import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Like, Repository} from "typeorm";
import {ProjectEntity} from "./entities/project.entities";
import {ProjectDTO} from "./projectDTO/projectDto";

@Injectable()
export class ProjectService {
    constructor(@InjectRepository(ProjectEntity)
                private readonly projectRepository: Repository<ProjectEntity>) {}



    async searchProjects(name: string) {
        if (!name) return [];

        return await this.projectRepository.createQueryBuilder('project')

            .where('project.ProjectName LIKE :name', { name: `%${name.trim()}%` })
            .take(20)
            .orderBy('project.ProjectName', 'ASC')
            .getMany();
    }



    async findAll(query: { skip: number; take: number; search?: string }) {
        const { skip, take, search } = query;
        const queryBuilder = this.projectRepository.createQueryBuilder('project');

        if (search) {

            queryBuilder.where('project.ProjectName LIKE :search', {
                search: `%${search}%`
            });
        }

        const [items, count] = await queryBuilder
            .orderBy('project.DateCreated', 'DESC')
            .skip(skip || 0)
            .take(take || 20)
            .getManyAndCount();

        return { items, count };
    }


    async assignedProjects(project: ProjectDTO): Promise<ProjectEntity> {
        const existingProject = await this.projectRepository.findOne({
            where: {ProjectName: project.ProjectName}
        })

        if (existingProject) {
            throw new BadRequestException('A project already exists.');
        }

        const newProject = this.projectRepository.create({
            ...project,
            Status: project.Status ?? 0,
            DateCreated: new Date(),
        });

        return await this.projectRepository.save(newProject);
    }

    async updateProject(id: number, updateProject: ProjectDTO): Promise<ProjectEntity> {
        const project = await this.projectRepository.findOne({where: {id}})

        if(!project) {
            throw new BadRequestException('Project not found.');
        }

        Object.assign(project, updateProject);

        return await this.projectRepository.save(project)
    }

    async deleteProject(id: number): Promise<void> {
        const project = await this.projectRepository.delete(id)

        if(project.affected === 0) {
            throw new BadRequestException('Cant Delete this project because this project is not existing');
        }
    }
}
