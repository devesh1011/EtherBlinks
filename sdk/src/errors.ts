export class EtherblinksError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EtherblinksError";
  }
}

export class EtherblinksWebhookError extends EtherblinksError {
  constructor(message: string) {
    super(message, "WEBHOOK_VERIFICATION_FAILED");
    this.name = "EtherblinksWebhookError";
  }
}

export class EtherblinksCheckoutError extends EtherblinksError {
  constructor(message: string) {
    super(message, "INVALID_CHECKOUT_PARAMS");
    this.name = "EtherblinksCheckoutError";
  }
}

export class EtherblinksMetadataError extends EtherblinksError {
  constructor(message: string) {
    super(message, "INVALID_METADATA");
    this.name = "EtherblinksMetadataError";
  }
}
