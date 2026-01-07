import { AuthorizeResponse as BaseAuthorizeResponse, AccountListItem as BaseAccountListItem } from './websocket';

export interface AccountListItem extends BaseAccountListItem { }

export interface ExtendedAuthorize {
  email: string;
  currency: string;
  balance: number;
  loginid: string;
  fullname: string;
  token1: string;
  account_list: Array<AccountListItem>;
  [key: string]: unknown;
}

export interface AuthorizeResponse extends BaseAuthorizeResponse {
  authorize: ExtendedAuthorize;
  msg_type: 'authorize';
}
