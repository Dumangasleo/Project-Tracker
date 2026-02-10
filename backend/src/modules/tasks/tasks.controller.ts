import {Controller, Get} from '@nestjs/common';

@Controller('tasks')
export class TasksController {

    @Get()
    findAll() {
        return [
            {
                id: 1,
                title: 'Initialize Repository',
                description: 'Setup Git and move project to D: Drive',
                status: 'completed',
                dueDate: '2026-02-06'
            },
            {
                id: 2,
                title: 'Build Task UI',
                description: 'Create the frontend layout for Vortex Sync tasks',
                status: 'in-progress',
                dueDate: '2026-02-07'
            }
        ];
    }
}
