export enum DecodedTransactionDataSource {
  Uniswap = 'Uniswap',
  Sourcify = 'Sourcify',
  FourByte = 'FourByte',
}

export type DecodedTransactionDataResponse = {
  data: DecodedTransactionDataMethod[];
  source: DecodedTransactionDataSource;
};

export type DecodedTransactionDataMethod = {
  name: string;
  description?: string;
  params: DecodedTransactionDataParam[];
};

export type DecodedTransactionDataParam = {
  name?: string;
  description?: string;
  type: string;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973

  value: any;
  children?: DecodedTransactionDataParam[];
};
