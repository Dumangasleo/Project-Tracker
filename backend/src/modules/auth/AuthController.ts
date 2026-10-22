import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './AuthService';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';
import { Public } from './Public';
import { CurrentUser } from './CurrentUser';
import type { JwtPayload } from './JwtPayload';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new member and return a JWT' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Log in with email + password, returns a JWT' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get the currently authenticated member' })
    me(@CurrentUser() user: JwtPayload) {
        return this.authService.me(user.sub);
    }
}
