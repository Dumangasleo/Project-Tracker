import {Controller, Get} from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {

    @Get('stats')
    getDashboardStats() {
        return {
            activeProjects: 24,
            pendingTasks: 85,
            teamVelocity: '94%',
            userName: 'admin'
        };
}

    @Get('projects')
    getProjects() {
        return [
            { id: 1, name: 'Vortex Sync App', status: 'In Progress', lead: 'ldumangas', priority: 'High' },
            { id: 2, name: 'E-commerce API', status: 'Completed', lead: 'Sarah J.', priority: 'Medium' },
            { id: 3, name: 'AI Chatbot', status: 'Pending', lead: 'Mike R.', priority: 'Low' },
        ];
    }
}
