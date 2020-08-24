import { Controller, Post, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() req,
  ) {
    const account = await this.authService.validateUserByCredentials(
      email,
      password,
    );
    if (account) {
      // account exists
      req = await this.authService.createTokens(account, req);
      return account;
    }
    return null;
  }
}
