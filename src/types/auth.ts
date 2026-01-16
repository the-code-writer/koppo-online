// Base interfaces for authentication responses
export interface AccountListItem {
  loginid: string;
  currency: string;
  [key: string]: unknown;
}

export interface BaseAuthorizeResponse {
  authorize: {
    email: string;
    currency: string;
    balance: number;
    loginid: string;
    fullname: string;
    [key: string]: unknown;
  };
  echo_req: {
    authorize: string;
    req_id: number;
  };
  msg_type: string;
  req_id: number;
  [key: string]: unknown;
}

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
