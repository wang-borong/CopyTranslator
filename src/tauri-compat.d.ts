declare module "@gotoeasy/bus" {
  const bus: any;
  export default bus;
}

declare module "sbd" {
  const tokenizer: {
    sentences(text: string, options?: Record<string, unknown> | boolean): string[];
  };
  export default tokenizer;
}

declare module "eazydict-bing" {
  const query: Function;
  export default query;
}

declare module "eazydict-youdao" {
  const query: Function;
  export default query;
}
