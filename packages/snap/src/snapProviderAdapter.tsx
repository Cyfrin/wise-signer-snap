// Simple provider adapter that wraps the snap's ethereum provider
export class SnapProviderAdapter {
    constructor(private snapProvider: any) { }

    async request<Params, Result>(eip1193Request: { method: string; params?: Params }): Promise<Result> {
        return this.snapProvider.request(eip1193Request);
    }

    sendAsync<Params>(eip1193Request: { method: string; params?: Params }, callback: (error: unknown, providerRes?: any) => void): void {
        this.snapProvider.request(eip1193Request)
            .then((result: any) => callback(null, { result }))
            .catch((error: any) => callback(error));
    }

    send<Params>(eip1193Request: { method: string; params?: Params }, callback: (error: unknown, providerRes?: any) => void): void {
        this.sendAsync(eip1193Request, callback);
    }

    // Event emitter methods (no-ops for our use case)
    on() { return this; }
    off() { return this; }
    removeListener() { return this; }
    emit() { return false; }
    listeners() { return []; }
}