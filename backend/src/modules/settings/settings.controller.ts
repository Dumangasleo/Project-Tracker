import { Controller, Get } from '@nestjs/common';

@Controller('settings')
export class SettingsController {

    @Get('profile')
    getProfile() {
        return {
            username: 'ldumangas',
            email: 'ldumangas@vortex.sync',
            plan: 'Free Plan',
            avatar: '👤',
            joinedDate: 'February 2026',
            preferences: {
                darkMode: true,
                notifications: true
            }
        };
    }

    @Get('about')
    getAboutInfo() {
        return {
            version: '1.0.0-alpha',
            author: 'ldumangas',
            description: 'Vortex Sync is a central hub for team collaboration and project tracking.'
        };
    }
}