import { Injectable } from '@nestjs/common';

export type Account = any;

@Injectable()
export class AccountService {
  private readonly accounts: Account[];

  constructor() {
    this.accounts = [
      {
        id: '1',
        email: 'john@email.com',
        password: 'changeme',
        count: 0,
      },
      {
        id: '2',
        email: 'chris@email.com',
        password: 'secret',
        count: 0,
      },
      {
        id: '3',
        email: 'maria@email.com',
        password: 'guess',
        count: 0,
      },
    ];
  }

  async getAccountByEmail(email: string): Promise<Account | undefined> {
    return this.accounts.find((account) => account.email === email);
  }

  async getAccountByID(id: string): Promise<Account | undefined> {
    return this.accounts.find((account) => account.id === id);
  }
}
