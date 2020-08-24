import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('problem')
  @UseGuards(JwtAuthGuard)
  passportProblem(@Req() req): string {
    console.log('request.user: ', req.user);
    console.log('request.account ', req.account);
    return 'JWT auth is working';
  }
}
