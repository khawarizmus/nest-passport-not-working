import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accountService: AccountService,
    private authService: AuthService,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    } else if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    }
  }

  async canActivate(context: ExecutionContext) {
    // this function handles the refresh token mechanism
    const req = this.getRequest(context);
    let validAccess;
    let validRefresh;
    const accessToken = req.cookies['access-token'];
    const refreshToken = req.cookies['refresh-token'];
    try {
      validAccess = this.jwtService.verify(accessToken);
    } catch (e) {
      // expired or invalid access token
      Logger.warn(`access-token: ${e.message}`);
    }
    if (!accessToken || !validAccess) {
      // invalid access token or absent
      // we check the refresh token
      try {
        validRefresh = this.jwtService.verify(refreshToken);
      } catch (e) {
        Logger.error(`refresh-token: ${e.message}`);
      }
      if (!refreshToken || !validRefresh) {
        // invalid refresh or absent
        throw new UnauthorizedException('invalid refresh token');
      } else {
        // refresh token hasn't been tempered or expired
        const account = await this.accountService.getAccountByID(
          validRefresh.id,
        );
        if (account.count !== validRefresh.count) {
          throw new UnauthorizedException('Invalid refresh token');
        }
        // we give new tokens
        context = await this.authService.refreshAccess(account, context);
        // plug the account in the request
        if (context.getType() === 'http') {
          context.switchToHttp().getRequest().user = account;
        } else if (context.getType<GqlContextType>() === 'graphql') {
          GqlExecutionContext.create(context).getContext().req.user = account;
        }
      }
      return true;
    } else {
      return (await super.canActivate(context)) as boolean;
    }
  }
}
