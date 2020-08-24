import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountService } from '../account/account.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private accountService: AccountService;
  constructor(accountService: AccountService) {
    super({
      jwtFromRequest: (req) => {
        let token;
        if (req && req.cookies) {
          token = req.cookies['access-token'];
        }
        return token;
      },
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: 'a secret',
    });
    this.accountService = accountService;
  }

  async validate(request: Request, payload: any) {
    // validating user logic
    const account = await this.accountService.getAccountByID(payload.id);
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }
    return account;
  }
}
