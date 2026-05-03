export class ErrPromise<TSuccess, TError = unknown> extends Promise<TSuccess> {
  constructor(
    executor: (
      resolve: (value: TSuccess | PromiseLike<TSuccess>) => void,
      reject: (reason: TError) => void,
    ) => void,
  ) {
    super(executor)
    // Object.setPrototypeOf(this, new.target.prototype);  // restore prototype chain
  }

  then<TResult1 = TSuccess, TResult2 = never>(
    onfulfilled?: ((value: TSuccess) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: TError) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return super.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: TError) => TResult | PromiseLike<TResult>) | undefined | null,
  ): Promise<TSuccess | TResult> {
    return super.catch(onrejected)
  }
}
