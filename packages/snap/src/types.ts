export type Transaction = {
  data?: string;
  to?: string;
  value?: string;
  [key: string]: any;
};

export type FourByteSignature = {
  id: number;
  text_signature: string;
  hex_signature: string;
  bytes_signature: string;
};

export type FourByteResponse = {
  count: number;
  results: FourByteSignature[];
};

export type DecodedFunction = {
  selector: string;
  signature: string;
  name: string;
  inputs: any[];
  decodedInputs: any[];
};

export type DecodedResult = {
  originalData: string;
  function?: DecodedFunction;
  error?: string;
  nestedDecoding?: DecodedResult[];
};
