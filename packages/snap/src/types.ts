export interface Transaction {
    data?: string;
    to?: string;
    value?: string;
    [key: string]: any;
}

export interface FourByteSignature {
    id: number;
    text_signature: string;
    hex_signature: string;
    bytes_signature: string;
}

export interface FourByteResponse {
    count: number;
    results: FourByteSignature[];
}

export interface DecodedFunction {
    selector: string;
    signature: string;
    name: string;
    inputs: any[];
    decodedInputs: any[];
}

export interface DecodedResult {
    originalData: string;
    function?: DecodedFunction;
    error?: string;
    nestedDecoding?: DecodedResult[];
}