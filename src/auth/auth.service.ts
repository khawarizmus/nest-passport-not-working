import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
import { AccountService, Account } from '../account/account.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserByCredentials(
    email: string,
    pswd: string,
  ): Promise<Omit<Account, 'password'>> {
    // this will be used in the jwt strategy
    const account = await this.accountService.getAccountByEmail(email);
    if (!account) {
      // user not found
      throw new UnauthorizedException('User not found');
    } else {
      // check password
      if (account.password !== pswd) {
        // password don't match
        throw new UnauthorizedException('Wrong password');
      }
    }
    return account;
  }

  async createTokens(account: any, req: Request): Promise<Request> {
    const payload = {
      id: account.id,
      role: account.role,
    };
    const payloadCount = {
      id: account.id,
      count: account.count,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15min' });
    const refreshToken = this.jwtService.sign(payloadCount, {
      expiresIn: '3d',
    });
    req.res.cookie('access-token', accessToken, {
      // maxAge: ms('15m') / 1000, // 15 minutes in seconds
      // sameSite: 'none',
      // secure: true,
    });
    req.res.cookie('refresh-token', refreshToken, {
      // maxAge: ms('3 days') / 1000, // 3 days in seconds
      // sameSite: 'none',
      // secure: true,
    });
    return req;
  }

  async refreshAccess(account: any, context: ExecutionContext) {
    const payload = {
      id: account.id,
      role: account.role,
    };
    const payloadCount = {
      id: account.id,
      count: account.count,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15min',
    });
    const refreshToken = await this.jwtService.signAsync(payloadCount, {
      expiresIn: '3d',
    });
    if (context.getType() === 'http') {
      context
        .switchToHttp()
        .getRequest()
        .res.cookie('access-token', accessToken, {
          // maxAge: ms('15m') / 1000, // 15 minutes in seconds
        });
      context
        .switchToHttp()
        .getRequest()
        .res.cookie('refresh-token', refreshToken, {
          // maxAge: ms('3 days') / 1000, // 3 days in seconds
        });
    } else if (context.getType<GqlContextType>() === 'graphql') {
      GqlExecutionContext.create(context)
        .getContext()
        .req.res.cookie('access-token', accessToken, {
          // maxAge: ms('15m') / 1000, // 3 days in seconds
        });
      GqlExecutionContext.create(context)
        .getContext()
        .req.res.cookie('refresh-token', refreshToken, {
          // maxAge: ms('3 days') / 1000, // 3 days in seconds
        });
    }
    return context;
  }
}
