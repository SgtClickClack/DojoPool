/**
 * Client
 **/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model User
 *
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>;
/**
 * Model Profile
 *
 */
export type Profile = $Result.DefaultSelection<Prisma.$ProfilePayload>;
/**
 * Model UserSettings
 *
 */
export type UserSettings =
  $Result.DefaultSelection<Prisma.$UserSettingsPayload>;
/**
 * Model Territory
 *
 */
export type Territory = $Result.DefaultSelection<Prisma.$TerritoryPayload>;
/**
 * Model UserNFT
 *
 */
export type UserNFT = $Result.DefaultSelection<Prisma.$UserNFTPayload>;
/**
 * Model Tournament
 *
 */
export type Tournament = $Result.DefaultSelection<Prisma.$TournamentPayload>;
/**
 * Model Challenge
 *
 */
export type Challenge = $Result.DefaultSelection<Prisma.$ChallengePayload>;
/**
 * Model Nomination
 *
 */
export type Nomination = $Result.DefaultSelection<Prisma.$NominationPayload>;
/**
 * Model Clan
 *
 */
export type Clan = $Result.DefaultSelection<Prisma.$ClanPayload>;
/**
 * Model ClanMember
 *
 */
export type ClanMember = $Result.DefaultSelection<Prisma.$ClanMemberPayload>;
/**
 * Model ClanWar
 *
 */
export type ClanWar = $Result.DefaultSelection<Prisma.$ClanWarPayload>;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions
    ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions['log']>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(
    optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>
  );
  $on<V extends U>(
    eventType: V,
    callback: (
      event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent
    ) => void
  ): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (
      prisma: Omit<PrismaClient, runtime.ITXClientDenyList>
    ) => $Utils.JsPromise<R>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    'extends',
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.profile`: Exposes CRUD operations for the **Profile** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Profiles
   * const profiles = await prisma.profile.findMany()
   * ```
   */
  get profile(): Prisma.ProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userSettings`: Exposes CRUD operations for the **UserSettings** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more UserSettings
   * const userSettings = await prisma.userSettings.findMany()
   * ```
   */
  get userSettings(): Prisma.UserSettingsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.territory`: Exposes CRUD operations for the **Territory** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Territories
   * const territories = await prisma.territory.findMany()
   * ```
   */
  get territory(): Prisma.TerritoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userNFT`: Exposes CRUD operations for the **UserNFT** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more UserNFTS
   * const userNFTS = await prisma.userNFT.findMany()
   * ```
   */
  get userNFT(): Prisma.UserNFTDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tournament`: Exposes CRUD operations for the **Tournament** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Tournaments
   * const tournaments = await prisma.tournament.findMany()
   * ```
   */
  get tournament(): Prisma.TournamentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.challenge`: Exposes CRUD operations for the **Challenge** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Challenges
   * const challenges = await prisma.challenge.findMany()
   * ```
   */
  get challenge(): Prisma.ChallengeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.nomination`: Exposes CRUD operations for the **Nomination** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Nominations
   * const nominations = await prisma.nomination.findMany()
   * ```
   */
  get nomination(): Prisma.NominationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.clan`: Exposes CRUD operations for the **Clan** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Clans
   * const clans = await prisma.clan.findMany()
   * ```
   */
  get clan(): Prisma.ClanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.clanMember`: Exposes CRUD operations for the **ClanMember** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more ClanMembers
   * const clanMembers = await prisma.clanMember.findMany()
   * ```
   */
  get clanMember(): Prisma.ClanMemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.clanWar`: Exposes CRUD operations for the **ClanWar** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more ClanWars
   * const clanWars = await prisma.clanWar.findMany()
   * ```
   */
  get clanWar(): Prisma.ClanWarDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics;
  export type Metric<T> = runtime.Metric<T>;
  export type MetricHistogram = runtime.MetricHistogram;
  export type MetricHistogramBucket = runtime.MetricHistogramBucket;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 6.6.0
   * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
   */
  export type PrismaVersion = {
    client: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> =
    T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<
    T extends (...args: any) => $Utils.JsPromise<any>,
  > = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? 'Please either choose `select` or `include`.'
    : T extends SelectAndOmit
      ? 'Please either choose `select` or `omit`.'
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object
    ? U extends object
      ? (Without<T, U> & U) | (Without<U, T> & T)
      : U
    : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends BigInt
            ? False
            : T extends object
              ? True
              : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<
    __Either<O, K>
  >;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = O extends unknown ? _Either<O, K, strict> : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O
    ? O[K]
    : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown
    ? AtStrict<O, K>
    : never;
  export type At<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ?
          | (K extends keyof O ? { [P in K]: O[P] } & O : O)
          | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >;

  type _Strict<U, _U = U> = U extends unknown
    ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>>
    : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>,
  > = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<
            UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never
          >
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<
    T,
    K extends Enumerable<keyof T> | keyof T,
  > = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}`
    ? never
    : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never
    ? never
    : FieldRef<Model, FieldType>;

  export const ModelName: {
    User: 'User';
    Profile: 'Profile';
    UserSettings: 'UserSettings';
    Territory: 'Territory';
    UserNFT: 'UserNFT';
    Tournament: 'Tournament';
    Challenge: 'Challenge';
    Nomination: 'Nomination';
    Clan: 'Clan';
    ClanMember: 'ClanMember';
    ClanWar: 'ClanWar';
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  export type Datasources = {
    db?: Datasource;
  };

  interface TypeMapCb<ClientOptions = {}>
    extends $Utils.Fn<
      { extArgs: $Extensions.InternalArgs },
      $Utils.Record<string, any>
    > {
    returns: Prisma.TypeMap<
      this['params']['extArgs'],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >;
  }

  export type TypeMap<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps:
        | 'user'
        | 'profile'
        | 'userSettings'
        | 'territory'
        | 'userNFT'
        | 'tournament'
        | 'challenge'
        | 'nomination'
        | 'clan'
        | 'clanMember'
        | 'clanWar';
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>;
        fields: Prisma.UserFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[];
          };
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[];
          };
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[];
          };
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPayload>;
          };
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateUser>;
          };
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>;
            result: $Utils.Optional<UserGroupByOutputType>[];
          };
          count: {
            args: Prisma.UserCountArgs<ExtArgs>;
            result: $Utils.Optional<UserCountAggregateOutputType> | number;
          };
        };
      };
      Profile: {
        payload: Prisma.$ProfilePayload<ExtArgs>;
        fields: Prisma.ProfileFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ProfileFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ProfileFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          findFirst: {
            args: Prisma.ProfileFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ProfileFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          findMany: {
            args: Prisma.ProfileFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[];
          };
          create: {
            args: Prisma.ProfileCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          createMany: {
            args: Prisma.ProfileCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ProfileCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[];
          };
          delete: {
            args: Prisma.ProfileDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          update: {
            args: Prisma.ProfileUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          deleteMany: {
            args: Prisma.ProfileDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ProfileUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ProfileUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[];
          };
          upsert: {
            args: Prisma.ProfileUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>;
          };
          aggregate: {
            args: Prisma.ProfileAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateProfile>;
          };
          groupBy: {
            args: Prisma.ProfileGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ProfileGroupByOutputType>[];
          };
          count: {
            args: Prisma.ProfileCountArgs<ExtArgs>;
            result: $Utils.Optional<ProfileCountAggregateOutputType> | number;
          };
        };
      };
      UserSettings: {
        payload: Prisma.$UserSettingsPayload<ExtArgs>;
        fields: Prisma.UserSettingsFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.UserSettingsFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.UserSettingsFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          findFirst: {
            args: Prisma.UserSettingsFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.UserSettingsFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          findMany: {
            args: Prisma.UserSettingsFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>[];
          };
          create: {
            args: Prisma.UserSettingsCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          createMany: {
            args: Prisma.UserSettingsCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.UserSettingsCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>[];
          };
          delete: {
            args: Prisma.UserSettingsDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          update: {
            args: Prisma.UserSettingsUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          deleteMany: {
            args: Prisma.UserSettingsDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.UserSettingsUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.UserSettingsUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>[];
          };
          upsert: {
            args: Prisma.UserSettingsUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserSettingsPayload>;
          };
          aggregate: {
            args: Prisma.UserSettingsAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateUserSettings>;
          };
          groupBy: {
            args: Prisma.UserSettingsGroupByArgs<ExtArgs>;
            result: $Utils.Optional<UserSettingsGroupByOutputType>[];
          };
          count: {
            args: Prisma.UserSettingsCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<UserSettingsCountAggregateOutputType>
              | number;
          };
        };
      };
      Territory: {
        payload: Prisma.$TerritoryPayload<ExtArgs>;
        fields: Prisma.TerritoryFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.TerritoryFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.TerritoryFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          findFirst: {
            args: Prisma.TerritoryFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.TerritoryFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          findMany: {
            args: Prisma.TerritoryFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>[];
          };
          create: {
            args: Prisma.TerritoryCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          createMany: {
            args: Prisma.TerritoryCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.TerritoryCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>[];
          };
          delete: {
            args: Prisma.TerritoryDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          update: {
            args: Prisma.TerritoryUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          deleteMany: {
            args: Prisma.TerritoryDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.TerritoryUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.TerritoryUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>[];
          };
          upsert: {
            args: Prisma.TerritoryUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TerritoryPayload>;
          };
          aggregate: {
            args: Prisma.TerritoryAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateTerritory>;
          };
          groupBy: {
            args: Prisma.TerritoryGroupByArgs<ExtArgs>;
            result: $Utils.Optional<TerritoryGroupByOutputType>[];
          };
          count: {
            args: Prisma.TerritoryCountArgs<ExtArgs>;
            result: $Utils.Optional<TerritoryCountAggregateOutputType> | number;
          };
        };
      };
      UserNFT: {
        payload: Prisma.$UserNFTPayload<ExtArgs>;
        fields: Prisma.UserNFTFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.UserNFTFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.UserNFTFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          findFirst: {
            args: Prisma.UserNFTFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.UserNFTFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          findMany: {
            args: Prisma.UserNFTFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>[];
          };
          create: {
            args: Prisma.UserNFTCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          createMany: {
            args: Prisma.UserNFTCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.UserNFTCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>[];
          };
          delete: {
            args: Prisma.UserNFTDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          update: {
            args: Prisma.UserNFTUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          deleteMany: {
            args: Prisma.UserNFTDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.UserNFTUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.UserNFTUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>[];
          };
          upsert: {
            args: Prisma.UserNFTUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserNFTPayload>;
          };
          aggregate: {
            args: Prisma.UserNFTAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateUserNFT>;
          };
          groupBy: {
            args: Prisma.UserNFTGroupByArgs<ExtArgs>;
            result: $Utils.Optional<UserNFTGroupByOutputType>[];
          };
          count: {
            args: Prisma.UserNFTCountArgs<ExtArgs>;
            result: $Utils.Optional<UserNFTCountAggregateOutputType> | number;
          };
        };
      };
      Tournament: {
        payload: Prisma.$TournamentPayload<ExtArgs>;
        fields: Prisma.TournamentFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.TournamentFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.TournamentFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          findFirst: {
            args: Prisma.TournamentFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.TournamentFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          findMany: {
            args: Prisma.TournamentFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[];
          };
          create: {
            args: Prisma.TournamentCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          createMany: {
            args: Prisma.TournamentCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.TournamentCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[];
          };
          delete: {
            args: Prisma.TournamentDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          update: {
            args: Prisma.TournamentUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          deleteMany: {
            args: Prisma.TournamentDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.TournamentUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.TournamentUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[];
          };
          upsert: {
            args: Prisma.TournamentUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>;
          };
          aggregate: {
            args: Prisma.TournamentAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateTournament>;
          };
          groupBy: {
            args: Prisma.TournamentGroupByArgs<ExtArgs>;
            result: $Utils.Optional<TournamentGroupByOutputType>[];
          };
          count: {
            args: Prisma.TournamentCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<TournamentCountAggregateOutputType>
              | number;
          };
        };
      };
      Challenge: {
        payload: Prisma.$ChallengePayload<ExtArgs>;
        fields: Prisma.ChallengeFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ChallengeFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ChallengeFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          findFirst: {
            args: Prisma.ChallengeFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ChallengeFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          findMany: {
            args: Prisma.ChallengeFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>[];
          };
          create: {
            args: Prisma.ChallengeCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          createMany: {
            args: Prisma.ChallengeCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ChallengeCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>[];
          };
          delete: {
            args: Prisma.ChallengeDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          update: {
            args: Prisma.ChallengeUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          deleteMany: {
            args: Prisma.ChallengeDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ChallengeUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ChallengeUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>[];
          };
          upsert: {
            args: Prisma.ChallengeUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ChallengePayload>;
          };
          aggregate: {
            args: Prisma.ChallengeAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateChallenge>;
          };
          groupBy: {
            args: Prisma.ChallengeGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ChallengeGroupByOutputType>[];
          };
          count: {
            args: Prisma.ChallengeCountArgs<ExtArgs>;
            result: $Utils.Optional<ChallengeCountAggregateOutputType> | number;
          };
        };
      };
      Nomination: {
        payload: Prisma.$NominationPayload<ExtArgs>;
        fields: Prisma.NominationFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.NominationFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.NominationFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          findFirst: {
            args: Prisma.NominationFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.NominationFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          findMany: {
            args: Prisma.NominationFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>[];
          };
          create: {
            args: Prisma.NominationCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          createMany: {
            args: Prisma.NominationCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.NominationCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>[];
          };
          delete: {
            args: Prisma.NominationDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          update: {
            args: Prisma.NominationUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          deleteMany: {
            args: Prisma.NominationDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.NominationUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.NominationUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>[];
          };
          upsert: {
            args: Prisma.NominationUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$NominationPayload>;
          };
          aggregate: {
            args: Prisma.NominationAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateNomination>;
          };
          groupBy: {
            args: Prisma.NominationGroupByArgs<ExtArgs>;
            result: $Utils.Optional<NominationGroupByOutputType>[];
          };
          count: {
            args: Prisma.NominationCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<NominationCountAggregateOutputType>
              | number;
          };
        };
      };
      Clan: {
        payload: Prisma.$ClanPayload<ExtArgs>;
        fields: Prisma.ClanFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ClanFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ClanFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          findFirst: {
            args: Prisma.ClanFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ClanFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          findMany: {
            args: Prisma.ClanFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>[];
          };
          create: {
            args: Prisma.ClanCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          createMany: {
            args: Prisma.ClanCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ClanCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>[];
          };
          delete: {
            args: Prisma.ClanDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          update: {
            args: Prisma.ClanUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          deleteMany: {
            args: Prisma.ClanDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ClanUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ClanUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>[];
          };
          upsert: {
            args: Prisma.ClanUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanPayload>;
          };
          aggregate: {
            args: Prisma.ClanAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateClan>;
          };
          groupBy: {
            args: Prisma.ClanGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ClanGroupByOutputType>[];
          };
          count: {
            args: Prisma.ClanCountArgs<ExtArgs>;
            result: $Utils.Optional<ClanCountAggregateOutputType> | number;
          };
        };
      };
      ClanMember: {
        payload: Prisma.$ClanMemberPayload<ExtArgs>;
        fields: Prisma.ClanMemberFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ClanMemberFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ClanMemberFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          findFirst: {
            args: Prisma.ClanMemberFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ClanMemberFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          findMany: {
            args: Prisma.ClanMemberFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>[];
          };
          create: {
            args: Prisma.ClanMemberCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          createMany: {
            args: Prisma.ClanMemberCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ClanMemberCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>[];
          };
          delete: {
            args: Prisma.ClanMemberDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          update: {
            args: Prisma.ClanMemberUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          deleteMany: {
            args: Prisma.ClanMemberDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ClanMemberUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ClanMemberUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>[];
          };
          upsert: {
            args: Prisma.ClanMemberUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanMemberPayload>;
          };
          aggregate: {
            args: Prisma.ClanMemberAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateClanMember>;
          };
          groupBy: {
            args: Prisma.ClanMemberGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ClanMemberGroupByOutputType>[];
          };
          count: {
            args: Prisma.ClanMemberCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<ClanMemberCountAggregateOutputType>
              | number;
          };
        };
      };
      ClanWar: {
        payload: Prisma.$ClanWarPayload<ExtArgs>;
        fields: Prisma.ClanWarFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ClanWarFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ClanWarFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          findFirst: {
            args: Prisma.ClanWarFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ClanWarFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          findMany: {
            args: Prisma.ClanWarFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>[];
          };
          create: {
            args: Prisma.ClanWarCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          createMany: {
            args: Prisma.ClanWarCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ClanWarCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>[];
          };
          delete: {
            args: Prisma.ClanWarDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          update: {
            args: Prisma.ClanWarUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          deleteMany: {
            args: Prisma.ClanWarDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ClanWarUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ClanWarUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>[];
          };
          upsert: {
            args: Prisma.ClanWarUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ClanWarPayload>;
          };
          aggregate: {
            args: Prisma.ClanWarAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateClanWar>;
          };
          groupBy: {
            args: Prisma.ClanWarGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ClanWarGroupByOutputType>[];
          };
          count: {
            args: Prisma.ClanWarCountArgs<ExtArgs>;
            result: $Utils.Optional<ClanWarCountAggregateOutputType> | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<
    'define',
    Prisma.TypeMapCb,
    $Extensions.DefaultArgs
  >;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources;
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string;
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
  }
  export type GlobalOmitConfig = {
    user?: UserOmit;
    profile?: ProfileOmit;
    userSettings?: UserSettingsOmit;
    territory?: TerritoryOmit;
    userNFT?: UserNFTOmit;
    tournament?: TournamentOmit;
    challenge?: ChallengeOmit;
    nomination?: NominationOmit;
    clan?: ClanOmit;
    clanMember?: ClanMemberOmit;
    clanWar?: ClanWarOmit;
  };

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error';
  export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
  };

  export type GetLogType<T extends LogLevel | LogDefinition> =
    T extends LogDefinition
      ? T['emit'] extends 'event'
        ? T['level']
        : never
      : never;
  export type GetEvents<T extends any> =
    T extends Array<LogLevel | LogDefinition>
      ?
          | GetLogType<T[0]>
          | GetLogType<T[1]>
          | GetLogType<T[2]>
          | GetLogType<T[3]>
      : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy';

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName;
    action: PrismaAction;
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
  };

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>
  ) => $Utils.JsPromise<T>;

  // tested in getLogLevel.test.ts
  export function getLogLevel(
    log: Array<LogLevel | LogDefinition>
  ): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<
    Prisma.DefaultPrismaClient,
    runtime.ITXClientDenyList
  >;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    territories: number;
    nfts: number;
    challengesAsChallenger: number;
    challengesAsDefender: number;
    nominations: number;
    ledClans: number;
  };

  export type UserCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    territories?: boolean | UserCountOutputTypeCountTerritoriesArgs;
    nfts?: boolean | UserCountOutputTypeCountNftsArgs;
    challengesAsChallenger?:
      | boolean
      | UserCountOutputTypeCountChallengesAsChallengerArgs;
    challengesAsDefender?:
      | boolean
      | UserCountOutputTypeCountChallengesAsDefenderArgs;
    nominations?: boolean | UserCountOutputTypeCountNominationsArgs;
    ledClans?: boolean | UserCountOutputTypeCountLedClansArgs;
  };

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTerritoriesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: TerritoryWhereInput;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNftsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserNFTWhereInput;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountChallengesAsChallengerArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ChallengeWhereInput;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountChallengesAsDefenderArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ChallengeWhereInput;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNominationsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: NominationWhereInput;
  };

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLedClansArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWhereInput;
  };

  /**
   * Count Type TerritoryCountOutputType
   */

  export type TerritoryCountOutputType = {
    nfts: number;
    challenges: number;
    homeDojoUsers: number;
    contestedWars: number;
  };

  export type TerritoryCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    nfts?: boolean | TerritoryCountOutputTypeCountNftsArgs;
    challenges?: boolean | TerritoryCountOutputTypeCountChallengesArgs;
    homeDojoUsers?: boolean | TerritoryCountOutputTypeCountHomeDojoUsersArgs;
    contestedWars?: boolean | TerritoryCountOutputTypeCountContestedWarsArgs;
  };

  // Custom InputTypes
  /**
   * TerritoryCountOutputType without action
   */
  export type TerritoryCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the TerritoryCountOutputType
     */
    select?: TerritoryCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * TerritoryCountOutputType without action
   */
  export type TerritoryCountOutputTypeCountNftsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserNFTWhereInput;
  };

  /**
   * TerritoryCountOutputType without action
   */
  export type TerritoryCountOutputTypeCountChallengesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ChallengeWhereInput;
  };

  /**
   * TerritoryCountOutputType without action
   */
  export type TerritoryCountOutputTypeCountHomeDojoUsersArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserWhereInput;
  };

  /**
   * TerritoryCountOutputType without action
   */
  export type TerritoryCountOutputTypeCountContestedWarsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWarWhereInput;
  };

  /**
   * Count Type ClanCountOutputType
   */

  export type ClanCountOutputType = {
    members: number;
    controlledDojos: number;
    warsAsClan1: number;
    warsAsClan2: number;
    wonWars: number;
  };

  export type ClanCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    members?: boolean | ClanCountOutputTypeCountMembersArgs;
    controlledDojos?: boolean | ClanCountOutputTypeCountControlledDojosArgs;
    warsAsClan1?: boolean | ClanCountOutputTypeCountWarsAsClan1Args;
    warsAsClan2?: boolean | ClanCountOutputTypeCountWarsAsClan2Args;
    wonWars?: boolean | ClanCountOutputTypeCountWonWarsArgs;
  };

  // Custom InputTypes
  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanCountOutputType
     */
    select?: ClanCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeCountMembersArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanMemberWhereInput;
  };

  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeCountControlledDojosArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: TerritoryWhereInput;
  };

  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeCountWarsAsClan1Args<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWarWhereInput;
  };

  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeCountWarsAsClan2Args<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWarWhereInput;
  };

  /**
   * ClanCountOutputType without action
   */
  export type ClanCountOutputTypeCountWonWarsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWarWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
  };

  export type UserMinAggregateOutputType = {
    id: string | null;
    email: string | null;
    password: string | null;
    role: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    homeDojoId: string | null;
    unlockedZones: string | null;
    relationships: string | null;
  };

  export type UserMaxAggregateOutputType = {
    id: string | null;
    email: string | null;
    password: string | null;
    role: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    homeDojoId: string | null;
    unlockedZones: string | null;
    relationships: string | null;
  };

  export type UserCountAggregateOutputType = {
    id: number;
    email: number;
    password: number;
    role: number;
    createdAt: number;
    updatedAt: number;
    homeDojoId: number;
    unlockedZones: number;
    relationships: number;
    _all: number;
  };

  export type UserMinAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    role?: true;
    createdAt?: true;
    updatedAt?: true;
    homeDojoId?: true;
    unlockedZones?: true;
    relationships?: true;
  };

  export type UserMaxAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    role?: true;
    createdAt?: true;
    updatedAt?: true;
    homeDojoId?: true;
    unlockedZones?: true;
    relationships?: true;
  };

  export type UserCountAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    role?: true;
    createdAt?: true;
    updatedAt?: true;
    homeDojoId?: true;
    unlockedZones?: true;
    relationships?: true;
    _all?: true;
  };

  export type UserAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
     **/
    _count?: true | UserCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: UserMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: UserMaxAggregateInputType;
  };

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
    [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>;
  };

  export type UserGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserWhereInput;
    orderBy?:
      | UserOrderByWithAggregationInput
      | UserOrderByWithAggregationInput[];
    by: UserScalarFieldEnum[] | UserScalarFieldEnum;
    having?: UserScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserCountAggregateInputType | true;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
  };

  export type UserGroupByOutputType = {
    id: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    homeDojoId: string | null;
    unlockedZones: string;
    relationships: string;
    _count: UserCountAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
  };

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> & {
        [P in keyof T & keyof UserGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], UserGroupByOutputType[P]>
          : GetScalarType<T[P], UserGroupByOutputType[P]>;
      }
    >
  >;

  export type UserSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      email?: boolean;
      password?: boolean;
      role?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      homeDojoId?: boolean;
      unlockedZones?: boolean;
      relationships?: boolean;
      profile?: boolean | User$profileArgs<ExtArgs>;
      settings?: boolean | User$settingsArgs<ExtArgs>;
      territories?: boolean | User$territoriesArgs<ExtArgs>;
      nfts?: boolean | User$nftsArgs<ExtArgs>;
      challengesAsChallenger?:
        | boolean
        | User$challengesAsChallengerArgs<ExtArgs>;
      challengesAsDefender?: boolean | User$challengesAsDefenderArgs<ExtArgs>;
      nominations?: boolean | User$nominationsArgs<ExtArgs>;
      homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
      ledClans?: boolean | User$ledClansArgs<ExtArgs>;
      clanMembership?: boolean | User$clanMembershipArgs<ExtArgs>;
      _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['user']
  >;

  export type UserSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      email?: boolean;
      password?: boolean;
      role?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      homeDojoId?: boolean;
      unlockedZones?: boolean;
      relationships?: boolean;
      homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
    },
    ExtArgs['result']['user']
  >;

  export type UserSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      email?: boolean;
      password?: boolean;
      role?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      homeDojoId?: boolean;
      unlockedZones?: boolean;
      relationships?: boolean;
      homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
    },
    ExtArgs['result']['user']
  >;

  export type UserSelectScalar = {
    id?: boolean;
    email?: boolean;
    password?: boolean;
    role?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    homeDojoId?: boolean;
    unlockedZones?: boolean;
    relationships?: boolean;
  };

  export type UserOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'email'
    | 'password'
    | 'role'
    | 'createdAt'
    | 'updatedAt'
    | 'homeDojoId'
    | 'unlockedZones'
    | 'relationships',
    ExtArgs['result']['user']
  >;
  export type UserInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    profile?: boolean | User$profileArgs<ExtArgs>;
    settings?: boolean | User$settingsArgs<ExtArgs>;
    territories?: boolean | User$territoriesArgs<ExtArgs>;
    nfts?: boolean | User$nftsArgs<ExtArgs>;
    challengesAsChallenger?: boolean | User$challengesAsChallengerArgs<ExtArgs>;
    challengesAsDefender?: boolean | User$challengesAsDefenderArgs<ExtArgs>;
    nominations?: boolean | User$nominationsArgs<ExtArgs>;
    homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
    ledClans?: boolean | User$ledClansArgs<ExtArgs>;
    clanMembership?: boolean | User$clanMembershipArgs<ExtArgs>;
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type UserIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
  };
  export type UserIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    homeDojo?: boolean | User$homeDojoArgs<ExtArgs>;
  };

  export type $UserPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'User';
    objects: {
      profile: Prisma.$ProfilePayload<ExtArgs> | null;
      settings: Prisma.$UserSettingsPayload<ExtArgs> | null;
      territories: Prisma.$TerritoryPayload<ExtArgs>[];
      nfts: Prisma.$UserNFTPayload<ExtArgs>[];
      challengesAsChallenger: Prisma.$ChallengePayload<ExtArgs>[];
      challengesAsDefender: Prisma.$ChallengePayload<ExtArgs>[];
      nominations: Prisma.$NominationPayload<ExtArgs>[];
      homeDojo: Prisma.$TerritoryPayload<ExtArgs> | null;
      ledClans: Prisma.$ClanPayload<ExtArgs>[];
      clanMembership: Prisma.$ClanMemberPayload<ExtArgs> | null;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        email: string;
        password: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        homeDojoId: string | null;
        unlockedZones: string;
        relationships: string;
      },
      ExtArgs['result']['user']
    >;
    composites: {};
  };

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> =
    $Result.GetResult<Prisma.$UserPayload, S>;

  type UserCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserCountAggregateInputType | true;
  };

  export interface UserDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['User'];
      meta: { name: 'User' };
    };
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(
      args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(
      args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(
      args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(
      args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(
      args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(
      args: SelectSubset<T, UserCreateArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(
      args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(
      args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(
      args: SelectSubset<T, UserDeleteArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(
      args: SelectSubset<T, UserUpdateArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(
      args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(
      args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(
      args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(
      args: SelectSubset<T, UserUpsertArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
     **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends UserAggregateArgs>(
      args: Subset<T, UserAggregateArgs>
    ): Prisma.PrismaPromise<GetUserAggregateType<T>>;

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors
      ? GetUserGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the User model
     */
    readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    profile<T extends User$profileArgs<ExtArgs> = {}>(
      args?: Subset<T, User$profileArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    settings<T extends User$settingsArgs<ExtArgs> = {}>(
      args?: Subset<T, User$settingsArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    territories<T extends User$territoriesArgs<ExtArgs> = {}>(
      args?: Subset<T, User$territoriesArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$TerritoryPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    nfts<T extends User$nftsArgs<ExtArgs> = {}>(
      args?: Subset<T, User$nftsArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$UserNFTPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    challengesAsChallenger<
      T extends User$challengesAsChallengerArgs<ExtArgs> = {},
    >(
      args?: Subset<T, User$challengesAsChallengerArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ChallengePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    challengesAsDefender<T extends User$challengesAsDefenderArgs<ExtArgs> = {}>(
      args?: Subset<T, User$challengesAsDefenderArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ChallengePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    nominations<T extends User$nominationsArgs<ExtArgs> = {}>(
      args?: Subset<T, User$nominationsArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$NominationPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    homeDojo<T extends User$homeDojoArgs<ExtArgs> = {}>(
      args?: Subset<T, User$homeDojoArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    ledClans<T extends User$ledClansArgs<ExtArgs> = {}>(
      args?: Subset<T, User$ledClansArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    clanMembership<T extends User$clanMembershipArgs<ExtArgs> = {}>(
      args?: Subset<T, User$clanMembershipArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<'User', 'String'>;
    readonly email: FieldRef<'User', 'String'>;
    readonly password: FieldRef<'User', 'String'>;
    readonly role: FieldRef<'User', 'String'>;
    readonly createdAt: FieldRef<'User', 'DateTime'>;
    readonly updatedAt: FieldRef<'User', 'DateTime'>;
    readonly homeDojoId: FieldRef<'User', 'String'>;
    readonly unlockedZones: FieldRef<'User', 'String'>;
    readonly relationships: FieldRef<'User', 'String'>;
  }

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput;
  };

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput;
  };

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[];
  };

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[];
  };

  /**
   * User findMany
   */
  export type UserFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[];
  };

  /**
   * User create
   */
  export type UserCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>;
  };

  /**
   * User createMany
   */
  export type UserCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[];
  };

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * User update
   */
  export type UserUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>;
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput;
  };

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>;
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput;
    /**
     * Limit how many Users to update.
     */
    limit?: number;
  };

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>;
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput;
    /**
     * Limit how many Users to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * User upsert
   */
  export type UserUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput;
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>;
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>;
  };

  /**
   * User delete
   */
  export type UserDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput;
  };

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput;
    /**
     * Limit how many Users to delete.
     */
    limit?: number;
  };

  /**
   * User.profile
   */
  export type User$profileArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    where?: ProfileWhereInput;
  };

  /**
   * User.settings
   */
  export type User$settingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    where?: UserSettingsWhereInput;
  };

  /**
   * User.territories
   */
  export type User$territoriesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    where?: TerritoryWhereInput;
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    cursor?: TerritoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: TerritoryScalarFieldEnum | TerritoryScalarFieldEnum[];
  };

  /**
   * User.nfts
   */
  export type User$nftsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    where?: UserNFTWhereInput;
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    cursor?: UserNFTWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: UserNFTScalarFieldEnum | UserNFTScalarFieldEnum[];
  };

  /**
   * User.challengesAsChallenger
   */
  export type User$challengesAsChallengerArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    where?: ChallengeWhereInput;
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    cursor?: ChallengeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * User.challengesAsDefender
   */
  export type User$challengesAsDefenderArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    where?: ChallengeWhereInput;
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    cursor?: ChallengeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * User.nominations
   */
  export type User$nominationsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    where?: NominationWhereInput;
    orderBy?:
      | NominationOrderByWithRelationInput
      | NominationOrderByWithRelationInput[];
    cursor?: NominationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: NominationScalarFieldEnum | NominationScalarFieldEnum[];
  };

  /**
   * User.homeDojo
   */
  export type User$homeDojoArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    where?: TerritoryWhereInput;
  };

  /**
   * User.ledClans
   */
  export type User$ledClansArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    where?: ClanWhereInput;
    orderBy?: ClanOrderByWithRelationInput | ClanOrderByWithRelationInput[];
    cursor?: ClanWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanScalarFieldEnum | ClanScalarFieldEnum[];
  };

  /**
   * User.clanMembership
   */
  export type User$clanMembershipArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    where?: ClanMemberWhereInput;
  };

  /**
   * User without action
   */
  export type UserDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
  };

  /**
   * Model Profile
   */

  export type AggregateProfile = {
    _count: ProfileCountAggregateOutputType | null;
    _avg: ProfileAvgAggregateOutputType | null;
    _sum: ProfileSumAggregateOutputType | null;
    _min: ProfileMinAggregateOutputType | null;
    _max: ProfileMaxAggregateOutputType | null;
  };

  export type ProfileAvgAggregateOutputType = {
    skillLevel: number | null;
  };

  export type ProfileSumAggregateOutputType = {
    skillLevel: number | null;
  };

  export type ProfileMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    skillLevel: number | null;
    preferredGame: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ProfileMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    skillLevel: number | null;
    preferredGame: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ProfileCountAggregateOutputType = {
    id: number;
    userId: number;
    displayName: number;
    bio: number;
    avatarUrl: number;
    location: number;
    skillLevel: number;
    preferredGame: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type ProfileAvgAggregateInputType = {
    skillLevel?: true;
  };

  export type ProfileSumAggregateInputType = {
    skillLevel?: true;
  };

  export type ProfileMinAggregateInputType = {
    id?: true;
    userId?: true;
    displayName?: true;
    bio?: true;
    avatarUrl?: true;
    location?: true;
    skillLevel?: true;
    preferredGame?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ProfileMaxAggregateInputType = {
    id?: true;
    userId?: true;
    displayName?: true;
    bio?: true;
    avatarUrl?: true;
    location?: true;
    skillLevel?: true;
    preferredGame?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ProfileCountAggregateInputType = {
    id?: true;
    userId?: true;
    displayName?: true;
    bio?: true;
    avatarUrl?: true;
    location?: true;
    skillLevel?: true;
    preferredGame?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type ProfileAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Profile to aggregate.
     */
    where?: ProfileWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Profiles to fetch.
     */
    orderBy?:
      | ProfileOrderByWithRelationInput
      | ProfileOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ProfileWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Profiles.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Profiles
     **/
    _count?: true | ProfileCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ProfileAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ProfileSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ProfileMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ProfileMaxAggregateInputType;
  };

  export type GetProfileAggregateType<T extends ProfileAggregateArgs> = {
    [P in keyof T & keyof AggregateProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProfile[P]>
      : GetScalarType<T[P], AggregateProfile[P]>;
  };

  export type ProfileGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ProfileWhereInput;
    orderBy?:
      | ProfileOrderByWithAggregationInput
      | ProfileOrderByWithAggregationInput[];
    by: ProfileScalarFieldEnum[] | ProfileScalarFieldEnum;
    having?: ProfileScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ProfileCountAggregateInputType | true;
    _avg?: ProfileAvgAggregateInputType;
    _sum?: ProfileSumAggregateInputType;
    _min?: ProfileMinAggregateInputType;
    _max?: ProfileMaxAggregateInputType;
  };

  export type ProfileGroupByOutputType = {
    id: string;
    userId: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    skillLevel: number;
    preferredGame: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: ProfileCountAggregateOutputType | null;
    _avg: ProfileAvgAggregateOutputType | null;
    _sum: ProfileSumAggregateOutputType | null;
    _min: ProfileMinAggregateOutputType | null;
    _max: ProfileMaxAggregateOutputType | null;
  };

  type GetProfileGroupByPayload<T extends ProfileGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ProfileGroupByOutputType, T['by']> & {
          [P in keyof T & keyof ProfileGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ProfileGroupByOutputType[P]>;
        }
      >
    >;

  export type ProfileSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      displayName?: boolean;
      bio?: boolean;
      avatarUrl?: boolean;
      location?: boolean;
      skillLevel?: boolean;
      preferredGame?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['profile']
  >;

  export type ProfileSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      displayName?: boolean;
      bio?: boolean;
      avatarUrl?: boolean;
      location?: boolean;
      skillLevel?: boolean;
      preferredGame?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['profile']
  >;

  export type ProfileSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      displayName?: boolean;
      bio?: boolean;
      avatarUrl?: boolean;
      location?: boolean;
      skillLevel?: boolean;
      preferredGame?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['profile']
  >;

  export type ProfileSelectScalar = {
    id?: boolean;
    userId?: boolean;
    displayName?: boolean;
    bio?: boolean;
    avatarUrl?: boolean;
    location?: boolean;
    skillLevel?: boolean;
    preferredGame?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type ProfileOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'userId'
    | 'displayName'
    | 'bio'
    | 'avatarUrl'
    | 'location'
    | 'skillLevel'
    | 'preferredGame'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['profile']
  >;
  export type ProfileInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type ProfileIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type ProfileIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };

  export type $ProfilePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Profile';
    objects: {
      user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        userId: string;
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        location: string | null;
        skillLevel: number;
        preferredGame: string | null;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['profile']
    >;
    composites: {};
  };

  type ProfileGetPayload<
    S extends boolean | null | undefined | ProfileDefaultArgs,
  > = $Result.GetResult<Prisma.$ProfilePayload, S>;

  type ProfileCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<ProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ProfileCountAggregateInputType | true;
  };

  export interface ProfileDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Profile'];
      meta: { name: 'Profile' };
    };
    /**
     * Find zero or one Profile that matches the filter.
     * @param {ProfileFindUniqueArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProfileFindUniqueArgs>(
      args: SelectSubset<T, ProfileFindUniqueArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProfileFindUniqueOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProfileFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ProfileFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProfileFindFirstArgs>(
      args?: SelectSubset<T, ProfileFindFirstArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProfileFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ProfileFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Profiles
     * const profiles = await prisma.profile.findMany()
     *
     * // Get first 10 Profiles
     * const profiles = await prisma.profile.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const profileWithIdOnly = await prisma.profile.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ProfileFindManyArgs>(
      args?: SelectSubset<T, ProfileFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Profile.
     * @param {ProfileCreateArgs} args - Arguments to create a Profile.
     * @example
     * // Create one Profile
     * const Profile = await prisma.profile.create({
     *   data: {
     *     // ... data to create a Profile
     *   }
     * })
     *
     */
    create<T extends ProfileCreateArgs>(
      args: SelectSubset<T, ProfileCreateArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Profiles.
     * @param {ProfileCreateManyArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ProfileCreateManyArgs>(
      args?: SelectSubset<T, ProfileCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Profiles and returns the data saved in the database.
     * @param {ProfileCreateManyAndReturnArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ProfileCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ProfileCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Profile.
     * @param {ProfileDeleteArgs} args - Arguments to delete one Profile.
     * @example
     * // Delete one Profile
     * const Profile = await prisma.profile.delete({
     *   where: {
     *     // ... filter to delete one Profile
     *   }
     * })
     *
     */
    delete<T extends ProfileDeleteArgs>(
      args: SelectSubset<T, ProfileDeleteArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Profile.
     * @param {ProfileUpdateArgs} args - Arguments to update one Profile.
     * @example
     * // Update one Profile
     * const profile = await prisma.profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ProfileUpdateArgs>(
      args: SelectSubset<T, ProfileUpdateArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Profiles.
     * @param {ProfileDeleteManyArgs} args - Arguments to filter Profiles to delete.
     * @example
     * // Delete a few Profiles
     * const { count } = await prisma.profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ProfileDeleteManyArgs>(
      args?: SelectSubset<T, ProfileDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ProfileUpdateManyArgs>(
      args: SelectSubset<T, ProfileUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Profiles and returns the data updated in the database.
     * @param {ProfileUpdateManyAndReturnArgs} args - Arguments to update many Profiles.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ProfileUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ProfileUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Profile.
     * @param {ProfileUpsertArgs} args - Arguments to update or create a Profile.
     * @example
     * // Update or create a Profile
     * const profile = await prisma.profile.upsert({
     *   create: {
     *     // ... data to create a Profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Profile we want to update
     *   }
     * })
     */
    upsert<T extends ProfileUpsertArgs>(
      args: SelectSubset<T, ProfileUpsertArgs<ExtArgs>>
    ): Prisma__ProfileClient<
      $Result.GetResult<
        Prisma.$ProfilePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileCountArgs} args - Arguments to filter Profiles to count.
     * @example
     * // Count the number of Profiles
     * const count = await prisma.profile.count({
     *   where: {
     *     // ... the filter for the Profiles we want to count
     *   }
     * })
     **/
    count<T extends ProfileCountArgs>(
      args?: Subset<T, ProfileCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProfileCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ProfileAggregateArgs>(
      args: Subset<T, ProfileAggregateArgs>
    ): Prisma.PrismaPromise<GetProfileAggregateType<T>>;

    /**
     * Group by Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProfileGroupByArgs['orderBy'] }
        : { orderBy?: ProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ProfileGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors
      ? GetProfileGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Profile model
     */
    readonly fields: ProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProfileClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Profile model
   */
  interface ProfileFieldRefs {
    readonly id: FieldRef<'Profile', 'String'>;
    readonly userId: FieldRef<'Profile', 'String'>;
    readonly displayName: FieldRef<'Profile', 'String'>;
    readonly bio: FieldRef<'Profile', 'String'>;
    readonly avatarUrl: FieldRef<'Profile', 'String'>;
    readonly location: FieldRef<'Profile', 'String'>;
    readonly skillLevel: FieldRef<'Profile', 'Int'>;
    readonly preferredGame: FieldRef<'Profile', 'String'>;
    readonly createdAt: FieldRef<'Profile', 'DateTime'>;
    readonly updatedAt: FieldRef<'Profile', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Profile findUnique
   */
  export type ProfileFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput;
  };

  /**
   * Profile findUniqueOrThrow
   */
  export type ProfileFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput;
  };

  /**
   * Profile findFirst
   */
  export type ProfileFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Profiles to fetch.
     */
    orderBy?:
      | ProfileOrderByWithRelationInput
      | ProfileOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Profiles.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[];
  };

  /**
   * Profile findFirstOrThrow
   */
  export type ProfileFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Profiles to fetch.
     */
    orderBy?:
      | ProfileOrderByWithRelationInput
      | ProfileOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Profiles.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[];
  };

  /**
   * Profile findMany
   */
  export type ProfileFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter, which Profiles to fetch.
     */
    where?: ProfileWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Profiles to fetch.
     */
    orderBy?:
      | ProfileOrderByWithRelationInput
      | ProfileOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Profiles.
     */
    cursor?: ProfileWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Profiles.
     */
    skip?: number;
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[];
  };

  /**
   * Profile create
   */
  export type ProfileCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * The data needed to create a Profile.
     */
    data: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>;
  };

  /**
   * Profile createMany
   */
  export type ProfileCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[];
  };

  /**
   * Profile createManyAndReturn
   */
  export type ProfileCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Profile update
   */
  export type ProfileUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * The data needed to update a Profile.
     */
    data: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>;
    /**
     * Choose, which Profile to update.
     */
    where: ProfileWhereUniqueInput;
  };

  /**
   * Profile updateMany
   */
  export type ProfileUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>;
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput;
    /**
     * Limit how many Profiles to update.
     */
    limit?: number;
  };

  /**
   * Profile updateManyAndReturn
   */
  export type ProfileUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>;
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput;
    /**
     * Limit how many Profiles to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Profile upsert
   */
  export type ProfileUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * The filter to search for the Profile to update in case it exists.
     */
    where: ProfileWhereUniqueInput;
    /**
     * In case the Profile found by the `where` argument doesn't exist, create a new Profile with this data.
     */
    create: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>;
    /**
     * In case the Profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>;
  };

  /**
   * Profile delete
   */
  export type ProfileDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
    /**
     * Filter which Profile to delete.
     */
    where: ProfileWhereUniqueInput;
  };

  /**
   * Profile deleteMany
   */
  export type ProfileDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Profiles to delete
     */
    where?: ProfileWhereInput;
    /**
     * Limit how many Profiles to delete.
     */
    limit?: number;
  };

  /**
   * Profile without action
   */
  export type ProfileDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null;
  };

  /**
   * Model UserSettings
   */

  export type AggregateUserSettings = {
    _count: UserSettingsCountAggregateOutputType | null;
    _min: UserSettingsMinAggregateOutputType | null;
    _max: UserSettingsMaxAggregateOutputType | null;
  };

  export type UserSettingsMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    emailNotifications: boolean | null;
    pushNotifications: boolean | null;
    darkMode: boolean | null;
    language: string | null;
    timezone: string | null;
    privacySettings: string | null;
    notificationSettings: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserSettingsMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    emailNotifications: boolean | null;
    pushNotifications: boolean | null;
    darkMode: boolean | null;
    language: string | null;
    timezone: string | null;
    privacySettings: string | null;
    notificationSettings: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserSettingsCountAggregateOutputType = {
    id: number;
    userId: number;
    emailNotifications: number;
    pushNotifications: number;
    darkMode: number;
    language: number;
    timezone: number;
    privacySettings: number;
    notificationSettings: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type UserSettingsMinAggregateInputType = {
    id?: true;
    userId?: true;
    emailNotifications?: true;
    pushNotifications?: true;
    darkMode?: true;
    language?: true;
    timezone?: true;
    privacySettings?: true;
    notificationSettings?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserSettingsMaxAggregateInputType = {
    id?: true;
    userId?: true;
    emailNotifications?: true;
    pushNotifications?: true;
    darkMode?: true;
    language?: true;
    timezone?: true;
    privacySettings?: true;
    notificationSettings?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserSettingsCountAggregateInputType = {
    id?: true;
    userId?: true;
    emailNotifications?: true;
    pushNotifications?: true;
    darkMode?: true;
    language?: true;
    timezone?: true;
    privacySettings?: true;
    notificationSettings?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type UserSettingsAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which UserSettings to aggregate.
     */
    where?: UserSettingsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserSettings to fetch.
     */
    orderBy?:
      | UserSettingsOrderByWithRelationInput
      | UserSettingsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserSettingsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserSettings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserSettings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned UserSettings
     **/
    _count?: true | UserSettingsCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: UserSettingsMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: UserSettingsMaxAggregateInputType;
  };

  export type GetUserSettingsAggregateType<
    T extends UserSettingsAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateUserSettings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserSettings[P]>
      : GetScalarType<T[P], AggregateUserSettings[P]>;
  };

  export type UserSettingsGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserSettingsWhereInput;
    orderBy?:
      | UserSettingsOrderByWithAggregationInput
      | UserSettingsOrderByWithAggregationInput[];
    by: UserSettingsScalarFieldEnum[] | UserSettingsScalarFieldEnum;
    having?: UserSettingsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserSettingsCountAggregateInputType | true;
    _min?: UserSettingsMinAggregateInputType;
    _max?: UserSettingsMaxAggregateInputType;
  };

  export type UserSettingsGroupByOutputType = {
    id: string;
    userId: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
    privacySettings: string;
    notificationSettings: string;
    createdAt: Date;
    updatedAt: Date;
    _count: UserSettingsCountAggregateOutputType | null;
    _min: UserSettingsMinAggregateOutputType | null;
    _max: UserSettingsMaxAggregateOutputType | null;
  };

  type GetUserSettingsGroupByPayload<T extends UserSettingsGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<UserSettingsGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof UserSettingsGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserSettingsGroupByOutputType[P]>
            : GetScalarType<T[P], UserSettingsGroupByOutputType[P]>;
        }
      >
    >;

  export type UserSettingsSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      darkMode?: boolean;
      language?: boolean;
      timezone?: boolean;
      privacySettings?: boolean;
      notificationSettings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['userSettings']
  >;

  export type UserSettingsSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      darkMode?: boolean;
      language?: boolean;
      timezone?: boolean;
      privacySettings?: boolean;
      notificationSettings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['userSettings']
  >;

  export type UserSettingsSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      darkMode?: boolean;
      language?: boolean;
      timezone?: boolean;
      privacySettings?: boolean;
      notificationSettings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['userSettings']
  >;

  export type UserSettingsSelectScalar = {
    id?: boolean;
    userId?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: boolean;
    timezone?: boolean;
    privacySettings?: boolean;
    notificationSettings?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type UserSettingsOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'userId'
    | 'emailNotifications'
    | 'pushNotifications'
    | 'darkMode'
    | 'language'
    | 'timezone'
    | 'privacySettings'
    | 'notificationSettings'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['userSettings']
  >;
  export type UserSettingsInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type UserSettingsIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type UserSettingsIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
  };

  export type $UserSettingsPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'UserSettings';
    objects: {
      user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        userId: string;
        emailNotifications: boolean;
        pushNotifications: boolean;
        darkMode: boolean;
        language: string;
        timezone: string;
        privacySettings: string;
        notificationSettings: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['userSettings']
    >;
    composites: {};
  };

  type UserSettingsGetPayload<
    S extends boolean | null | undefined | UserSettingsDefaultArgs,
  > = $Result.GetResult<Prisma.$UserSettingsPayload, S>;

  type UserSettingsCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    UserSettingsFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: UserSettingsCountAggregateInputType | true;
  };

  export interface UserSettingsDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['UserSettings'];
      meta: { name: 'UserSettings' };
    };
    /**
     * Find zero or one UserSettings that matches the filter.
     * @param {UserSettingsFindUniqueArgs} args - Arguments to find a UserSettings
     * @example
     * // Get one UserSettings
     * const userSettings = await prisma.userSettings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserSettingsFindUniqueArgs>(
      args: SelectSubset<T, UserSettingsFindUniqueArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one UserSettings that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserSettingsFindUniqueOrThrowArgs} args - Arguments to find a UserSettings
     * @example
     * // Get one UserSettings
     * const userSettings = await prisma.userSettings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserSettingsFindUniqueOrThrowArgs>(
      args: SelectSubset<T, UserSettingsFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsFindFirstArgs} args - Arguments to find a UserSettings
     * @example
     * // Get one UserSettings
     * const userSettings = await prisma.userSettings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserSettingsFindFirstArgs>(
      args?: SelectSubset<T, UserSettingsFindFirstArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserSettings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsFindFirstOrThrowArgs} args - Arguments to find a UserSettings
     * @example
     * // Get one UserSettings
     * const userSettings = await prisma.userSettings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserSettingsFindFirstOrThrowArgs>(
      args?: SelectSubset<T, UserSettingsFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more UserSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserSettings
     * const userSettings = await prisma.userSettings.findMany()
     *
     * // Get first 10 UserSettings
     * const userSettings = await prisma.userSettings.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userSettingsWithIdOnly = await prisma.userSettings.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserSettingsFindManyArgs>(
      args?: SelectSubset<T, UserSettingsFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a UserSettings.
     * @param {UserSettingsCreateArgs} args - Arguments to create a UserSettings.
     * @example
     * // Create one UserSettings
     * const UserSettings = await prisma.userSettings.create({
     *   data: {
     *     // ... data to create a UserSettings
     *   }
     * })
     *
     */
    create<T extends UserSettingsCreateArgs>(
      args: SelectSubset<T, UserSettingsCreateArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many UserSettings.
     * @param {UserSettingsCreateManyArgs} args - Arguments to create many UserSettings.
     * @example
     * // Create many UserSettings
     * const userSettings = await prisma.userSettings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserSettingsCreateManyArgs>(
      args?: SelectSubset<T, UserSettingsCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many UserSettings and returns the data saved in the database.
     * @param {UserSettingsCreateManyAndReturnArgs} args - Arguments to create many UserSettings.
     * @example
     * // Create many UserSettings
     * const userSettings = await prisma.userSettings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many UserSettings and only return the `id`
     * const userSettingsWithIdOnly = await prisma.userSettings.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserSettingsCreateManyAndReturnArgs>(
      args?: SelectSubset<T, UserSettingsCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a UserSettings.
     * @param {UserSettingsDeleteArgs} args - Arguments to delete one UserSettings.
     * @example
     * // Delete one UserSettings
     * const UserSettings = await prisma.userSettings.delete({
     *   where: {
     *     // ... filter to delete one UserSettings
     *   }
     * })
     *
     */
    delete<T extends UserSettingsDeleteArgs>(
      args: SelectSubset<T, UserSettingsDeleteArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one UserSettings.
     * @param {UserSettingsUpdateArgs} args - Arguments to update one UserSettings.
     * @example
     * // Update one UserSettings
     * const userSettings = await prisma.userSettings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserSettingsUpdateArgs>(
      args: SelectSubset<T, UserSettingsUpdateArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more UserSettings.
     * @param {UserSettingsDeleteManyArgs} args - Arguments to filter UserSettings to delete.
     * @example
     * // Delete a few UserSettings
     * const { count } = await prisma.userSettings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserSettingsDeleteManyArgs>(
      args?: SelectSubset<T, UserSettingsDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserSettings
     * const userSettings = await prisma.userSettings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserSettingsUpdateManyArgs>(
      args: SelectSubset<T, UserSettingsUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserSettings and returns the data updated in the database.
     * @param {UserSettingsUpdateManyAndReturnArgs} args - Arguments to update many UserSettings.
     * @example
     * // Update many UserSettings
     * const userSettings = await prisma.userSettings.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more UserSettings and only return the `id`
     * const userSettingsWithIdOnly = await prisma.userSettings.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserSettingsUpdateManyAndReturnArgs>(
      args: SelectSubset<T, UserSettingsUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one UserSettings.
     * @param {UserSettingsUpsertArgs} args - Arguments to update or create a UserSettings.
     * @example
     * // Update or create a UserSettings
     * const userSettings = await prisma.userSettings.upsert({
     *   create: {
     *     // ... data to create a UserSettings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserSettings we want to update
     *   }
     * })
     */
    upsert<T extends UserSettingsUpsertArgs>(
      args: SelectSubset<T, UserSettingsUpsertArgs<ExtArgs>>
    ): Prisma__UserSettingsClient<
      $Result.GetResult<
        Prisma.$UserSettingsPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of UserSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsCountArgs} args - Arguments to filter UserSettings to count.
     * @example
     * // Count the number of UserSettings
     * const count = await prisma.userSettings.count({
     *   where: {
     *     // ... the filter for the UserSettings we want to count
     *   }
     * })
     **/
    count<T extends UserSettingsCountArgs>(
      args?: Subset<T, UserSettingsCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserSettingsCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a UserSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends UserSettingsAggregateArgs>(
      args: Subset<T, UserSettingsAggregateArgs>
    ): Prisma.PrismaPromise<GetUserSettingsAggregateType<T>>;

    /**
     * Group by UserSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSettingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends UserSettingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserSettingsGroupByArgs['orderBy'] }
        : { orderBy?: UserSettingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, UserSettingsGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetUserSettingsGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the UserSettings model
     */
    readonly fields: UserSettingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserSettings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserSettingsClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the UserSettings model
   */
  interface UserSettingsFieldRefs {
    readonly id: FieldRef<'UserSettings', 'String'>;
    readonly userId: FieldRef<'UserSettings', 'String'>;
    readonly emailNotifications: FieldRef<'UserSettings', 'Boolean'>;
    readonly pushNotifications: FieldRef<'UserSettings', 'Boolean'>;
    readonly darkMode: FieldRef<'UserSettings', 'Boolean'>;
    readonly language: FieldRef<'UserSettings', 'String'>;
    readonly timezone: FieldRef<'UserSettings', 'String'>;
    readonly privacySettings: FieldRef<'UserSettings', 'String'>;
    readonly notificationSettings: FieldRef<'UserSettings', 'String'>;
    readonly createdAt: FieldRef<'UserSettings', 'DateTime'>;
    readonly updatedAt: FieldRef<'UserSettings', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * UserSettings findUnique
   */
  export type UserSettingsFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter, which UserSettings to fetch.
     */
    where: UserSettingsWhereUniqueInput;
  };

  /**
   * UserSettings findUniqueOrThrow
   */
  export type UserSettingsFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter, which UserSettings to fetch.
     */
    where: UserSettingsWhereUniqueInput;
  };

  /**
   * UserSettings findFirst
   */
  export type UserSettingsFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter, which UserSettings to fetch.
     */
    where?: UserSettingsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserSettings to fetch.
     */
    orderBy?:
      | UserSettingsOrderByWithRelationInput
      | UserSettingsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UserSettings.
     */
    cursor?: UserSettingsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserSettings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserSettings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserSettings.
     */
    distinct?: UserSettingsScalarFieldEnum | UserSettingsScalarFieldEnum[];
  };

  /**
   * UserSettings findFirstOrThrow
   */
  export type UserSettingsFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter, which UserSettings to fetch.
     */
    where?: UserSettingsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserSettings to fetch.
     */
    orderBy?:
      | UserSettingsOrderByWithRelationInput
      | UserSettingsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UserSettings.
     */
    cursor?: UserSettingsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserSettings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserSettings.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserSettings.
     */
    distinct?: UserSettingsScalarFieldEnum | UserSettingsScalarFieldEnum[];
  };

  /**
   * UserSettings findMany
   */
  export type UserSettingsFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter, which UserSettings to fetch.
     */
    where?: UserSettingsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserSettings to fetch.
     */
    orderBy?:
      | UserSettingsOrderByWithRelationInput
      | UserSettingsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing UserSettings.
     */
    cursor?: UserSettingsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserSettings from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserSettings.
     */
    skip?: number;
    distinct?: UserSettingsScalarFieldEnum | UserSettingsScalarFieldEnum[];
  };

  /**
   * UserSettings create
   */
  export type UserSettingsCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * The data needed to create a UserSettings.
     */
    data: XOR<UserSettingsCreateInput, UserSettingsUncheckedCreateInput>;
  };

  /**
   * UserSettings createMany
   */
  export type UserSettingsCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many UserSettings.
     */
    data: UserSettingsCreateManyInput | UserSettingsCreateManyInput[];
  };

  /**
   * UserSettings createManyAndReturn
   */
  export type UserSettingsCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * The data used to create many UserSettings.
     */
    data: UserSettingsCreateManyInput | UserSettingsCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserSettings update
   */
  export type UserSettingsUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * The data needed to update a UserSettings.
     */
    data: XOR<UserSettingsUpdateInput, UserSettingsUncheckedUpdateInput>;
    /**
     * Choose, which UserSettings to update.
     */
    where: UserSettingsWhereUniqueInput;
  };

  /**
   * UserSettings updateMany
   */
  export type UserSettingsUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update UserSettings.
     */
    data: XOR<
      UserSettingsUpdateManyMutationInput,
      UserSettingsUncheckedUpdateManyInput
    >;
    /**
     * Filter which UserSettings to update
     */
    where?: UserSettingsWhereInput;
    /**
     * Limit how many UserSettings to update.
     */
    limit?: number;
  };

  /**
   * UserSettings updateManyAndReturn
   */
  export type UserSettingsUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * The data used to update UserSettings.
     */
    data: XOR<
      UserSettingsUpdateManyMutationInput,
      UserSettingsUncheckedUpdateManyInput
    >;
    /**
     * Filter which UserSettings to update
     */
    where?: UserSettingsWhereInput;
    /**
     * Limit how many UserSettings to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserSettings upsert
   */
  export type UserSettingsUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * The filter to search for the UserSettings to update in case it exists.
     */
    where: UserSettingsWhereUniqueInput;
    /**
     * In case the UserSettings found by the `where` argument doesn't exist, create a new UserSettings with this data.
     */
    create: XOR<UserSettingsCreateInput, UserSettingsUncheckedCreateInput>;
    /**
     * In case the UserSettings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserSettingsUpdateInput, UserSettingsUncheckedUpdateInput>;
  };

  /**
   * UserSettings delete
   */
  export type UserSettingsDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
    /**
     * Filter which UserSettings to delete.
     */
    where: UserSettingsWhereUniqueInput;
  };

  /**
   * UserSettings deleteMany
   */
  export type UserSettingsDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which UserSettings to delete
     */
    where?: UserSettingsWhereInput;
    /**
     * Limit how many UserSettings to delete.
     */
    limit?: number;
  };

  /**
   * UserSettings without action
   */
  export type UserSettingsDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserSettings
     */
    select?: UserSettingsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserSettings
     */
    omit?: UserSettingsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSettingsInclude<ExtArgs> | null;
  };

  /**
   * Model Territory
   */

  export type AggregateTerritory = {
    _count: TerritoryCountAggregateOutputType | null;
    _avg: TerritoryAvgAggregateOutputType | null;
    _sum: TerritorySumAggregateOutputType | null;
    _min: TerritoryMinAggregateOutputType | null;
    _max: TerritoryMaxAggregateOutputType | null;
  };

  export type TerritoryAvgAggregateOutputType = {
    influence: number | null;
    allegianceMeter: number | null;
  };

  export type TerritorySumAggregateOutputType = {
    influence: number | null;
    allegianceMeter: number | null;
  };

  export type TerritoryMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    description: string | null;
    coordinates: string | null;
    requiredNFT: string | null;
    influence: number | null;
    ownerId: string | null;
    clan: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    venueOwnerId: string | null;
    status: string | null;
    leaderboard: string | null;
    allegianceMeter: number | null;
    controllingClanId: string | null;
  };

  export type TerritoryMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    description: string | null;
    coordinates: string | null;
    requiredNFT: string | null;
    influence: number | null;
    ownerId: string | null;
    clan: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    venueOwnerId: string | null;
    status: string | null;
    leaderboard: string | null;
    allegianceMeter: number | null;
    controllingClanId: string | null;
  };

  export type TerritoryCountAggregateOutputType = {
    id: number;
    name: number;
    description: number;
    coordinates: number;
    requiredNFT: number;
    influence: number;
    ownerId: number;
    clan: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    venueOwnerId: number;
    status: number;
    leaderboard: number;
    allegianceMeter: number;
    controllingClanId: number;
    _all: number;
  };

  export type TerritoryAvgAggregateInputType = {
    influence?: true;
    allegianceMeter?: true;
  };

  export type TerritorySumAggregateInputType = {
    influence?: true;
    allegianceMeter?: true;
  };

  export type TerritoryMinAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    coordinates?: true;
    requiredNFT?: true;
    influence?: true;
    ownerId?: true;
    clan?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    venueOwnerId?: true;
    status?: true;
    leaderboard?: true;
    allegianceMeter?: true;
    controllingClanId?: true;
  };

  export type TerritoryMaxAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    coordinates?: true;
    requiredNFT?: true;
    influence?: true;
    ownerId?: true;
    clan?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    venueOwnerId?: true;
    status?: true;
    leaderboard?: true;
    allegianceMeter?: true;
    controllingClanId?: true;
  };

  export type TerritoryCountAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    coordinates?: true;
    requiredNFT?: true;
    influence?: true;
    ownerId?: true;
    clan?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    venueOwnerId?: true;
    status?: true;
    leaderboard?: true;
    allegianceMeter?: true;
    controllingClanId?: true;
    _all?: true;
  };

  export type TerritoryAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Territory to aggregate.
     */
    where?: TerritoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Territories to fetch.
     */
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: TerritoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Territories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Territories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Territories
     **/
    _count?: true | TerritoryCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: TerritoryAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: TerritorySumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: TerritoryMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: TerritoryMaxAggregateInputType;
  };

  export type GetTerritoryAggregateType<T extends TerritoryAggregateArgs> = {
    [P in keyof T & keyof AggregateTerritory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTerritory[P]>
      : GetScalarType<T[P], AggregateTerritory[P]>;
  };

  export type TerritoryGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: TerritoryWhereInput;
    orderBy?:
      | TerritoryOrderByWithAggregationInput
      | TerritoryOrderByWithAggregationInput[];
    by: TerritoryScalarFieldEnum[] | TerritoryScalarFieldEnum;
    having?: TerritoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TerritoryCountAggregateInputType | true;
    _avg?: TerritoryAvgAggregateInputType;
    _sum?: TerritorySumAggregateInputType;
    _min?: TerritoryMinAggregateInputType;
    _max?: TerritoryMaxAggregateInputType;
  };

  export type TerritoryGroupByOutputType = {
    id: string;
    name: string;
    description: string | null;
    coordinates: string;
    requiredNFT: string;
    influence: number;
    ownerId: string | null;
    clan: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    venueOwnerId: string | null;
    status: string;
    leaderboard: string;
    allegianceMeter: number;
    controllingClanId: string | null;
    _count: TerritoryCountAggregateOutputType | null;
    _avg: TerritoryAvgAggregateOutputType | null;
    _sum: TerritorySumAggregateOutputType | null;
    _min: TerritoryMinAggregateOutputType | null;
    _max: TerritoryMaxAggregateOutputType | null;
  };

  type GetTerritoryGroupByPayload<T extends TerritoryGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<TerritoryGroupByOutputType, T['by']> & {
          [P in keyof T & keyof TerritoryGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TerritoryGroupByOutputType[P]>
            : GetScalarType<T[P], TerritoryGroupByOutputType[P]>;
        }
      >
    >;

  export type TerritorySelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      coordinates?: boolean;
      requiredNFT?: boolean;
      influence?: boolean;
      ownerId?: boolean;
      clan?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      venueOwnerId?: boolean;
      status?: boolean;
      leaderboard?: boolean;
      allegianceMeter?: boolean;
      controllingClanId?: boolean;
      owner?: boolean | Territory$ownerArgs<ExtArgs>;
      nfts?: boolean | Territory$nftsArgs<ExtArgs>;
      challenges?: boolean | Territory$challengesArgs<ExtArgs>;
      homeDojoUsers?: boolean | Territory$homeDojoUsersArgs<ExtArgs>;
      controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
      contestedWars?: boolean | Territory$contestedWarsArgs<ExtArgs>;
      _count?: boolean | TerritoryCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['territory']
  >;

  export type TerritorySelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      coordinates?: boolean;
      requiredNFT?: boolean;
      influence?: boolean;
      ownerId?: boolean;
      clan?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      venueOwnerId?: boolean;
      status?: boolean;
      leaderboard?: boolean;
      allegianceMeter?: boolean;
      controllingClanId?: boolean;
      owner?: boolean | Territory$ownerArgs<ExtArgs>;
      controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
    },
    ExtArgs['result']['territory']
  >;

  export type TerritorySelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      coordinates?: boolean;
      requiredNFT?: boolean;
      influence?: boolean;
      ownerId?: boolean;
      clan?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      venueOwnerId?: boolean;
      status?: boolean;
      leaderboard?: boolean;
      allegianceMeter?: boolean;
      controllingClanId?: boolean;
      owner?: boolean | Territory$ownerArgs<ExtArgs>;
      controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
    },
    ExtArgs['result']['territory']
  >;

  export type TerritorySelectScalar = {
    id?: boolean;
    name?: boolean;
    description?: boolean;
    coordinates?: boolean;
    requiredNFT?: boolean;
    influence?: boolean;
    ownerId?: boolean;
    clan?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    venueOwnerId?: boolean;
    status?: boolean;
    leaderboard?: boolean;
    allegianceMeter?: boolean;
    controllingClanId?: boolean;
  };

  export type TerritoryOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'name'
    | 'description'
    | 'coordinates'
    | 'requiredNFT'
    | 'influence'
    | 'ownerId'
    | 'clan'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
    | 'venueOwnerId'
    | 'status'
    | 'leaderboard'
    | 'allegianceMeter'
    | 'controllingClanId',
    ExtArgs['result']['territory']
  >;
  export type TerritoryInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    owner?: boolean | Territory$ownerArgs<ExtArgs>;
    nfts?: boolean | Territory$nftsArgs<ExtArgs>;
    challenges?: boolean | Territory$challengesArgs<ExtArgs>;
    homeDojoUsers?: boolean | Territory$homeDojoUsersArgs<ExtArgs>;
    controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
    contestedWars?: boolean | Territory$contestedWarsArgs<ExtArgs>;
    _count?: boolean | TerritoryCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type TerritoryIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    owner?: boolean | Territory$ownerArgs<ExtArgs>;
    controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
  };
  export type TerritoryIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    owner?: boolean | Territory$ownerArgs<ExtArgs>;
    controllingClan?: boolean | Territory$controllingClanArgs<ExtArgs>;
  };

  export type $TerritoryPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Territory';
    objects: {
      owner: Prisma.$UserPayload<ExtArgs> | null;
      nfts: Prisma.$UserNFTPayload<ExtArgs>[];
      challenges: Prisma.$ChallengePayload<ExtArgs>[];
      homeDojoUsers: Prisma.$UserPayload<ExtArgs>[];
      controllingClan: Prisma.$ClanPayload<ExtArgs> | null;
      contestedWars: Prisma.$ClanWarPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        name: string;
        description: string | null;
        coordinates: string;
        requiredNFT: string;
        influence: number;
        ownerId: string | null;
        clan: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        venueOwnerId: string | null;
        status: string;
        leaderboard: string;
        allegianceMeter: number;
        controllingClanId: string | null;
      },
      ExtArgs['result']['territory']
    >;
    composites: {};
  };

  type TerritoryGetPayload<
    S extends boolean | null | undefined | TerritoryDefaultArgs,
  > = $Result.GetResult<Prisma.$TerritoryPayload, S>;

  type TerritoryCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    TerritoryFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: TerritoryCountAggregateInputType | true;
  };

  export interface TerritoryDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Territory'];
      meta: { name: 'Territory' };
    };
    /**
     * Find zero or one Territory that matches the filter.
     * @param {TerritoryFindUniqueArgs} args - Arguments to find a Territory
     * @example
     * // Get one Territory
     * const territory = await prisma.territory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TerritoryFindUniqueArgs>(
      args: SelectSubset<T, TerritoryFindUniqueArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Territory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TerritoryFindUniqueOrThrowArgs} args - Arguments to find a Territory
     * @example
     * // Get one Territory
     * const territory = await prisma.territory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TerritoryFindUniqueOrThrowArgs>(
      args: SelectSubset<T, TerritoryFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Territory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryFindFirstArgs} args - Arguments to find a Territory
     * @example
     * // Get one Territory
     * const territory = await prisma.territory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TerritoryFindFirstArgs>(
      args?: SelectSubset<T, TerritoryFindFirstArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Territory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryFindFirstOrThrowArgs} args - Arguments to find a Territory
     * @example
     * // Get one Territory
     * const territory = await prisma.territory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TerritoryFindFirstOrThrowArgs>(
      args?: SelectSubset<T, TerritoryFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Territories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Territories
     * const territories = await prisma.territory.findMany()
     *
     * // Get first 10 Territories
     * const territories = await prisma.territory.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const territoryWithIdOnly = await prisma.territory.findMany({ select: { id: true } })
     *
     */
    findMany<T extends TerritoryFindManyArgs>(
      args?: SelectSubset<T, TerritoryFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Territory.
     * @param {TerritoryCreateArgs} args - Arguments to create a Territory.
     * @example
     * // Create one Territory
     * const Territory = await prisma.territory.create({
     *   data: {
     *     // ... data to create a Territory
     *   }
     * })
     *
     */
    create<T extends TerritoryCreateArgs>(
      args: SelectSubset<T, TerritoryCreateArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Territories.
     * @param {TerritoryCreateManyArgs} args - Arguments to create many Territories.
     * @example
     * // Create many Territories
     * const territory = await prisma.territory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends TerritoryCreateManyArgs>(
      args?: SelectSubset<T, TerritoryCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Territories and returns the data saved in the database.
     * @param {TerritoryCreateManyAndReturnArgs} args - Arguments to create many Territories.
     * @example
     * // Create many Territories
     * const territory = await prisma.territory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Territories and only return the `id`
     * const territoryWithIdOnly = await prisma.territory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends TerritoryCreateManyAndReturnArgs>(
      args?: SelectSubset<T, TerritoryCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Territory.
     * @param {TerritoryDeleteArgs} args - Arguments to delete one Territory.
     * @example
     * // Delete one Territory
     * const Territory = await prisma.territory.delete({
     *   where: {
     *     // ... filter to delete one Territory
     *   }
     * })
     *
     */
    delete<T extends TerritoryDeleteArgs>(
      args: SelectSubset<T, TerritoryDeleteArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Territory.
     * @param {TerritoryUpdateArgs} args - Arguments to update one Territory.
     * @example
     * // Update one Territory
     * const territory = await prisma.territory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends TerritoryUpdateArgs>(
      args: SelectSubset<T, TerritoryUpdateArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Territories.
     * @param {TerritoryDeleteManyArgs} args - Arguments to filter Territories to delete.
     * @example
     * // Delete a few Territories
     * const { count } = await prisma.territory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends TerritoryDeleteManyArgs>(
      args?: SelectSubset<T, TerritoryDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Territories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Territories
     * const territory = await prisma.territory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends TerritoryUpdateManyArgs>(
      args: SelectSubset<T, TerritoryUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Territories and returns the data updated in the database.
     * @param {TerritoryUpdateManyAndReturnArgs} args - Arguments to update many Territories.
     * @example
     * // Update many Territories
     * const territory = await prisma.territory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Territories and only return the `id`
     * const territoryWithIdOnly = await prisma.territory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends TerritoryUpdateManyAndReturnArgs>(
      args: SelectSubset<T, TerritoryUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Territory.
     * @param {TerritoryUpsertArgs} args - Arguments to update or create a Territory.
     * @example
     * // Update or create a Territory
     * const territory = await prisma.territory.upsert({
     *   create: {
     *     // ... data to create a Territory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Territory we want to update
     *   }
     * })
     */
    upsert<T extends TerritoryUpsertArgs>(
      args: SelectSubset<T, TerritoryUpsertArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Territories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryCountArgs} args - Arguments to filter Territories to count.
     * @example
     * // Count the number of Territories
     * const count = await prisma.territory.count({
     *   where: {
     *     // ... the filter for the Territories we want to count
     *   }
     * })
     **/
    count<T extends TerritoryCountArgs>(
      args?: Subset<T, TerritoryCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TerritoryCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Territory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends TerritoryAggregateArgs>(
      args: Subset<T, TerritoryAggregateArgs>
    ): Prisma.PrismaPromise<GetTerritoryAggregateType<T>>;

    /**
     * Group by Territory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TerritoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends TerritoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TerritoryGroupByArgs['orderBy'] }
        : { orderBy?: TerritoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, TerritoryGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetTerritoryGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Territory model
     */
    readonly fields: TerritoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Territory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TerritoryClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    owner<T extends Territory$ownerArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$ownerArgs<ExtArgs>>
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    nfts<T extends Territory$nftsArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$nftsArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$UserNFTPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    challenges<T extends Territory$challengesArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$challengesArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ChallengePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    homeDojoUsers<T extends Territory$homeDojoUsersArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$homeDojoUsersArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    controllingClan<T extends Territory$controllingClanArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$controllingClanArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    contestedWars<T extends Territory$contestedWarsArgs<ExtArgs> = {}>(
      args?: Subset<T, Territory$contestedWarsArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanWarPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Territory model
   */
  interface TerritoryFieldRefs {
    readonly id: FieldRef<'Territory', 'String'>;
    readonly name: FieldRef<'Territory', 'String'>;
    readonly description: FieldRef<'Territory', 'String'>;
    readonly coordinates: FieldRef<'Territory', 'String'>;
    readonly requiredNFT: FieldRef<'Territory', 'String'>;
    readonly influence: FieldRef<'Territory', 'Int'>;
    readonly ownerId: FieldRef<'Territory', 'String'>;
    readonly clan: FieldRef<'Territory', 'String'>;
    readonly isActive: FieldRef<'Territory', 'Boolean'>;
    readonly createdAt: FieldRef<'Territory', 'DateTime'>;
    readonly updatedAt: FieldRef<'Territory', 'DateTime'>;
    readonly venueOwnerId: FieldRef<'Territory', 'String'>;
    readonly status: FieldRef<'Territory', 'String'>;
    readonly leaderboard: FieldRef<'Territory', 'String'>;
    readonly allegianceMeter: FieldRef<'Territory', 'Int'>;
    readonly controllingClanId: FieldRef<'Territory', 'String'>;
  }

  // Custom InputTypes
  /**
   * Territory findUnique
   */
  export type TerritoryFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter, which Territory to fetch.
     */
    where: TerritoryWhereUniqueInput;
  };

  /**
   * Territory findUniqueOrThrow
   */
  export type TerritoryFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter, which Territory to fetch.
     */
    where: TerritoryWhereUniqueInput;
  };

  /**
   * Territory findFirst
   */
  export type TerritoryFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter, which Territory to fetch.
     */
    where?: TerritoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Territories to fetch.
     */
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Territories.
     */
    cursor?: TerritoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Territories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Territories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Territories.
     */
    distinct?: TerritoryScalarFieldEnum | TerritoryScalarFieldEnum[];
  };

  /**
   * Territory findFirstOrThrow
   */
  export type TerritoryFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter, which Territory to fetch.
     */
    where?: TerritoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Territories to fetch.
     */
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Territories.
     */
    cursor?: TerritoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Territories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Territories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Territories.
     */
    distinct?: TerritoryScalarFieldEnum | TerritoryScalarFieldEnum[];
  };

  /**
   * Territory findMany
   */
  export type TerritoryFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter, which Territories to fetch.
     */
    where?: TerritoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Territories to fetch.
     */
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Territories.
     */
    cursor?: TerritoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Territories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Territories.
     */
    skip?: number;
    distinct?: TerritoryScalarFieldEnum | TerritoryScalarFieldEnum[];
  };

  /**
   * Territory create
   */
  export type TerritoryCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * The data needed to create a Territory.
     */
    data: XOR<TerritoryCreateInput, TerritoryUncheckedCreateInput>;
  };

  /**
   * Territory createMany
   */
  export type TerritoryCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Territories.
     */
    data: TerritoryCreateManyInput | TerritoryCreateManyInput[];
  };

  /**
   * Territory createManyAndReturn
   */
  export type TerritoryCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * The data used to create many Territories.
     */
    data: TerritoryCreateManyInput | TerritoryCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Territory update
   */
  export type TerritoryUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * The data needed to update a Territory.
     */
    data: XOR<TerritoryUpdateInput, TerritoryUncheckedUpdateInput>;
    /**
     * Choose, which Territory to update.
     */
    where: TerritoryWhereUniqueInput;
  };

  /**
   * Territory updateMany
   */
  export type TerritoryUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Territories.
     */
    data: XOR<
      TerritoryUpdateManyMutationInput,
      TerritoryUncheckedUpdateManyInput
    >;
    /**
     * Filter which Territories to update
     */
    where?: TerritoryWhereInput;
    /**
     * Limit how many Territories to update.
     */
    limit?: number;
  };

  /**
   * Territory updateManyAndReturn
   */
  export type TerritoryUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * The data used to update Territories.
     */
    data: XOR<
      TerritoryUpdateManyMutationInput,
      TerritoryUncheckedUpdateManyInput
    >;
    /**
     * Filter which Territories to update
     */
    where?: TerritoryWhereInput;
    /**
     * Limit how many Territories to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Territory upsert
   */
  export type TerritoryUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * The filter to search for the Territory to update in case it exists.
     */
    where: TerritoryWhereUniqueInput;
    /**
     * In case the Territory found by the `where` argument doesn't exist, create a new Territory with this data.
     */
    create: XOR<TerritoryCreateInput, TerritoryUncheckedCreateInput>;
    /**
     * In case the Territory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TerritoryUpdateInput, TerritoryUncheckedUpdateInput>;
  };

  /**
   * Territory delete
   */
  export type TerritoryDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    /**
     * Filter which Territory to delete.
     */
    where: TerritoryWhereUniqueInput;
  };

  /**
   * Territory deleteMany
   */
  export type TerritoryDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Territories to delete
     */
    where?: TerritoryWhereInput;
    /**
     * Limit how many Territories to delete.
     */
    limit?: number;
  };

  /**
   * Territory.owner
   */
  export type Territory$ownerArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    where?: UserWhereInput;
  };

  /**
   * Territory.nfts
   */
  export type Territory$nftsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    where?: UserNFTWhereInput;
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    cursor?: UserNFTWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: UserNFTScalarFieldEnum | UserNFTScalarFieldEnum[];
  };

  /**
   * Territory.challenges
   */
  export type Territory$challengesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    where?: ChallengeWhereInput;
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    cursor?: ChallengeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * Territory.homeDojoUsers
   */
  export type Territory$homeDojoUsersArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null;
    where?: UserWhereInput;
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[];
    cursor?: UserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[];
  };

  /**
   * Territory.controllingClan
   */
  export type Territory$controllingClanArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    where?: ClanWhereInput;
  };

  /**
   * Territory.contestedWars
   */
  export type Territory$contestedWarsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    where?: ClanWarWhereInput;
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    cursor?: ClanWarWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * Territory without action
   */
  export type TerritoryDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
  };

  /**
   * Model UserNFT
   */

  export type AggregateUserNFT = {
    _count: UserNFTCountAggregateOutputType | null;
    _min: UserNFTMinAggregateOutputType | null;
    _max: UserNFTMaxAggregateOutputType | null;
  };

  export type UserNFTMinAggregateOutputType = {
    id: string | null;
    tokenId: string | null;
    name: string | null;
    description: string | null;
    imageUrl: string | null;
    metadata: string | null;
    acquiredAt: Date | null;
    userId: string | null;
    territoryId: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserNFTMaxAggregateOutputType = {
    id: string | null;
    tokenId: string | null;
    name: string | null;
    description: string | null;
    imageUrl: string | null;
    metadata: string | null;
    acquiredAt: Date | null;
    userId: string | null;
    territoryId: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserNFTCountAggregateOutputType = {
    id: number;
    tokenId: number;
    name: number;
    description: number;
    imageUrl: number;
    metadata: number;
    acquiredAt: number;
    userId: number;
    territoryId: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type UserNFTMinAggregateInputType = {
    id?: true;
    tokenId?: true;
    name?: true;
    description?: true;
    imageUrl?: true;
    metadata?: true;
    acquiredAt?: true;
    userId?: true;
    territoryId?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserNFTMaxAggregateInputType = {
    id?: true;
    tokenId?: true;
    name?: true;
    description?: true;
    imageUrl?: true;
    metadata?: true;
    acquiredAt?: true;
    userId?: true;
    territoryId?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserNFTCountAggregateInputType = {
    id?: true;
    tokenId?: true;
    name?: true;
    description?: true;
    imageUrl?: true;
    metadata?: true;
    acquiredAt?: true;
    userId?: true;
    territoryId?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type UserNFTAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which UserNFT to aggregate.
     */
    where?: UserNFTWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserNFTS to fetch.
     */
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserNFTWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserNFTS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserNFTS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned UserNFTS
     **/
    _count?: true | UserNFTCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: UserNFTMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: UserNFTMaxAggregateInputType;
  };

  export type GetUserNFTAggregateType<T extends UserNFTAggregateArgs> = {
    [P in keyof T & keyof AggregateUserNFT]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserNFT[P]>
      : GetScalarType<T[P], AggregateUserNFT[P]>;
  };

  export type UserNFTGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserNFTWhereInput;
    orderBy?:
      | UserNFTOrderByWithAggregationInput
      | UserNFTOrderByWithAggregationInput[];
    by: UserNFTScalarFieldEnum[] | UserNFTScalarFieldEnum;
    having?: UserNFTScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserNFTCountAggregateInputType | true;
    _min?: UserNFTMinAggregateInputType;
    _max?: UserNFTMaxAggregateInputType;
  };

  export type UserNFTGroupByOutputType = {
    id: string;
    tokenId: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    metadata: string;
    acquiredAt: Date;
    userId: string;
    territoryId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: UserNFTCountAggregateOutputType | null;
    _min: UserNFTMinAggregateOutputType | null;
    _max: UserNFTMaxAggregateOutputType | null;
  };

  type GetUserNFTGroupByPayload<T extends UserNFTGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<UserNFTGroupByOutputType, T['by']> & {
          [P in keyof T & keyof UserNFTGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserNFTGroupByOutputType[P]>
            : GetScalarType<T[P], UserNFTGroupByOutputType[P]>;
        }
      >
    >;

  export type UserNFTSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      tokenId?: boolean;
      name?: boolean;
      description?: boolean;
      imageUrl?: boolean;
      metadata?: boolean;
      acquiredAt?: boolean;
      userId?: boolean;
      territoryId?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['userNFT']
  >;

  export type UserNFTSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      tokenId?: boolean;
      name?: boolean;
      description?: boolean;
      imageUrl?: boolean;
      metadata?: boolean;
      acquiredAt?: boolean;
      userId?: boolean;
      territoryId?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['userNFT']
  >;

  export type UserNFTSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      tokenId?: boolean;
      name?: boolean;
      description?: boolean;
      imageUrl?: boolean;
      metadata?: boolean;
      acquiredAt?: boolean;
      userId?: boolean;
      territoryId?: boolean;
      isActive?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['userNFT']
  >;

  export type UserNFTSelectScalar = {
    id?: boolean;
    tokenId?: boolean;
    name?: boolean;
    description?: boolean;
    imageUrl?: boolean;
    metadata?: boolean;
    acquiredAt?: boolean;
    userId?: boolean;
    territoryId?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type UserNFTOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'tokenId'
    | 'name'
    | 'description'
    | 'imageUrl'
    | 'metadata'
    | 'acquiredAt'
    | 'userId'
    | 'territoryId'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['userNFT']
  >;
  export type UserNFTInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
  };
  export type UserNFTIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
  };
  export type UserNFTIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    territory?: boolean | UserNFT$territoryArgs<ExtArgs>;
  };

  export type $UserNFTPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'UserNFT';
    objects: {
      user: Prisma.$UserPayload<ExtArgs>;
      territory: Prisma.$TerritoryPayload<ExtArgs> | null;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        tokenId: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        metadata: string;
        acquiredAt: Date;
        userId: string;
        territoryId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['userNFT']
    >;
    composites: {};
  };

  type UserNFTGetPayload<
    S extends boolean | null | undefined | UserNFTDefaultArgs,
  > = $Result.GetResult<Prisma.$UserNFTPayload, S>;

  type UserNFTCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<UserNFTFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserNFTCountAggregateInputType | true;
  };

  export interface UserNFTDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['UserNFT'];
      meta: { name: 'UserNFT' };
    };
    /**
     * Find zero or one UserNFT that matches the filter.
     * @param {UserNFTFindUniqueArgs} args - Arguments to find a UserNFT
     * @example
     * // Get one UserNFT
     * const userNFT = await prisma.userNFT.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserNFTFindUniqueArgs>(
      args: SelectSubset<T, UserNFTFindUniqueArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one UserNFT that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserNFTFindUniqueOrThrowArgs} args - Arguments to find a UserNFT
     * @example
     * // Get one UserNFT
     * const userNFT = await prisma.userNFT.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserNFTFindUniqueOrThrowArgs>(
      args: SelectSubset<T, UserNFTFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserNFT that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTFindFirstArgs} args - Arguments to find a UserNFT
     * @example
     * // Get one UserNFT
     * const userNFT = await prisma.userNFT.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserNFTFindFirstArgs>(
      args?: SelectSubset<T, UserNFTFindFirstArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserNFT that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTFindFirstOrThrowArgs} args - Arguments to find a UserNFT
     * @example
     * // Get one UserNFT
     * const userNFT = await prisma.userNFT.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserNFTFindFirstOrThrowArgs>(
      args?: SelectSubset<T, UserNFTFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more UserNFTS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserNFTS
     * const userNFTS = await prisma.userNFT.findMany()
     *
     * // Get first 10 UserNFTS
     * const userNFTS = await prisma.userNFT.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userNFTWithIdOnly = await prisma.userNFT.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserNFTFindManyArgs>(
      args?: SelectSubset<T, UserNFTFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a UserNFT.
     * @param {UserNFTCreateArgs} args - Arguments to create a UserNFT.
     * @example
     * // Create one UserNFT
     * const UserNFT = await prisma.userNFT.create({
     *   data: {
     *     // ... data to create a UserNFT
     *   }
     * })
     *
     */
    create<T extends UserNFTCreateArgs>(
      args: SelectSubset<T, UserNFTCreateArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many UserNFTS.
     * @param {UserNFTCreateManyArgs} args - Arguments to create many UserNFTS.
     * @example
     * // Create many UserNFTS
     * const userNFT = await prisma.userNFT.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserNFTCreateManyArgs>(
      args?: SelectSubset<T, UserNFTCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many UserNFTS and returns the data saved in the database.
     * @param {UserNFTCreateManyAndReturnArgs} args - Arguments to create many UserNFTS.
     * @example
     * // Create many UserNFTS
     * const userNFT = await prisma.userNFT.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many UserNFTS and only return the `id`
     * const userNFTWithIdOnly = await prisma.userNFT.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserNFTCreateManyAndReturnArgs>(
      args?: SelectSubset<T, UserNFTCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a UserNFT.
     * @param {UserNFTDeleteArgs} args - Arguments to delete one UserNFT.
     * @example
     * // Delete one UserNFT
     * const UserNFT = await prisma.userNFT.delete({
     *   where: {
     *     // ... filter to delete one UserNFT
     *   }
     * })
     *
     */
    delete<T extends UserNFTDeleteArgs>(
      args: SelectSubset<T, UserNFTDeleteArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one UserNFT.
     * @param {UserNFTUpdateArgs} args - Arguments to update one UserNFT.
     * @example
     * // Update one UserNFT
     * const userNFT = await prisma.userNFT.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserNFTUpdateArgs>(
      args: SelectSubset<T, UserNFTUpdateArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more UserNFTS.
     * @param {UserNFTDeleteManyArgs} args - Arguments to filter UserNFTS to delete.
     * @example
     * // Delete a few UserNFTS
     * const { count } = await prisma.userNFT.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserNFTDeleteManyArgs>(
      args?: SelectSubset<T, UserNFTDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserNFTS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserNFTS
     * const userNFT = await prisma.userNFT.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserNFTUpdateManyArgs>(
      args: SelectSubset<T, UserNFTUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserNFTS and returns the data updated in the database.
     * @param {UserNFTUpdateManyAndReturnArgs} args - Arguments to update many UserNFTS.
     * @example
     * // Update many UserNFTS
     * const userNFT = await prisma.userNFT.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more UserNFTS and only return the `id`
     * const userNFTWithIdOnly = await prisma.userNFT.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserNFTUpdateManyAndReturnArgs>(
      args: SelectSubset<T, UserNFTUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one UserNFT.
     * @param {UserNFTUpsertArgs} args - Arguments to update or create a UserNFT.
     * @example
     * // Update or create a UserNFT
     * const userNFT = await prisma.userNFT.upsert({
     *   create: {
     *     // ... data to create a UserNFT
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserNFT we want to update
     *   }
     * })
     */
    upsert<T extends UserNFTUpsertArgs>(
      args: SelectSubset<T, UserNFTUpsertArgs<ExtArgs>>
    ): Prisma__UserNFTClient<
      $Result.GetResult<
        Prisma.$UserNFTPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of UserNFTS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTCountArgs} args - Arguments to filter UserNFTS to count.
     * @example
     * // Count the number of UserNFTS
     * const count = await prisma.userNFT.count({
     *   where: {
     *     // ... the filter for the UserNFTS we want to count
     *   }
     * })
     **/
    count<T extends UserNFTCountArgs>(
      args?: Subset<T, UserNFTCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserNFTCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a UserNFT.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends UserNFTAggregateArgs>(
      args: Subset<T, UserNFTAggregateArgs>
    ): Prisma.PrismaPromise<GetUserNFTAggregateType<T>>;

    /**
     * Group by UserNFT.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserNFTGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends UserNFTGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserNFTGroupByArgs['orderBy'] }
        : { orderBy?: UserNFTGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, UserNFTGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors
      ? GetUserNFTGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the UserNFT model
     */
    readonly fields: UserNFTFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserNFT.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserNFTClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    territory<T extends UserNFT$territoryArgs<ExtArgs> = {}>(
      args?: Subset<T, UserNFT$territoryArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the UserNFT model
   */
  interface UserNFTFieldRefs {
    readonly id: FieldRef<'UserNFT', 'String'>;
    readonly tokenId: FieldRef<'UserNFT', 'String'>;
    readonly name: FieldRef<'UserNFT', 'String'>;
    readonly description: FieldRef<'UserNFT', 'String'>;
    readonly imageUrl: FieldRef<'UserNFT', 'String'>;
    readonly metadata: FieldRef<'UserNFT', 'String'>;
    readonly acquiredAt: FieldRef<'UserNFT', 'DateTime'>;
    readonly userId: FieldRef<'UserNFT', 'String'>;
    readonly territoryId: FieldRef<'UserNFT', 'String'>;
    readonly isActive: FieldRef<'UserNFT', 'Boolean'>;
    readonly createdAt: FieldRef<'UserNFT', 'DateTime'>;
    readonly updatedAt: FieldRef<'UserNFT', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * UserNFT findUnique
   */
  export type UserNFTFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter, which UserNFT to fetch.
     */
    where: UserNFTWhereUniqueInput;
  };

  /**
   * UserNFT findUniqueOrThrow
   */
  export type UserNFTFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter, which UserNFT to fetch.
     */
    where: UserNFTWhereUniqueInput;
  };

  /**
   * UserNFT findFirst
   */
  export type UserNFTFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter, which UserNFT to fetch.
     */
    where?: UserNFTWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserNFTS to fetch.
     */
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UserNFTS.
     */
    cursor?: UserNFTWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserNFTS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserNFTS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserNFTS.
     */
    distinct?: UserNFTScalarFieldEnum | UserNFTScalarFieldEnum[];
  };

  /**
   * UserNFT findFirstOrThrow
   */
  export type UserNFTFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter, which UserNFT to fetch.
     */
    where?: UserNFTWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserNFTS to fetch.
     */
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UserNFTS.
     */
    cursor?: UserNFTWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserNFTS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserNFTS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserNFTS.
     */
    distinct?: UserNFTScalarFieldEnum | UserNFTScalarFieldEnum[];
  };

  /**
   * UserNFT findMany
   */
  export type UserNFTFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter, which UserNFTS to fetch.
     */
    where?: UserNFTWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserNFTS to fetch.
     */
    orderBy?:
      | UserNFTOrderByWithRelationInput
      | UserNFTOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing UserNFTS.
     */
    cursor?: UserNFTWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserNFTS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserNFTS.
     */
    skip?: number;
    distinct?: UserNFTScalarFieldEnum | UserNFTScalarFieldEnum[];
  };

  /**
   * UserNFT create
   */
  export type UserNFTCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * The data needed to create a UserNFT.
     */
    data: XOR<UserNFTCreateInput, UserNFTUncheckedCreateInput>;
  };

  /**
   * UserNFT createMany
   */
  export type UserNFTCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many UserNFTS.
     */
    data: UserNFTCreateManyInput | UserNFTCreateManyInput[];
  };

  /**
   * UserNFT createManyAndReturn
   */
  export type UserNFTCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * The data used to create many UserNFTS.
     */
    data: UserNFTCreateManyInput | UserNFTCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserNFT update
   */
  export type UserNFTUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * The data needed to update a UserNFT.
     */
    data: XOR<UserNFTUpdateInput, UserNFTUncheckedUpdateInput>;
    /**
     * Choose, which UserNFT to update.
     */
    where: UserNFTWhereUniqueInput;
  };

  /**
   * UserNFT updateMany
   */
  export type UserNFTUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update UserNFTS.
     */
    data: XOR<UserNFTUpdateManyMutationInput, UserNFTUncheckedUpdateManyInput>;
    /**
     * Filter which UserNFTS to update
     */
    where?: UserNFTWhereInput;
    /**
     * Limit how many UserNFTS to update.
     */
    limit?: number;
  };

  /**
   * UserNFT updateManyAndReturn
   */
  export type UserNFTUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * The data used to update UserNFTS.
     */
    data: XOR<UserNFTUpdateManyMutationInput, UserNFTUncheckedUpdateManyInput>;
    /**
     * Filter which UserNFTS to update
     */
    where?: UserNFTWhereInput;
    /**
     * Limit how many UserNFTS to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserNFT upsert
   */
  export type UserNFTUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * The filter to search for the UserNFT to update in case it exists.
     */
    where: UserNFTWhereUniqueInput;
    /**
     * In case the UserNFT found by the `where` argument doesn't exist, create a new UserNFT with this data.
     */
    create: XOR<UserNFTCreateInput, UserNFTUncheckedCreateInput>;
    /**
     * In case the UserNFT was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserNFTUpdateInput, UserNFTUncheckedUpdateInput>;
  };

  /**
   * UserNFT delete
   */
  export type UserNFTDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
    /**
     * Filter which UserNFT to delete.
     */
    where: UserNFTWhereUniqueInput;
  };

  /**
   * UserNFT deleteMany
   */
  export type UserNFTDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which UserNFTS to delete
     */
    where?: UserNFTWhereInput;
    /**
     * Limit how many UserNFTS to delete.
     */
    limit?: number;
  };

  /**
   * UserNFT.territory
   */
  export type UserNFT$territoryArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    where?: TerritoryWhereInput;
  };

  /**
   * UserNFT without action
   */
  export type UserNFTDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserNFT
     */
    select?: UserNFTSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserNFT
     */
    omit?: UserNFTOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserNFTInclude<ExtArgs> | null;
  };

  /**
   * Model Tournament
   */

  export type AggregateTournament = {
    _count: TournamentCountAggregateOutputType | null;
    _avg: TournamentAvgAggregateOutputType | null;
    _sum: TournamentSumAggregateOutputType | null;
    _min: TournamentMinAggregateOutputType | null;
    _max: TournamentMaxAggregateOutputType | null;
  };

  export type TournamentAvgAggregateOutputType = {
    maxParticipants: number | null;
    entryFee: number | null;
    prizePool: number | null;
  };

  export type TournamentSumAggregateOutputType = {
    maxParticipants: number | null;
    entryFee: number | null;
    prizePool: number | null;
  };

  export type TournamentMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    format: string | null;
    venueId: string | null;
    startDate: Date | null;
    endDate: Date | null;
    maxParticipants: number | null;
    entryFee: number | null;
    prizePool: number | null;
    status: string | null;
    participants: string | null;
    matches: string | null;
    winnerId: string | null;
    finalStandings: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    endedAt: Date | null;
  };

  export type TournamentMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    format: string | null;
    venueId: string | null;
    startDate: Date | null;
    endDate: Date | null;
    maxParticipants: number | null;
    entryFee: number | null;
    prizePool: number | null;
    status: string | null;
    participants: string | null;
    matches: string | null;
    winnerId: string | null;
    finalStandings: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    endedAt: Date | null;
  };

  export type TournamentCountAggregateOutputType = {
    id: number;
    name: number;
    format: number;
    venueId: number;
    startDate: number;
    endDate: number;
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
    status: number;
    participants: number;
    matches: number;
    winnerId: number;
    finalStandings: number;
    createdAt: number;
    updatedAt: number;
    endedAt: number;
    _all: number;
  };

  export type TournamentAvgAggregateInputType = {
    maxParticipants?: true;
    entryFee?: true;
    prizePool?: true;
  };

  export type TournamentSumAggregateInputType = {
    maxParticipants?: true;
    entryFee?: true;
    prizePool?: true;
  };

  export type TournamentMinAggregateInputType = {
    id?: true;
    name?: true;
    format?: true;
    venueId?: true;
    startDate?: true;
    endDate?: true;
    maxParticipants?: true;
    entryFee?: true;
    prizePool?: true;
    status?: true;
    participants?: true;
    matches?: true;
    winnerId?: true;
    finalStandings?: true;
    createdAt?: true;
    updatedAt?: true;
    endedAt?: true;
  };

  export type TournamentMaxAggregateInputType = {
    id?: true;
    name?: true;
    format?: true;
    venueId?: true;
    startDate?: true;
    endDate?: true;
    maxParticipants?: true;
    entryFee?: true;
    prizePool?: true;
    status?: true;
    participants?: true;
    matches?: true;
    winnerId?: true;
    finalStandings?: true;
    createdAt?: true;
    updatedAt?: true;
    endedAt?: true;
  };

  export type TournamentCountAggregateInputType = {
    id?: true;
    name?: true;
    format?: true;
    venueId?: true;
    startDate?: true;
    endDate?: true;
    maxParticipants?: true;
    entryFee?: true;
    prizePool?: true;
    status?: true;
    participants?: true;
    matches?: true;
    winnerId?: true;
    finalStandings?: true;
    createdAt?: true;
    updatedAt?: true;
    endedAt?: true;
    _all?: true;
  };

  export type TournamentAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Tournament to aggregate.
     */
    where?: TournamentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Tournaments to fetch.
     */
    orderBy?:
      | TournamentOrderByWithRelationInput
      | TournamentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: TournamentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Tournaments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Tournaments
     **/
    _count?: true | TournamentCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: TournamentAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: TournamentSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: TournamentMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: TournamentMaxAggregateInputType;
  };

  export type GetTournamentAggregateType<T extends TournamentAggregateArgs> = {
    [P in keyof T & keyof AggregateTournament]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTournament[P]>
      : GetScalarType<T[P], AggregateTournament[P]>;
  };

  export type TournamentGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: TournamentWhereInput;
    orderBy?:
      | TournamentOrderByWithAggregationInput
      | TournamentOrderByWithAggregationInput[];
    by: TournamentScalarFieldEnum[] | TournamentScalarFieldEnum;
    having?: TournamentScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TournamentCountAggregateInputType | true;
    _avg?: TournamentAvgAggregateInputType;
    _sum?: TournamentSumAggregateInputType;
    _min?: TournamentMinAggregateInputType;
    _max?: TournamentMaxAggregateInputType;
  };

  export type TournamentGroupByOutputType = {
    id: string;
    name: string;
    format: string;
    venueId: string;
    startDate: Date;
    endDate: Date;
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
    status: string;
    participants: string;
    matches: string;
    winnerId: string | null;
    finalStandings: string;
    createdAt: Date;
    updatedAt: Date;
    endedAt: Date | null;
    _count: TournamentCountAggregateOutputType | null;
    _avg: TournamentAvgAggregateOutputType | null;
    _sum: TournamentSumAggregateOutputType | null;
    _min: TournamentMinAggregateOutputType | null;
    _max: TournamentMaxAggregateOutputType | null;
  };

  type GetTournamentGroupByPayload<T extends TournamentGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<TournamentGroupByOutputType, T['by']> & {
          [P in keyof T & keyof TournamentGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TournamentGroupByOutputType[P]>
            : GetScalarType<T[P], TournamentGroupByOutputType[P]>;
        }
      >
    >;

  export type TournamentSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      format?: boolean;
      venueId?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      maxParticipants?: boolean;
      entryFee?: boolean;
      prizePool?: boolean;
      status?: boolean;
      participants?: boolean;
      matches?: boolean;
      winnerId?: boolean;
      finalStandings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      endedAt?: boolean;
    },
    ExtArgs['result']['tournament']
  >;

  export type TournamentSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      format?: boolean;
      venueId?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      maxParticipants?: boolean;
      entryFee?: boolean;
      prizePool?: boolean;
      status?: boolean;
      participants?: boolean;
      matches?: boolean;
      winnerId?: boolean;
      finalStandings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      endedAt?: boolean;
    },
    ExtArgs['result']['tournament']
  >;

  export type TournamentSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      format?: boolean;
      venueId?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      maxParticipants?: boolean;
      entryFee?: boolean;
      prizePool?: boolean;
      status?: boolean;
      participants?: boolean;
      matches?: boolean;
      winnerId?: boolean;
      finalStandings?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      endedAt?: boolean;
    },
    ExtArgs['result']['tournament']
  >;

  export type TournamentSelectScalar = {
    id?: boolean;
    name?: boolean;
    format?: boolean;
    venueId?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    maxParticipants?: boolean;
    entryFee?: boolean;
    prizePool?: boolean;
    status?: boolean;
    participants?: boolean;
    matches?: boolean;
    winnerId?: boolean;
    finalStandings?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    endedAt?: boolean;
  };

  export type TournamentOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'name'
    | 'format'
    | 'venueId'
    | 'startDate'
    | 'endDate'
    | 'maxParticipants'
    | 'entryFee'
    | 'prizePool'
    | 'status'
    | 'participants'
    | 'matches'
    | 'winnerId'
    | 'finalStandings'
    | 'createdAt'
    | 'updatedAt'
    | 'endedAt',
    ExtArgs['result']['tournament']
  >;

  export type $TournamentPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Tournament';
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        name: string;
        format: string;
        venueId: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number;
        entryFee: number;
        prizePool: number;
        status: string;
        participants: string;
        matches: string;
        winnerId: string | null;
        finalStandings: string;
        createdAt: Date;
        updatedAt: Date;
        endedAt: Date | null;
      },
      ExtArgs['result']['tournament']
    >;
    composites: {};
  };

  type TournamentGetPayload<
    S extends boolean | null | undefined | TournamentDefaultArgs,
  > = $Result.GetResult<Prisma.$TournamentPayload, S>;

  type TournamentCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    TournamentFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: TournamentCountAggregateInputType | true;
  };

  export interface TournamentDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Tournament'];
      meta: { name: 'Tournament' };
    };
    /**
     * Find zero or one Tournament that matches the filter.
     * @param {TournamentFindUniqueArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TournamentFindUniqueArgs>(
      args: SelectSubset<T, TournamentFindUniqueArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Tournament that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TournamentFindUniqueOrThrowArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TournamentFindUniqueOrThrowArgs>(
      args: SelectSubset<T, TournamentFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Tournament that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindFirstArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TournamentFindFirstArgs>(
      args?: SelectSubset<T, TournamentFindFirstArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Tournament that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindFirstOrThrowArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TournamentFindFirstOrThrowArgs>(
      args?: SelectSubset<T, TournamentFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Tournaments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tournaments
     * const tournaments = await prisma.tournament.findMany()
     *
     * // Get first 10 Tournaments
     * const tournaments = await prisma.tournament.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const tournamentWithIdOnly = await prisma.tournament.findMany({ select: { id: true } })
     *
     */
    findMany<T extends TournamentFindManyArgs>(
      args?: SelectSubset<T, TournamentFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Tournament.
     * @param {TournamentCreateArgs} args - Arguments to create a Tournament.
     * @example
     * // Create one Tournament
     * const Tournament = await prisma.tournament.create({
     *   data: {
     *     // ... data to create a Tournament
     *   }
     * })
     *
     */
    create<T extends TournamentCreateArgs>(
      args: SelectSubset<T, TournamentCreateArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Tournaments.
     * @param {TournamentCreateManyArgs} args - Arguments to create many Tournaments.
     * @example
     * // Create many Tournaments
     * const tournament = await prisma.tournament.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends TournamentCreateManyArgs>(
      args?: SelectSubset<T, TournamentCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Tournaments and returns the data saved in the database.
     * @param {TournamentCreateManyAndReturnArgs} args - Arguments to create many Tournaments.
     * @example
     * // Create many Tournaments
     * const tournament = await prisma.tournament.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Tournaments and only return the `id`
     * const tournamentWithIdOnly = await prisma.tournament.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends TournamentCreateManyAndReturnArgs>(
      args?: SelectSubset<T, TournamentCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Tournament.
     * @param {TournamentDeleteArgs} args - Arguments to delete one Tournament.
     * @example
     * // Delete one Tournament
     * const Tournament = await prisma.tournament.delete({
     *   where: {
     *     // ... filter to delete one Tournament
     *   }
     * })
     *
     */
    delete<T extends TournamentDeleteArgs>(
      args: SelectSubset<T, TournamentDeleteArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Tournament.
     * @param {TournamentUpdateArgs} args - Arguments to update one Tournament.
     * @example
     * // Update one Tournament
     * const tournament = await prisma.tournament.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends TournamentUpdateArgs>(
      args: SelectSubset<T, TournamentUpdateArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Tournaments.
     * @param {TournamentDeleteManyArgs} args - Arguments to filter Tournaments to delete.
     * @example
     * // Delete a few Tournaments
     * const { count } = await prisma.tournament.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends TournamentDeleteManyArgs>(
      args?: SelectSubset<T, TournamentDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Tournaments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tournaments
     * const tournament = await prisma.tournament.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends TournamentUpdateManyArgs>(
      args: SelectSubset<T, TournamentUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Tournaments and returns the data updated in the database.
     * @param {TournamentUpdateManyAndReturnArgs} args - Arguments to update many Tournaments.
     * @example
     * // Update many Tournaments
     * const tournament = await prisma.tournament.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Tournaments and only return the `id`
     * const tournamentWithIdOnly = await prisma.tournament.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends TournamentUpdateManyAndReturnArgs>(
      args: SelectSubset<T, TournamentUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Tournament.
     * @param {TournamentUpsertArgs} args - Arguments to update or create a Tournament.
     * @example
     * // Update or create a Tournament
     * const tournament = await prisma.tournament.upsert({
     *   create: {
     *     // ... data to create a Tournament
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tournament we want to update
     *   }
     * })
     */
    upsert<T extends TournamentUpsertArgs>(
      args: SelectSubset<T, TournamentUpsertArgs<ExtArgs>>
    ): Prisma__TournamentClient<
      $Result.GetResult<
        Prisma.$TournamentPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Tournaments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentCountArgs} args - Arguments to filter Tournaments to count.
     * @example
     * // Count the number of Tournaments
     * const count = await prisma.tournament.count({
     *   where: {
     *     // ... the filter for the Tournaments we want to count
     *   }
     * })
     **/
    count<T extends TournamentCountArgs>(
      args?: Subset<T, TournamentCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TournamentCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Tournament.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends TournamentAggregateArgs>(
      args: Subset<T, TournamentAggregateArgs>
    ): Prisma.PrismaPromise<GetTournamentAggregateType<T>>;

    /**
     * Group by Tournament.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends TournamentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TournamentGroupByArgs['orderBy'] }
        : { orderBy?: TournamentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, TournamentGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetTournamentGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Tournament model
     */
    readonly fields: TournamentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tournament.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TournamentClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Tournament model
   */
  interface TournamentFieldRefs {
    readonly id: FieldRef<'Tournament', 'String'>;
    readonly name: FieldRef<'Tournament', 'String'>;
    readonly format: FieldRef<'Tournament', 'String'>;
    readonly venueId: FieldRef<'Tournament', 'String'>;
    readonly startDate: FieldRef<'Tournament', 'DateTime'>;
    readonly endDate: FieldRef<'Tournament', 'DateTime'>;
    readonly maxParticipants: FieldRef<'Tournament', 'Int'>;
    readonly entryFee: FieldRef<'Tournament', 'Float'>;
    readonly prizePool: FieldRef<'Tournament', 'Float'>;
    readonly status: FieldRef<'Tournament', 'String'>;
    readonly participants: FieldRef<'Tournament', 'String'>;
    readonly matches: FieldRef<'Tournament', 'String'>;
    readonly winnerId: FieldRef<'Tournament', 'String'>;
    readonly finalStandings: FieldRef<'Tournament', 'String'>;
    readonly createdAt: FieldRef<'Tournament', 'DateTime'>;
    readonly updatedAt: FieldRef<'Tournament', 'DateTime'>;
    readonly endedAt: FieldRef<'Tournament', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Tournament findUnique
   */
  export type TournamentFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter, which Tournament to fetch.
     */
    where: TournamentWhereUniqueInput;
  };

  /**
   * Tournament findUniqueOrThrow
   */
  export type TournamentFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter, which Tournament to fetch.
     */
    where: TournamentWhereUniqueInput;
  };

  /**
   * Tournament findFirst
   */
  export type TournamentFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter, which Tournament to fetch.
     */
    where?: TournamentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Tournaments to fetch.
     */
    orderBy?:
      | TournamentOrderByWithRelationInput
      | TournamentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Tournaments.
     */
    cursor?: TournamentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Tournaments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Tournaments.
     */
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[];
  };

  /**
   * Tournament findFirstOrThrow
   */
  export type TournamentFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter, which Tournament to fetch.
     */
    where?: TournamentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Tournaments to fetch.
     */
    orderBy?:
      | TournamentOrderByWithRelationInput
      | TournamentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Tournaments.
     */
    cursor?: TournamentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Tournaments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Tournaments.
     */
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[];
  };

  /**
   * Tournament findMany
   */
  export type TournamentFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter, which Tournaments to fetch.
     */
    where?: TournamentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Tournaments to fetch.
     */
    orderBy?:
      | TournamentOrderByWithRelationInput
      | TournamentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Tournaments.
     */
    cursor?: TournamentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Tournaments.
     */
    skip?: number;
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[];
  };

  /**
   * Tournament create
   */
  export type TournamentCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * The data needed to create a Tournament.
     */
    data: XOR<TournamentCreateInput, TournamentUncheckedCreateInput>;
  };

  /**
   * Tournament createMany
   */
  export type TournamentCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Tournaments.
     */
    data: TournamentCreateManyInput | TournamentCreateManyInput[];
  };

  /**
   * Tournament createManyAndReturn
   */
  export type TournamentCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * The data used to create many Tournaments.
     */
    data: TournamentCreateManyInput | TournamentCreateManyInput[];
  };

  /**
   * Tournament update
   */
  export type TournamentUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * The data needed to update a Tournament.
     */
    data: XOR<TournamentUpdateInput, TournamentUncheckedUpdateInput>;
    /**
     * Choose, which Tournament to update.
     */
    where: TournamentWhereUniqueInput;
  };

  /**
   * Tournament updateMany
   */
  export type TournamentUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Tournaments.
     */
    data: XOR<
      TournamentUpdateManyMutationInput,
      TournamentUncheckedUpdateManyInput
    >;
    /**
     * Filter which Tournaments to update
     */
    where?: TournamentWhereInput;
    /**
     * Limit how many Tournaments to update.
     */
    limit?: number;
  };

  /**
   * Tournament updateManyAndReturn
   */
  export type TournamentUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * The data used to update Tournaments.
     */
    data: XOR<
      TournamentUpdateManyMutationInput,
      TournamentUncheckedUpdateManyInput
    >;
    /**
     * Filter which Tournaments to update
     */
    where?: TournamentWhereInput;
    /**
     * Limit how many Tournaments to update.
     */
    limit?: number;
  };

  /**
   * Tournament upsert
   */
  export type TournamentUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * The filter to search for the Tournament to update in case it exists.
     */
    where: TournamentWhereUniqueInput;
    /**
     * In case the Tournament found by the `where` argument doesn't exist, create a new Tournament with this data.
     */
    create: XOR<TournamentCreateInput, TournamentUncheckedCreateInput>;
    /**
     * In case the Tournament was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TournamentUpdateInput, TournamentUncheckedUpdateInput>;
  };

  /**
   * Tournament delete
   */
  export type TournamentDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
    /**
     * Filter which Tournament to delete.
     */
    where: TournamentWhereUniqueInput;
  };

  /**
   * Tournament deleteMany
   */
  export type TournamentDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Tournaments to delete
     */
    where?: TournamentWhereInput;
    /**
     * Limit how many Tournaments to delete.
     */
    limit?: number;
  };

  /**
   * Tournament without action
   */
  export type TournamentDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null;
  };

  /**
   * Model Challenge
   */

  export type AggregateChallenge = {
    _count: ChallengeCountAggregateOutputType | null;
    _min: ChallengeMinAggregateOutputType | null;
    _max: ChallengeMaxAggregateOutputType | null;
  };

  export type ChallengeMinAggregateOutputType = {
    id: string | null;
    type: string | null;
    challengerId: string | null;
    defenderId: string | null;
    dojoId: string | null;
    status: string | null;
    outcome: string | null;
    winnerId: string | null;
    requirements: string | null;
    matchData: string | null;
    expiresAt: Date | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ChallengeMaxAggregateOutputType = {
    id: string | null;
    type: string | null;
    challengerId: string | null;
    defenderId: string | null;
    dojoId: string | null;
    status: string | null;
    outcome: string | null;
    winnerId: string | null;
    requirements: string | null;
    matchData: string | null;
    expiresAt: Date | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ChallengeCountAggregateOutputType = {
    id: number;
    type: number;
    challengerId: number;
    defenderId: number;
    dojoId: number;
    status: number;
    outcome: number;
    winnerId: number;
    requirements: number;
    matchData: number;
    expiresAt: number;
    acceptedAt: number;
    declinedAt: number;
    completedAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type ChallengeMinAggregateInputType = {
    id?: true;
    type?: true;
    challengerId?: true;
    defenderId?: true;
    dojoId?: true;
    status?: true;
    outcome?: true;
    winnerId?: true;
    requirements?: true;
    matchData?: true;
    expiresAt?: true;
    acceptedAt?: true;
    declinedAt?: true;
    completedAt?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ChallengeMaxAggregateInputType = {
    id?: true;
    type?: true;
    challengerId?: true;
    defenderId?: true;
    dojoId?: true;
    status?: true;
    outcome?: true;
    winnerId?: true;
    requirements?: true;
    matchData?: true;
    expiresAt?: true;
    acceptedAt?: true;
    declinedAt?: true;
    completedAt?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ChallengeCountAggregateInputType = {
    id?: true;
    type?: true;
    challengerId?: true;
    defenderId?: true;
    dojoId?: true;
    status?: true;
    outcome?: true;
    winnerId?: true;
    requirements?: true;
    matchData?: true;
    expiresAt?: true;
    acceptedAt?: true;
    declinedAt?: true;
    completedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type ChallengeAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Challenge to aggregate.
     */
    where?: ChallengeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Challenges to fetch.
     */
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ChallengeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Challenges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Challenges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Challenges
     **/
    _count?: true | ChallengeCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ChallengeMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ChallengeMaxAggregateInputType;
  };

  export type GetChallengeAggregateType<T extends ChallengeAggregateArgs> = {
    [P in keyof T & keyof AggregateChallenge]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChallenge[P]>
      : GetScalarType<T[P], AggregateChallenge[P]>;
  };

  export type ChallengeGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ChallengeWhereInput;
    orderBy?:
      | ChallengeOrderByWithAggregationInput
      | ChallengeOrderByWithAggregationInput[];
    by: ChallengeScalarFieldEnum[] | ChallengeScalarFieldEnum;
    having?: ChallengeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ChallengeCountAggregateInputType | true;
    _min?: ChallengeMinAggregateInputType;
    _max?: ChallengeMaxAggregateInputType;
  };

  export type ChallengeGroupByOutputType = {
    id: string;
    type: string;
    challengerId: string;
    defenderId: string;
    dojoId: string;
    status: string;
    outcome: string | null;
    winnerId: string | null;
    requirements: string;
    matchData: string | null;
    expiresAt: Date;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: ChallengeCountAggregateOutputType | null;
    _min: ChallengeMinAggregateOutputType | null;
    _max: ChallengeMaxAggregateOutputType | null;
  };

  type GetChallengeGroupByPayload<T extends ChallengeGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ChallengeGroupByOutputType, T['by']> & {
          [P in keyof T & keyof ChallengeGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChallengeGroupByOutputType[P]>
            : GetScalarType<T[P], ChallengeGroupByOutputType[P]>;
        }
      >
    >;

  export type ChallengeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      type?: boolean;
      challengerId?: boolean;
      defenderId?: boolean;
      dojoId?: boolean;
      status?: boolean;
      outcome?: boolean;
      winnerId?: boolean;
      requirements?: boolean;
      matchData?: boolean;
      expiresAt?: boolean;
      acceptedAt?: boolean;
      declinedAt?: boolean;
      completedAt?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      challenger?: boolean | UserDefaultArgs<ExtArgs>;
      defender?: boolean | UserDefaultArgs<ExtArgs>;
      dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['challenge']
  >;

  export type ChallengeSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      type?: boolean;
      challengerId?: boolean;
      defenderId?: boolean;
      dojoId?: boolean;
      status?: boolean;
      outcome?: boolean;
      winnerId?: boolean;
      requirements?: boolean;
      matchData?: boolean;
      expiresAt?: boolean;
      acceptedAt?: boolean;
      declinedAt?: boolean;
      completedAt?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      challenger?: boolean | UserDefaultArgs<ExtArgs>;
      defender?: boolean | UserDefaultArgs<ExtArgs>;
      dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['challenge']
  >;

  export type ChallengeSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      type?: boolean;
      challengerId?: boolean;
      defenderId?: boolean;
      dojoId?: boolean;
      status?: boolean;
      outcome?: boolean;
      winnerId?: boolean;
      requirements?: boolean;
      matchData?: boolean;
      expiresAt?: boolean;
      acceptedAt?: boolean;
      declinedAt?: boolean;
      completedAt?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      challenger?: boolean | UserDefaultArgs<ExtArgs>;
      defender?: boolean | UserDefaultArgs<ExtArgs>;
      dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['challenge']
  >;

  export type ChallengeSelectScalar = {
    id?: boolean;
    type?: boolean;
    challengerId?: boolean;
    defenderId?: boolean;
    dojoId?: boolean;
    status?: boolean;
    outcome?: boolean;
    winnerId?: boolean;
    requirements?: boolean;
    matchData?: boolean;
    expiresAt?: boolean;
    acceptedAt?: boolean;
    declinedAt?: boolean;
    completedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type ChallengeOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'type'
    | 'challengerId'
    | 'defenderId'
    | 'dojoId'
    | 'status'
    | 'outcome'
    | 'winnerId'
    | 'requirements'
    | 'matchData'
    | 'expiresAt'
    | 'acceptedAt'
    | 'declinedAt'
    | 'completedAt'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['challenge']
  >;
  export type ChallengeInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    challenger?: boolean | UserDefaultArgs<ExtArgs>;
    defender?: boolean | UserDefaultArgs<ExtArgs>;
    dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
  };
  export type ChallengeIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    challenger?: boolean | UserDefaultArgs<ExtArgs>;
    defender?: boolean | UserDefaultArgs<ExtArgs>;
    dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
  };
  export type ChallengeIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    challenger?: boolean | UserDefaultArgs<ExtArgs>;
    defender?: boolean | UserDefaultArgs<ExtArgs>;
    dojo?: boolean | TerritoryDefaultArgs<ExtArgs>;
  };

  export type $ChallengePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Challenge';
    objects: {
      challenger: Prisma.$UserPayload<ExtArgs>;
      defender: Prisma.$UserPayload<ExtArgs>;
      dojo: Prisma.$TerritoryPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        type: string;
        challengerId: string;
        defenderId: string;
        dojoId: string;
        status: string;
        outcome: string | null;
        winnerId: string | null;
        requirements: string;
        matchData: string | null;
        expiresAt: Date;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['challenge']
    >;
    composites: {};
  };

  type ChallengeGetPayload<
    S extends boolean | null | undefined | ChallengeDefaultArgs,
  > = $Result.GetResult<Prisma.$ChallengePayload, S>;

  type ChallengeCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    ChallengeFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: ChallengeCountAggregateInputType | true;
  };

  export interface ChallengeDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Challenge'];
      meta: { name: 'Challenge' };
    };
    /**
     * Find zero or one Challenge that matches the filter.
     * @param {ChallengeFindUniqueArgs} args - Arguments to find a Challenge
     * @example
     * // Get one Challenge
     * const challenge = await prisma.challenge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChallengeFindUniqueArgs>(
      args: SelectSubset<T, ChallengeFindUniqueArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Challenge that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChallengeFindUniqueOrThrowArgs} args - Arguments to find a Challenge
     * @example
     * // Get one Challenge
     * const challenge = await prisma.challenge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChallengeFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ChallengeFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Challenge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeFindFirstArgs} args - Arguments to find a Challenge
     * @example
     * // Get one Challenge
     * const challenge = await prisma.challenge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChallengeFindFirstArgs>(
      args?: SelectSubset<T, ChallengeFindFirstArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Challenge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeFindFirstOrThrowArgs} args - Arguments to find a Challenge
     * @example
     * // Get one Challenge
     * const challenge = await prisma.challenge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChallengeFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ChallengeFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Challenges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Challenges
     * const challenges = await prisma.challenge.findMany()
     *
     * // Get first 10 Challenges
     * const challenges = await prisma.challenge.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const challengeWithIdOnly = await prisma.challenge.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ChallengeFindManyArgs>(
      args?: SelectSubset<T, ChallengeFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Challenge.
     * @param {ChallengeCreateArgs} args - Arguments to create a Challenge.
     * @example
     * // Create one Challenge
     * const Challenge = await prisma.challenge.create({
     *   data: {
     *     // ... data to create a Challenge
     *   }
     * })
     *
     */
    create<T extends ChallengeCreateArgs>(
      args: SelectSubset<T, ChallengeCreateArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Challenges.
     * @param {ChallengeCreateManyArgs} args - Arguments to create many Challenges.
     * @example
     * // Create many Challenges
     * const challenge = await prisma.challenge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ChallengeCreateManyArgs>(
      args?: SelectSubset<T, ChallengeCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Challenges and returns the data saved in the database.
     * @param {ChallengeCreateManyAndReturnArgs} args - Arguments to create many Challenges.
     * @example
     * // Create many Challenges
     * const challenge = await prisma.challenge.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Challenges and only return the `id`
     * const challengeWithIdOnly = await prisma.challenge.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ChallengeCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ChallengeCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Challenge.
     * @param {ChallengeDeleteArgs} args - Arguments to delete one Challenge.
     * @example
     * // Delete one Challenge
     * const Challenge = await prisma.challenge.delete({
     *   where: {
     *     // ... filter to delete one Challenge
     *   }
     * })
     *
     */
    delete<T extends ChallengeDeleteArgs>(
      args: SelectSubset<T, ChallengeDeleteArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Challenge.
     * @param {ChallengeUpdateArgs} args - Arguments to update one Challenge.
     * @example
     * // Update one Challenge
     * const challenge = await prisma.challenge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ChallengeUpdateArgs>(
      args: SelectSubset<T, ChallengeUpdateArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Challenges.
     * @param {ChallengeDeleteManyArgs} args - Arguments to filter Challenges to delete.
     * @example
     * // Delete a few Challenges
     * const { count } = await prisma.challenge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ChallengeDeleteManyArgs>(
      args?: SelectSubset<T, ChallengeDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Challenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Challenges
     * const challenge = await prisma.challenge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ChallengeUpdateManyArgs>(
      args: SelectSubset<T, ChallengeUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Challenges and returns the data updated in the database.
     * @param {ChallengeUpdateManyAndReturnArgs} args - Arguments to update many Challenges.
     * @example
     * // Update many Challenges
     * const challenge = await prisma.challenge.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Challenges and only return the `id`
     * const challengeWithIdOnly = await prisma.challenge.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ChallengeUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ChallengeUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Challenge.
     * @param {ChallengeUpsertArgs} args - Arguments to update or create a Challenge.
     * @example
     * // Update or create a Challenge
     * const challenge = await prisma.challenge.upsert({
     *   create: {
     *     // ... data to create a Challenge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Challenge we want to update
     *   }
     * })
     */
    upsert<T extends ChallengeUpsertArgs>(
      args: SelectSubset<T, ChallengeUpsertArgs<ExtArgs>>
    ): Prisma__ChallengeClient<
      $Result.GetResult<
        Prisma.$ChallengePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Challenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeCountArgs} args - Arguments to filter Challenges to count.
     * @example
     * // Count the number of Challenges
     * const count = await prisma.challenge.count({
     *   where: {
     *     // ... the filter for the Challenges we want to count
     *   }
     * })
     **/
    count<T extends ChallengeCountArgs>(
      args?: Subset<T, ChallengeCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChallengeCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Challenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ChallengeAggregateArgs>(
      args: Subset<T, ChallengeAggregateArgs>
    ): Prisma.PrismaPromise<GetChallengeAggregateType<T>>;

    /**
     * Group by Challenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ChallengeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChallengeGroupByArgs['orderBy'] }
        : { orderBy?: ChallengeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ChallengeGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetChallengeGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Challenge model
     */
    readonly fields: ChallengeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Challenge.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChallengeClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    challenger<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    defender<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    dojo<T extends TerritoryDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, TerritoryDefaultArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      | $Result.GetResult<
          Prisma.$TerritoryPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Challenge model
   */
  interface ChallengeFieldRefs {
    readonly id: FieldRef<'Challenge', 'String'>;
    readonly type: FieldRef<'Challenge', 'String'>;
    readonly challengerId: FieldRef<'Challenge', 'String'>;
    readonly defenderId: FieldRef<'Challenge', 'String'>;
    readonly dojoId: FieldRef<'Challenge', 'String'>;
    readonly status: FieldRef<'Challenge', 'String'>;
    readonly outcome: FieldRef<'Challenge', 'String'>;
    readonly winnerId: FieldRef<'Challenge', 'String'>;
    readonly requirements: FieldRef<'Challenge', 'String'>;
    readonly matchData: FieldRef<'Challenge', 'String'>;
    readonly expiresAt: FieldRef<'Challenge', 'DateTime'>;
    readonly acceptedAt: FieldRef<'Challenge', 'DateTime'>;
    readonly declinedAt: FieldRef<'Challenge', 'DateTime'>;
    readonly completedAt: FieldRef<'Challenge', 'DateTime'>;
    readonly createdAt: FieldRef<'Challenge', 'DateTime'>;
    readonly updatedAt: FieldRef<'Challenge', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Challenge findUnique
   */
  export type ChallengeFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter, which Challenge to fetch.
     */
    where: ChallengeWhereUniqueInput;
  };

  /**
   * Challenge findUniqueOrThrow
   */
  export type ChallengeFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter, which Challenge to fetch.
     */
    where: ChallengeWhereUniqueInput;
  };

  /**
   * Challenge findFirst
   */
  export type ChallengeFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter, which Challenge to fetch.
     */
    where?: ChallengeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Challenges to fetch.
     */
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Challenges.
     */
    cursor?: ChallengeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Challenges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Challenges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Challenges.
     */
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * Challenge findFirstOrThrow
   */
  export type ChallengeFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter, which Challenge to fetch.
     */
    where?: ChallengeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Challenges to fetch.
     */
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Challenges.
     */
    cursor?: ChallengeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Challenges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Challenges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Challenges.
     */
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * Challenge findMany
   */
  export type ChallengeFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter, which Challenges to fetch.
     */
    where?: ChallengeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Challenges to fetch.
     */
    orderBy?:
      | ChallengeOrderByWithRelationInput
      | ChallengeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Challenges.
     */
    cursor?: ChallengeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Challenges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Challenges.
     */
    skip?: number;
    distinct?: ChallengeScalarFieldEnum | ChallengeScalarFieldEnum[];
  };

  /**
   * Challenge create
   */
  export type ChallengeCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * The data needed to create a Challenge.
     */
    data: XOR<ChallengeCreateInput, ChallengeUncheckedCreateInput>;
  };

  /**
   * Challenge createMany
   */
  export type ChallengeCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Challenges.
     */
    data: ChallengeCreateManyInput | ChallengeCreateManyInput[];
  };

  /**
   * Challenge createManyAndReturn
   */
  export type ChallengeCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * The data used to create many Challenges.
     */
    data: ChallengeCreateManyInput | ChallengeCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Challenge update
   */
  export type ChallengeUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * The data needed to update a Challenge.
     */
    data: XOR<ChallengeUpdateInput, ChallengeUncheckedUpdateInput>;
    /**
     * Choose, which Challenge to update.
     */
    where: ChallengeWhereUniqueInput;
  };

  /**
   * Challenge updateMany
   */
  export type ChallengeUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Challenges.
     */
    data: XOR<
      ChallengeUpdateManyMutationInput,
      ChallengeUncheckedUpdateManyInput
    >;
    /**
     * Filter which Challenges to update
     */
    where?: ChallengeWhereInput;
    /**
     * Limit how many Challenges to update.
     */
    limit?: number;
  };

  /**
   * Challenge updateManyAndReturn
   */
  export type ChallengeUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * The data used to update Challenges.
     */
    data: XOR<
      ChallengeUpdateManyMutationInput,
      ChallengeUncheckedUpdateManyInput
    >;
    /**
     * Filter which Challenges to update
     */
    where?: ChallengeWhereInput;
    /**
     * Limit how many Challenges to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Challenge upsert
   */
  export type ChallengeUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * The filter to search for the Challenge to update in case it exists.
     */
    where: ChallengeWhereUniqueInput;
    /**
     * In case the Challenge found by the `where` argument doesn't exist, create a new Challenge with this data.
     */
    create: XOR<ChallengeCreateInput, ChallengeUncheckedCreateInput>;
    /**
     * In case the Challenge was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChallengeUpdateInput, ChallengeUncheckedUpdateInput>;
  };

  /**
   * Challenge delete
   */
  export type ChallengeDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
    /**
     * Filter which Challenge to delete.
     */
    where: ChallengeWhereUniqueInput;
  };

  /**
   * Challenge deleteMany
   */
  export type ChallengeDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Challenges to delete
     */
    where?: ChallengeWhereInput;
    /**
     * Limit how many Challenges to delete.
     */
    limit?: number;
  };

  /**
   * Challenge without action
   */
  export type ChallengeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Challenge
     */
    select?: ChallengeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Challenge
     */
    omit?: ChallengeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeInclude<ExtArgs> | null;
  };

  /**
   * Model Nomination
   */

  export type AggregateNomination = {
    _count: NominationCountAggregateOutputType | null;
    _avg: NominationAvgAggregateOutputType | null;
    _sum: NominationSumAggregateOutputType | null;
    _min: NominationMinAggregateOutputType | null;
    _max: NominationMaxAggregateOutputType | null;
  };

  export type NominationAvgAggregateOutputType = {
    latitude: number | null;
    longitude: number | null;
  };

  export type NominationSumAggregateOutputType = {
    latitude: number | null;
    longitude: number | null;
  };

  export type NominationMinAggregateOutputType = {
    id: string | null;
    playerId: string | null;
    name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    contactInfo: string | null;
    status: string | null;
    verified: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type NominationMaxAggregateOutputType = {
    id: string | null;
    playerId: string | null;
    name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    contactInfo: string | null;
    status: string | null;
    verified: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type NominationCountAggregateOutputType = {
    id: number;
    playerId: number;
    name: number;
    address: number;
    latitude: number;
    longitude: number;
    description: number;
    contactInfo: number;
    status: number;
    verified: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type NominationAvgAggregateInputType = {
    latitude?: true;
    longitude?: true;
  };

  export type NominationSumAggregateInputType = {
    latitude?: true;
    longitude?: true;
  };

  export type NominationMinAggregateInputType = {
    id?: true;
    playerId?: true;
    name?: true;
    address?: true;
    latitude?: true;
    longitude?: true;
    description?: true;
    contactInfo?: true;
    status?: true;
    verified?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type NominationMaxAggregateInputType = {
    id?: true;
    playerId?: true;
    name?: true;
    address?: true;
    latitude?: true;
    longitude?: true;
    description?: true;
    contactInfo?: true;
    status?: true;
    verified?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type NominationCountAggregateInputType = {
    id?: true;
    playerId?: true;
    name?: true;
    address?: true;
    latitude?: true;
    longitude?: true;
    description?: true;
    contactInfo?: true;
    status?: true;
    verified?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type NominationAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Nomination to aggregate.
     */
    where?: NominationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Nominations to fetch.
     */
    orderBy?:
      | NominationOrderByWithRelationInput
      | NominationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: NominationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Nominations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Nominations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Nominations
     **/
    _count?: true | NominationCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: NominationAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: NominationSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: NominationMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: NominationMaxAggregateInputType;
  };

  export type GetNominationAggregateType<T extends NominationAggregateArgs> = {
    [P in keyof T & keyof AggregateNomination]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNomination[P]>
      : GetScalarType<T[P], AggregateNomination[P]>;
  };

  export type NominationGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: NominationWhereInput;
    orderBy?:
      | NominationOrderByWithAggregationInput
      | NominationOrderByWithAggregationInput[];
    by: NominationScalarFieldEnum[] | NominationScalarFieldEnum;
    having?: NominationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: NominationCountAggregateInputType | true;
    _avg?: NominationAvgAggregateInputType;
    _sum?: NominationSumAggregateInputType;
    _min?: NominationMinAggregateInputType;
    _max?: NominationMaxAggregateInputType;
  };

  export type NominationGroupByOutputType = {
    id: string;
    playerId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description: string | null;
    contactInfo: string | null;
    status: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: NominationCountAggregateOutputType | null;
    _avg: NominationAvgAggregateOutputType | null;
    _sum: NominationSumAggregateOutputType | null;
    _min: NominationMinAggregateOutputType | null;
    _max: NominationMaxAggregateOutputType | null;
  };

  type GetNominationGroupByPayload<T extends NominationGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<NominationGroupByOutputType, T['by']> & {
          [P in keyof T & keyof NominationGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NominationGroupByOutputType[P]>
            : GetScalarType<T[P], NominationGroupByOutputType[P]>;
        }
      >
    >;

  export type NominationSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playerId?: boolean;
      name?: boolean;
      address?: boolean;
      latitude?: boolean;
      longitude?: boolean;
      description?: boolean;
      contactInfo?: boolean;
      status?: boolean;
      verified?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      player?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['nomination']
  >;

  export type NominationSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playerId?: boolean;
      name?: boolean;
      address?: boolean;
      latitude?: boolean;
      longitude?: boolean;
      description?: boolean;
      contactInfo?: boolean;
      status?: boolean;
      verified?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      player?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['nomination']
  >;

  export type NominationSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playerId?: boolean;
      name?: boolean;
      address?: boolean;
      latitude?: boolean;
      longitude?: boolean;
      description?: boolean;
      contactInfo?: boolean;
      status?: boolean;
      verified?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      player?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['nomination']
  >;

  export type NominationSelectScalar = {
    id?: boolean;
    playerId?: boolean;
    name?: boolean;
    address?: boolean;
    latitude?: boolean;
    longitude?: boolean;
    description?: boolean;
    contactInfo?: boolean;
    status?: boolean;
    verified?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type NominationOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'playerId'
    | 'name'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'description'
    | 'contactInfo'
    | 'status'
    | 'verified'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['nomination']
  >;
  export type NominationInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    player?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type NominationIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    player?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type NominationIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    player?: boolean | UserDefaultArgs<ExtArgs>;
  };

  export type $NominationPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Nomination';
    objects: {
      player: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        playerId: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        description: string | null;
        contactInfo: string | null;
        status: string;
        verified: boolean;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['nomination']
    >;
    composites: {};
  };

  type NominationGetPayload<
    S extends boolean | null | undefined | NominationDefaultArgs,
  > = $Result.GetResult<Prisma.$NominationPayload, S>;

  type NominationCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    NominationFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: NominationCountAggregateInputType | true;
  };

  export interface NominationDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Nomination'];
      meta: { name: 'Nomination' };
    };
    /**
     * Find zero or one Nomination that matches the filter.
     * @param {NominationFindUniqueArgs} args - Arguments to find a Nomination
     * @example
     * // Get one Nomination
     * const nomination = await prisma.nomination.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NominationFindUniqueArgs>(
      args: SelectSubset<T, NominationFindUniqueArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Nomination that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NominationFindUniqueOrThrowArgs} args - Arguments to find a Nomination
     * @example
     * // Get one Nomination
     * const nomination = await prisma.nomination.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NominationFindUniqueOrThrowArgs>(
      args: SelectSubset<T, NominationFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Nomination that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationFindFirstArgs} args - Arguments to find a Nomination
     * @example
     * // Get one Nomination
     * const nomination = await prisma.nomination.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NominationFindFirstArgs>(
      args?: SelectSubset<T, NominationFindFirstArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Nomination that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationFindFirstOrThrowArgs} args - Arguments to find a Nomination
     * @example
     * // Get one Nomination
     * const nomination = await prisma.nomination.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NominationFindFirstOrThrowArgs>(
      args?: SelectSubset<T, NominationFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Nominations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Nominations
     * const nominations = await prisma.nomination.findMany()
     *
     * // Get first 10 Nominations
     * const nominations = await prisma.nomination.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const nominationWithIdOnly = await prisma.nomination.findMany({ select: { id: true } })
     *
     */
    findMany<T extends NominationFindManyArgs>(
      args?: SelectSubset<T, NominationFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Nomination.
     * @param {NominationCreateArgs} args - Arguments to create a Nomination.
     * @example
     * // Create one Nomination
     * const Nomination = await prisma.nomination.create({
     *   data: {
     *     // ... data to create a Nomination
     *   }
     * })
     *
     */
    create<T extends NominationCreateArgs>(
      args: SelectSubset<T, NominationCreateArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Nominations.
     * @param {NominationCreateManyArgs} args - Arguments to create many Nominations.
     * @example
     * // Create many Nominations
     * const nomination = await prisma.nomination.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends NominationCreateManyArgs>(
      args?: SelectSubset<T, NominationCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Nominations and returns the data saved in the database.
     * @param {NominationCreateManyAndReturnArgs} args - Arguments to create many Nominations.
     * @example
     * // Create many Nominations
     * const nomination = await prisma.nomination.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Nominations and only return the `id`
     * const nominationWithIdOnly = await prisma.nomination.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends NominationCreateManyAndReturnArgs>(
      args?: SelectSubset<T, NominationCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Nomination.
     * @param {NominationDeleteArgs} args - Arguments to delete one Nomination.
     * @example
     * // Delete one Nomination
     * const Nomination = await prisma.nomination.delete({
     *   where: {
     *     // ... filter to delete one Nomination
     *   }
     * })
     *
     */
    delete<T extends NominationDeleteArgs>(
      args: SelectSubset<T, NominationDeleteArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Nomination.
     * @param {NominationUpdateArgs} args - Arguments to update one Nomination.
     * @example
     * // Update one Nomination
     * const nomination = await prisma.nomination.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends NominationUpdateArgs>(
      args: SelectSubset<T, NominationUpdateArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Nominations.
     * @param {NominationDeleteManyArgs} args - Arguments to filter Nominations to delete.
     * @example
     * // Delete a few Nominations
     * const { count } = await prisma.nomination.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends NominationDeleteManyArgs>(
      args?: SelectSubset<T, NominationDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Nominations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Nominations
     * const nomination = await prisma.nomination.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends NominationUpdateManyArgs>(
      args: SelectSubset<T, NominationUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Nominations and returns the data updated in the database.
     * @param {NominationUpdateManyAndReturnArgs} args - Arguments to update many Nominations.
     * @example
     * // Update many Nominations
     * const nomination = await prisma.nomination.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Nominations and only return the `id`
     * const nominationWithIdOnly = await prisma.nomination.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends NominationUpdateManyAndReturnArgs>(
      args: SelectSubset<T, NominationUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Nomination.
     * @param {NominationUpsertArgs} args - Arguments to update or create a Nomination.
     * @example
     * // Update or create a Nomination
     * const nomination = await prisma.nomination.upsert({
     *   create: {
     *     // ... data to create a Nomination
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Nomination we want to update
     *   }
     * })
     */
    upsert<T extends NominationUpsertArgs>(
      args: SelectSubset<T, NominationUpsertArgs<ExtArgs>>
    ): Prisma__NominationClient<
      $Result.GetResult<
        Prisma.$NominationPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Nominations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationCountArgs} args - Arguments to filter Nominations to count.
     * @example
     * // Count the number of Nominations
     * const count = await prisma.nomination.count({
     *   where: {
     *     // ... the filter for the Nominations we want to count
     *   }
     * })
     **/
    count<T extends NominationCountArgs>(
      args?: Subset<T, NominationCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NominationCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Nomination.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends NominationAggregateArgs>(
      args: Subset<T, NominationAggregateArgs>
    ): Prisma.PrismaPromise<GetNominationAggregateType<T>>;

    /**
     * Group by Nomination.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NominationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends NominationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NominationGroupByArgs['orderBy'] }
        : { orderBy?: NominationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, NominationGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetNominationGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Nomination model
     */
    readonly fields: NominationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Nomination.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NominationClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    player<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Nomination model
   */
  interface NominationFieldRefs {
    readonly id: FieldRef<'Nomination', 'String'>;
    readonly playerId: FieldRef<'Nomination', 'String'>;
    readonly name: FieldRef<'Nomination', 'String'>;
    readonly address: FieldRef<'Nomination', 'String'>;
    readonly latitude: FieldRef<'Nomination', 'Float'>;
    readonly longitude: FieldRef<'Nomination', 'Float'>;
    readonly description: FieldRef<'Nomination', 'String'>;
    readonly contactInfo: FieldRef<'Nomination', 'String'>;
    readonly status: FieldRef<'Nomination', 'String'>;
    readonly verified: FieldRef<'Nomination', 'Boolean'>;
    readonly createdAt: FieldRef<'Nomination', 'DateTime'>;
    readonly updatedAt: FieldRef<'Nomination', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Nomination findUnique
   */
  export type NominationFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter, which Nomination to fetch.
     */
    where: NominationWhereUniqueInput;
  };

  /**
   * Nomination findUniqueOrThrow
   */
  export type NominationFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter, which Nomination to fetch.
     */
    where: NominationWhereUniqueInput;
  };

  /**
   * Nomination findFirst
   */
  export type NominationFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter, which Nomination to fetch.
     */
    where?: NominationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Nominations to fetch.
     */
    orderBy?:
      | NominationOrderByWithRelationInput
      | NominationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Nominations.
     */
    cursor?: NominationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Nominations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Nominations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Nominations.
     */
    distinct?: NominationScalarFieldEnum | NominationScalarFieldEnum[];
  };

  /**
   * Nomination findFirstOrThrow
   */
  export type NominationFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter, which Nomination to fetch.
     */
    where?: NominationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Nominations to fetch.
     */
    orderBy?:
      | NominationOrderByWithRelationInput
      | NominationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Nominations.
     */
    cursor?: NominationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Nominations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Nominations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Nominations.
     */
    distinct?: NominationScalarFieldEnum | NominationScalarFieldEnum[];
  };

  /**
   * Nomination findMany
   */
  export type NominationFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter, which Nominations to fetch.
     */
    where?: NominationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Nominations to fetch.
     */
    orderBy?:
      | NominationOrderByWithRelationInput
      | NominationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Nominations.
     */
    cursor?: NominationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Nominations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Nominations.
     */
    skip?: number;
    distinct?: NominationScalarFieldEnum | NominationScalarFieldEnum[];
  };

  /**
   * Nomination create
   */
  export type NominationCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * The data needed to create a Nomination.
     */
    data: XOR<NominationCreateInput, NominationUncheckedCreateInput>;
  };

  /**
   * Nomination createMany
   */
  export type NominationCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Nominations.
     */
    data: NominationCreateManyInput | NominationCreateManyInput[];
  };

  /**
   * Nomination createManyAndReturn
   */
  export type NominationCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * The data used to create many Nominations.
     */
    data: NominationCreateManyInput | NominationCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Nomination update
   */
  export type NominationUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * The data needed to update a Nomination.
     */
    data: XOR<NominationUpdateInput, NominationUncheckedUpdateInput>;
    /**
     * Choose, which Nomination to update.
     */
    where: NominationWhereUniqueInput;
  };

  /**
   * Nomination updateMany
   */
  export type NominationUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Nominations.
     */
    data: XOR<
      NominationUpdateManyMutationInput,
      NominationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Nominations to update
     */
    where?: NominationWhereInput;
    /**
     * Limit how many Nominations to update.
     */
    limit?: number;
  };

  /**
   * Nomination updateManyAndReturn
   */
  export type NominationUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * The data used to update Nominations.
     */
    data: XOR<
      NominationUpdateManyMutationInput,
      NominationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Nominations to update
     */
    where?: NominationWhereInput;
    /**
     * Limit how many Nominations to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Nomination upsert
   */
  export type NominationUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * The filter to search for the Nomination to update in case it exists.
     */
    where: NominationWhereUniqueInput;
    /**
     * In case the Nomination found by the `where` argument doesn't exist, create a new Nomination with this data.
     */
    create: XOR<NominationCreateInput, NominationUncheckedCreateInput>;
    /**
     * In case the Nomination was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NominationUpdateInput, NominationUncheckedUpdateInput>;
  };

  /**
   * Nomination delete
   */
  export type NominationDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
    /**
     * Filter which Nomination to delete.
     */
    where: NominationWhereUniqueInput;
  };

  /**
   * Nomination deleteMany
   */
  export type NominationDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Nominations to delete
     */
    where?: NominationWhereInput;
    /**
     * Limit how many Nominations to delete.
     */
    limit?: number;
  };

  /**
   * Nomination without action
   */
  export type NominationDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Nomination
     */
    select?: NominationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Nomination
     */
    omit?: NominationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NominationInclude<ExtArgs> | null;
  };

  /**
   * Model Clan
   */

  export type AggregateClan = {
    _count: ClanCountAggregateOutputType | null;
    _avg: ClanAvgAggregateOutputType | null;
    _sum: ClanSumAggregateOutputType | null;
    _min: ClanMinAggregateOutputType | null;
    _max: ClanMaxAggregateOutputType | null;
  };

  export type ClanAvgAggregateOutputType = {
    memberCount: number | null;
    maxMembers: number | null;
    level: number | null;
    experience: number | null;
    territoryCount: number | null;
    totalWins: number | null;
    totalLosses: number | null;
  };

  export type ClanSumAggregateOutputType = {
    memberCount: number | null;
    maxMembers: number | null;
    level: number | null;
    experience: number | null;
    territoryCount: number | null;
    totalWins: number | null;
    totalLosses: number | null;
  };

  export type ClanMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    tag: string | null;
    description: string | null;
    avatar: string | null;
    banner: string | null;
    leaderId: string | null;
    memberCount: number | null;
    maxMembers: number | null;
    level: number | null;
    experience: number | null;
    territoryCount: number | null;
    totalWins: number | null;
    totalLosses: number | null;
    isPublic: boolean | null;
    requirements: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    tag: string | null;
    description: string | null;
    avatar: string | null;
    banner: string | null;
    leaderId: string | null;
    memberCount: number | null;
    maxMembers: number | null;
    level: number | null;
    experience: number | null;
    territoryCount: number | null;
    totalWins: number | null;
    totalLosses: number | null;
    isPublic: boolean | null;
    requirements: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanCountAggregateOutputType = {
    id: number;
    name: number;
    tag: number;
    description: number;
    avatar: number;
    banner: number;
    leaderId: number;
    memberCount: number;
    maxMembers: number;
    level: number;
    experience: number;
    territoryCount: number;
    totalWins: number;
    totalLosses: number;
    isPublic: number;
    requirements: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type ClanAvgAggregateInputType = {
    memberCount?: true;
    maxMembers?: true;
    level?: true;
    experience?: true;
    territoryCount?: true;
    totalWins?: true;
    totalLosses?: true;
  };

  export type ClanSumAggregateInputType = {
    memberCount?: true;
    maxMembers?: true;
    level?: true;
    experience?: true;
    territoryCount?: true;
    totalWins?: true;
    totalLosses?: true;
  };

  export type ClanMinAggregateInputType = {
    id?: true;
    name?: true;
    tag?: true;
    description?: true;
    avatar?: true;
    banner?: true;
    leaderId?: true;
    memberCount?: true;
    maxMembers?: true;
    level?: true;
    experience?: true;
    territoryCount?: true;
    totalWins?: true;
    totalLosses?: true;
    isPublic?: true;
    requirements?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ClanMaxAggregateInputType = {
    id?: true;
    name?: true;
    tag?: true;
    description?: true;
    avatar?: true;
    banner?: true;
    leaderId?: true;
    memberCount?: true;
    maxMembers?: true;
    level?: true;
    experience?: true;
    territoryCount?: true;
    totalWins?: true;
    totalLosses?: true;
    isPublic?: true;
    requirements?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ClanCountAggregateInputType = {
    id?: true;
    name?: true;
    tag?: true;
    description?: true;
    avatar?: true;
    banner?: true;
    leaderId?: true;
    memberCount?: true;
    maxMembers?: true;
    level?: true;
    experience?: true;
    territoryCount?: true;
    totalWins?: true;
    totalLosses?: true;
    isPublic?: true;
    requirements?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type ClanAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Clan to aggregate.
     */
    where?: ClanWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Clans to fetch.
     */
    orderBy?: ClanOrderByWithRelationInput | ClanOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ClanWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Clans from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Clans.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Clans
     **/
    _count?: true | ClanCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ClanAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ClanSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ClanMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ClanMaxAggregateInputType;
  };

  export type GetClanAggregateType<T extends ClanAggregateArgs> = {
    [P in keyof T & keyof AggregateClan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClan[P]>
      : GetScalarType<T[P], AggregateClan[P]>;
  };

  export type ClanGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWhereInput;
    orderBy?:
      | ClanOrderByWithAggregationInput
      | ClanOrderByWithAggregationInput[];
    by: ClanScalarFieldEnum[] | ClanScalarFieldEnum;
    having?: ClanScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ClanCountAggregateInputType | true;
    _avg?: ClanAvgAggregateInputType;
    _sum?: ClanSumAggregateInputType;
    _min?: ClanMinAggregateInputType;
    _max?: ClanMaxAggregateInputType;
  };

  export type ClanGroupByOutputType = {
    id: string;
    name: string;
    tag: string;
    description: string | null;
    avatar: string | null;
    banner: string | null;
    leaderId: string;
    memberCount: number;
    maxMembers: number;
    level: number;
    experience: number;
    territoryCount: number;
    totalWins: number;
    totalLosses: number;
    isPublic: boolean;
    requirements: string;
    createdAt: Date;
    updatedAt: Date;
    _count: ClanCountAggregateOutputType | null;
    _avg: ClanAvgAggregateOutputType | null;
    _sum: ClanSumAggregateOutputType | null;
    _min: ClanMinAggregateOutputType | null;
    _max: ClanMaxAggregateOutputType | null;
  };

  type GetClanGroupByPayload<T extends ClanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ClanGroupByOutputType, T['by']> & {
        [P in keyof T & keyof ClanGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], ClanGroupByOutputType[P]>
          : GetScalarType<T[P], ClanGroupByOutputType[P]>;
      }
    >
  >;

  export type ClanSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      tag?: boolean;
      description?: boolean;
      avatar?: boolean;
      banner?: boolean;
      leaderId?: boolean;
      memberCount?: boolean;
      maxMembers?: boolean;
      level?: boolean;
      experience?: boolean;
      territoryCount?: boolean;
      totalWins?: boolean;
      totalLosses?: boolean;
      isPublic?: boolean;
      requirements?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      leader?: boolean | UserDefaultArgs<ExtArgs>;
      members?: boolean | Clan$membersArgs<ExtArgs>;
      controlledDojos?: boolean | Clan$controlledDojosArgs<ExtArgs>;
      warsAsClan1?: boolean | Clan$warsAsClan1Args<ExtArgs>;
      warsAsClan2?: boolean | Clan$warsAsClan2Args<ExtArgs>;
      wonWars?: boolean | Clan$wonWarsArgs<ExtArgs>;
      _count?: boolean | ClanCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clan']
  >;

  export type ClanSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      tag?: boolean;
      description?: boolean;
      avatar?: boolean;
      banner?: boolean;
      leaderId?: boolean;
      memberCount?: boolean;
      maxMembers?: boolean;
      level?: boolean;
      experience?: boolean;
      territoryCount?: boolean;
      totalWins?: boolean;
      totalLosses?: boolean;
      isPublic?: boolean;
      requirements?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      leader?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clan']
  >;

  export type ClanSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      tag?: boolean;
      description?: boolean;
      avatar?: boolean;
      banner?: boolean;
      leaderId?: boolean;
      memberCount?: boolean;
      maxMembers?: boolean;
      level?: boolean;
      experience?: boolean;
      territoryCount?: boolean;
      totalWins?: boolean;
      totalLosses?: boolean;
      isPublic?: boolean;
      requirements?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      leader?: boolean | UserDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clan']
  >;

  export type ClanSelectScalar = {
    id?: boolean;
    name?: boolean;
    tag?: boolean;
    description?: boolean;
    avatar?: boolean;
    banner?: boolean;
    leaderId?: boolean;
    memberCount?: boolean;
    maxMembers?: boolean;
    level?: boolean;
    experience?: boolean;
    territoryCount?: boolean;
    totalWins?: boolean;
    totalLosses?: boolean;
    isPublic?: boolean;
    requirements?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type ClanOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'name'
    | 'tag'
    | 'description'
    | 'avatar'
    | 'banner'
    | 'leaderId'
    | 'memberCount'
    | 'maxMembers'
    | 'level'
    | 'experience'
    | 'territoryCount'
    | 'totalWins'
    | 'totalLosses'
    | 'isPublic'
    | 'requirements'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['clan']
  >;
  export type ClanInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    leader?: boolean | UserDefaultArgs<ExtArgs>;
    members?: boolean | Clan$membersArgs<ExtArgs>;
    controlledDojos?: boolean | Clan$controlledDojosArgs<ExtArgs>;
    warsAsClan1?: boolean | Clan$warsAsClan1Args<ExtArgs>;
    warsAsClan2?: boolean | Clan$warsAsClan2Args<ExtArgs>;
    wonWars?: boolean | Clan$wonWarsArgs<ExtArgs>;
    _count?: boolean | ClanCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type ClanIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    leader?: boolean | UserDefaultArgs<ExtArgs>;
  };
  export type ClanIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    leader?: boolean | UserDefaultArgs<ExtArgs>;
  };

  export type $ClanPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Clan';
    objects: {
      leader: Prisma.$UserPayload<ExtArgs>;
      members: Prisma.$ClanMemberPayload<ExtArgs>[];
      controlledDojos: Prisma.$TerritoryPayload<ExtArgs>[];
      warsAsClan1: Prisma.$ClanWarPayload<ExtArgs>[];
      warsAsClan2: Prisma.$ClanWarPayload<ExtArgs>[];
      wonWars: Prisma.$ClanWarPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        name: string;
        tag: string;
        description: string | null;
        avatar: string | null;
        banner: string | null;
        leaderId: string;
        memberCount: number;
        maxMembers: number;
        level: number;
        experience: number;
        territoryCount: number;
        totalWins: number;
        totalLosses: number;
        isPublic: boolean;
        requirements: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['clan']
    >;
    composites: {};
  };

  type ClanGetPayload<S extends boolean | null | undefined | ClanDefaultArgs> =
    $Result.GetResult<Prisma.$ClanPayload, S>;

  type ClanCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<ClanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ClanCountAggregateInputType | true;
  };

  export interface ClanDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Clan'];
      meta: { name: 'Clan' };
    };
    /**
     * Find zero or one Clan that matches the filter.
     * @param {ClanFindUniqueArgs} args - Arguments to find a Clan
     * @example
     * // Get one Clan
     * const clan = await prisma.clan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClanFindUniqueArgs>(
      args: SelectSubset<T, ClanFindUniqueArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Clan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClanFindUniqueOrThrowArgs} args - Arguments to find a Clan
     * @example
     * // Get one Clan
     * const clan = await prisma.clan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClanFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ClanFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Clan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanFindFirstArgs} args - Arguments to find a Clan
     * @example
     * // Get one Clan
     * const clan = await prisma.clan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClanFindFirstArgs>(
      args?: SelectSubset<T, ClanFindFirstArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Clan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanFindFirstOrThrowArgs} args - Arguments to find a Clan
     * @example
     * // Get one Clan
     * const clan = await prisma.clan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClanFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ClanFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Clans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Clans
     * const clans = await prisma.clan.findMany()
     *
     * // Get first 10 Clans
     * const clans = await prisma.clan.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const clanWithIdOnly = await prisma.clan.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ClanFindManyArgs>(
      args?: SelectSubset<T, ClanFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Clan.
     * @param {ClanCreateArgs} args - Arguments to create a Clan.
     * @example
     * // Create one Clan
     * const Clan = await prisma.clan.create({
     *   data: {
     *     // ... data to create a Clan
     *   }
     * })
     *
     */
    create<T extends ClanCreateArgs>(
      args: SelectSubset<T, ClanCreateArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Clans.
     * @param {ClanCreateManyArgs} args - Arguments to create many Clans.
     * @example
     * // Create many Clans
     * const clan = await prisma.clan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ClanCreateManyArgs>(
      args?: SelectSubset<T, ClanCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Clans and returns the data saved in the database.
     * @param {ClanCreateManyAndReturnArgs} args - Arguments to create many Clans.
     * @example
     * // Create many Clans
     * const clan = await prisma.clan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Clans and only return the `id`
     * const clanWithIdOnly = await prisma.clan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ClanCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ClanCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Clan.
     * @param {ClanDeleteArgs} args - Arguments to delete one Clan.
     * @example
     * // Delete one Clan
     * const Clan = await prisma.clan.delete({
     *   where: {
     *     // ... filter to delete one Clan
     *   }
     * })
     *
     */
    delete<T extends ClanDeleteArgs>(
      args: SelectSubset<T, ClanDeleteArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Clan.
     * @param {ClanUpdateArgs} args - Arguments to update one Clan.
     * @example
     * // Update one Clan
     * const clan = await prisma.clan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ClanUpdateArgs>(
      args: SelectSubset<T, ClanUpdateArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Clans.
     * @param {ClanDeleteManyArgs} args - Arguments to filter Clans to delete.
     * @example
     * // Delete a few Clans
     * const { count } = await prisma.clan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ClanDeleteManyArgs>(
      args?: SelectSubset<T, ClanDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Clans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Clans
     * const clan = await prisma.clan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ClanUpdateManyArgs>(
      args: SelectSubset<T, ClanUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Clans and returns the data updated in the database.
     * @param {ClanUpdateManyAndReturnArgs} args - Arguments to update many Clans.
     * @example
     * // Update many Clans
     * const clan = await prisma.clan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Clans and only return the `id`
     * const clanWithIdOnly = await prisma.clan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ClanUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ClanUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Clan.
     * @param {ClanUpsertArgs} args - Arguments to update or create a Clan.
     * @example
     * // Update or create a Clan
     * const clan = await prisma.clan.upsert({
     *   create: {
     *     // ... data to create a Clan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Clan we want to update
     *   }
     * })
     */
    upsert<T extends ClanUpsertArgs>(
      args: SelectSubset<T, ClanUpsertArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Clans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanCountArgs} args - Arguments to filter Clans to count.
     * @example
     * // Count the number of Clans
     * const count = await prisma.clan.count({
     *   where: {
     *     // ... the filter for the Clans we want to count
     *   }
     * })
     **/
    count<T extends ClanCountArgs>(
      args?: Subset<T, ClanCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClanCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Clan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ClanAggregateArgs>(
      args: Subset<T, ClanAggregateArgs>
    ): Prisma.PrismaPromise<GetClanAggregateType<T>>;

    /**
     * Group by Clan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ClanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClanGroupByArgs['orderBy'] }
        : { orderBy?: ClanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ClanGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors
      ? GetClanGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Clan model
     */
    readonly fields: ClanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Clan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClanClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    leader<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    members<T extends Clan$membersArgs<ExtArgs> = {}>(
      args?: Subset<T, Clan$membersArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanMemberPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    controlledDojos<T extends Clan$controlledDojosArgs<ExtArgs> = {}>(
      args?: Subset<T, Clan$controlledDojosArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$TerritoryPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    warsAsClan1<T extends Clan$warsAsClan1Args<ExtArgs> = {}>(
      args?: Subset<T, Clan$warsAsClan1Args<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanWarPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    warsAsClan2<T extends Clan$warsAsClan2Args<ExtArgs> = {}>(
      args?: Subset<T, Clan$warsAsClan2Args<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanWarPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    wonWars<T extends Clan$wonWarsArgs<ExtArgs> = {}>(
      args?: Subset<T, Clan$wonWarsArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ClanWarPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Clan model
   */
  interface ClanFieldRefs {
    readonly id: FieldRef<'Clan', 'String'>;
    readonly name: FieldRef<'Clan', 'String'>;
    readonly tag: FieldRef<'Clan', 'String'>;
    readonly description: FieldRef<'Clan', 'String'>;
    readonly avatar: FieldRef<'Clan', 'String'>;
    readonly banner: FieldRef<'Clan', 'String'>;
    readonly leaderId: FieldRef<'Clan', 'String'>;
    readonly memberCount: FieldRef<'Clan', 'Int'>;
    readonly maxMembers: FieldRef<'Clan', 'Int'>;
    readonly level: FieldRef<'Clan', 'Int'>;
    readonly experience: FieldRef<'Clan', 'Int'>;
    readonly territoryCount: FieldRef<'Clan', 'Int'>;
    readonly totalWins: FieldRef<'Clan', 'Int'>;
    readonly totalLosses: FieldRef<'Clan', 'Int'>;
    readonly isPublic: FieldRef<'Clan', 'Boolean'>;
    readonly requirements: FieldRef<'Clan', 'String'>;
    readonly createdAt: FieldRef<'Clan', 'DateTime'>;
    readonly updatedAt: FieldRef<'Clan', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Clan findUnique
   */
  export type ClanFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter, which Clan to fetch.
     */
    where: ClanWhereUniqueInput;
  };

  /**
   * Clan findUniqueOrThrow
   */
  export type ClanFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter, which Clan to fetch.
     */
    where: ClanWhereUniqueInput;
  };

  /**
   * Clan findFirst
   */
  export type ClanFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter, which Clan to fetch.
     */
    where?: ClanWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Clans to fetch.
     */
    orderBy?: ClanOrderByWithRelationInput | ClanOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Clans.
     */
    cursor?: ClanWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Clans from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Clans.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Clans.
     */
    distinct?: ClanScalarFieldEnum | ClanScalarFieldEnum[];
  };

  /**
   * Clan findFirstOrThrow
   */
  export type ClanFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter, which Clan to fetch.
     */
    where?: ClanWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Clans to fetch.
     */
    orderBy?: ClanOrderByWithRelationInput | ClanOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Clans.
     */
    cursor?: ClanWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Clans from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Clans.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Clans.
     */
    distinct?: ClanScalarFieldEnum | ClanScalarFieldEnum[];
  };

  /**
   * Clan findMany
   */
  export type ClanFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter, which Clans to fetch.
     */
    where?: ClanWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Clans to fetch.
     */
    orderBy?: ClanOrderByWithRelationInput | ClanOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Clans.
     */
    cursor?: ClanWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Clans from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Clans.
     */
    skip?: number;
    distinct?: ClanScalarFieldEnum | ClanScalarFieldEnum[];
  };

  /**
   * Clan create
   */
  export type ClanCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * The data needed to create a Clan.
     */
    data: XOR<ClanCreateInput, ClanUncheckedCreateInput>;
  };

  /**
   * Clan createMany
   */
  export type ClanCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Clans.
     */
    data: ClanCreateManyInput | ClanCreateManyInput[];
  };

  /**
   * Clan createManyAndReturn
   */
  export type ClanCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * The data used to create many Clans.
     */
    data: ClanCreateManyInput | ClanCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Clan update
   */
  export type ClanUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * The data needed to update a Clan.
     */
    data: XOR<ClanUpdateInput, ClanUncheckedUpdateInput>;
    /**
     * Choose, which Clan to update.
     */
    where: ClanWhereUniqueInput;
  };

  /**
   * Clan updateMany
   */
  export type ClanUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Clans.
     */
    data: XOR<ClanUpdateManyMutationInput, ClanUncheckedUpdateManyInput>;
    /**
     * Filter which Clans to update
     */
    where?: ClanWhereInput;
    /**
     * Limit how many Clans to update.
     */
    limit?: number;
  };

  /**
   * Clan updateManyAndReturn
   */
  export type ClanUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * The data used to update Clans.
     */
    data: XOR<ClanUpdateManyMutationInput, ClanUncheckedUpdateManyInput>;
    /**
     * Filter which Clans to update
     */
    where?: ClanWhereInput;
    /**
     * Limit how many Clans to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Clan upsert
   */
  export type ClanUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * The filter to search for the Clan to update in case it exists.
     */
    where: ClanWhereUniqueInput;
    /**
     * In case the Clan found by the `where` argument doesn't exist, create a new Clan with this data.
     */
    create: XOR<ClanCreateInput, ClanUncheckedCreateInput>;
    /**
     * In case the Clan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClanUpdateInput, ClanUncheckedUpdateInput>;
  };

  /**
   * Clan delete
   */
  export type ClanDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    /**
     * Filter which Clan to delete.
     */
    where: ClanWhereUniqueInput;
  };

  /**
   * Clan deleteMany
   */
  export type ClanDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Clans to delete
     */
    where?: ClanWhereInput;
    /**
     * Limit how many Clans to delete.
     */
    limit?: number;
  };

  /**
   * Clan.members
   */
  export type Clan$membersArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    where?: ClanMemberWhereInput;
    orderBy?:
      | ClanMemberOrderByWithRelationInput
      | ClanMemberOrderByWithRelationInput[];
    cursor?: ClanMemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanMemberScalarFieldEnum | ClanMemberScalarFieldEnum[];
  };

  /**
   * Clan.controlledDojos
   */
  export type Clan$controlledDojosArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    where?: TerritoryWhereInput;
    orderBy?:
      | TerritoryOrderByWithRelationInput
      | TerritoryOrderByWithRelationInput[];
    cursor?: TerritoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: TerritoryScalarFieldEnum | TerritoryScalarFieldEnum[];
  };

  /**
   * Clan.warsAsClan1
   */
  export type Clan$warsAsClan1Args<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    where?: ClanWarWhereInput;
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    cursor?: ClanWarWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * Clan.warsAsClan2
   */
  export type Clan$warsAsClan2Args<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    where?: ClanWarWhereInput;
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    cursor?: ClanWarWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * Clan.wonWars
   */
  export type Clan$wonWarsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    where?: ClanWarWhereInput;
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    cursor?: ClanWarWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * Clan without action
   */
  export type ClanDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
  };

  /**
   * Model ClanMember
   */

  export type AggregateClanMember = {
    _count: ClanMemberCountAggregateOutputType | null;
    _avg: ClanMemberAvgAggregateOutputType | null;
    _sum: ClanMemberSumAggregateOutputType | null;
    _min: ClanMemberMinAggregateOutputType | null;
    _max: ClanMemberMaxAggregateOutputType | null;
  };

  export type ClanMemberAvgAggregateOutputType = {
    contribution: number | null;
    territoryCount: number | null;
    matchWins: number | null;
  };

  export type ClanMemberSumAggregateOutputType = {
    contribution: number | null;
    territoryCount: number | null;
    matchWins: number | null;
  };

  export type ClanMemberMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    clanId: string | null;
    role: string | null;
    contribution: number | null;
    territoryCount: number | null;
    matchWins: number | null;
    joinedAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanMemberMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    clanId: string | null;
    role: string | null;
    contribution: number | null;
    territoryCount: number | null;
    matchWins: number | null;
    joinedAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanMemberCountAggregateOutputType = {
    id: number;
    userId: number;
    clanId: number;
    role: number;
    contribution: number;
    territoryCount: number;
    matchWins: number;
    joinedAt: number;
    updatedAt: number;
    _all: number;
  };

  export type ClanMemberAvgAggregateInputType = {
    contribution?: true;
    territoryCount?: true;
    matchWins?: true;
  };

  export type ClanMemberSumAggregateInputType = {
    contribution?: true;
    territoryCount?: true;
    matchWins?: true;
  };

  export type ClanMemberMinAggregateInputType = {
    id?: true;
    userId?: true;
    clanId?: true;
    role?: true;
    contribution?: true;
    territoryCount?: true;
    matchWins?: true;
    joinedAt?: true;
    updatedAt?: true;
  };

  export type ClanMemberMaxAggregateInputType = {
    id?: true;
    userId?: true;
    clanId?: true;
    role?: true;
    contribution?: true;
    territoryCount?: true;
    matchWins?: true;
    joinedAt?: true;
    updatedAt?: true;
  };

  export type ClanMemberCountAggregateInputType = {
    id?: true;
    userId?: true;
    clanId?: true;
    role?: true;
    contribution?: true;
    territoryCount?: true;
    matchWins?: true;
    joinedAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type ClanMemberAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ClanMember to aggregate.
     */
    where?: ClanMemberWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanMembers to fetch.
     */
    orderBy?:
      | ClanMemberOrderByWithRelationInput
      | ClanMemberOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ClanMemberWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanMembers from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanMembers.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ClanMembers
     **/
    _count?: true | ClanMemberCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ClanMemberAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ClanMemberSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ClanMemberMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ClanMemberMaxAggregateInputType;
  };

  export type GetClanMemberAggregateType<T extends ClanMemberAggregateArgs> = {
    [P in keyof T & keyof AggregateClanMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClanMember[P]>
      : GetScalarType<T[P], AggregateClanMember[P]>;
  };

  export type ClanMemberGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanMemberWhereInput;
    orderBy?:
      | ClanMemberOrderByWithAggregationInput
      | ClanMemberOrderByWithAggregationInput[];
    by: ClanMemberScalarFieldEnum[] | ClanMemberScalarFieldEnum;
    having?: ClanMemberScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ClanMemberCountAggregateInputType | true;
    _avg?: ClanMemberAvgAggregateInputType;
    _sum?: ClanMemberSumAggregateInputType;
    _min?: ClanMemberMinAggregateInputType;
    _max?: ClanMemberMaxAggregateInputType;
  };

  export type ClanMemberGroupByOutputType = {
    id: string;
    userId: string;
    clanId: string;
    role: string;
    contribution: number;
    territoryCount: number;
    matchWins: number;
    joinedAt: Date;
    updatedAt: Date;
    _count: ClanMemberCountAggregateOutputType | null;
    _avg: ClanMemberAvgAggregateOutputType | null;
    _sum: ClanMemberSumAggregateOutputType | null;
    _min: ClanMemberMinAggregateOutputType | null;
    _max: ClanMemberMaxAggregateOutputType | null;
  };

  type GetClanMemberGroupByPayload<T extends ClanMemberGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ClanMemberGroupByOutputType, T['by']> & {
          [P in keyof T & keyof ClanMemberGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClanMemberGroupByOutputType[P]>
            : GetScalarType<T[P], ClanMemberGroupByOutputType[P]>;
        }
      >
    >;

  export type ClanMemberSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      clanId?: boolean;
      role?: boolean;
      contribution?: boolean;
      territoryCount?: boolean;
      matchWins?: boolean;
      joinedAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      clan?: boolean | ClanDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clanMember']
  >;

  export type ClanMemberSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      clanId?: boolean;
      role?: boolean;
      contribution?: boolean;
      territoryCount?: boolean;
      matchWins?: boolean;
      joinedAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      clan?: boolean | ClanDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clanMember']
  >;

  export type ClanMemberSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      userId?: boolean;
      clanId?: boolean;
      role?: boolean;
      contribution?: boolean;
      territoryCount?: boolean;
      matchWins?: boolean;
      joinedAt?: boolean;
      updatedAt?: boolean;
      user?: boolean | UserDefaultArgs<ExtArgs>;
      clan?: boolean | ClanDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['clanMember']
  >;

  export type ClanMemberSelectScalar = {
    id?: boolean;
    userId?: boolean;
    clanId?: boolean;
    role?: boolean;
    contribution?: boolean;
    territoryCount?: boolean;
    matchWins?: boolean;
    joinedAt?: boolean;
    updatedAt?: boolean;
  };

  export type ClanMemberOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'userId'
    | 'clanId'
    | 'role'
    | 'contribution'
    | 'territoryCount'
    | 'matchWins'
    | 'joinedAt'
    | 'updatedAt',
    ExtArgs['result']['clanMember']
  >;
  export type ClanMemberInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    clan?: boolean | ClanDefaultArgs<ExtArgs>;
  };
  export type ClanMemberIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    clan?: boolean | ClanDefaultArgs<ExtArgs>;
  };
  export type ClanMemberIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>;
    clan?: boolean | ClanDefaultArgs<ExtArgs>;
  };

  export type $ClanMemberPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'ClanMember';
    objects: {
      user: Prisma.$UserPayload<ExtArgs>;
      clan: Prisma.$ClanPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        userId: string;
        clanId: string;
        role: string;
        contribution: number;
        territoryCount: number;
        matchWins: number;
        joinedAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['clanMember']
    >;
    composites: {};
  };

  type ClanMemberGetPayload<
    S extends boolean | null | undefined | ClanMemberDefaultArgs,
  > = $Result.GetResult<Prisma.$ClanMemberPayload, S>;

  type ClanMemberCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    ClanMemberFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: ClanMemberCountAggregateInputType | true;
  };

  export interface ClanMemberDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['ClanMember'];
      meta: { name: 'ClanMember' };
    };
    /**
     * Find zero or one ClanMember that matches the filter.
     * @param {ClanMemberFindUniqueArgs} args - Arguments to find a ClanMember
     * @example
     * // Get one ClanMember
     * const clanMember = await prisma.clanMember.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClanMemberFindUniqueArgs>(
      args: SelectSubset<T, ClanMemberFindUniqueArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one ClanMember that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClanMemberFindUniqueOrThrowArgs} args - Arguments to find a ClanMember
     * @example
     * // Get one ClanMember
     * const clanMember = await prisma.clanMember.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClanMemberFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ClanMemberFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ClanMember that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberFindFirstArgs} args - Arguments to find a ClanMember
     * @example
     * // Get one ClanMember
     * const clanMember = await prisma.clanMember.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClanMemberFindFirstArgs>(
      args?: SelectSubset<T, ClanMemberFindFirstArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ClanMember that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberFindFirstOrThrowArgs} args - Arguments to find a ClanMember
     * @example
     * // Get one ClanMember
     * const clanMember = await prisma.clanMember.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClanMemberFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ClanMemberFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more ClanMembers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ClanMembers
     * const clanMembers = await prisma.clanMember.findMany()
     *
     * // Get first 10 ClanMembers
     * const clanMembers = await prisma.clanMember.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const clanMemberWithIdOnly = await prisma.clanMember.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ClanMemberFindManyArgs>(
      args?: SelectSubset<T, ClanMemberFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a ClanMember.
     * @param {ClanMemberCreateArgs} args - Arguments to create a ClanMember.
     * @example
     * // Create one ClanMember
     * const ClanMember = await prisma.clanMember.create({
     *   data: {
     *     // ... data to create a ClanMember
     *   }
     * })
     *
     */
    create<T extends ClanMemberCreateArgs>(
      args: SelectSubset<T, ClanMemberCreateArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many ClanMembers.
     * @param {ClanMemberCreateManyArgs} args - Arguments to create many ClanMembers.
     * @example
     * // Create many ClanMembers
     * const clanMember = await prisma.clanMember.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ClanMemberCreateManyArgs>(
      args?: SelectSubset<T, ClanMemberCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many ClanMembers and returns the data saved in the database.
     * @param {ClanMemberCreateManyAndReturnArgs} args - Arguments to create many ClanMembers.
     * @example
     * // Create many ClanMembers
     * const clanMember = await prisma.clanMember.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ClanMembers and only return the `id`
     * const clanMemberWithIdOnly = await prisma.clanMember.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ClanMemberCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ClanMemberCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a ClanMember.
     * @param {ClanMemberDeleteArgs} args - Arguments to delete one ClanMember.
     * @example
     * // Delete one ClanMember
     * const ClanMember = await prisma.clanMember.delete({
     *   where: {
     *     // ... filter to delete one ClanMember
     *   }
     * })
     *
     */
    delete<T extends ClanMemberDeleteArgs>(
      args: SelectSubset<T, ClanMemberDeleteArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one ClanMember.
     * @param {ClanMemberUpdateArgs} args - Arguments to update one ClanMember.
     * @example
     * // Update one ClanMember
     * const clanMember = await prisma.clanMember.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ClanMemberUpdateArgs>(
      args: SelectSubset<T, ClanMemberUpdateArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more ClanMembers.
     * @param {ClanMemberDeleteManyArgs} args - Arguments to filter ClanMembers to delete.
     * @example
     * // Delete a few ClanMembers
     * const { count } = await prisma.clanMember.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ClanMemberDeleteManyArgs>(
      args?: SelectSubset<T, ClanMemberDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ClanMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ClanMembers
     * const clanMember = await prisma.clanMember.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ClanMemberUpdateManyArgs>(
      args: SelectSubset<T, ClanMemberUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ClanMembers and returns the data updated in the database.
     * @param {ClanMemberUpdateManyAndReturnArgs} args - Arguments to update many ClanMembers.
     * @example
     * // Update many ClanMembers
     * const clanMember = await prisma.clanMember.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ClanMembers and only return the `id`
     * const clanMemberWithIdOnly = await prisma.clanMember.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ClanMemberUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ClanMemberUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one ClanMember.
     * @param {ClanMemberUpsertArgs} args - Arguments to update or create a ClanMember.
     * @example
     * // Update or create a ClanMember
     * const clanMember = await prisma.clanMember.upsert({
     *   create: {
     *     // ... data to create a ClanMember
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ClanMember we want to update
     *   }
     * })
     */
    upsert<T extends ClanMemberUpsertArgs>(
      args: SelectSubset<T, ClanMemberUpsertArgs<ExtArgs>>
    ): Prisma__ClanMemberClient<
      $Result.GetResult<
        Prisma.$ClanMemberPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of ClanMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberCountArgs} args - Arguments to filter ClanMembers to count.
     * @example
     * // Count the number of ClanMembers
     * const count = await prisma.clanMember.count({
     *   where: {
     *     // ... the filter for the ClanMembers we want to count
     *   }
     * })
     **/
    count<T extends ClanMemberCountArgs>(
      args?: Subset<T, ClanMemberCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClanMemberCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a ClanMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ClanMemberAggregateArgs>(
      args: Subset<T, ClanMemberAggregateArgs>
    ): Prisma.PrismaPromise<GetClanMemberAggregateType<T>>;

    /**
     * Group by ClanMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanMemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ClanMemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClanMemberGroupByArgs['orderBy'] }
        : { orderBy?: ClanMemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ClanMemberGroupByArgs, OrderByArg> &
        InputErrors
    ): {} extends InputErrors
      ? GetClanMemberGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ClanMember model
     */
    readonly fields: ClanMemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ClanMember.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClanMemberClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    clan<T extends ClanDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ClanDefaultArgs<ExtArgs>>
    ): Prisma__ClanClient<
      | $Result.GetResult<
          Prisma.$ClanPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the ClanMember model
   */
  interface ClanMemberFieldRefs {
    readonly id: FieldRef<'ClanMember', 'String'>;
    readonly userId: FieldRef<'ClanMember', 'String'>;
    readonly clanId: FieldRef<'ClanMember', 'String'>;
    readonly role: FieldRef<'ClanMember', 'String'>;
    readonly contribution: FieldRef<'ClanMember', 'Int'>;
    readonly territoryCount: FieldRef<'ClanMember', 'Int'>;
    readonly matchWins: FieldRef<'ClanMember', 'Int'>;
    readonly joinedAt: FieldRef<'ClanMember', 'DateTime'>;
    readonly updatedAt: FieldRef<'ClanMember', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * ClanMember findUnique
   */
  export type ClanMemberFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter, which ClanMember to fetch.
     */
    where: ClanMemberWhereUniqueInput;
  };

  /**
   * ClanMember findUniqueOrThrow
   */
  export type ClanMemberFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter, which ClanMember to fetch.
     */
    where: ClanMemberWhereUniqueInput;
  };

  /**
   * ClanMember findFirst
   */
  export type ClanMemberFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter, which ClanMember to fetch.
     */
    where?: ClanMemberWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanMembers to fetch.
     */
    orderBy?:
      | ClanMemberOrderByWithRelationInput
      | ClanMemberOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ClanMembers.
     */
    cursor?: ClanMemberWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanMembers from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanMembers.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ClanMembers.
     */
    distinct?: ClanMemberScalarFieldEnum | ClanMemberScalarFieldEnum[];
  };

  /**
   * ClanMember findFirstOrThrow
   */
  export type ClanMemberFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter, which ClanMember to fetch.
     */
    where?: ClanMemberWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanMembers to fetch.
     */
    orderBy?:
      | ClanMemberOrderByWithRelationInput
      | ClanMemberOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ClanMembers.
     */
    cursor?: ClanMemberWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanMembers from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanMembers.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ClanMembers.
     */
    distinct?: ClanMemberScalarFieldEnum | ClanMemberScalarFieldEnum[];
  };

  /**
   * ClanMember findMany
   */
  export type ClanMemberFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter, which ClanMembers to fetch.
     */
    where?: ClanMemberWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanMembers to fetch.
     */
    orderBy?:
      | ClanMemberOrderByWithRelationInput
      | ClanMemberOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ClanMembers.
     */
    cursor?: ClanMemberWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanMembers from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanMembers.
     */
    skip?: number;
    distinct?: ClanMemberScalarFieldEnum | ClanMemberScalarFieldEnum[];
  };

  /**
   * ClanMember create
   */
  export type ClanMemberCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * The data needed to create a ClanMember.
     */
    data: XOR<ClanMemberCreateInput, ClanMemberUncheckedCreateInput>;
  };

  /**
   * ClanMember createMany
   */
  export type ClanMemberCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many ClanMembers.
     */
    data: ClanMemberCreateManyInput | ClanMemberCreateManyInput[];
  };

  /**
   * ClanMember createManyAndReturn
   */
  export type ClanMemberCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * The data used to create many ClanMembers.
     */
    data: ClanMemberCreateManyInput | ClanMemberCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * ClanMember update
   */
  export type ClanMemberUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * The data needed to update a ClanMember.
     */
    data: XOR<ClanMemberUpdateInput, ClanMemberUncheckedUpdateInput>;
    /**
     * Choose, which ClanMember to update.
     */
    where: ClanMemberWhereUniqueInput;
  };

  /**
   * ClanMember updateMany
   */
  export type ClanMemberUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update ClanMembers.
     */
    data: XOR<
      ClanMemberUpdateManyMutationInput,
      ClanMemberUncheckedUpdateManyInput
    >;
    /**
     * Filter which ClanMembers to update
     */
    where?: ClanMemberWhereInput;
    /**
     * Limit how many ClanMembers to update.
     */
    limit?: number;
  };

  /**
   * ClanMember updateManyAndReturn
   */
  export type ClanMemberUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * The data used to update ClanMembers.
     */
    data: XOR<
      ClanMemberUpdateManyMutationInput,
      ClanMemberUncheckedUpdateManyInput
    >;
    /**
     * Filter which ClanMembers to update
     */
    where?: ClanMemberWhereInput;
    /**
     * Limit how many ClanMembers to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * ClanMember upsert
   */
  export type ClanMemberUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * The filter to search for the ClanMember to update in case it exists.
     */
    where: ClanMemberWhereUniqueInput;
    /**
     * In case the ClanMember found by the `where` argument doesn't exist, create a new ClanMember with this data.
     */
    create: XOR<ClanMemberCreateInput, ClanMemberUncheckedCreateInput>;
    /**
     * In case the ClanMember was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClanMemberUpdateInput, ClanMemberUncheckedUpdateInput>;
  };

  /**
   * ClanMember delete
   */
  export type ClanMemberDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
    /**
     * Filter which ClanMember to delete.
     */
    where: ClanMemberWhereUniqueInput;
  };

  /**
   * ClanMember deleteMany
   */
  export type ClanMemberDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ClanMembers to delete
     */
    where?: ClanMemberWhereInput;
    /**
     * Limit how many ClanMembers to delete.
     */
    limit?: number;
  };

  /**
   * ClanMember without action
   */
  export type ClanMemberDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanMember
     */
    select?: ClanMemberSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanMember
     */
    omit?: ClanMemberOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanMemberInclude<ExtArgs> | null;
  };

  /**
   * Model ClanWar
   */

  export type AggregateClanWar = {
    _count: ClanWarCountAggregateOutputType | null;
    _avg: ClanWarAvgAggregateOutputType | null;
    _sum: ClanWarSumAggregateOutputType | null;
    _min: ClanWarMinAggregateOutputType | null;
    _max: ClanWarMaxAggregateOutputType | null;
  };

  export type ClanWarAvgAggregateOutputType = {
    clan1Score: number | null;
    clan2Score: number | null;
  };

  export type ClanWarSumAggregateOutputType = {
    clan1Score: number | null;
    clan2Score: number | null;
  };

  export type ClanWarMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string | null;
    clan1Id: string | null;
    clan1Score: number | null;
    clan2Id: string | null;
    clan2Score: number | null;
    winnerId: string | null;
    territoryId: string | null;
    rewards: string | null;
    matches: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanWarMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string | null;
    clan1Id: string | null;
    clan1Score: number | null;
    clan2Id: string | null;
    clan2Score: number | null;
    winnerId: string | null;
    territoryId: string | null;
    rewards: string | null;
    matches: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type ClanWarCountAggregateOutputType = {
    id: number;
    name: number;
    description: number;
    startDate: number;
    endDate: number;
    status: number;
    clan1Id: number;
    clan1Score: number;
    clan2Id: number;
    clan2Score: number;
    winnerId: number;
    territoryId: number;
    rewards: number;
    matches: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type ClanWarAvgAggregateInputType = {
    clan1Score?: true;
    clan2Score?: true;
  };

  export type ClanWarSumAggregateInputType = {
    clan1Score?: true;
    clan2Score?: true;
  };

  export type ClanWarMinAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    startDate?: true;
    endDate?: true;
    status?: true;
    clan1Id?: true;
    clan1Score?: true;
    clan2Id?: true;
    clan2Score?: true;
    winnerId?: true;
    territoryId?: true;
    rewards?: true;
    matches?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ClanWarMaxAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    startDate?: true;
    endDate?: true;
    status?: true;
    clan1Id?: true;
    clan1Score?: true;
    clan2Id?: true;
    clan2Score?: true;
    winnerId?: true;
    territoryId?: true;
    rewards?: true;
    matches?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type ClanWarCountAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    startDate?: true;
    endDate?: true;
    status?: true;
    clan1Id?: true;
    clan1Score?: true;
    clan2Id?: true;
    clan2Score?: true;
    winnerId?: true;
    territoryId?: true;
    rewards?: true;
    matches?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type ClanWarAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ClanWar to aggregate.
     */
    where?: ClanWarWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanWars to fetch.
     */
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ClanWarWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanWars from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanWars.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ClanWars
     **/
    _count?: true | ClanWarCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ClanWarAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ClanWarSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ClanWarMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ClanWarMaxAggregateInputType;
  };

  export type GetClanWarAggregateType<T extends ClanWarAggregateArgs> = {
    [P in keyof T & keyof AggregateClanWar]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClanWar[P]>
      : GetScalarType<T[P], AggregateClanWar[P]>;
  };

  export type ClanWarGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ClanWarWhereInput;
    orderBy?:
      | ClanWarOrderByWithAggregationInput
      | ClanWarOrderByWithAggregationInput[];
    by: ClanWarScalarFieldEnum[] | ClanWarScalarFieldEnum;
    having?: ClanWarScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ClanWarCountAggregateInputType | true;
    _avg?: ClanWarAvgAggregateInputType;
    _sum?: ClanWarSumAggregateInputType;
    _min?: ClanWarMinAggregateInputType;
    _max?: ClanWarMaxAggregateInputType;
  };

  export type ClanWarGroupByOutputType = {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    status: string;
    clan1Id: string;
    clan1Score: number;
    clan2Id: string;
    clan2Score: number;
    winnerId: string | null;
    territoryId: string | null;
    rewards: string;
    matches: string;
    createdAt: Date;
    updatedAt: Date;
    _count: ClanWarCountAggregateOutputType | null;
    _avg: ClanWarAvgAggregateOutputType | null;
    _sum: ClanWarSumAggregateOutputType | null;
    _min: ClanWarMinAggregateOutputType | null;
    _max: ClanWarMaxAggregateOutputType | null;
  };

  type GetClanWarGroupByPayload<T extends ClanWarGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ClanWarGroupByOutputType, T['by']> & {
          [P in keyof T & keyof ClanWarGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClanWarGroupByOutputType[P]>
            : GetScalarType<T[P], ClanWarGroupByOutputType[P]>;
        }
      >
    >;

  export type ClanWarSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      status?: boolean;
      clan1Id?: boolean;
      clan1Score?: boolean;
      clan2Id?: boolean;
      clan2Score?: boolean;
      winnerId?: boolean;
      territoryId?: boolean;
      rewards?: boolean;
      matches?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      clan1?: boolean | ClanDefaultArgs<ExtArgs>;
      clan2?: boolean | ClanDefaultArgs<ExtArgs>;
      winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
      territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['clanWar']
  >;

  export type ClanWarSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      status?: boolean;
      clan1Id?: boolean;
      clan1Score?: boolean;
      clan2Id?: boolean;
      clan2Score?: boolean;
      winnerId?: boolean;
      territoryId?: boolean;
      rewards?: boolean;
      matches?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      clan1?: boolean | ClanDefaultArgs<ExtArgs>;
      clan2?: boolean | ClanDefaultArgs<ExtArgs>;
      winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
      territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['clanWar']
  >;

  export type ClanWarSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      description?: boolean;
      startDate?: boolean;
      endDate?: boolean;
      status?: boolean;
      clan1Id?: boolean;
      clan1Score?: boolean;
      clan2Id?: boolean;
      clan2Score?: boolean;
      winnerId?: boolean;
      territoryId?: boolean;
      rewards?: boolean;
      matches?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      clan1?: boolean | ClanDefaultArgs<ExtArgs>;
      clan2?: boolean | ClanDefaultArgs<ExtArgs>;
      winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
      territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
    },
    ExtArgs['result']['clanWar']
  >;

  export type ClanWarSelectScalar = {
    id?: boolean;
    name?: boolean;
    description?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    status?: boolean;
    clan1Id?: boolean;
    clan1Score?: boolean;
    clan2Id?: boolean;
    clan2Score?: boolean;
    winnerId?: boolean;
    territoryId?: boolean;
    rewards?: boolean;
    matches?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type ClanWarOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'name'
    | 'description'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'clan1Id'
    | 'clan1Score'
    | 'clan2Id'
    | 'clan2Score'
    | 'winnerId'
    | 'territoryId'
    | 'rewards'
    | 'matches'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['clanWar']
  >;
  export type ClanWarInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    clan1?: boolean | ClanDefaultArgs<ExtArgs>;
    clan2?: boolean | ClanDefaultArgs<ExtArgs>;
    winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
    territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
  };
  export type ClanWarIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    clan1?: boolean | ClanDefaultArgs<ExtArgs>;
    clan2?: boolean | ClanDefaultArgs<ExtArgs>;
    winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
    territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
  };
  export type ClanWarIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    clan1?: boolean | ClanDefaultArgs<ExtArgs>;
    clan2?: boolean | ClanDefaultArgs<ExtArgs>;
    winner?: boolean | ClanWar$winnerArgs<ExtArgs>;
    territory?: boolean | ClanWar$territoryArgs<ExtArgs>;
  };

  export type $ClanWarPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'ClanWar';
    objects: {
      clan1: Prisma.$ClanPayload<ExtArgs>;
      clan2: Prisma.$ClanPayload<ExtArgs>;
      winner: Prisma.$ClanPayload<ExtArgs> | null;
      territory: Prisma.$TerritoryPayload<ExtArgs> | null;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        name: string;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        clan1Id: string;
        clan1Score: number;
        clan2Id: string;
        clan2Score: number;
        winnerId: string | null;
        territoryId: string | null;
        rewards: string;
        matches: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['clanWar']
    >;
    composites: {};
  };

  type ClanWarGetPayload<
    S extends boolean | null | undefined | ClanWarDefaultArgs,
  > = $Result.GetResult<Prisma.$ClanWarPayload, S>;

  type ClanWarCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<ClanWarFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ClanWarCountAggregateInputType | true;
  };

  export interface ClanWarDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['ClanWar'];
      meta: { name: 'ClanWar' };
    };
    /**
     * Find zero or one ClanWar that matches the filter.
     * @param {ClanWarFindUniqueArgs} args - Arguments to find a ClanWar
     * @example
     * // Get one ClanWar
     * const clanWar = await prisma.clanWar.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClanWarFindUniqueArgs>(
      args: SelectSubset<T, ClanWarFindUniqueArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one ClanWar that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClanWarFindUniqueOrThrowArgs} args - Arguments to find a ClanWar
     * @example
     * // Get one ClanWar
     * const clanWar = await prisma.clanWar.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClanWarFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ClanWarFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ClanWar that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarFindFirstArgs} args - Arguments to find a ClanWar
     * @example
     * // Get one ClanWar
     * const clanWar = await prisma.clanWar.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClanWarFindFirstArgs>(
      args?: SelectSubset<T, ClanWarFindFirstArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ClanWar that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarFindFirstOrThrowArgs} args - Arguments to find a ClanWar
     * @example
     * // Get one ClanWar
     * const clanWar = await prisma.clanWar.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClanWarFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ClanWarFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more ClanWars that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ClanWars
     * const clanWars = await prisma.clanWar.findMany()
     *
     * // Get first 10 ClanWars
     * const clanWars = await prisma.clanWar.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const clanWarWithIdOnly = await prisma.clanWar.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ClanWarFindManyArgs>(
      args?: SelectSubset<T, ClanWarFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a ClanWar.
     * @param {ClanWarCreateArgs} args - Arguments to create a ClanWar.
     * @example
     * // Create one ClanWar
     * const ClanWar = await prisma.clanWar.create({
     *   data: {
     *     // ... data to create a ClanWar
     *   }
     * })
     *
     */
    create<T extends ClanWarCreateArgs>(
      args: SelectSubset<T, ClanWarCreateArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many ClanWars.
     * @param {ClanWarCreateManyArgs} args - Arguments to create many ClanWars.
     * @example
     * // Create many ClanWars
     * const clanWar = await prisma.clanWar.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ClanWarCreateManyArgs>(
      args?: SelectSubset<T, ClanWarCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many ClanWars and returns the data saved in the database.
     * @param {ClanWarCreateManyAndReturnArgs} args - Arguments to create many ClanWars.
     * @example
     * // Create many ClanWars
     * const clanWar = await prisma.clanWar.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ClanWars and only return the `id`
     * const clanWarWithIdOnly = await prisma.clanWar.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ClanWarCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ClanWarCreateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a ClanWar.
     * @param {ClanWarDeleteArgs} args - Arguments to delete one ClanWar.
     * @example
     * // Delete one ClanWar
     * const ClanWar = await prisma.clanWar.delete({
     *   where: {
     *     // ... filter to delete one ClanWar
     *   }
     * })
     *
     */
    delete<T extends ClanWarDeleteArgs>(
      args: SelectSubset<T, ClanWarDeleteArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one ClanWar.
     * @param {ClanWarUpdateArgs} args - Arguments to update one ClanWar.
     * @example
     * // Update one ClanWar
     * const clanWar = await prisma.clanWar.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ClanWarUpdateArgs>(
      args: SelectSubset<T, ClanWarUpdateArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more ClanWars.
     * @param {ClanWarDeleteManyArgs} args - Arguments to filter ClanWars to delete.
     * @example
     * // Delete a few ClanWars
     * const { count } = await prisma.clanWar.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ClanWarDeleteManyArgs>(
      args?: SelectSubset<T, ClanWarDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ClanWars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ClanWars
     * const clanWar = await prisma.clanWar.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ClanWarUpdateManyArgs>(
      args: SelectSubset<T, ClanWarUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ClanWars and returns the data updated in the database.
     * @param {ClanWarUpdateManyAndReturnArgs} args - Arguments to update many ClanWars.
     * @example
     * // Update many ClanWars
     * const clanWar = await prisma.clanWar.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ClanWars and only return the `id`
     * const clanWarWithIdOnly = await prisma.clanWar.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ClanWarUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ClanWarUpdateManyAndReturnArgs<ExtArgs>>
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one ClanWar.
     * @param {ClanWarUpsertArgs} args - Arguments to update or create a ClanWar.
     * @example
     * // Update or create a ClanWar
     * const clanWar = await prisma.clanWar.upsert({
     *   create: {
     *     // ... data to create a ClanWar
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ClanWar we want to update
     *   }
     * })
     */
    upsert<T extends ClanWarUpsertArgs>(
      args: SelectSubset<T, ClanWarUpsertArgs<ExtArgs>>
    ): Prisma__ClanWarClient<
      $Result.GetResult<
        Prisma.$ClanWarPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of ClanWars.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarCountArgs} args - Arguments to filter ClanWars to count.
     * @example
     * // Count the number of ClanWars
     * const count = await prisma.clanWar.count({
     *   where: {
     *     // ... the filter for the ClanWars we want to count
     *   }
     * })
     **/
    count<T extends ClanWarCountArgs>(
      args?: Subset<T, ClanWarCountArgs>
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClanWarCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a ClanWar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ClanWarAggregateArgs>(
      args: Subset<T, ClanWarAggregateArgs>
    ): Prisma.PrismaPromise<GetClanWarAggregateType<T>>;

    /**
     * Group by ClanWar.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClanWarGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ClanWarGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClanWarGroupByArgs['orderBy'] }
        : { orderBy?: ClanWarGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ClanWarGroupByArgs, OrderByArg> & InputErrors
    ): {} extends InputErrors
      ? GetClanWarGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ClanWar model
     */
    readonly fields: ClanWarFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ClanWar.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClanWarClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    clan1<T extends ClanDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ClanDefaultArgs<ExtArgs>>
    ): Prisma__ClanClient<
      | $Result.GetResult<
          Prisma.$ClanPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    clan2<T extends ClanDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ClanDefaultArgs<ExtArgs>>
    ): Prisma__ClanClient<
      | $Result.GetResult<
          Prisma.$ClanPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    winner<T extends ClanWar$winnerArgs<ExtArgs> = {}>(
      args?: Subset<T, ClanWar$winnerArgs<ExtArgs>>
    ): Prisma__ClanClient<
      $Result.GetResult<
        Prisma.$ClanPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    territory<T extends ClanWar$territoryArgs<ExtArgs> = {}>(
      args?: Subset<T, ClanWar$territoryArgs<ExtArgs>>
    ): Prisma__TerritoryClient<
      $Result.GetResult<
        Prisma.$TerritoryPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the ClanWar model
   */
  interface ClanWarFieldRefs {
    readonly id: FieldRef<'ClanWar', 'String'>;
    readonly name: FieldRef<'ClanWar', 'String'>;
    readonly description: FieldRef<'ClanWar', 'String'>;
    readonly startDate: FieldRef<'ClanWar', 'DateTime'>;
    readonly endDate: FieldRef<'ClanWar', 'DateTime'>;
    readonly status: FieldRef<'ClanWar', 'String'>;
    readonly clan1Id: FieldRef<'ClanWar', 'String'>;
    readonly clan1Score: FieldRef<'ClanWar', 'Int'>;
    readonly clan2Id: FieldRef<'ClanWar', 'String'>;
    readonly clan2Score: FieldRef<'ClanWar', 'Int'>;
    readonly winnerId: FieldRef<'ClanWar', 'String'>;
    readonly territoryId: FieldRef<'ClanWar', 'String'>;
    readonly rewards: FieldRef<'ClanWar', 'String'>;
    readonly matches: FieldRef<'ClanWar', 'String'>;
    readonly createdAt: FieldRef<'ClanWar', 'DateTime'>;
    readonly updatedAt: FieldRef<'ClanWar', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * ClanWar findUnique
   */
  export type ClanWarFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter, which ClanWar to fetch.
     */
    where: ClanWarWhereUniqueInput;
  };

  /**
   * ClanWar findUniqueOrThrow
   */
  export type ClanWarFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter, which ClanWar to fetch.
     */
    where: ClanWarWhereUniqueInput;
  };

  /**
   * ClanWar findFirst
   */
  export type ClanWarFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter, which ClanWar to fetch.
     */
    where?: ClanWarWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanWars to fetch.
     */
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ClanWars.
     */
    cursor?: ClanWarWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanWars from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanWars.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ClanWars.
     */
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * ClanWar findFirstOrThrow
   */
  export type ClanWarFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter, which ClanWar to fetch.
     */
    where?: ClanWarWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanWars to fetch.
     */
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ClanWars.
     */
    cursor?: ClanWarWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanWars from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanWars.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ClanWars.
     */
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * ClanWar findMany
   */
  export type ClanWarFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter, which ClanWars to fetch.
     */
    where?: ClanWarWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ClanWars to fetch.
     */
    orderBy?:
      | ClanWarOrderByWithRelationInput
      | ClanWarOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ClanWars.
     */
    cursor?: ClanWarWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ClanWars from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ClanWars.
     */
    skip?: number;
    distinct?: ClanWarScalarFieldEnum | ClanWarScalarFieldEnum[];
  };

  /**
   * ClanWar create
   */
  export type ClanWarCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * The data needed to create a ClanWar.
     */
    data: XOR<ClanWarCreateInput, ClanWarUncheckedCreateInput>;
  };

  /**
   * ClanWar createMany
   */
  export type ClanWarCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many ClanWars.
     */
    data: ClanWarCreateManyInput | ClanWarCreateManyInput[];
  };

  /**
   * ClanWar createManyAndReturn
   */
  export type ClanWarCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * The data used to create many ClanWars.
     */
    data: ClanWarCreateManyInput | ClanWarCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * ClanWar update
   */
  export type ClanWarUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * The data needed to update a ClanWar.
     */
    data: XOR<ClanWarUpdateInput, ClanWarUncheckedUpdateInput>;
    /**
     * Choose, which ClanWar to update.
     */
    where: ClanWarWhereUniqueInput;
  };

  /**
   * ClanWar updateMany
   */
  export type ClanWarUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update ClanWars.
     */
    data: XOR<ClanWarUpdateManyMutationInput, ClanWarUncheckedUpdateManyInput>;
    /**
     * Filter which ClanWars to update
     */
    where?: ClanWarWhereInput;
    /**
     * Limit how many ClanWars to update.
     */
    limit?: number;
  };

  /**
   * ClanWar updateManyAndReturn
   */
  export type ClanWarUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * The data used to update ClanWars.
     */
    data: XOR<ClanWarUpdateManyMutationInput, ClanWarUncheckedUpdateManyInput>;
    /**
     * Filter which ClanWars to update
     */
    where?: ClanWarWhereInput;
    /**
     * Limit how many ClanWars to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * ClanWar upsert
   */
  export type ClanWarUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * The filter to search for the ClanWar to update in case it exists.
     */
    where: ClanWarWhereUniqueInput;
    /**
     * In case the ClanWar found by the `where` argument doesn't exist, create a new ClanWar with this data.
     */
    create: XOR<ClanWarCreateInput, ClanWarUncheckedCreateInput>;
    /**
     * In case the ClanWar was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClanWarUpdateInput, ClanWarUncheckedUpdateInput>;
  };

  /**
   * ClanWar delete
   */
  export type ClanWarDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
    /**
     * Filter which ClanWar to delete.
     */
    where: ClanWarWhereUniqueInput;
  };

  /**
   * ClanWar deleteMany
   */
  export type ClanWarDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ClanWars to delete
     */
    where?: ClanWarWhereInput;
    /**
     * Limit how many ClanWars to delete.
     */
    limit?: number;
  };

  /**
   * ClanWar.winner
   */
  export type ClanWar$winnerArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Clan
     */
    select?: ClanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Clan
     */
    omit?: ClanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanInclude<ExtArgs> | null;
    where?: ClanWhereInput;
  };

  /**
   * ClanWar.territory
   */
  export type ClanWar$territoryArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Territory
     */
    select?: TerritorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Territory
     */
    omit?: TerritoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TerritoryInclude<ExtArgs> | null;
    where?: TerritoryWhereInput;
  };

  /**
   * ClanWar without action
   */
  export type ClanWarDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ClanWar
     */
    select?: ClanWarSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ClanWar
     */
    omit?: ClanWarOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClanWarInclude<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable';
  };

  export type TransactionIsolationLevel =
    (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const UserScalarFieldEnum: {
    id: 'id';
    email: 'email';
    password: 'password';
    role: 'role';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
    homeDojoId: 'homeDojoId';
    unlockedZones: 'unlockedZones';
    relationships: 'relationships';
  };

  export type UserScalarFieldEnum =
    (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];

  export const ProfileScalarFieldEnum: {
    id: 'id';
    userId: 'userId';
    displayName: 'displayName';
    bio: 'bio';
    avatarUrl: 'avatarUrl';
    location: 'location';
    skillLevel: 'skillLevel';
    preferredGame: 'preferredGame';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type ProfileScalarFieldEnum =
    (typeof ProfileScalarFieldEnum)[keyof typeof ProfileScalarFieldEnum];

  export const UserSettingsScalarFieldEnum: {
    id: 'id';
    userId: 'userId';
    emailNotifications: 'emailNotifications';
    pushNotifications: 'pushNotifications';
    darkMode: 'darkMode';
    language: 'language';
    timezone: 'timezone';
    privacySettings: 'privacySettings';
    notificationSettings: 'notificationSettings';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type UserSettingsScalarFieldEnum =
    (typeof UserSettingsScalarFieldEnum)[keyof typeof UserSettingsScalarFieldEnum];

  export const TerritoryScalarFieldEnum: {
    id: 'id';
    name: 'name';
    description: 'description';
    coordinates: 'coordinates';
    requiredNFT: 'requiredNFT';
    influence: 'influence';
    ownerId: 'ownerId';
    clan: 'clan';
    isActive: 'isActive';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
    venueOwnerId: 'venueOwnerId';
    status: 'status';
    leaderboard: 'leaderboard';
    allegianceMeter: 'allegianceMeter';
    controllingClanId: 'controllingClanId';
  };

  export type TerritoryScalarFieldEnum =
    (typeof TerritoryScalarFieldEnum)[keyof typeof TerritoryScalarFieldEnum];

  export const UserNFTScalarFieldEnum: {
    id: 'id';
    tokenId: 'tokenId';
    name: 'name';
    description: 'description';
    imageUrl: 'imageUrl';
    metadata: 'metadata';
    acquiredAt: 'acquiredAt';
    userId: 'userId';
    territoryId: 'territoryId';
    isActive: 'isActive';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type UserNFTScalarFieldEnum =
    (typeof UserNFTScalarFieldEnum)[keyof typeof UserNFTScalarFieldEnum];

  export const TournamentScalarFieldEnum: {
    id: 'id';
    name: 'name';
    format: 'format';
    venueId: 'venueId';
    startDate: 'startDate';
    endDate: 'endDate';
    maxParticipants: 'maxParticipants';
    entryFee: 'entryFee';
    prizePool: 'prizePool';
    status: 'status';
    participants: 'participants';
    matches: 'matches';
    winnerId: 'winnerId';
    finalStandings: 'finalStandings';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
    endedAt: 'endedAt';
  };

  export type TournamentScalarFieldEnum =
    (typeof TournamentScalarFieldEnum)[keyof typeof TournamentScalarFieldEnum];

  export const ChallengeScalarFieldEnum: {
    id: 'id';
    type: 'type';
    challengerId: 'challengerId';
    defenderId: 'defenderId';
    dojoId: 'dojoId';
    status: 'status';
    outcome: 'outcome';
    winnerId: 'winnerId';
    requirements: 'requirements';
    matchData: 'matchData';
    expiresAt: 'expiresAt';
    acceptedAt: 'acceptedAt';
    declinedAt: 'declinedAt';
    completedAt: 'completedAt';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type ChallengeScalarFieldEnum =
    (typeof ChallengeScalarFieldEnum)[keyof typeof ChallengeScalarFieldEnum];

  export const NominationScalarFieldEnum: {
    id: 'id';
    playerId: 'playerId';
    name: 'name';
    address: 'address';
    latitude: 'latitude';
    longitude: 'longitude';
    description: 'description';
    contactInfo: 'contactInfo';
    status: 'status';
    verified: 'verified';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type NominationScalarFieldEnum =
    (typeof NominationScalarFieldEnum)[keyof typeof NominationScalarFieldEnum];

  export const ClanScalarFieldEnum: {
    id: 'id';
    name: 'name';
    tag: 'tag';
    description: 'description';
    avatar: 'avatar';
    banner: 'banner';
    leaderId: 'leaderId';
    memberCount: 'memberCount';
    maxMembers: 'maxMembers';
    level: 'level';
    experience: 'experience';
    territoryCount: 'territoryCount';
    totalWins: 'totalWins';
    totalLosses: 'totalLosses';
    isPublic: 'isPublic';
    requirements: 'requirements';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type ClanScalarFieldEnum =
    (typeof ClanScalarFieldEnum)[keyof typeof ClanScalarFieldEnum];

  export const ClanMemberScalarFieldEnum: {
    id: 'id';
    userId: 'userId';
    clanId: 'clanId';
    role: 'role';
    contribution: 'contribution';
    territoryCount: 'territoryCount';
    matchWins: 'matchWins';
    joinedAt: 'joinedAt';
    updatedAt: 'updatedAt';
  };

  export type ClanMemberScalarFieldEnum =
    (typeof ClanMemberScalarFieldEnum)[keyof typeof ClanMemberScalarFieldEnum];

  export const ClanWarScalarFieldEnum: {
    id: 'id';
    name: 'name';
    description: 'description';
    startDate: 'startDate';
    endDate: 'endDate';
    status: 'status';
    clan1Id: 'clan1Id';
    clan1Score: 'clan1Score';
    clan2Id: 'clan2Id';
    clan2Score: 'clan2Score';
    winnerId: 'winnerId';
    territoryId: 'territoryId';
    rewards: 'rewards';
    matches: 'matches';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type ClanWarScalarFieldEnum =
    (typeof ClanWarScalarFieldEnum)[keyof typeof ClanWarScalarFieldEnum];

  export const SortOrder: {
    asc: 'asc';
    desc: 'desc';
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  export const NullsOrder: {
    first: 'first';
    last: 'last';
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'String'
  >;

  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'DateTime'
  >;

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Int'
  >;

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Boolean'
  >;

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Float'
  >;

  /**
   * Deep Input Types
   */

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[];
    OR?: UserWhereInput[];
    NOT?: UserWhereInput | UserWhereInput[];
    id?: StringFilter<'User'> | string;
    email?: StringFilter<'User'> | string;
    password?: StringFilter<'User'> | string;
    role?: StringFilter<'User'> | string;
    createdAt?: DateTimeFilter<'User'> | Date | string;
    updatedAt?: DateTimeFilter<'User'> | Date | string;
    homeDojoId?: StringNullableFilter<'User'> | string | null;
    unlockedZones?: StringFilter<'User'> | string;
    relationships?: StringFilter<'User'> | string;
    profile?: XOR<
      ProfileNullableScalarRelationFilter,
      ProfileWhereInput
    > | null;
    settings?: XOR<
      UserSettingsNullableScalarRelationFilter,
      UserSettingsWhereInput
    > | null;
    territories?: TerritoryListRelationFilter;
    nfts?: UserNFTListRelationFilter;
    challengesAsChallenger?: ChallengeListRelationFilter;
    challengesAsDefender?: ChallengeListRelationFilter;
    nominations?: NominationListRelationFilter;
    homeDojo?: XOR<
      TerritoryNullableScalarRelationFilter,
      TerritoryWhereInput
    > | null;
    ledClans?: ClanListRelationFilter;
    clanMembership?: XOR<
      ClanMemberNullableScalarRelationFilter,
      ClanMemberWhereInput
    > | null;
  };

  export type UserOrderByWithRelationInput = {
    id?: SortOrder;
    email?: SortOrder;
    password?: SortOrder;
    role?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    homeDojoId?: SortOrderInput | SortOrder;
    unlockedZones?: SortOrder;
    relationships?: SortOrder;
    profile?: ProfileOrderByWithRelationInput;
    settings?: UserSettingsOrderByWithRelationInput;
    territories?: TerritoryOrderByRelationAggregateInput;
    nfts?: UserNFTOrderByRelationAggregateInput;
    challengesAsChallenger?: ChallengeOrderByRelationAggregateInput;
    challengesAsDefender?: ChallengeOrderByRelationAggregateInput;
    nominations?: NominationOrderByRelationAggregateInput;
    homeDojo?: TerritoryOrderByWithRelationInput;
    ledClans?: ClanOrderByRelationAggregateInput;
    clanMembership?: ClanMemberOrderByWithRelationInput;
  };

  export type UserWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      email?: string;
      AND?: UserWhereInput | UserWhereInput[];
      OR?: UserWhereInput[];
      NOT?: UserWhereInput | UserWhereInput[];
      password?: StringFilter<'User'> | string;
      role?: StringFilter<'User'> | string;
      createdAt?: DateTimeFilter<'User'> | Date | string;
      updatedAt?: DateTimeFilter<'User'> | Date | string;
      homeDojoId?: StringNullableFilter<'User'> | string | null;
      unlockedZones?: StringFilter<'User'> | string;
      relationships?: StringFilter<'User'> | string;
      profile?: XOR<
        ProfileNullableScalarRelationFilter,
        ProfileWhereInput
      > | null;
      settings?: XOR<
        UserSettingsNullableScalarRelationFilter,
        UserSettingsWhereInput
      > | null;
      territories?: TerritoryListRelationFilter;
      nfts?: UserNFTListRelationFilter;
      challengesAsChallenger?: ChallengeListRelationFilter;
      challengesAsDefender?: ChallengeListRelationFilter;
      nominations?: NominationListRelationFilter;
      homeDojo?: XOR<
        TerritoryNullableScalarRelationFilter,
        TerritoryWhereInput
      > | null;
      ledClans?: ClanListRelationFilter;
      clanMembership?: XOR<
        ClanMemberNullableScalarRelationFilter,
        ClanMemberWhereInput
      > | null;
    },
    'id' | 'email'
  >;

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder;
    email?: SortOrder;
    password?: SortOrder;
    role?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    homeDojoId?: SortOrderInput | SortOrder;
    unlockedZones?: SortOrder;
    relationships?: SortOrder;
    _count?: UserCountOrderByAggregateInput;
    _max?: UserMaxOrderByAggregateInput;
    _min?: UserMinOrderByAggregateInput;
  };

  export type UserScalarWhereWithAggregatesInput = {
    AND?:
      | UserScalarWhereWithAggregatesInput
      | UserScalarWhereWithAggregatesInput[];
    OR?: UserScalarWhereWithAggregatesInput[];
    NOT?:
      | UserScalarWhereWithAggregatesInput
      | UserScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'User'> | string;
    email?: StringWithAggregatesFilter<'User'> | string;
    password?: StringWithAggregatesFilter<'User'> | string;
    role?: StringWithAggregatesFilter<'User'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'User'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'User'> | Date | string;
    homeDojoId?: StringNullableWithAggregatesFilter<'User'> | string | null;
    unlockedZones?: StringWithAggregatesFilter<'User'> | string;
    relationships?: StringWithAggregatesFilter<'User'> | string;
  };

  export type ProfileWhereInput = {
    AND?: ProfileWhereInput | ProfileWhereInput[];
    OR?: ProfileWhereInput[];
    NOT?: ProfileWhereInput | ProfileWhereInput[];
    id?: StringFilter<'Profile'> | string;
    userId?: StringFilter<'Profile'> | string;
    displayName?: StringNullableFilter<'Profile'> | string | null;
    bio?: StringNullableFilter<'Profile'> | string | null;
    avatarUrl?: StringNullableFilter<'Profile'> | string | null;
    location?: StringNullableFilter<'Profile'> | string | null;
    skillLevel?: IntFilter<'Profile'> | number;
    preferredGame?: StringNullableFilter<'Profile'> | string | null;
    createdAt?: DateTimeFilter<'Profile'> | Date | string;
    updatedAt?: DateTimeFilter<'Profile'> | Date | string;
    user?: XOR<UserScalarRelationFilter, UserWhereInput>;
  };

  export type ProfileOrderByWithRelationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    displayName?: SortOrderInput | SortOrder;
    bio?: SortOrderInput | SortOrder;
    avatarUrl?: SortOrderInput | SortOrder;
    location?: SortOrderInput | SortOrder;
    skillLevel?: SortOrder;
    preferredGame?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    user?: UserOrderByWithRelationInput;
  };

  export type ProfileWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      userId?: string;
      AND?: ProfileWhereInput | ProfileWhereInput[];
      OR?: ProfileWhereInput[];
      NOT?: ProfileWhereInput | ProfileWhereInput[];
      displayName?: StringNullableFilter<'Profile'> | string | null;
      bio?: StringNullableFilter<'Profile'> | string | null;
      avatarUrl?: StringNullableFilter<'Profile'> | string | null;
      location?: StringNullableFilter<'Profile'> | string | null;
      skillLevel?: IntFilter<'Profile'> | number;
      preferredGame?: StringNullableFilter<'Profile'> | string | null;
      createdAt?: DateTimeFilter<'Profile'> | Date | string;
      updatedAt?: DateTimeFilter<'Profile'> | Date | string;
      user?: XOR<UserScalarRelationFilter, UserWhereInput>;
    },
    'id' | 'userId'
  >;

  export type ProfileOrderByWithAggregationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    displayName?: SortOrderInput | SortOrder;
    bio?: SortOrderInput | SortOrder;
    avatarUrl?: SortOrderInput | SortOrder;
    location?: SortOrderInput | SortOrder;
    skillLevel?: SortOrder;
    preferredGame?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: ProfileCountOrderByAggregateInput;
    _avg?: ProfileAvgOrderByAggregateInput;
    _max?: ProfileMaxOrderByAggregateInput;
    _min?: ProfileMinOrderByAggregateInput;
    _sum?: ProfileSumOrderByAggregateInput;
  };

  export type ProfileScalarWhereWithAggregatesInput = {
    AND?:
      | ProfileScalarWhereWithAggregatesInput
      | ProfileScalarWhereWithAggregatesInput[];
    OR?: ProfileScalarWhereWithAggregatesInput[];
    NOT?:
      | ProfileScalarWhereWithAggregatesInput
      | ProfileScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Profile'> | string;
    userId?: StringWithAggregatesFilter<'Profile'> | string;
    displayName?: StringNullableWithAggregatesFilter<'Profile'> | string | null;
    bio?: StringNullableWithAggregatesFilter<'Profile'> | string | null;
    avatarUrl?: StringNullableWithAggregatesFilter<'Profile'> | string | null;
    location?: StringNullableWithAggregatesFilter<'Profile'> | string | null;
    skillLevel?: IntWithAggregatesFilter<'Profile'> | number;
    preferredGame?:
      | StringNullableWithAggregatesFilter<'Profile'>
      | string
      | null;
    createdAt?: DateTimeWithAggregatesFilter<'Profile'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Profile'> | Date | string;
  };

  export type UserSettingsWhereInput = {
    AND?: UserSettingsWhereInput | UserSettingsWhereInput[];
    OR?: UserSettingsWhereInput[];
    NOT?: UserSettingsWhereInput | UserSettingsWhereInput[];
    id?: StringFilter<'UserSettings'> | string;
    userId?: StringFilter<'UserSettings'> | string;
    emailNotifications?: BoolFilter<'UserSettings'> | boolean;
    pushNotifications?: BoolFilter<'UserSettings'> | boolean;
    darkMode?: BoolFilter<'UserSettings'> | boolean;
    language?: StringFilter<'UserSettings'> | string;
    timezone?: StringFilter<'UserSettings'> | string;
    privacySettings?: StringFilter<'UserSettings'> | string;
    notificationSettings?: StringFilter<'UserSettings'> | string;
    createdAt?: DateTimeFilter<'UserSettings'> | Date | string;
    updatedAt?: DateTimeFilter<'UserSettings'> | Date | string;
    user?: XOR<UserScalarRelationFilter, UserWhereInput>;
  };

  export type UserSettingsOrderByWithRelationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    emailNotifications?: SortOrder;
    pushNotifications?: SortOrder;
    darkMode?: SortOrder;
    language?: SortOrder;
    timezone?: SortOrder;
    privacySettings?: SortOrder;
    notificationSettings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    user?: UserOrderByWithRelationInput;
  };

  export type UserSettingsWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      userId?: string;
      AND?: UserSettingsWhereInput | UserSettingsWhereInput[];
      OR?: UserSettingsWhereInput[];
      NOT?: UserSettingsWhereInput | UserSettingsWhereInput[];
      emailNotifications?: BoolFilter<'UserSettings'> | boolean;
      pushNotifications?: BoolFilter<'UserSettings'> | boolean;
      darkMode?: BoolFilter<'UserSettings'> | boolean;
      language?: StringFilter<'UserSettings'> | string;
      timezone?: StringFilter<'UserSettings'> | string;
      privacySettings?: StringFilter<'UserSettings'> | string;
      notificationSettings?: StringFilter<'UserSettings'> | string;
      createdAt?: DateTimeFilter<'UserSettings'> | Date | string;
      updatedAt?: DateTimeFilter<'UserSettings'> | Date | string;
      user?: XOR<UserScalarRelationFilter, UserWhereInput>;
    },
    'id' | 'userId'
  >;

  export type UserSettingsOrderByWithAggregationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    emailNotifications?: SortOrder;
    pushNotifications?: SortOrder;
    darkMode?: SortOrder;
    language?: SortOrder;
    timezone?: SortOrder;
    privacySettings?: SortOrder;
    notificationSettings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: UserSettingsCountOrderByAggregateInput;
    _max?: UserSettingsMaxOrderByAggregateInput;
    _min?: UserSettingsMinOrderByAggregateInput;
  };

  export type UserSettingsScalarWhereWithAggregatesInput = {
    AND?:
      | UserSettingsScalarWhereWithAggregatesInput
      | UserSettingsScalarWhereWithAggregatesInput[];
    OR?: UserSettingsScalarWhereWithAggregatesInput[];
    NOT?:
      | UserSettingsScalarWhereWithAggregatesInput
      | UserSettingsScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'UserSettings'> | string;
    userId?: StringWithAggregatesFilter<'UserSettings'> | string;
    emailNotifications?: BoolWithAggregatesFilter<'UserSettings'> | boolean;
    pushNotifications?: BoolWithAggregatesFilter<'UserSettings'> | boolean;
    darkMode?: BoolWithAggregatesFilter<'UserSettings'> | boolean;
    language?: StringWithAggregatesFilter<'UserSettings'> | string;
    timezone?: StringWithAggregatesFilter<'UserSettings'> | string;
    privacySettings?: StringWithAggregatesFilter<'UserSettings'> | string;
    notificationSettings?: StringWithAggregatesFilter<'UserSettings'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'UserSettings'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'UserSettings'> | Date | string;
  };

  export type TerritoryWhereInput = {
    AND?: TerritoryWhereInput | TerritoryWhereInput[];
    OR?: TerritoryWhereInput[];
    NOT?: TerritoryWhereInput | TerritoryWhereInput[];
    id?: StringFilter<'Territory'> | string;
    name?: StringFilter<'Territory'> | string;
    description?: StringNullableFilter<'Territory'> | string | null;
    coordinates?: StringFilter<'Territory'> | string;
    requiredNFT?: StringFilter<'Territory'> | string;
    influence?: IntFilter<'Territory'> | number;
    ownerId?: StringNullableFilter<'Territory'> | string | null;
    clan?: StringNullableFilter<'Territory'> | string | null;
    isActive?: BoolFilter<'Territory'> | boolean;
    createdAt?: DateTimeFilter<'Territory'> | Date | string;
    updatedAt?: DateTimeFilter<'Territory'> | Date | string;
    venueOwnerId?: StringNullableFilter<'Territory'> | string | null;
    status?: StringFilter<'Territory'> | string;
    leaderboard?: StringFilter<'Territory'> | string;
    allegianceMeter?: IntFilter<'Territory'> | number;
    controllingClanId?: StringNullableFilter<'Territory'> | string | null;
    owner?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null;
    nfts?: UserNFTListRelationFilter;
    challenges?: ChallengeListRelationFilter;
    homeDojoUsers?: UserListRelationFilter;
    controllingClan?: XOR<
      ClanNullableScalarRelationFilter,
      ClanWhereInput
    > | null;
    contestedWars?: ClanWarListRelationFilter;
  };

  export type TerritoryOrderByWithRelationInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    coordinates?: SortOrder;
    requiredNFT?: SortOrder;
    influence?: SortOrder;
    ownerId?: SortOrderInput | SortOrder;
    clan?: SortOrderInput | SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    venueOwnerId?: SortOrderInput | SortOrder;
    status?: SortOrder;
    leaderboard?: SortOrder;
    allegianceMeter?: SortOrder;
    controllingClanId?: SortOrderInput | SortOrder;
    owner?: UserOrderByWithRelationInput;
    nfts?: UserNFTOrderByRelationAggregateInput;
    challenges?: ChallengeOrderByRelationAggregateInput;
    homeDojoUsers?: UserOrderByRelationAggregateInput;
    controllingClan?: ClanOrderByWithRelationInput;
    contestedWars?: ClanWarOrderByRelationAggregateInput;
  };

  export type TerritoryWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      name?: string;
      requiredNFT?: string;
      AND?: TerritoryWhereInput | TerritoryWhereInput[];
      OR?: TerritoryWhereInput[];
      NOT?: TerritoryWhereInput | TerritoryWhereInput[];
      description?: StringNullableFilter<'Territory'> | string | null;
      coordinates?: StringFilter<'Territory'> | string;
      influence?: IntFilter<'Territory'> | number;
      ownerId?: StringNullableFilter<'Territory'> | string | null;
      clan?: StringNullableFilter<'Territory'> | string | null;
      isActive?: BoolFilter<'Territory'> | boolean;
      createdAt?: DateTimeFilter<'Territory'> | Date | string;
      updatedAt?: DateTimeFilter<'Territory'> | Date | string;
      venueOwnerId?: StringNullableFilter<'Territory'> | string | null;
      status?: StringFilter<'Territory'> | string;
      leaderboard?: StringFilter<'Territory'> | string;
      allegianceMeter?: IntFilter<'Territory'> | number;
      controllingClanId?: StringNullableFilter<'Territory'> | string | null;
      owner?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null;
      nfts?: UserNFTListRelationFilter;
      challenges?: ChallengeListRelationFilter;
      homeDojoUsers?: UserListRelationFilter;
      controllingClan?: XOR<
        ClanNullableScalarRelationFilter,
        ClanWhereInput
      > | null;
      contestedWars?: ClanWarListRelationFilter;
    },
    'id' | 'name' | 'requiredNFT'
  >;

  export type TerritoryOrderByWithAggregationInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    coordinates?: SortOrder;
    requiredNFT?: SortOrder;
    influence?: SortOrder;
    ownerId?: SortOrderInput | SortOrder;
    clan?: SortOrderInput | SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    venueOwnerId?: SortOrderInput | SortOrder;
    status?: SortOrder;
    leaderboard?: SortOrder;
    allegianceMeter?: SortOrder;
    controllingClanId?: SortOrderInput | SortOrder;
    _count?: TerritoryCountOrderByAggregateInput;
    _avg?: TerritoryAvgOrderByAggregateInput;
    _max?: TerritoryMaxOrderByAggregateInput;
    _min?: TerritoryMinOrderByAggregateInput;
    _sum?: TerritorySumOrderByAggregateInput;
  };

  export type TerritoryScalarWhereWithAggregatesInput = {
    AND?:
      | TerritoryScalarWhereWithAggregatesInput
      | TerritoryScalarWhereWithAggregatesInput[];
    OR?: TerritoryScalarWhereWithAggregatesInput[];
    NOT?:
      | TerritoryScalarWhereWithAggregatesInput
      | TerritoryScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Territory'> | string;
    name?: StringWithAggregatesFilter<'Territory'> | string;
    description?:
      | StringNullableWithAggregatesFilter<'Territory'>
      | string
      | null;
    coordinates?: StringWithAggregatesFilter<'Territory'> | string;
    requiredNFT?: StringWithAggregatesFilter<'Territory'> | string;
    influence?: IntWithAggregatesFilter<'Territory'> | number;
    ownerId?: StringNullableWithAggregatesFilter<'Territory'> | string | null;
    clan?: StringNullableWithAggregatesFilter<'Territory'> | string | null;
    isActive?: BoolWithAggregatesFilter<'Territory'> | boolean;
    createdAt?: DateTimeWithAggregatesFilter<'Territory'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Territory'> | Date | string;
    venueOwnerId?:
      | StringNullableWithAggregatesFilter<'Territory'>
      | string
      | null;
    status?: StringWithAggregatesFilter<'Territory'> | string;
    leaderboard?: StringWithAggregatesFilter<'Territory'> | string;
    allegianceMeter?: IntWithAggregatesFilter<'Territory'> | number;
    controllingClanId?:
      | StringNullableWithAggregatesFilter<'Territory'>
      | string
      | null;
  };

  export type UserNFTWhereInput = {
    AND?: UserNFTWhereInput | UserNFTWhereInput[];
    OR?: UserNFTWhereInput[];
    NOT?: UserNFTWhereInput | UserNFTWhereInput[];
    id?: StringFilter<'UserNFT'> | string;
    tokenId?: StringFilter<'UserNFT'> | string;
    name?: StringFilter<'UserNFT'> | string;
    description?: StringNullableFilter<'UserNFT'> | string | null;
    imageUrl?: StringNullableFilter<'UserNFT'> | string | null;
    metadata?: StringFilter<'UserNFT'> | string;
    acquiredAt?: DateTimeFilter<'UserNFT'> | Date | string;
    userId?: StringFilter<'UserNFT'> | string;
    territoryId?: StringNullableFilter<'UserNFT'> | string | null;
    isActive?: BoolFilter<'UserNFT'> | boolean;
    createdAt?: DateTimeFilter<'UserNFT'> | Date | string;
    updatedAt?: DateTimeFilter<'UserNFT'> | Date | string;
    user?: XOR<UserScalarRelationFilter, UserWhereInput>;
    territory?: XOR<
      TerritoryNullableScalarRelationFilter,
      TerritoryWhereInput
    > | null;
  };

  export type UserNFTOrderByWithRelationInput = {
    id?: SortOrder;
    tokenId?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    imageUrl?: SortOrderInput | SortOrder;
    metadata?: SortOrder;
    acquiredAt?: SortOrder;
    userId?: SortOrder;
    territoryId?: SortOrderInput | SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    user?: UserOrderByWithRelationInput;
    territory?: TerritoryOrderByWithRelationInput;
  };

  export type UserNFTWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      tokenId?: string;
      AND?: UserNFTWhereInput | UserNFTWhereInput[];
      OR?: UserNFTWhereInput[];
      NOT?: UserNFTWhereInput | UserNFTWhereInput[];
      name?: StringFilter<'UserNFT'> | string;
      description?: StringNullableFilter<'UserNFT'> | string | null;
      imageUrl?: StringNullableFilter<'UserNFT'> | string | null;
      metadata?: StringFilter<'UserNFT'> | string;
      acquiredAt?: DateTimeFilter<'UserNFT'> | Date | string;
      userId?: StringFilter<'UserNFT'> | string;
      territoryId?: StringNullableFilter<'UserNFT'> | string | null;
      isActive?: BoolFilter<'UserNFT'> | boolean;
      createdAt?: DateTimeFilter<'UserNFT'> | Date | string;
      updatedAt?: DateTimeFilter<'UserNFT'> | Date | string;
      user?: XOR<UserScalarRelationFilter, UserWhereInput>;
      territory?: XOR<
        TerritoryNullableScalarRelationFilter,
        TerritoryWhereInput
      > | null;
    },
    'id' | 'tokenId'
  >;

  export type UserNFTOrderByWithAggregationInput = {
    id?: SortOrder;
    tokenId?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    imageUrl?: SortOrderInput | SortOrder;
    metadata?: SortOrder;
    acquiredAt?: SortOrder;
    userId?: SortOrder;
    territoryId?: SortOrderInput | SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: UserNFTCountOrderByAggregateInput;
    _max?: UserNFTMaxOrderByAggregateInput;
    _min?: UserNFTMinOrderByAggregateInput;
  };

  export type UserNFTScalarWhereWithAggregatesInput = {
    AND?:
      | UserNFTScalarWhereWithAggregatesInput
      | UserNFTScalarWhereWithAggregatesInput[];
    OR?: UserNFTScalarWhereWithAggregatesInput[];
    NOT?:
      | UserNFTScalarWhereWithAggregatesInput
      | UserNFTScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'UserNFT'> | string;
    tokenId?: StringWithAggregatesFilter<'UserNFT'> | string;
    name?: StringWithAggregatesFilter<'UserNFT'> | string;
    description?: StringNullableWithAggregatesFilter<'UserNFT'> | string | null;
    imageUrl?: StringNullableWithAggregatesFilter<'UserNFT'> | string | null;
    metadata?: StringWithAggregatesFilter<'UserNFT'> | string;
    acquiredAt?: DateTimeWithAggregatesFilter<'UserNFT'> | Date | string;
    userId?: StringWithAggregatesFilter<'UserNFT'> | string;
    territoryId?: StringNullableWithAggregatesFilter<'UserNFT'> | string | null;
    isActive?: BoolWithAggregatesFilter<'UserNFT'> | boolean;
    createdAt?: DateTimeWithAggregatesFilter<'UserNFT'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'UserNFT'> | Date | string;
  };

  export type TournamentWhereInput = {
    AND?: TournamentWhereInput | TournamentWhereInput[];
    OR?: TournamentWhereInput[];
    NOT?: TournamentWhereInput | TournamentWhereInput[];
    id?: StringFilter<'Tournament'> | string;
    name?: StringFilter<'Tournament'> | string;
    format?: StringFilter<'Tournament'> | string;
    venueId?: StringFilter<'Tournament'> | string;
    startDate?: DateTimeFilter<'Tournament'> | Date | string;
    endDate?: DateTimeFilter<'Tournament'> | Date | string;
    maxParticipants?: IntFilter<'Tournament'> | number;
    entryFee?: FloatFilter<'Tournament'> | number;
    prizePool?: FloatFilter<'Tournament'> | number;
    status?: StringFilter<'Tournament'> | string;
    participants?: StringFilter<'Tournament'> | string;
    matches?: StringFilter<'Tournament'> | string;
    winnerId?: StringNullableFilter<'Tournament'> | string | null;
    finalStandings?: StringFilter<'Tournament'> | string;
    createdAt?: DateTimeFilter<'Tournament'> | Date | string;
    updatedAt?: DateTimeFilter<'Tournament'> | Date | string;
    endedAt?: DateTimeNullableFilter<'Tournament'> | Date | string | null;
  };

  export type TournamentOrderByWithRelationInput = {
    id?: SortOrder;
    name?: SortOrder;
    format?: SortOrder;
    venueId?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
    status?: SortOrder;
    participants?: SortOrder;
    matches?: SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    finalStandings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    endedAt?: SortOrderInput | SortOrder;
  };

  export type TournamentWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: TournamentWhereInput | TournamentWhereInput[];
      OR?: TournamentWhereInput[];
      NOT?: TournamentWhereInput | TournamentWhereInput[];
      name?: StringFilter<'Tournament'> | string;
      format?: StringFilter<'Tournament'> | string;
      venueId?: StringFilter<'Tournament'> | string;
      startDate?: DateTimeFilter<'Tournament'> | Date | string;
      endDate?: DateTimeFilter<'Tournament'> | Date | string;
      maxParticipants?: IntFilter<'Tournament'> | number;
      entryFee?: FloatFilter<'Tournament'> | number;
      prizePool?: FloatFilter<'Tournament'> | number;
      status?: StringFilter<'Tournament'> | string;
      participants?: StringFilter<'Tournament'> | string;
      matches?: StringFilter<'Tournament'> | string;
      winnerId?: StringNullableFilter<'Tournament'> | string | null;
      finalStandings?: StringFilter<'Tournament'> | string;
      createdAt?: DateTimeFilter<'Tournament'> | Date | string;
      updatedAt?: DateTimeFilter<'Tournament'> | Date | string;
      endedAt?: DateTimeNullableFilter<'Tournament'> | Date | string | null;
    },
    'id'
  >;

  export type TournamentOrderByWithAggregationInput = {
    id?: SortOrder;
    name?: SortOrder;
    format?: SortOrder;
    venueId?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
    status?: SortOrder;
    participants?: SortOrder;
    matches?: SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    finalStandings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    endedAt?: SortOrderInput | SortOrder;
    _count?: TournamentCountOrderByAggregateInput;
    _avg?: TournamentAvgOrderByAggregateInput;
    _max?: TournamentMaxOrderByAggregateInput;
    _min?: TournamentMinOrderByAggregateInput;
    _sum?: TournamentSumOrderByAggregateInput;
  };

  export type TournamentScalarWhereWithAggregatesInput = {
    AND?:
      | TournamentScalarWhereWithAggregatesInput
      | TournamentScalarWhereWithAggregatesInput[];
    OR?: TournamentScalarWhereWithAggregatesInput[];
    NOT?:
      | TournamentScalarWhereWithAggregatesInput
      | TournamentScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Tournament'> | string;
    name?: StringWithAggregatesFilter<'Tournament'> | string;
    format?: StringWithAggregatesFilter<'Tournament'> | string;
    venueId?: StringWithAggregatesFilter<'Tournament'> | string;
    startDate?: DateTimeWithAggregatesFilter<'Tournament'> | Date | string;
    endDate?: DateTimeWithAggregatesFilter<'Tournament'> | Date | string;
    maxParticipants?: IntWithAggregatesFilter<'Tournament'> | number;
    entryFee?: FloatWithAggregatesFilter<'Tournament'> | number;
    prizePool?: FloatWithAggregatesFilter<'Tournament'> | number;
    status?: StringWithAggregatesFilter<'Tournament'> | string;
    participants?: StringWithAggregatesFilter<'Tournament'> | string;
    matches?: StringWithAggregatesFilter<'Tournament'> | string;
    winnerId?: StringNullableWithAggregatesFilter<'Tournament'> | string | null;
    finalStandings?: StringWithAggregatesFilter<'Tournament'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'Tournament'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Tournament'> | Date | string;
    endedAt?:
      | DateTimeNullableWithAggregatesFilter<'Tournament'>
      | Date
      | string
      | null;
  };

  export type ChallengeWhereInput = {
    AND?: ChallengeWhereInput | ChallengeWhereInput[];
    OR?: ChallengeWhereInput[];
    NOT?: ChallengeWhereInput | ChallengeWhereInput[];
    id?: StringFilter<'Challenge'> | string;
    type?: StringFilter<'Challenge'> | string;
    challengerId?: StringFilter<'Challenge'> | string;
    defenderId?: StringFilter<'Challenge'> | string;
    dojoId?: StringFilter<'Challenge'> | string;
    status?: StringFilter<'Challenge'> | string;
    outcome?: StringNullableFilter<'Challenge'> | string | null;
    winnerId?: StringNullableFilter<'Challenge'> | string | null;
    requirements?: StringFilter<'Challenge'> | string;
    matchData?: StringNullableFilter<'Challenge'> | string | null;
    expiresAt?: DateTimeFilter<'Challenge'> | Date | string;
    acceptedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    declinedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    completedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    createdAt?: DateTimeFilter<'Challenge'> | Date | string;
    updatedAt?: DateTimeFilter<'Challenge'> | Date | string;
    challenger?: XOR<UserScalarRelationFilter, UserWhereInput>;
    defender?: XOR<UserScalarRelationFilter, UserWhereInput>;
    dojo?: XOR<TerritoryScalarRelationFilter, TerritoryWhereInput>;
  };

  export type ChallengeOrderByWithRelationInput = {
    id?: SortOrder;
    type?: SortOrder;
    challengerId?: SortOrder;
    defenderId?: SortOrder;
    dojoId?: SortOrder;
    status?: SortOrder;
    outcome?: SortOrderInput | SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    requirements?: SortOrder;
    matchData?: SortOrderInput | SortOrder;
    expiresAt?: SortOrder;
    acceptedAt?: SortOrderInput | SortOrder;
    declinedAt?: SortOrderInput | SortOrder;
    completedAt?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    challenger?: UserOrderByWithRelationInput;
    defender?: UserOrderByWithRelationInput;
    dojo?: TerritoryOrderByWithRelationInput;
  };

  export type ChallengeWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: ChallengeWhereInput | ChallengeWhereInput[];
      OR?: ChallengeWhereInput[];
      NOT?: ChallengeWhereInput | ChallengeWhereInput[];
      type?: StringFilter<'Challenge'> | string;
      challengerId?: StringFilter<'Challenge'> | string;
      defenderId?: StringFilter<'Challenge'> | string;
      dojoId?: StringFilter<'Challenge'> | string;
      status?: StringFilter<'Challenge'> | string;
      outcome?: StringNullableFilter<'Challenge'> | string | null;
      winnerId?: StringNullableFilter<'Challenge'> | string | null;
      requirements?: StringFilter<'Challenge'> | string;
      matchData?: StringNullableFilter<'Challenge'> | string | null;
      expiresAt?: DateTimeFilter<'Challenge'> | Date | string;
      acceptedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
      declinedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
      completedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
      createdAt?: DateTimeFilter<'Challenge'> | Date | string;
      updatedAt?: DateTimeFilter<'Challenge'> | Date | string;
      challenger?: XOR<UserScalarRelationFilter, UserWhereInput>;
      defender?: XOR<UserScalarRelationFilter, UserWhereInput>;
      dojo?: XOR<TerritoryScalarRelationFilter, TerritoryWhereInput>;
    },
    'id'
  >;

  export type ChallengeOrderByWithAggregationInput = {
    id?: SortOrder;
    type?: SortOrder;
    challengerId?: SortOrder;
    defenderId?: SortOrder;
    dojoId?: SortOrder;
    status?: SortOrder;
    outcome?: SortOrderInput | SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    requirements?: SortOrder;
    matchData?: SortOrderInput | SortOrder;
    expiresAt?: SortOrder;
    acceptedAt?: SortOrderInput | SortOrder;
    declinedAt?: SortOrderInput | SortOrder;
    completedAt?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: ChallengeCountOrderByAggregateInput;
    _max?: ChallengeMaxOrderByAggregateInput;
    _min?: ChallengeMinOrderByAggregateInput;
  };

  export type ChallengeScalarWhereWithAggregatesInput = {
    AND?:
      | ChallengeScalarWhereWithAggregatesInput
      | ChallengeScalarWhereWithAggregatesInput[];
    OR?: ChallengeScalarWhereWithAggregatesInput[];
    NOT?:
      | ChallengeScalarWhereWithAggregatesInput
      | ChallengeScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Challenge'> | string;
    type?: StringWithAggregatesFilter<'Challenge'> | string;
    challengerId?: StringWithAggregatesFilter<'Challenge'> | string;
    defenderId?: StringWithAggregatesFilter<'Challenge'> | string;
    dojoId?: StringWithAggregatesFilter<'Challenge'> | string;
    status?: StringWithAggregatesFilter<'Challenge'> | string;
    outcome?: StringNullableWithAggregatesFilter<'Challenge'> | string | null;
    winnerId?: StringNullableWithAggregatesFilter<'Challenge'> | string | null;
    requirements?: StringWithAggregatesFilter<'Challenge'> | string;
    matchData?: StringNullableWithAggregatesFilter<'Challenge'> | string | null;
    expiresAt?: DateTimeWithAggregatesFilter<'Challenge'> | Date | string;
    acceptedAt?:
      | DateTimeNullableWithAggregatesFilter<'Challenge'>
      | Date
      | string
      | null;
    declinedAt?:
      | DateTimeNullableWithAggregatesFilter<'Challenge'>
      | Date
      | string
      | null;
    completedAt?:
      | DateTimeNullableWithAggregatesFilter<'Challenge'>
      | Date
      | string
      | null;
    createdAt?: DateTimeWithAggregatesFilter<'Challenge'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Challenge'> | Date | string;
  };

  export type NominationWhereInput = {
    AND?: NominationWhereInput | NominationWhereInput[];
    OR?: NominationWhereInput[];
    NOT?: NominationWhereInput | NominationWhereInput[];
    id?: StringFilter<'Nomination'> | string;
    playerId?: StringFilter<'Nomination'> | string;
    name?: StringFilter<'Nomination'> | string;
    address?: StringFilter<'Nomination'> | string;
    latitude?: FloatFilter<'Nomination'> | number;
    longitude?: FloatFilter<'Nomination'> | number;
    description?: StringNullableFilter<'Nomination'> | string | null;
    contactInfo?: StringNullableFilter<'Nomination'> | string | null;
    status?: StringFilter<'Nomination'> | string;
    verified?: BoolFilter<'Nomination'> | boolean;
    createdAt?: DateTimeFilter<'Nomination'> | Date | string;
    updatedAt?: DateTimeFilter<'Nomination'> | Date | string;
    player?: XOR<UserScalarRelationFilter, UserWhereInput>;
  };

  export type NominationOrderByWithRelationInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    name?: SortOrder;
    address?: SortOrder;
    latitude?: SortOrder;
    longitude?: SortOrder;
    description?: SortOrderInput | SortOrder;
    contactInfo?: SortOrderInput | SortOrder;
    status?: SortOrder;
    verified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    player?: UserOrderByWithRelationInput;
  };

  export type NominationWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: NominationWhereInput | NominationWhereInput[];
      OR?: NominationWhereInput[];
      NOT?: NominationWhereInput | NominationWhereInput[];
      playerId?: StringFilter<'Nomination'> | string;
      name?: StringFilter<'Nomination'> | string;
      address?: StringFilter<'Nomination'> | string;
      latitude?: FloatFilter<'Nomination'> | number;
      longitude?: FloatFilter<'Nomination'> | number;
      description?: StringNullableFilter<'Nomination'> | string | null;
      contactInfo?: StringNullableFilter<'Nomination'> | string | null;
      status?: StringFilter<'Nomination'> | string;
      verified?: BoolFilter<'Nomination'> | boolean;
      createdAt?: DateTimeFilter<'Nomination'> | Date | string;
      updatedAt?: DateTimeFilter<'Nomination'> | Date | string;
      player?: XOR<UserScalarRelationFilter, UserWhereInput>;
    },
    'id'
  >;

  export type NominationOrderByWithAggregationInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    name?: SortOrder;
    address?: SortOrder;
    latitude?: SortOrder;
    longitude?: SortOrder;
    description?: SortOrderInput | SortOrder;
    contactInfo?: SortOrderInput | SortOrder;
    status?: SortOrder;
    verified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: NominationCountOrderByAggregateInput;
    _avg?: NominationAvgOrderByAggregateInput;
    _max?: NominationMaxOrderByAggregateInput;
    _min?: NominationMinOrderByAggregateInput;
    _sum?: NominationSumOrderByAggregateInput;
  };

  export type NominationScalarWhereWithAggregatesInput = {
    AND?:
      | NominationScalarWhereWithAggregatesInput
      | NominationScalarWhereWithAggregatesInput[];
    OR?: NominationScalarWhereWithAggregatesInput[];
    NOT?:
      | NominationScalarWhereWithAggregatesInput
      | NominationScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Nomination'> | string;
    playerId?: StringWithAggregatesFilter<'Nomination'> | string;
    name?: StringWithAggregatesFilter<'Nomination'> | string;
    address?: StringWithAggregatesFilter<'Nomination'> | string;
    latitude?: FloatWithAggregatesFilter<'Nomination'> | number;
    longitude?: FloatWithAggregatesFilter<'Nomination'> | number;
    description?:
      | StringNullableWithAggregatesFilter<'Nomination'>
      | string
      | null;
    contactInfo?:
      | StringNullableWithAggregatesFilter<'Nomination'>
      | string
      | null;
    status?: StringWithAggregatesFilter<'Nomination'> | string;
    verified?: BoolWithAggregatesFilter<'Nomination'> | boolean;
    createdAt?: DateTimeWithAggregatesFilter<'Nomination'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Nomination'> | Date | string;
  };

  export type ClanWhereInput = {
    AND?: ClanWhereInput | ClanWhereInput[];
    OR?: ClanWhereInput[];
    NOT?: ClanWhereInput | ClanWhereInput[];
    id?: StringFilter<'Clan'> | string;
    name?: StringFilter<'Clan'> | string;
    tag?: StringFilter<'Clan'> | string;
    description?: StringNullableFilter<'Clan'> | string | null;
    avatar?: StringNullableFilter<'Clan'> | string | null;
    banner?: StringNullableFilter<'Clan'> | string | null;
    leaderId?: StringFilter<'Clan'> | string;
    memberCount?: IntFilter<'Clan'> | number;
    maxMembers?: IntFilter<'Clan'> | number;
    level?: IntFilter<'Clan'> | number;
    experience?: IntFilter<'Clan'> | number;
    territoryCount?: IntFilter<'Clan'> | number;
    totalWins?: IntFilter<'Clan'> | number;
    totalLosses?: IntFilter<'Clan'> | number;
    isPublic?: BoolFilter<'Clan'> | boolean;
    requirements?: StringFilter<'Clan'> | string;
    createdAt?: DateTimeFilter<'Clan'> | Date | string;
    updatedAt?: DateTimeFilter<'Clan'> | Date | string;
    leader?: XOR<UserScalarRelationFilter, UserWhereInput>;
    members?: ClanMemberListRelationFilter;
    controlledDojos?: TerritoryListRelationFilter;
    warsAsClan1?: ClanWarListRelationFilter;
    warsAsClan2?: ClanWarListRelationFilter;
    wonWars?: ClanWarListRelationFilter;
  };

  export type ClanOrderByWithRelationInput = {
    id?: SortOrder;
    name?: SortOrder;
    tag?: SortOrder;
    description?: SortOrderInput | SortOrder;
    avatar?: SortOrderInput | SortOrder;
    banner?: SortOrderInput | SortOrder;
    leaderId?: SortOrder;
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
    isPublic?: SortOrder;
    requirements?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    leader?: UserOrderByWithRelationInput;
    members?: ClanMemberOrderByRelationAggregateInput;
    controlledDojos?: TerritoryOrderByRelationAggregateInput;
    warsAsClan1?: ClanWarOrderByRelationAggregateInput;
    warsAsClan2?: ClanWarOrderByRelationAggregateInput;
    wonWars?: ClanWarOrderByRelationAggregateInput;
  };

  export type ClanWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      name?: string;
      tag?: string;
      AND?: ClanWhereInput | ClanWhereInput[];
      OR?: ClanWhereInput[];
      NOT?: ClanWhereInput | ClanWhereInput[];
      description?: StringNullableFilter<'Clan'> | string | null;
      avatar?: StringNullableFilter<'Clan'> | string | null;
      banner?: StringNullableFilter<'Clan'> | string | null;
      leaderId?: StringFilter<'Clan'> | string;
      memberCount?: IntFilter<'Clan'> | number;
      maxMembers?: IntFilter<'Clan'> | number;
      level?: IntFilter<'Clan'> | number;
      experience?: IntFilter<'Clan'> | number;
      territoryCount?: IntFilter<'Clan'> | number;
      totalWins?: IntFilter<'Clan'> | number;
      totalLosses?: IntFilter<'Clan'> | number;
      isPublic?: BoolFilter<'Clan'> | boolean;
      requirements?: StringFilter<'Clan'> | string;
      createdAt?: DateTimeFilter<'Clan'> | Date | string;
      updatedAt?: DateTimeFilter<'Clan'> | Date | string;
      leader?: XOR<UserScalarRelationFilter, UserWhereInput>;
      members?: ClanMemberListRelationFilter;
      controlledDojos?: TerritoryListRelationFilter;
      warsAsClan1?: ClanWarListRelationFilter;
      warsAsClan2?: ClanWarListRelationFilter;
      wonWars?: ClanWarListRelationFilter;
    },
    'id' | 'name' | 'tag'
  >;

  export type ClanOrderByWithAggregationInput = {
    id?: SortOrder;
    name?: SortOrder;
    tag?: SortOrder;
    description?: SortOrderInput | SortOrder;
    avatar?: SortOrderInput | SortOrder;
    banner?: SortOrderInput | SortOrder;
    leaderId?: SortOrder;
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
    isPublic?: SortOrder;
    requirements?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: ClanCountOrderByAggregateInput;
    _avg?: ClanAvgOrderByAggregateInput;
    _max?: ClanMaxOrderByAggregateInput;
    _min?: ClanMinOrderByAggregateInput;
    _sum?: ClanSumOrderByAggregateInput;
  };

  export type ClanScalarWhereWithAggregatesInput = {
    AND?:
      | ClanScalarWhereWithAggregatesInput
      | ClanScalarWhereWithAggregatesInput[];
    OR?: ClanScalarWhereWithAggregatesInput[];
    NOT?:
      | ClanScalarWhereWithAggregatesInput
      | ClanScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Clan'> | string;
    name?: StringWithAggregatesFilter<'Clan'> | string;
    tag?: StringWithAggregatesFilter<'Clan'> | string;
    description?: StringNullableWithAggregatesFilter<'Clan'> | string | null;
    avatar?: StringNullableWithAggregatesFilter<'Clan'> | string | null;
    banner?: StringNullableWithAggregatesFilter<'Clan'> | string | null;
    leaderId?: StringWithAggregatesFilter<'Clan'> | string;
    memberCount?: IntWithAggregatesFilter<'Clan'> | number;
    maxMembers?: IntWithAggregatesFilter<'Clan'> | number;
    level?: IntWithAggregatesFilter<'Clan'> | number;
    experience?: IntWithAggregatesFilter<'Clan'> | number;
    territoryCount?: IntWithAggregatesFilter<'Clan'> | number;
    totalWins?: IntWithAggregatesFilter<'Clan'> | number;
    totalLosses?: IntWithAggregatesFilter<'Clan'> | number;
    isPublic?: BoolWithAggregatesFilter<'Clan'> | boolean;
    requirements?: StringWithAggregatesFilter<'Clan'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'Clan'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Clan'> | Date | string;
  };

  export type ClanMemberWhereInput = {
    AND?: ClanMemberWhereInput | ClanMemberWhereInput[];
    OR?: ClanMemberWhereInput[];
    NOT?: ClanMemberWhereInput | ClanMemberWhereInput[];
    id?: StringFilter<'ClanMember'> | string;
    userId?: StringFilter<'ClanMember'> | string;
    clanId?: StringFilter<'ClanMember'> | string;
    role?: StringFilter<'ClanMember'> | string;
    contribution?: IntFilter<'ClanMember'> | number;
    territoryCount?: IntFilter<'ClanMember'> | number;
    matchWins?: IntFilter<'ClanMember'> | number;
    joinedAt?: DateTimeFilter<'ClanMember'> | Date | string;
    updatedAt?: DateTimeFilter<'ClanMember'> | Date | string;
    user?: XOR<UserScalarRelationFilter, UserWhereInput>;
    clan?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
  };

  export type ClanMemberOrderByWithRelationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    clanId?: SortOrder;
    role?: SortOrder;
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
    joinedAt?: SortOrder;
    updatedAt?: SortOrder;
    user?: UserOrderByWithRelationInput;
    clan?: ClanOrderByWithRelationInput;
  };

  export type ClanMemberWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      userId?: string;
      AND?: ClanMemberWhereInput | ClanMemberWhereInput[];
      OR?: ClanMemberWhereInput[];
      NOT?: ClanMemberWhereInput | ClanMemberWhereInput[];
      clanId?: StringFilter<'ClanMember'> | string;
      role?: StringFilter<'ClanMember'> | string;
      contribution?: IntFilter<'ClanMember'> | number;
      territoryCount?: IntFilter<'ClanMember'> | number;
      matchWins?: IntFilter<'ClanMember'> | number;
      joinedAt?: DateTimeFilter<'ClanMember'> | Date | string;
      updatedAt?: DateTimeFilter<'ClanMember'> | Date | string;
      user?: XOR<UserScalarRelationFilter, UserWhereInput>;
      clan?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
    },
    'id' | 'userId'
  >;

  export type ClanMemberOrderByWithAggregationInput = {
    id?: SortOrder;
    userId?: SortOrder;
    clanId?: SortOrder;
    role?: SortOrder;
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
    joinedAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: ClanMemberCountOrderByAggregateInput;
    _avg?: ClanMemberAvgOrderByAggregateInput;
    _max?: ClanMemberMaxOrderByAggregateInput;
    _min?: ClanMemberMinOrderByAggregateInput;
    _sum?: ClanMemberSumOrderByAggregateInput;
  };

  export type ClanMemberScalarWhereWithAggregatesInput = {
    AND?:
      | ClanMemberScalarWhereWithAggregatesInput
      | ClanMemberScalarWhereWithAggregatesInput[];
    OR?: ClanMemberScalarWhereWithAggregatesInput[];
    NOT?:
      | ClanMemberScalarWhereWithAggregatesInput
      | ClanMemberScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'ClanMember'> | string;
    userId?: StringWithAggregatesFilter<'ClanMember'> | string;
    clanId?: StringWithAggregatesFilter<'ClanMember'> | string;
    role?: StringWithAggregatesFilter<'ClanMember'> | string;
    contribution?: IntWithAggregatesFilter<'ClanMember'> | number;
    territoryCount?: IntWithAggregatesFilter<'ClanMember'> | number;
    matchWins?: IntWithAggregatesFilter<'ClanMember'> | number;
    joinedAt?: DateTimeWithAggregatesFilter<'ClanMember'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'ClanMember'> | Date | string;
  };

  export type ClanWarWhereInput = {
    AND?: ClanWarWhereInput | ClanWarWhereInput[];
    OR?: ClanWarWhereInput[];
    NOT?: ClanWarWhereInput | ClanWarWhereInput[];
    id?: StringFilter<'ClanWar'> | string;
    name?: StringFilter<'ClanWar'> | string;
    description?: StringNullableFilter<'ClanWar'> | string | null;
    startDate?: DateTimeFilter<'ClanWar'> | Date | string;
    endDate?: DateTimeFilter<'ClanWar'> | Date | string;
    status?: StringFilter<'ClanWar'> | string;
    clan1Id?: StringFilter<'ClanWar'> | string;
    clan1Score?: IntFilter<'ClanWar'> | number;
    clan2Id?: StringFilter<'ClanWar'> | string;
    clan2Score?: IntFilter<'ClanWar'> | number;
    winnerId?: StringNullableFilter<'ClanWar'> | string | null;
    territoryId?: StringNullableFilter<'ClanWar'> | string | null;
    rewards?: StringFilter<'ClanWar'> | string;
    matches?: StringFilter<'ClanWar'> | string;
    createdAt?: DateTimeFilter<'ClanWar'> | Date | string;
    updatedAt?: DateTimeFilter<'ClanWar'> | Date | string;
    clan1?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
    clan2?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
    winner?: XOR<ClanNullableScalarRelationFilter, ClanWhereInput> | null;
    territory?: XOR<
      TerritoryNullableScalarRelationFilter,
      TerritoryWhereInput
    > | null;
  };

  export type ClanWarOrderByWithRelationInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    status?: SortOrder;
    clan1Id?: SortOrder;
    clan1Score?: SortOrder;
    clan2Id?: SortOrder;
    clan2Score?: SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    territoryId?: SortOrderInput | SortOrder;
    rewards?: SortOrder;
    matches?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    clan1?: ClanOrderByWithRelationInput;
    clan2?: ClanOrderByWithRelationInput;
    winner?: ClanOrderByWithRelationInput;
    territory?: TerritoryOrderByWithRelationInput;
  };

  export type ClanWarWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: ClanWarWhereInput | ClanWarWhereInput[];
      OR?: ClanWarWhereInput[];
      NOT?: ClanWarWhereInput | ClanWarWhereInput[];
      name?: StringFilter<'ClanWar'> | string;
      description?: StringNullableFilter<'ClanWar'> | string | null;
      startDate?: DateTimeFilter<'ClanWar'> | Date | string;
      endDate?: DateTimeFilter<'ClanWar'> | Date | string;
      status?: StringFilter<'ClanWar'> | string;
      clan1Id?: StringFilter<'ClanWar'> | string;
      clan1Score?: IntFilter<'ClanWar'> | number;
      clan2Id?: StringFilter<'ClanWar'> | string;
      clan2Score?: IntFilter<'ClanWar'> | number;
      winnerId?: StringNullableFilter<'ClanWar'> | string | null;
      territoryId?: StringNullableFilter<'ClanWar'> | string | null;
      rewards?: StringFilter<'ClanWar'> | string;
      matches?: StringFilter<'ClanWar'> | string;
      createdAt?: DateTimeFilter<'ClanWar'> | Date | string;
      updatedAt?: DateTimeFilter<'ClanWar'> | Date | string;
      clan1?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
      clan2?: XOR<ClanScalarRelationFilter, ClanWhereInput>;
      winner?: XOR<ClanNullableScalarRelationFilter, ClanWhereInput> | null;
      territory?: XOR<
        TerritoryNullableScalarRelationFilter,
        TerritoryWhereInput
      > | null;
    },
    'id'
  >;

  export type ClanWarOrderByWithAggregationInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    status?: SortOrder;
    clan1Id?: SortOrder;
    clan1Score?: SortOrder;
    clan2Id?: SortOrder;
    clan2Score?: SortOrder;
    winnerId?: SortOrderInput | SortOrder;
    territoryId?: SortOrderInput | SortOrder;
    rewards?: SortOrder;
    matches?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: ClanWarCountOrderByAggregateInput;
    _avg?: ClanWarAvgOrderByAggregateInput;
    _max?: ClanWarMaxOrderByAggregateInput;
    _min?: ClanWarMinOrderByAggregateInput;
    _sum?: ClanWarSumOrderByAggregateInput;
  };

  export type ClanWarScalarWhereWithAggregatesInput = {
    AND?:
      | ClanWarScalarWhereWithAggregatesInput
      | ClanWarScalarWhereWithAggregatesInput[];
    OR?: ClanWarScalarWhereWithAggregatesInput[];
    NOT?:
      | ClanWarScalarWhereWithAggregatesInput
      | ClanWarScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'ClanWar'> | string;
    name?: StringWithAggregatesFilter<'ClanWar'> | string;
    description?: StringNullableWithAggregatesFilter<'ClanWar'> | string | null;
    startDate?: DateTimeWithAggregatesFilter<'ClanWar'> | Date | string;
    endDate?: DateTimeWithAggregatesFilter<'ClanWar'> | Date | string;
    status?: StringWithAggregatesFilter<'ClanWar'> | string;
    clan1Id?: StringWithAggregatesFilter<'ClanWar'> | string;
    clan1Score?: IntWithAggregatesFilter<'ClanWar'> | number;
    clan2Id?: StringWithAggregatesFilter<'ClanWar'> | string;
    clan2Score?: IntWithAggregatesFilter<'ClanWar'> | number;
    winnerId?: StringNullableWithAggregatesFilter<'ClanWar'> | string | null;
    territoryId?: StringNullableWithAggregatesFilter<'ClanWar'> | string | null;
    rewards?: StringWithAggregatesFilter<'ClanWar'> | string;
    matches?: StringWithAggregatesFilter<'ClanWar'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'ClanWar'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'ClanWar'> | Date | string;
  };

  export type UserCreateInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserCreateManyInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
  };

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
  };

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
  };

  export type ProfileCreateInput = {
    id?: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    skillLevel?: number;
    preferredGame?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutProfileInput;
  };

  export type ProfileUncheckedCreateInput = {
    id?: string;
    userId: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    skillLevel?: number;
    preferredGame?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutProfileNestedInput;
  };

  export type ProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ProfileCreateManyInput = {
    id?: string;
    userId: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    skillLevel?: number;
    preferredGame?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserSettingsCreateInput = {
    id?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    privacySettings?: string;
    notificationSettings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutSettingsInput;
  };

  export type UserSettingsUncheckedCreateInput = {
    id?: string;
    userId: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    privacySettings?: string;
    notificationSettings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserSettingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutSettingsNestedInput;
  };

  export type UserSettingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserSettingsCreateManyInput = {
    id?: string;
    userId: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    privacySettings?: string;
    notificationSettings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserSettingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserSettingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TerritoryCreateInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryCreateManyInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
  };

  export type TerritoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
  };

  export type TerritoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
  };

  export type UserNFTCreateInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutNftsInput;
    territory?: TerritoryCreateNestedOneWithoutNftsInput;
  };

  export type UserNFTUncheckedCreateInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    userId: string;
    territoryId?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserNFTUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutNftsNestedInput;
    territory?: TerritoryUpdateOneWithoutNftsNestedInput;
  };

  export type UserNFTUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    userId?: StringFieldUpdateOperationsInput | string;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserNFTCreateManyInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    userId: string;
    territoryId?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserNFTUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserNFTUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    userId?: StringFieldUpdateOperationsInput | string;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TournamentCreateInput = {
    id?: string;
    name: string;
    format: string;
    venueId: string;
    startDate: Date | string;
    endDate: Date | string;
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
    status?: string;
    participants?: string;
    matches?: string;
    winnerId?: string | null;
    finalStandings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    endedAt?: Date | string | null;
  };

  export type TournamentUncheckedCreateInput = {
    id?: string;
    name: string;
    format: string;
    venueId: string;
    startDate: Date | string;
    endDate: Date | string;
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
    status?: string;
    participants?: string;
    matches?: string;
    winnerId?: string | null;
    finalStandings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    endedAt?: Date | string | null;
  };

  export type TournamentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    format?: StringFieldUpdateOperationsInput | string;
    venueId?: StringFieldUpdateOperationsInput | string;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    entryFee?: FloatFieldUpdateOperationsInput | number;
    prizePool?: FloatFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    participants?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    finalStandings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type TournamentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    format?: StringFieldUpdateOperationsInput | string;
    venueId?: StringFieldUpdateOperationsInput | string;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    entryFee?: FloatFieldUpdateOperationsInput | number;
    prizePool?: FloatFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    participants?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    finalStandings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type TournamentCreateManyInput = {
    id?: string;
    name: string;
    format: string;
    venueId: string;
    startDate: Date | string;
    endDate: Date | string;
    maxParticipants: number;
    entryFee: number;
    prizePool: number;
    status?: string;
    participants?: string;
    matches?: string;
    winnerId?: string | null;
    finalStandings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    endedAt?: Date | string | null;
  };

  export type TournamentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    format?: StringFieldUpdateOperationsInput | string;
    venueId?: StringFieldUpdateOperationsInput | string;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    entryFee?: FloatFieldUpdateOperationsInput | number;
    prizePool?: FloatFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    participants?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    finalStandings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type TournamentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    format?: StringFieldUpdateOperationsInput | string;
    venueId?: StringFieldUpdateOperationsInput | string;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    entryFee?: FloatFieldUpdateOperationsInput | number;
    prizePool?: FloatFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    participants?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    finalStandings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type ChallengeCreateInput = {
    id?: string;
    type: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    challenger: UserCreateNestedOneWithoutChallengesAsChallengerInput;
    defender: UserCreateNestedOneWithoutChallengesAsDefenderInput;
    dojo: TerritoryCreateNestedOneWithoutChallengesInput;
  };

  export type ChallengeUncheckedCreateInput = {
    id?: string;
    type: string;
    challengerId: string;
    defenderId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    challenger?: UserUpdateOneRequiredWithoutChallengesAsChallengerNestedInput;
    defender?: UserUpdateOneRequiredWithoutChallengesAsDefenderNestedInput;
    dojo?: TerritoryUpdateOneRequiredWithoutChallengesNestedInput;
  };

  export type ChallengeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeCreateManyInput = {
    id?: string;
    type: string;
    challengerId: string;
    defenderId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationCreateInput = {
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    player: UserCreateNestedOneWithoutNominationsInput;
  };

  export type NominationUncheckedCreateInput = {
    id?: string;
    playerId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type NominationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    player?: UserUpdateOneRequiredWithoutNominationsNestedInput;
  };

  export type NominationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    playerId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationCreateManyInput = {
    id?: string;
    playerId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type NominationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    playerId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanCreateInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanCreateManyInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanMemberCreateInput = {
    id?: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutClanMembershipInput;
    clan: ClanCreateNestedOneWithoutMembersInput;
  };

  export type ClanMemberUncheckedCreateInput = {
    id?: string;
    userId: string;
    clanId: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanMemberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutClanMembershipNestedInput;
    clan?: ClanUpdateOneRequiredWithoutMembersNestedInput;
  };

  export type ClanMemberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    clanId?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanMemberCreateManyInput = {
    id?: string;
    userId: string;
    clanId: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanMemberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanMemberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    clanId?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarCreateInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Score?: number;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    clan1: ClanCreateNestedOneWithoutWarsAsClan1Input;
    clan2: ClanCreateNestedOneWithoutWarsAsClan2Input;
    winner?: ClanCreateNestedOneWithoutWonWarsInput;
    territory?: TerritoryCreateNestedOneWithoutContestedWarsInput;
  };

  export type ClanWarUncheckedCreateInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan1?: ClanUpdateOneRequiredWithoutWarsAsClan1NestedInput;
    clan2?: ClanUpdateOneRequiredWithoutWarsAsClan2NestedInput;
    winner?: ClanUpdateOneWithoutWonWarsNestedInput;
    territory?: TerritoryUpdateOneWithoutContestedWarsNestedInput;
  };

  export type ClanWarUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarCreateManyInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type ProfileNullableScalarRelationFilter = {
    is?: ProfileWhereInput | null;
    isNot?: ProfileWhereInput | null;
  };

  export type UserSettingsNullableScalarRelationFilter = {
    is?: UserSettingsWhereInput | null;
    isNot?: UserSettingsWhereInput | null;
  };

  export type TerritoryListRelationFilter = {
    every?: TerritoryWhereInput;
    some?: TerritoryWhereInput;
    none?: TerritoryWhereInput;
  };

  export type UserNFTListRelationFilter = {
    every?: UserNFTWhereInput;
    some?: UserNFTWhereInput;
    none?: UserNFTWhereInput;
  };

  export type ChallengeListRelationFilter = {
    every?: ChallengeWhereInput;
    some?: ChallengeWhereInput;
    none?: ChallengeWhereInput;
  };

  export type NominationListRelationFilter = {
    every?: NominationWhereInput;
    some?: NominationWhereInput;
    none?: NominationWhereInput;
  };

  export type TerritoryNullableScalarRelationFilter = {
    is?: TerritoryWhereInput | null;
    isNot?: TerritoryWhereInput | null;
  };

  export type ClanListRelationFilter = {
    every?: ClanWhereInput;
    some?: ClanWhereInput;
    none?: ClanWhereInput;
  };

  export type ClanMemberNullableScalarRelationFilter = {
    is?: ClanMemberWhereInput | null;
    isNot?: ClanMemberWhereInput | null;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type TerritoryOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type UserNFTOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type ChallengeOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type NominationOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type ClanOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder;
    email?: SortOrder;
    password?: SortOrder;
    role?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    homeDojoId?: SortOrder;
    unlockedZones?: SortOrder;
    relationships?: SortOrder;
  };

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder;
    email?: SortOrder;
    password?: SortOrder;
    role?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    homeDojoId?: SortOrder;
    unlockedZones?: SortOrder;
    relationships?: SortOrder;
  };

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder;
    email?: SortOrder;
    password?: SortOrder;
    role?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    homeDojoId?: SortOrder;
    unlockedZones?: SortOrder;
    relationships?: SortOrder;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type UserScalarRelationFilter = {
    is?: UserWhereInput;
    isNot?: UserWhereInput;
  };

  export type ProfileCountOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    displayName?: SortOrder;
    bio?: SortOrder;
    avatarUrl?: SortOrder;
    location?: SortOrder;
    skillLevel?: SortOrder;
    preferredGame?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ProfileAvgOrderByAggregateInput = {
    skillLevel?: SortOrder;
  };

  export type ProfileMaxOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    displayName?: SortOrder;
    bio?: SortOrder;
    avatarUrl?: SortOrder;
    location?: SortOrder;
    skillLevel?: SortOrder;
    preferredGame?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ProfileMinOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    displayName?: SortOrder;
    bio?: SortOrder;
    avatarUrl?: SortOrder;
    location?: SortOrder;
    skillLevel?: SortOrder;
    preferredGame?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ProfileSumOrderByAggregateInput = {
    skillLevel?: SortOrder;
  };

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type UserSettingsCountOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    emailNotifications?: SortOrder;
    pushNotifications?: SortOrder;
    darkMode?: SortOrder;
    language?: SortOrder;
    timezone?: SortOrder;
    privacySettings?: SortOrder;
    notificationSettings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserSettingsMaxOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    emailNotifications?: SortOrder;
    pushNotifications?: SortOrder;
    darkMode?: SortOrder;
    language?: SortOrder;
    timezone?: SortOrder;
    privacySettings?: SortOrder;
    notificationSettings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserSettingsMinOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    emailNotifications?: SortOrder;
    pushNotifications?: SortOrder;
    darkMode?: SortOrder;
    language?: SortOrder;
    timezone?: SortOrder;
    privacySettings?: SortOrder;
    notificationSettings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null;
    isNot?: UserWhereInput | null;
  };

  export type UserListRelationFilter = {
    every?: UserWhereInput;
    some?: UserWhereInput;
    none?: UserWhereInput;
  };

  export type ClanNullableScalarRelationFilter = {
    is?: ClanWhereInput | null;
    isNot?: ClanWhereInput | null;
  };

  export type ClanWarListRelationFilter = {
    every?: ClanWarWhereInput;
    some?: ClanWarWhereInput;
    none?: ClanWarWhereInput;
  };

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type ClanWarOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type TerritoryCountOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    coordinates?: SortOrder;
    requiredNFT?: SortOrder;
    influence?: SortOrder;
    ownerId?: SortOrder;
    clan?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    venueOwnerId?: SortOrder;
    status?: SortOrder;
    leaderboard?: SortOrder;
    allegianceMeter?: SortOrder;
    controllingClanId?: SortOrder;
  };

  export type TerritoryAvgOrderByAggregateInput = {
    influence?: SortOrder;
    allegianceMeter?: SortOrder;
  };

  export type TerritoryMaxOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    coordinates?: SortOrder;
    requiredNFT?: SortOrder;
    influence?: SortOrder;
    ownerId?: SortOrder;
    clan?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    venueOwnerId?: SortOrder;
    status?: SortOrder;
    leaderboard?: SortOrder;
    allegianceMeter?: SortOrder;
    controllingClanId?: SortOrder;
  };

  export type TerritoryMinOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    coordinates?: SortOrder;
    requiredNFT?: SortOrder;
    influence?: SortOrder;
    ownerId?: SortOrder;
    clan?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    venueOwnerId?: SortOrder;
    status?: SortOrder;
    leaderboard?: SortOrder;
    allegianceMeter?: SortOrder;
    controllingClanId?: SortOrder;
  };

  export type TerritorySumOrderByAggregateInput = {
    influence?: SortOrder;
    allegianceMeter?: SortOrder;
  };

  export type UserNFTCountOrderByAggregateInput = {
    id?: SortOrder;
    tokenId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    imageUrl?: SortOrder;
    metadata?: SortOrder;
    acquiredAt?: SortOrder;
    userId?: SortOrder;
    territoryId?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserNFTMaxOrderByAggregateInput = {
    id?: SortOrder;
    tokenId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    imageUrl?: SortOrder;
    metadata?: SortOrder;
    acquiredAt?: SortOrder;
    userId?: SortOrder;
    territoryId?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserNFTMinOrderByAggregateInput = {
    id?: SortOrder;
    tokenId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    imageUrl?: SortOrder;
    metadata?: SortOrder;
    acquiredAt?: SortOrder;
    userId?: SortOrder;
    territoryId?: SortOrder;
    isActive?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatFilter<$PrismaModel> | number;
  };

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type TournamentCountOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    format?: SortOrder;
    venueId?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
    status?: SortOrder;
    participants?: SortOrder;
    matches?: SortOrder;
    winnerId?: SortOrder;
    finalStandings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    endedAt?: SortOrder;
  };

  export type TournamentAvgOrderByAggregateInput = {
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
  };

  export type TournamentMaxOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    format?: SortOrder;
    venueId?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
    status?: SortOrder;
    participants?: SortOrder;
    matches?: SortOrder;
    winnerId?: SortOrder;
    finalStandings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    endedAt?: SortOrder;
  };

  export type TournamentMinOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    format?: SortOrder;
    venueId?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
    status?: SortOrder;
    participants?: SortOrder;
    matches?: SortOrder;
    winnerId?: SortOrder;
    finalStandings?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    endedAt?: SortOrder;
  };

  export type TournamentSumOrderByAggregateInput = {
    maxParticipants?: SortOrder;
    entryFee?: SortOrder;
    prizePool?: SortOrder;
  };

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedFloatFilter<$PrismaModel>;
    _min?: NestedFloatFilter<$PrismaModel>;
    _max?: NestedFloatFilter<$PrismaModel>;
  };

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?:
      | NestedDateTimeNullableWithAggregatesFilter<$PrismaModel>
      | Date
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type TerritoryScalarRelationFilter = {
    is?: TerritoryWhereInput;
    isNot?: TerritoryWhereInput;
  };

  export type ChallengeCountOrderByAggregateInput = {
    id?: SortOrder;
    type?: SortOrder;
    challengerId?: SortOrder;
    defenderId?: SortOrder;
    dojoId?: SortOrder;
    status?: SortOrder;
    outcome?: SortOrder;
    winnerId?: SortOrder;
    requirements?: SortOrder;
    matchData?: SortOrder;
    expiresAt?: SortOrder;
    acceptedAt?: SortOrder;
    declinedAt?: SortOrder;
    completedAt?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ChallengeMaxOrderByAggregateInput = {
    id?: SortOrder;
    type?: SortOrder;
    challengerId?: SortOrder;
    defenderId?: SortOrder;
    dojoId?: SortOrder;
    status?: SortOrder;
    outcome?: SortOrder;
    winnerId?: SortOrder;
    requirements?: SortOrder;
    matchData?: SortOrder;
    expiresAt?: SortOrder;
    acceptedAt?: SortOrder;
    declinedAt?: SortOrder;
    completedAt?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ChallengeMinOrderByAggregateInput = {
    id?: SortOrder;
    type?: SortOrder;
    challengerId?: SortOrder;
    defenderId?: SortOrder;
    dojoId?: SortOrder;
    status?: SortOrder;
    outcome?: SortOrder;
    winnerId?: SortOrder;
    requirements?: SortOrder;
    matchData?: SortOrder;
    expiresAt?: SortOrder;
    acceptedAt?: SortOrder;
    declinedAt?: SortOrder;
    completedAt?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type NominationCountOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    name?: SortOrder;
    address?: SortOrder;
    latitude?: SortOrder;
    longitude?: SortOrder;
    description?: SortOrder;
    contactInfo?: SortOrder;
    status?: SortOrder;
    verified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type NominationAvgOrderByAggregateInput = {
    latitude?: SortOrder;
    longitude?: SortOrder;
  };

  export type NominationMaxOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    name?: SortOrder;
    address?: SortOrder;
    latitude?: SortOrder;
    longitude?: SortOrder;
    description?: SortOrder;
    contactInfo?: SortOrder;
    status?: SortOrder;
    verified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type NominationMinOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    name?: SortOrder;
    address?: SortOrder;
    latitude?: SortOrder;
    longitude?: SortOrder;
    description?: SortOrder;
    contactInfo?: SortOrder;
    status?: SortOrder;
    verified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type NominationSumOrderByAggregateInput = {
    latitude?: SortOrder;
    longitude?: SortOrder;
  };

  export type ClanMemberListRelationFilter = {
    every?: ClanMemberWhereInput;
    some?: ClanMemberWhereInput;
    none?: ClanMemberWhereInput;
  };

  export type ClanMemberOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type ClanCountOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    tag?: SortOrder;
    description?: SortOrder;
    avatar?: SortOrder;
    banner?: SortOrder;
    leaderId?: SortOrder;
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
    isPublic?: SortOrder;
    requirements?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanAvgOrderByAggregateInput = {
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
  };

  export type ClanMaxOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    tag?: SortOrder;
    description?: SortOrder;
    avatar?: SortOrder;
    banner?: SortOrder;
    leaderId?: SortOrder;
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
    isPublic?: SortOrder;
    requirements?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanMinOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    tag?: SortOrder;
    description?: SortOrder;
    avatar?: SortOrder;
    banner?: SortOrder;
    leaderId?: SortOrder;
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
    isPublic?: SortOrder;
    requirements?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanSumOrderByAggregateInput = {
    memberCount?: SortOrder;
    maxMembers?: SortOrder;
    level?: SortOrder;
    experience?: SortOrder;
    territoryCount?: SortOrder;
    totalWins?: SortOrder;
    totalLosses?: SortOrder;
  };

  export type ClanScalarRelationFilter = {
    is?: ClanWhereInput;
    isNot?: ClanWhereInput;
  };

  export type ClanMemberCountOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    clanId?: SortOrder;
    role?: SortOrder;
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
    joinedAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanMemberAvgOrderByAggregateInput = {
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
  };

  export type ClanMemberMaxOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    clanId?: SortOrder;
    role?: SortOrder;
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
    joinedAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanMemberMinOrderByAggregateInput = {
    id?: SortOrder;
    userId?: SortOrder;
    clanId?: SortOrder;
    role?: SortOrder;
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
    joinedAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanMemberSumOrderByAggregateInput = {
    contribution?: SortOrder;
    territoryCount?: SortOrder;
    matchWins?: SortOrder;
  };

  export type ClanWarCountOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    status?: SortOrder;
    clan1Id?: SortOrder;
    clan1Score?: SortOrder;
    clan2Id?: SortOrder;
    clan2Score?: SortOrder;
    winnerId?: SortOrder;
    territoryId?: SortOrder;
    rewards?: SortOrder;
    matches?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanWarAvgOrderByAggregateInput = {
    clan1Score?: SortOrder;
    clan2Score?: SortOrder;
  };

  export type ClanWarMaxOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    status?: SortOrder;
    clan1Id?: SortOrder;
    clan1Score?: SortOrder;
    clan2Id?: SortOrder;
    clan2Score?: SortOrder;
    winnerId?: SortOrder;
    territoryId?: SortOrder;
    rewards?: SortOrder;
    matches?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanWarMinOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    status?: SortOrder;
    clan1Id?: SortOrder;
    clan1Score?: SortOrder;
    clan2Id?: SortOrder;
    clan2Score?: SortOrder;
    winnerId?: SortOrder;
    territoryId?: SortOrder;
    rewards?: SortOrder;
    matches?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type ClanWarSumOrderByAggregateInput = {
    clan1Score?: SortOrder;
    clan2Score?: SortOrder;
  };

  export type ProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ProfileCreateOrConnectWithoutUserInput;
    connect?: ProfileWhereUniqueInput;
  };

  export type UserSettingsCreateNestedOneWithoutUserInput = {
    create?: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: UserSettingsCreateOrConnectWithoutUserInput;
    connect?: UserSettingsWhereUniqueInput;
  };

  export type TerritoryCreateNestedManyWithoutOwnerInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutOwnerInput,
          TerritoryUncheckedCreateWithoutOwnerInput
        >
      | TerritoryCreateWithoutOwnerInput[]
      | TerritoryUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutOwnerInput
      | TerritoryCreateOrConnectWithoutOwnerInput[];
    createMany?: TerritoryCreateManyOwnerInputEnvelope;
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
  };

  export type UserNFTCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutUserInput,
          UserNFTUncheckedCreateWithoutUserInput
        >
      | UserNFTCreateWithoutUserInput[]
      | UserNFTUncheckedCreateWithoutUserInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutUserInput
      | UserNFTCreateOrConnectWithoutUserInput[];
    createMany?: UserNFTCreateManyUserInputEnvelope;
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
  };

  export type ChallengeCreateNestedManyWithoutChallengerInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutChallengerInput,
          ChallengeUncheckedCreateWithoutChallengerInput
        >
      | ChallengeCreateWithoutChallengerInput[]
      | ChallengeUncheckedCreateWithoutChallengerInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutChallengerInput
      | ChallengeCreateOrConnectWithoutChallengerInput[];
    createMany?: ChallengeCreateManyChallengerInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type ChallengeCreateNestedManyWithoutDefenderInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDefenderInput,
          ChallengeUncheckedCreateWithoutDefenderInput
        >
      | ChallengeCreateWithoutDefenderInput[]
      | ChallengeUncheckedCreateWithoutDefenderInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDefenderInput
      | ChallengeCreateOrConnectWithoutDefenderInput[];
    createMany?: ChallengeCreateManyDefenderInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type NominationCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<
          NominationCreateWithoutPlayerInput,
          NominationUncheckedCreateWithoutPlayerInput
        >
      | NominationCreateWithoutPlayerInput[]
      | NominationUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | NominationCreateOrConnectWithoutPlayerInput
      | NominationCreateOrConnectWithoutPlayerInput[];
    createMany?: NominationCreateManyPlayerInputEnvelope;
    connect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
  };

  export type TerritoryCreateNestedOneWithoutHomeDojoUsersInput = {
    create?: XOR<
      TerritoryCreateWithoutHomeDojoUsersInput,
      TerritoryUncheckedCreateWithoutHomeDojoUsersInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutHomeDojoUsersInput;
    connect?: TerritoryWhereUniqueInput;
  };

  export type ClanCreateNestedManyWithoutLeaderInput = {
    create?:
      | XOR<ClanCreateWithoutLeaderInput, ClanUncheckedCreateWithoutLeaderInput>
      | ClanCreateWithoutLeaderInput[]
      | ClanUncheckedCreateWithoutLeaderInput[];
    connectOrCreate?:
      | ClanCreateOrConnectWithoutLeaderInput
      | ClanCreateOrConnectWithoutLeaderInput[];
    createMany?: ClanCreateManyLeaderInputEnvelope;
    connect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
  };

  export type ClanMemberCreateNestedOneWithoutUserInput = {
    create?: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ClanMemberCreateOrConnectWithoutUserInput;
    connect?: ClanMemberWhereUniqueInput;
  };

  export type ProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ProfileCreateOrConnectWithoutUserInput;
    connect?: ProfileWhereUniqueInput;
  };

  export type UserSettingsUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: UserSettingsCreateOrConnectWithoutUserInput;
    connect?: UserSettingsWhereUniqueInput;
  };

  export type TerritoryUncheckedCreateNestedManyWithoutOwnerInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutOwnerInput,
          TerritoryUncheckedCreateWithoutOwnerInput
        >
      | TerritoryCreateWithoutOwnerInput[]
      | TerritoryUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutOwnerInput
      | TerritoryCreateOrConnectWithoutOwnerInput[];
    createMany?: TerritoryCreateManyOwnerInputEnvelope;
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
  };

  export type UserNFTUncheckedCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutUserInput,
          UserNFTUncheckedCreateWithoutUserInput
        >
      | UserNFTCreateWithoutUserInput[]
      | UserNFTUncheckedCreateWithoutUserInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutUserInput
      | UserNFTCreateOrConnectWithoutUserInput[];
    createMany?: UserNFTCreateManyUserInputEnvelope;
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
  };

  export type ChallengeUncheckedCreateNestedManyWithoutChallengerInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutChallengerInput,
          ChallengeUncheckedCreateWithoutChallengerInput
        >
      | ChallengeCreateWithoutChallengerInput[]
      | ChallengeUncheckedCreateWithoutChallengerInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutChallengerInput
      | ChallengeCreateOrConnectWithoutChallengerInput[];
    createMany?: ChallengeCreateManyChallengerInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type ChallengeUncheckedCreateNestedManyWithoutDefenderInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDefenderInput,
          ChallengeUncheckedCreateWithoutDefenderInput
        >
      | ChallengeCreateWithoutDefenderInput[]
      | ChallengeUncheckedCreateWithoutDefenderInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDefenderInput
      | ChallengeCreateOrConnectWithoutDefenderInput[];
    createMany?: ChallengeCreateManyDefenderInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type NominationUncheckedCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<
          NominationCreateWithoutPlayerInput,
          NominationUncheckedCreateWithoutPlayerInput
        >
      | NominationCreateWithoutPlayerInput[]
      | NominationUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | NominationCreateOrConnectWithoutPlayerInput
      | NominationCreateOrConnectWithoutPlayerInput[];
    createMany?: NominationCreateManyPlayerInputEnvelope;
    connect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
  };

  export type ClanUncheckedCreateNestedManyWithoutLeaderInput = {
    create?:
      | XOR<ClanCreateWithoutLeaderInput, ClanUncheckedCreateWithoutLeaderInput>
      | ClanCreateWithoutLeaderInput[]
      | ClanUncheckedCreateWithoutLeaderInput[];
    connectOrCreate?:
      | ClanCreateOrConnectWithoutLeaderInput
      | ClanCreateOrConnectWithoutLeaderInput[];
    createMany?: ClanCreateManyLeaderInputEnvelope;
    connect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
  };

  export type ClanMemberUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ClanMemberCreateOrConnectWithoutUserInput;
    connect?: ClanMemberWhereUniqueInput;
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
  };

  export type ProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ProfileCreateOrConnectWithoutUserInput;
    upsert?: ProfileUpsertWithoutUserInput;
    disconnect?: ProfileWhereInput | boolean;
    delete?: ProfileWhereInput | boolean;
    connect?: ProfileWhereUniqueInput;
    update?: XOR<
      XOR<
        ProfileUpdateToOneWithWhereWithoutUserInput,
        ProfileUpdateWithoutUserInput
      >,
      ProfileUncheckedUpdateWithoutUserInput
    >;
  };

  export type UserSettingsUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: UserSettingsCreateOrConnectWithoutUserInput;
    upsert?: UserSettingsUpsertWithoutUserInput;
    disconnect?: UserSettingsWhereInput | boolean;
    delete?: UserSettingsWhereInput | boolean;
    connect?: UserSettingsWhereUniqueInput;
    update?: XOR<
      XOR<
        UserSettingsUpdateToOneWithWhereWithoutUserInput,
        UserSettingsUpdateWithoutUserInput
      >,
      UserSettingsUncheckedUpdateWithoutUserInput
    >;
  };

  export type TerritoryUpdateManyWithoutOwnerNestedInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutOwnerInput,
          TerritoryUncheckedCreateWithoutOwnerInput
        >
      | TerritoryCreateWithoutOwnerInput[]
      | TerritoryUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutOwnerInput
      | TerritoryCreateOrConnectWithoutOwnerInput[];
    upsert?:
      | TerritoryUpsertWithWhereUniqueWithoutOwnerInput
      | TerritoryUpsertWithWhereUniqueWithoutOwnerInput[];
    createMany?: TerritoryCreateManyOwnerInputEnvelope;
    set?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    disconnect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    delete?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    update?:
      | TerritoryUpdateWithWhereUniqueWithoutOwnerInput
      | TerritoryUpdateWithWhereUniqueWithoutOwnerInput[];
    updateMany?:
      | TerritoryUpdateManyWithWhereWithoutOwnerInput
      | TerritoryUpdateManyWithWhereWithoutOwnerInput[];
    deleteMany?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
  };

  export type UserNFTUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutUserInput,
          UserNFTUncheckedCreateWithoutUserInput
        >
      | UserNFTCreateWithoutUserInput[]
      | UserNFTUncheckedCreateWithoutUserInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutUserInput
      | UserNFTCreateOrConnectWithoutUserInput[];
    upsert?:
      | UserNFTUpsertWithWhereUniqueWithoutUserInput
      | UserNFTUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: UserNFTCreateManyUserInputEnvelope;
    set?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    disconnect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    delete?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    update?:
      | UserNFTUpdateWithWhereUniqueWithoutUserInput
      | UserNFTUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?:
      | UserNFTUpdateManyWithWhereWithoutUserInput
      | UserNFTUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
  };

  export type ChallengeUpdateManyWithoutChallengerNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutChallengerInput,
          ChallengeUncheckedCreateWithoutChallengerInput
        >
      | ChallengeCreateWithoutChallengerInput[]
      | ChallengeUncheckedCreateWithoutChallengerInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutChallengerInput
      | ChallengeCreateOrConnectWithoutChallengerInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutChallengerInput
      | ChallengeUpsertWithWhereUniqueWithoutChallengerInput[];
    createMany?: ChallengeCreateManyChallengerInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutChallengerInput
      | ChallengeUpdateWithWhereUniqueWithoutChallengerInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutChallengerInput
      | ChallengeUpdateManyWithWhereWithoutChallengerInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type ChallengeUpdateManyWithoutDefenderNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDefenderInput,
          ChallengeUncheckedCreateWithoutDefenderInput
        >
      | ChallengeCreateWithoutDefenderInput[]
      | ChallengeUncheckedCreateWithoutDefenderInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDefenderInput
      | ChallengeCreateOrConnectWithoutDefenderInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutDefenderInput
      | ChallengeUpsertWithWhereUniqueWithoutDefenderInput[];
    createMany?: ChallengeCreateManyDefenderInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutDefenderInput
      | ChallengeUpdateWithWhereUniqueWithoutDefenderInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutDefenderInput
      | ChallengeUpdateManyWithWhereWithoutDefenderInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type NominationUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<
          NominationCreateWithoutPlayerInput,
          NominationUncheckedCreateWithoutPlayerInput
        >
      | NominationCreateWithoutPlayerInput[]
      | NominationUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | NominationCreateOrConnectWithoutPlayerInput
      | NominationCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | NominationUpsertWithWhereUniqueWithoutPlayerInput
      | NominationUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: NominationCreateManyPlayerInputEnvelope;
    set?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    disconnect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    delete?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    connect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    update?:
      | NominationUpdateWithWhereUniqueWithoutPlayerInput
      | NominationUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | NominationUpdateManyWithWhereWithoutPlayerInput
      | NominationUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: NominationScalarWhereInput | NominationScalarWhereInput[];
  };

  export type TerritoryUpdateOneWithoutHomeDojoUsersNestedInput = {
    create?: XOR<
      TerritoryCreateWithoutHomeDojoUsersInput,
      TerritoryUncheckedCreateWithoutHomeDojoUsersInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutHomeDojoUsersInput;
    upsert?: TerritoryUpsertWithoutHomeDojoUsersInput;
    disconnect?: TerritoryWhereInput | boolean;
    delete?: TerritoryWhereInput | boolean;
    connect?: TerritoryWhereUniqueInput;
    update?: XOR<
      XOR<
        TerritoryUpdateToOneWithWhereWithoutHomeDojoUsersInput,
        TerritoryUpdateWithoutHomeDojoUsersInput
      >,
      TerritoryUncheckedUpdateWithoutHomeDojoUsersInput
    >;
  };

  export type ClanUpdateManyWithoutLeaderNestedInput = {
    create?:
      | XOR<ClanCreateWithoutLeaderInput, ClanUncheckedCreateWithoutLeaderInput>
      | ClanCreateWithoutLeaderInput[]
      | ClanUncheckedCreateWithoutLeaderInput[];
    connectOrCreate?:
      | ClanCreateOrConnectWithoutLeaderInput
      | ClanCreateOrConnectWithoutLeaderInput[];
    upsert?:
      | ClanUpsertWithWhereUniqueWithoutLeaderInput
      | ClanUpsertWithWhereUniqueWithoutLeaderInput[];
    createMany?: ClanCreateManyLeaderInputEnvelope;
    set?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    disconnect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    delete?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    connect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    update?:
      | ClanUpdateWithWhereUniqueWithoutLeaderInput
      | ClanUpdateWithWhereUniqueWithoutLeaderInput[];
    updateMany?:
      | ClanUpdateManyWithWhereWithoutLeaderInput
      | ClanUpdateManyWithWhereWithoutLeaderInput[];
    deleteMany?: ClanScalarWhereInput | ClanScalarWhereInput[];
  };

  export type ClanMemberUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ClanMemberCreateOrConnectWithoutUserInput;
    upsert?: ClanMemberUpsertWithoutUserInput;
    disconnect?: ClanMemberWhereInput | boolean;
    delete?: ClanMemberWhereInput | boolean;
    connect?: ClanMemberWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanMemberUpdateToOneWithWhereWithoutUserInput,
        ClanMemberUpdateWithoutUserInput
      >,
      ClanMemberUncheckedUpdateWithoutUserInput
    >;
  };

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
  };

  export type ProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ProfileCreateOrConnectWithoutUserInput;
    upsert?: ProfileUpsertWithoutUserInput;
    disconnect?: ProfileWhereInput | boolean;
    delete?: ProfileWhereInput | boolean;
    connect?: ProfileWhereUniqueInput;
    update?: XOR<
      XOR<
        ProfileUpdateToOneWithWhereWithoutUserInput,
        ProfileUpdateWithoutUserInput
      >,
      ProfileUncheckedUpdateWithoutUserInput
    >;
  };

  export type UserSettingsUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: UserSettingsCreateOrConnectWithoutUserInput;
    upsert?: UserSettingsUpsertWithoutUserInput;
    disconnect?: UserSettingsWhereInput | boolean;
    delete?: UserSettingsWhereInput | boolean;
    connect?: UserSettingsWhereUniqueInput;
    update?: XOR<
      XOR<
        UserSettingsUpdateToOneWithWhereWithoutUserInput,
        UserSettingsUpdateWithoutUserInput
      >,
      UserSettingsUncheckedUpdateWithoutUserInput
    >;
  };

  export type TerritoryUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutOwnerInput,
          TerritoryUncheckedCreateWithoutOwnerInput
        >
      | TerritoryCreateWithoutOwnerInput[]
      | TerritoryUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutOwnerInput
      | TerritoryCreateOrConnectWithoutOwnerInput[];
    upsert?:
      | TerritoryUpsertWithWhereUniqueWithoutOwnerInput
      | TerritoryUpsertWithWhereUniqueWithoutOwnerInput[];
    createMany?: TerritoryCreateManyOwnerInputEnvelope;
    set?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    disconnect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    delete?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    update?:
      | TerritoryUpdateWithWhereUniqueWithoutOwnerInput
      | TerritoryUpdateWithWhereUniqueWithoutOwnerInput[];
    updateMany?:
      | TerritoryUpdateManyWithWhereWithoutOwnerInput
      | TerritoryUpdateManyWithWhereWithoutOwnerInput[];
    deleteMany?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
  };

  export type UserNFTUncheckedUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutUserInput,
          UserNFTUncheckedCreateWithoutUserInput
        >
      | UserNFTCreateWithoutUserInput[]
      | UserNFTUncheckedCreateWithoutUserInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutUserInput
      | UserNFTCreateOrConnectWithoutUserInput[];
    upsert?:
      | UserNFTUpsertWithWhereUniqueWithoutUserInput
      | UserNFTUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: UserNFTCreateManyUserInputEnvelope;
    set?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    disconnect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    delete?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    update?:
      | UserNFTUpdateWithWhereUniqueWithoutUserInput
      | UserNFTUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?:
      | UserNFTUpdateManyWithWhereWithoutUserInput
      | UserNFTUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
  };

  export type ChallengeUncheckedUpdateManyWithoutChallengerNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutChallengerInput,
          ChallengeUncheckedCreateWithoutChallengerInput
        >
      | ChallengeCreateWithoutChallengerInput[]
      | ChallengeUncheckedCreateWithoutChallengerInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutChallengerInput
      | ChallengeCreateOrConnectWithoutChallengerInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutChallengerInput
      | ChallengeUpsertWithWhereUniqueWithoutChallengerInput[];
    createMany?: ChallengeCreateManyChallengerInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutChallengerInput
      | ChallengeUpdateWithWhereUniqueWithoutChallengerInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutChallengerInput
      | ChallengeUpdateManyWithWhereWithoutChallengerInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type ChallengeUncheckedUpdateManyWithoutDefenderNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDefenderInput,
          ChallengeUncheckedCreateWithoutDefenderInput
        >
      | ChallengeCreateWithoutDefenderInput[]
      | ChallengeUncheckedCreateWithoutDefenderInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDefenderInput
      | ChallengeCreateOrConnectWithoutDefenderInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutDefenderInput
      | ChallengeUpsertWithWhereUniqueWithoutDefenderInput[];
    createMany?: ChallengeCreateManyDefenderInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutDefenderInput
      | ChallengeUpdateWithWhereUniqueWithoutDefenderInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutDefenderInput
      | ChallengeUpdateManyWithWhereWithoutDefenderInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type NominationUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<
          NominationCreateWithoutPlayerInput,
          NominationUncheckedCreateWithoutPlayerInput
        >
      | NominationCreateWithoutPlayerInput[]
      | NominationUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | NominationCreateOrConnectWithoutPlayerInput
      | NominationCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | NominationUpsertWithWhereUniqueWithoutPlayerInput
      | NominationUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: NominationCreateManyPlayerInputEnvelope;
    set?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    disconnect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    delete?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    connect?: NominationWhereUniqueInput | NominationWhereUniqueInput[];
    update?:
      | NominationUpdateWithWhereUniqueWithoutPlayerInput
      | NominationUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | NominationUpdateManyWithWhereWithoutPlayerInput
      | NominationUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: NominationScalarWhereInput | NominationScalarWhereInput[];
  };

  export type ClanUncheckedUpdateManyWithoutLeaderNestedInput = {
    create?:
      | XOR<ClanCreateWithoutLeaderInput, ClanUncheckedCreateWithoutLeaderInput>
      | ClanCreateWithoutLeaderInput[]
      | ClanUncheckedCreateWithoutLeaderInput[];
    connectOrCreate?:
      | ClanCreateOrConnectWithoutLeaderInput
      | ClanCreateOrConnectWithoutLeaderInput[];
    upsert?:
      | ClanUpsertWithWhereUniqueWithoutLeaderInput
      | ClanUpsertWithWhereUniqueWithoutLeaderInput[];
    createMany?: ClanCreateManyLeaderInputEnvelope;
    set?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    disconnect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    delete?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    connect?: ClanWhereUniqueInput | ClanWhereUniqueInput[];
    update?:
      | ClanUpdateWithWhereUniqueWithoutLeaderInput
      | ClanUpdateWithWhereUniqueWithoutLeaderInput[];
    updateMany?:
      | ClanUpdateManyWithWhereWithoutLeaderInput
      | ClanUpdateManyWithWhereWithoutLeaderInput[];
    deleteMany?: ClanScalarWhereInput | ClanScalarWhereInput[];
  };

  export type ClanMemberUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
    connectOrCreate?: ClanMemberCreateOrConnectWithoutUserInput;
    upsert?: ClanMemberUpsertWithoutUserInput;
    disconnect?: ClanMemberWhereInput | boolean;
    delete?: ClanMemberWhereInput | boolean;
    connect?: ClanMemberWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanMemberUpdateToOneWithWhereWithoutUserInput,
        ClanMemberUpdateWithoutUserInput
      >,
      ClanMemberUncheckedUpdateWithoutUserInput
    >;
  };

  export type UserCreateNestedOneWithoutProfileInput = {
    create?: XOR<
      UserCreateWithoutProfileInput,
      UserUncheckedCreateWithoutProfileInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutProfileInput;
    connect?: UserWhereUniqueInput;
  };

  export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type UserUpdateOneRequiredWithoutProfileNestedInput = {
    create?: XOR<
      UserCreateWithoutProfileInput,
      UserUncheckedCreateWithoutProfileInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutProfileInput;
    upsert?: UserUpsertWithoutProfileInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutProfileInput,
        UserUpdateWithoutProfileInput
      >,
      UserUncheckedUpdateWithoutProfileInput
    >;
  };

  export type UserCreateNestedOneWithoutSettingsInput = {
    create?: XOR<
      UserCreateWithoutSettingsInput,
      UserUncheckedCreateWithoutSettingsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutSettingsInput;
    connect?: UserWhereUniqueInput;
  };

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
  };

  export type UserUpdateOneRequiredWithoutSettingsNestedInput = {
    create?: XOR<
      UserCreateWithoutSettingsInput,
      UserUncheckedCreateWithoutSettingsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutSettingsInput;
    upsert?: UserUpsertWithoutSettingsInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutSettingsInput,
        UserUpdateWithoutSettingsInput
      >,
      UserUncheckedUpdateWithoutSettingsInput
    >;
  };

  export type UserCreateNestedOneWithoutTerritoriesInput = {
    create?: XOR<
      UserCreateWithoutTerritoriesInput,
      UserUncheckedCreateWithoutTerritoriesInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutTerritoriesInput;
    connect?: UserWhereUniqueInput;
  };

  export type UserNFTCreateNestedManyWithoutTerritoryInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutTerritoryInput,
          UserNFTUncheckedCreateWithoutTerritoryInput
        >
      | UserNFTCreateWithoutTerritoryInput[]
      | UserNFTUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutTerritoryInput
      | UserNFTCreateOrConnectWithoutTerritoryInput[];
    createMany?: UserNFTCreateManyTerritoryInputEnvelope;
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
  };

  export type ChallengeCreateNestedManyWithoutDojoInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDojoInput,
          ChallengeUncheckedCreateWithoutDojoInput
        >
      | ChallengeCreateWithoutDojoInput[]
      | ChallengeUncheckedCreateWithoutDojoInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDojoInput
      | ChallengeCreateOrConnectWithoutDojoInput[];
    createMany?: ChallengeCreateManyDojoInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type UserCreateNestedManyWithoutHomeDojoInput = {
    create?:
      | XOR<
          UserCreateWithoutHomeDojoInput,
          UserUncheckedCreateWithoutHomeDojoInput
        >
      | UserCreateWithoutHomeDojoInput[]
      | UserUncheckedCreateWithoutHomeDojoInput[];
    connectOrCreate?:
      | UserCreateOrConnectWithoutHomeDojoInput
      | UserCreateOrConnectWithoutHomeDojoInput[];
    createMany?: UserCreateManyHomeDojoInputEnvelope;
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[];
  };

  export type ClanCreateNestedOneWithoutControlledDojosInput = {
    create?: XOR<
      ClanCreateWithoutControlledDojosInput,
      ClanUncheckedCreateWithoutControlledDojosInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutControlledDojosInput;
    connect?: ClanWhereUniqueInput;
  };

  export type ClanWarCreateNestedManyWithoutTerritoryInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutTerritoryInput,
          ClanWarUncheckedCreateWithoutTerritoryInput
        >
      | ClanWarCreateWithoutTerritoryInput[]
      | ClanWarUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutTerritoryInput
      | ClanWarCreateOrConnectWithoutTerritoryInput[];
    createMany?: ClanWarCreateManyTerritoryInputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type UserNFTUncheckedCreateNestedManyWithoutTerritoryInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutTerritoryInput,
          UserNFTUncheckedCreateWithoutTerritoryInput
        >
      | UserNFTCreateWithoutTerritoryInput[]
      | UserNFTUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutTerritoryInput
      | UserNFTCreateOrConnectWithoutTerritoryInput[];
    createMany?: UserNFTCreateManyTerritoryInputEnvelope;
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
  };

  export type ChallengeUncheckedCreateNestedManyWithoutDojoInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDojoInput,
          ChallengeUncheckedCreateWithoutDojoInput
        >
      | ChallengeCreateWithoutDojoInput[]
      | ChallengeUncheckedCreateWithoutDojoInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDojoInput
      | ChallengeCreateOrConnectWithoutDojoInput[];
    createMany?: ChallengeCreateManyDojoInputEnvelope;
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
  };

  export type UserUncheckedCreateNestedManyWithoutHomeDojoInput = {
    create?:
      | XOR<
          UserCreateWithoutHomeDojoInput,
          UserUncheckedCreateWithoutHomeDojoInput
        >
      | UserCreateWithoutHomeDojoInput[]
      | UserUncheckedCreateWithoutHomeDojoInput[];
    connectOrCreate?:
      | UserCreateOrConnectWithoutHomeDojoInput
      | UserCreateOrConnectWithoutHomeDojoInput[];
    createMany?: UserCreateManyHomeDojoInputEnvelope;
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[];
  };

  export type ClanWarUncheckedCreateNestedManyWithoutTerritoryInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutTerritoryInput,
          ClanWarUncheckedCreateWithoutTerritoryInput
        >
      | ClanWarCreateWithoutTerritoryInput[]
      | ClanWarUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutTerritoryInput
      | ClanWarCreateOrConnectWithoutTerritoryInput[];
    createMany?: ClanWarCreateManyTerritoryInputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type UserUpdateOneWithoutTerritoriesNestedInput = {
    create?: XOR<
      UserCreateWithoutTerritoriesInput,
      UserUncheckedCreateWithoutTerritoriesInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutTerritoriesInput;
    upsert?: UserUpsertWithoutTerritoriesInput;
    disconnect?: UserWhereInput | boolean;
    delete?: UserWhereInput | boolean;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutTerritoriesInput,
        UserUpdateWithoutTerritoriesInput
      >,
      UserUncheckedUpdateWithoutTerritoriesInput
    >;
  };

  export type UserNFTUpdateManyWithoutTerritoryNestedInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutTerritoryInput,
          UserNFTUncheckedCreateWithoutTerritoryInput
        >
      | UserNFTCreateWithoutTerritoryInput[]
      | UserNFTUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutTerritoryInput
      | UserNFTCreateOrConnectWithoutTerritoryInput[];
    upsert?:
      | UserNFTUpsertWithWhereUniqueWithoutTerritoryInput
      | UserNFTUpsertWithWhereUniqueWithoutTerritoryInput[];
    createMany?: UserNFTCreateManyTerritoryInputEnvelope;
    set?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    disconnect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    delete?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    update?:
      | UserNFTUpdateWithWhereUniqueWithoutTerritoryInput
      | UserNFTUpdateWithWhereUniqueWithoutTerritoryInput[];
    updateMany?:
      | UserNFTUpdateManyWithWhereWithoutTerritoryInput
      | UserNFTUpdateManyWithWhereWithoutTerritoryInput[];
    deleteMany?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
  };

  export type ChallengeUpdateManyWithoutDojoNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDojoInput,
          ChallengeUncheckedCreateWithoutDojoInput
        >
      | ChallengeCreateWithoutDojoInput[]
      | ChallengeUncheckedCreateWithoutDojoInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDojoInput
      | ChallengeCreateOrConnectWithoutDojoInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutDojoInput
      | ChallengeUpsertWithWhereUniqueWithoutDojoInput[];
    createMany?: ChallengeCreateManyDojoInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutDojoInput
      | ChallengeUpdateWithWhereUniqueWithoutDojoInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutDojoInput
      | ChallengeUpdateManyWithWhereWithoutDojoInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type UserUpdateManyWithoutHomeDojoNestedInput = {
    create?:
      | XOR<
          UserCreateWithoutHomeDojoInput,
          UserUncheckedCreateWithoutHomeDojoInput
        >
      | UserCreateWithoutHomeDojoInput[]
      | UserUncheckedCreateWithoutHomeDojoInput[];
    connectOrCreate?:
      | UserCreateOrConnectWithoutHomeDojoInput
      | UserCreateOrConnectWithoutHomeDojoInput[];
    upsert?:
      | UserUpsertWithWhereUniqueWithoutHomeDojoInput
      | UserUpsertWithWhereUniqueWithoutHomeDojoInput[];
    createMany?: UserCreateManyHomeDojoInputEnvelope;
    set?: UserWhereUniqueInput | UserWhereUniqueInput[];
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[];
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[];
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[];
    update?:
      | UserUpdateWithWhereUniqueWithoutHomeDojoInput
      | UserUpdateWithWhereUniqueWithoutHomeDojoInput[];
    updateMany?:
      | UserUpdateManyWithWhereWithoutHomeDojoInput
      | UserUpdateManyWithWhereWithoutHomeDojoInput[];
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[];
  };

  export type ClanUpdateOneWithoutControlledDojosNestedInput = {
    create?: XOR<
      ClanCreateWithoutControlledDojosInput,
      ClanUncheckedCreateWithoutControlledDojosInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutControlledDojosInput;
    upsert?: ClanUpsertWithoutControlledDojosInput;
    disconnect?: ClanWhereInput | boolean;
    delete?: ClanWhereInput | boolean;
    connect?: ClanWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanUpdateToOneWithWhereWithoutControlledDojosInput,
        ClanUpdateWithoutControlledDojosInput
      >,
      ClanUncheckedUpdateWithoutControlledDojosInput
    >;
  };

  export type ClanWarUpdateManyWithoutTerritoryNestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutTerritoryInput,
          ClanWarUncheckedCreateWithoutTerritoryInput
        >
      | ClanWarCreateWithoutTerritoryInput[]
      | ClanWarUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutTerritoryInput
      | ClanWarCreateOrConnectWithoutTerritoryInput[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutTerritoryInput
      | ClanWarUpsertWithWhereUniqueWithoutTerritoryInput[];
    createMany?: ClanWarCreateManyTerritoryInputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutTerritoryInput
      | ClanWarUpdateWithWhereUniqueWithoutTerritoryInput[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutTerritoryInput
      | ClanWarUpdateManyWithWhereWithoutTerritoryInput[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput = {
    create?:
      | XOR<
          UserNFTCreateWithoutTerritoryInput,
          UserNFTUncheckedCreateWithoutTerritoryInput
        >
      | UserNFTCreateWithoutTerritoryInput[]
      | UserNFTUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | UserNFTCreateOrConnectWithoutTerritoryInput
      | UserNFTCreateOrConnectWithoutTerritoryInput[];
    upsert?:
      | UserNFTUpsertWithWhereUniqueWithoutTerritoryInput
      | UserNFTUpsertWithWhereUniqueWithoutTerritoryInput[];
    createMany?: UserNFTCreateManyTerritoryInputEnvelope;
    set?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    disconnect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    delete?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    connect?: UserNFTWhereUniqueInput | UserNFTWhereUniqueInput[];
    update?:
      | UserNFTUpdateWithWhereUniqueWithoutTerritoryInput
      | UserNFTUpdateWithWhereUniqueWithoutTerritoryInput[];
    updateMany?:
      | UserNFTUpdateManyWithWhereWithoutTerritoryInput
      | UserNFTUpdateManyWithWhereWithoutTerritoryInput[];
    deleteMany?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
  };

  export type ChallengeUncheckedUpdateManyWithoutDojoNestedInput = {
    create?:
      | XOR<
          ChallengeCreateWithoutDojoInput,
          ChallengeUncheckedCreateWithoutDojoInput
        >
      | ChallengeCreateWithoutDojoInput[]
      | ChallengeUncheckedCreateWithoutDojoInput[];
    connectOrCreate?:
      | ChallengeCreateOrConnectWithoutDojoInput
      | ChallengeCreateOrConnectWithoutDojoInput[];
    upsert?:
      | ChallengeUpsertWithWhereUniqueWithoutDojoInput
      | ChallengeUpsertWithWhereUniqueWithoutDojoInput[];
    createMany?: ChallengeCreateManyDojoInputEnvelope;
    set?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    disconnect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    delete?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    connect?: ChallengeWhereUniqueInput | ChallengeWhereUniqueInput[];
    update?:
      | ChallengeUpdateWithWhereUniqueWithoutDojoInput
      | ChallengeUpdateWithWhereUniqueWithoutDojoInput[];
    updateMany?:
      | ChallengeUpdateManyWithWhereWithoutDojoInput
      | ChallengeUpdateManyWithWhereWithoutDojoInput[];
    deleteMany?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
  };

  export type UserUncheckedUpdateManyWithoutHomeDojoNestedInput = {
    create?:
      | XOR<
          UserCreateWithoutHomeDojoInput,
          UserUncheckedCreateWithoutHomeDojoInput
        >
      | UserCreateWithoutHomeDojoInput[]
      | UserUncheckedCreateWithoutHomeDojoInput[];
    connectOrCreate?:
      | UserCreateOrConnectWithoutHomeDojoInput
      | UserCreateOrConnectWithoutHomeDojoInput[];
    upsert?:
      | UserUpsertWithWhereUniqueWithoutHomeDojoInput
      | UserUpsertWithWhereUniqueWithoutHomeDojoInput[];
    createMany?: UserCreateManyHomeDojoInputEnvelope;
    set?: UserWhereUniqueInput | UserWhereUniqueInput[];
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[];
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[];
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[];
    update?:
      | UserUpdateWithWhereUniqueWithoutHomeDojoInput
      | UserUpdateWithWhereUniqueWithoutHomeDojoInput[];
    updateMany?:
      | UserUpdateManyWithWhereWithoutHomeDojoInput
      | UserUpdateManyWithWhereWithoutHomeDojoInput[];
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[];
  };

  export type ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutTerritoryInput,
          ClanWarUncheckedCreateWithoutTerritoryInput
        >
      | ClanWarCreateWithoutTerritoryInput[]
      | ClanWarUncheckedCreateWithoutTerritoryInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutTerritoryInput
      | ClanWarCreateOrConnectWithoutTerritoryInput[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutTerritoryInput
      | ClanWarUpsertWithWhereUniqueWithoutTerritoryInput[];
    createMany?: ClanWarCreateManyTerritoryInputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutTerritoryInput
      | ClanWarUpdateWithWhereUniqueWithoutTerritoryInput[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutTerritoryInput
      | ClanWarUpdateManyWithWhereWithoutTerritoryInput[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type UserCreateNestedOneWithoutNftsInput = {
    create?: XOR<
      UserCreateWithoutNftsInput,
      UserUncheckedCreateWithoutNftsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutNftsInput;
    connect?: UserWhereUniqueInput;
  };

  export type TerritoryCreateNestedOneWithoutNftsInput = {
    create?: XOR<
      TerritoryCreateWithoutNftsInput,
      TerritoryUncheckedCreateWithoutNftsInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutNftsInput;
    connect?: TerritoryWhereUniqueInput;
  };

  export type UserUpdateOneRequiredWithoutNftsNestedInput = {
    create?: XOR<
      UserCreateWithoutNftsInput,
      UserUncheckedCreateWithoutNftsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutNftsInput;
    upsert?: UserUpsertWithoutNftsInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<UserUpdateToOneWithWhereWithoutNftsInput, UserUpdateWithoutNftsInput>,
      UserUncheckedUpdateWithoutNftsInput
    >;
  };

  export type TerritoryUpdateOneWithoutNftsNestedInput = {
    create?: XOR<
      TerritoryCreateWithoutNftsInput,
      TerritoryUncheckedCreateWithoutNftsInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutNftsInput;
    upsert?: TerritoryUpsertWithoutNftsInput;
    disconnect?: TerritoryWhereInput | boolean;
    delete?: TerritoryWhereInput | boolean;
    connect?: TerritoryWhereUniqueInput;
    update?: XOR<
      XOR<
        TerritoryUpdateToOneWithWhereWithoutNftsInput,
        TerritoryUpdateWithoutNftsInput
      >,
      TerritoryUncheckedUpdateWithoutNftsInput
    >;
  };

  export type FloatFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
  };

  export type UserCreateNestedOneWithoutChallengesAsChallengerInput = {
    create?: XOR<
      UserCreateWithoutChallengesAsChallengerInput,
      UserUncheckedCreateWithoutChallengesAsChallengerInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutChallengesAsChallengerInput;
    connect?: UserWhereUniqueInput;
  };

  export type UserCreateNestedOneWithoutChallengesAsDefenderInput = {
    create?: XOR<
      UserCreateWithoutChallengesAsDefenderInput,
      UserUncheckedCreateWithoutChallengesAsDefenderInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutChallengesAsDefenderInput;
    connect?: UserWhereUniqueInput;
  };

  export type TerritoryCreateNestedOneWithoutChallengesInput = {
    create?: XOR<
      TerritoryCreateWithoutChallengesInput,
      TerritoryUncheckedCreateWithoutChallengesInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutChallengesInput;
    connect?: TerritoryWhereUniqueInput;
  };

  export type UserUpdateOneRequiredWithoutChallengesAsChallengerNestedInput = {
    create?: XOR<
      UserCreateWithoutChallengesAsChallengerInput,
      UserUncheckedCreateWithoutChallengesAsChallengerInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutChallengesAsChallengerInput;
    upsert?: UserUpsertWithoutChallengesAsChallengerInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutChallengesAsChallengerInput,
        UserUpdateWithoutChallengesAsChallengerInput
      >,
      UserUncheckedUpdateWithoutChallengesAsChallengerInput
    >;
  };

  export type UserUpdateOneRequiredWithoutChallengesAsDefenderNestedInput = {
    create?: XOR<
      UserCreateWithoutChallengesAsDefenderInput,
      UserUncheckedCreateWithoutChallengesAsDefenderInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutChallengesAsDefenderInput;
    upsert?: UserUpsertWithoutChallengesAsDefenderInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutChallengesAsDefenderInput,
        UserUpdateWithoutChallengesAsDefenderInput
      >,
      UserUncheckedUpdateWithoutChallengesAsDefenderInput
    >;
  };

  export type TerritoryUpdateOneRequiredWithoutChallengesNestedInput = {
    create?: XOR<
      TerritoryCreateWithoutChallengesInput,
      TerritoryUncheckedCreateWithoutChallengesInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutChallengesInput;
    upsert?: TerritoryUpsertWithoutChallengesInput;
    connect?: TerritoryWhereUniqueInput;
    update?: XOR<
      XOR<
        TerritoryUpdateToOneWithWhereWithoutChallengesInput,
        TerritoryUpdateWithoutChallengesInput
      >,
      TerritoryUncheckedUpdateWithoutChallengesInput
    >;
  };

  export type UserCreateNestedOneWithoutNominationsInput = {
    create?: XOR<
      UserCreateWithoutNominationsInput,
      UserUncheckedCreateWithoutNominationsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutNominationsInput;
    connect?: UserWhereUniqueInput;
  };

  export type UserUpdateOneRequiredWithoutNominationsNestedInput = {
    create?: XOR<
      UserCreateWithoutNominationsInput,
      UserUncheckedCreateWithoutNominationsInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutNominationsInput;
    upsert?: UserUpsertWithoutNominationsInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutNominationsInput,
        UserUpdateWithoutNominationsInput
      >,
      UserUncheckedUpdateWithoutNominationsInput
    >;
  };

  export type UserCreateNestedOneWithoutLedClansInput = {
    create?: XOR<
      UserCreateWithoutLedClansInput,
      UserUncheckedCreateWithoutLedClansInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutLedClansInput;
    connect?: UserWhereUniqueInput;
  };

  export type ClanMemberCreateNestedManyWithoutClanInput = {
    create?:
      | XOR<
          ClanMemberCreateWithoutClanInput,
          ClanMemberUncheckedCreateWithoutClanInput
        >
      | ClanMemberCreateWithoutClanInput[]
      | ClanMemberUncheckedCreateWithoutClanInput[];
    connectOrCreate?:
      | ClanMemberCreateOrConnectWithoutClanInput
      | ClanMemberCreateOrConnectWithoutClanInput[];
    createMany?: ClanMemberCreateManyClanInputEnvelope;
    connect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
  };

  export type TerritoryCreateNestedManyWithoutControllingClanInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutControllingClanInput,
          TerritoryUncheckedCreateWithoutControllingClanInput
        >
      | TerritoryCreateWithoutControllingClanInput[]
      | TerritoryUncheckedCreateWithoutControllingClanInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutControllingClanInput
      | TerritoryCreateOrConnectWithoutControllingClanInput[];
    createMany?: TerritoryCreateManyControllingClanInputEnvelope;
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
  };

  export type ClanWarCreateNestedManyWithoutClan1Input = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan1Input,
          ClanWarUncheckedCreateWithoutClan1Input
        >
      | ClanWarCreateWithoutClan1Input[]
      | ClanWarUncheckedCreateWithoutClan1Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan1Input
      | ClanWarCreateOrConnectWithoutClan1Input[];
    createMany?: ClanWarCreateManyClan1InputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type ClanWarCreateNestedManyWithoutClan2Input = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan2Input,
          ClanWarUncheckedCreateWithoutClan2Input
        >
      | ClanWarCreateWithoutClan2Input[]
      | ClanWarUncheckedCreateWithoutClan2Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan2Input
      | ClanWarCreateOrConnectWithoutClan2Input[];
    createMany?: ClanWarCreateManyClan2InputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type ClanWarCreateNestedManyWithoutWinnerInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutWinnerInput,
          ClanWarUncheckedCreateWithoutWinnerInput
        >
      | ClanWarCreateWithoutWinnerInput[]
      | ClanWarUncheckedCreateWithoutWinnerInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutWinnerInput
      | ClanWarCreateOrConnectWithoutWinnerInput[];
    createMany?: ClanWarCreateManyWinnerInputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type ClanMemberUncheckedCreateNestedManyWithoutClanInput = {
    create?:
      | XOR<
          ClanMemberCreateWithoutClanInput,
          ClanMemberUncheckedCreateWithoutClanInput
        >
      | ClanMemberCreateWithoutClanInput[]
      | ClanMemberUncheckedCreateWithoutClanInput[];
    connectOrCreate?:
      | ClanMemberCreateOrConnectWithoutClanInput
      | ClanMemberCreateOrConnectWithoutClanInput[];
    createMany?: ClanMemberCreateManyClanInputEnvelope;
    connect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
  };

  export type TerritoryUncheckedCreateNestedManyWithoutControllingClanInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutControllingClanInput,
          TerritoryUncheckedCreateWithoutControllingClanInput
        >
      | TerritoryCreateWithoutControllingClanInput[]
      | TerritoryUncheckedCreateWithoutControllingClanInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutControllingClanInput
      | TerritoryCreateOrConnectWithoutControllingClanInput[];
    createMany?: TerritoryCreateManyControllingClanInputEnvelope;
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
  };

  export type ClanWarUncheckedCreateNestedManyWithoutClan1Input = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan1Input,
          ClanWarUncheckedCreateWithoutClan1Input
        >
      | ClanWarCreateWithoutClan1Input[]
      | ClanWarUncheckedCreateWithoutClan1Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan1Input
      | ClanWarCreateOrConnectWithoutClan1Input[];
    createMany?: ClanWarCreateManyClan1InputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type ClanWarUncheckedCreateNestedManyWithoutClan2Input = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan2Input,
          ClanWarUncheckedCreateWithoutClan2Input
        >
      | ClanWarCreateWithoutClan2Input[]
      | ClanWarUncheckedCreateWithoutClan2Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan2Input
      | ClanWarCreateOrConnectWithoutClan2Input[];
    createMany?: ClanWarCreateManyClan2InputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type ClanWarUncheckedCreateNestedManyWithoutWinnerInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutWinnerInput,
          ClanWarUncheckedCreateWithoutWinnerInput
        >
      | ClanWarCreateWithoutWinnerInput[]
      | ClanWarUncheckedCreateWithoutWinnerInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutWinnerInput
      | ClanWarCreateOrConnectWithoutWinnerInput[];
    createMany?: ClanWarCreateManyWinnerInputEnvelope;
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
  };

  export type UserUpdateOneRequiredWithoutLedClansNestedInput = {
    create?: XOR<
      UserCreateWithoutLedClansInput,
      UserUncheckedCreateWithoutLedClansInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutLedClansInput;
    upsert?: UserUpsertWithoutLedClansInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutLedClansInput,
        UserUpdateWithoutLedClansInput
      >,
      UserUncheckedUpdateWithoutLedClansInput
    >;
  };

  export type ClanMemberUpdateManyWithoutClanNestedInput = {
    create?:
      | XOR<
          ClanMemberCreateWithoutClanInput,
          ClanMemberUncheckedCreateWithoutClanInput
        >
      | ClanMemberCreateWithoutClanInput[]
      | ClanMemberUncheckedCreateWithoutClanInput[];
    connectOrCreate?:
      | ClanMemberCreateOrConnectWithoutClanInput
      | ClanMemberCreateOrConnectWithoutClanInput[];
    upsert?:
      | ClanMemberUpsertWithWhereUniqueWithoutClanInput
      | ClanMemberUpsertWithWhereUniqueWithoutClanInput[];
    createMany?: ClanMemberCreateManyClanInputEnvelope;
    set?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    disconnect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    delete?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    connect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    update?:
      | ClanMemberUpdateWithWhereUniqueWithoutClanInput
      | ClanMemberUpdateWithWhereUniqueWithoutClanInput[];
    updateMany?:
      | ClanMemberUpdateManyWithWhereWithoutClanInput
      | ClanMemberUpdateManyWithWhereWithoutClanInput[];
    deleteMany?: ClanMemberScalarWhereInput | ClanMemberScalarWhereInput[];
  };

  export type TerritoryUpdateManyWithoutControllingClanNestedInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutControllingClanInput,
          TerritoryUncheckedCreateWithoutControllingClanInput
        >
      | TerritoryCreateWithoutControllingClanInput[]
      | TerritoryUncheckedCreateWithoutControllingClanInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutControllingClanInput
      | TerritoryCreateOrConnectWithoutControllingClanInput[];
    upsert?:
      | TerritoryUpsertWithWhereUniqueWithoutControllingClanInput
      | TerritoryUpsertWithWhereUniqueWithoutControllingClanInput[];
    createMany?: TerritoryCreateManyControllingClanInputEnvelope;
    set?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    disconnect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    delete?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    update?:
      | TerritoryUpdateWithWhereUniqueWithoutControllingClanInput
      | TerritoryUpdateWithWhereUniqueWithoutControllingClanInput[];
    updateMany?:
      | TerritoryUpdateManyWithWhereWithoutControllingClanInput
      | TerritoryUpdateManyWithWhereWithoutControllingClanInput[];
    deleteMany?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
  };

  export type ClanWarUpdateManyWithoutClan1NestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan1Input,
          ClanWarUncheckedCreateWithoutClan1Input
        >
      | ClanWarCreateWithoutClan1Input[]
      | ClanWarUncheckedCreateWithoutClan1Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan1Input
      | ClanWarCreateOrConnectWithoutClan1Input[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutClan1Input
      | ClanWarUpsertWithWhereUniqueWithoutClan1Input[];
    createMany?: ClanWarCreateManyClan1InputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutClan1Input
      | ClanWarUpdateWithWhereUniqueWithoutClan1Input[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutClan1Input
      | ClanWarUpdateManyWithWhereWithoutClan1Input[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type ClanWarUpdateManyWithoutClan2NestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan2Input,
          ClanWarUncheckedCreateWithoutClan2Input
        >
      | ClanWarCreateWithoutClan2Input[]
      | ClanWarUncheckedCreateWithoutClan2Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan2Input
      | ClanWarCreateOrConnectWithoutClan2Input[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutClan2Input
      | ClanWarUpsertWithWhereUniqueWithoutClan2Input[];
    createMany?: ClanWarCreateManyClan2InputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutClan2Input
      | ClanWarUpdateWithWhereUniqueWithoutClan2Input[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutClan2Input
      | ClanWarUpdateManyWithWhereWithoutClan2Input[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type ClanWarUpdateManyWithoutWinnerNestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutWinnerInput,
          ClanWarUncheckedCreateWithoutWinnerInput
        >
      | ClanWarCreateWithoutWinnerInput[]
      | ClanWarUncheckedCreateWithoutWinnerInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutWinnerInput
      | ClanWarCreateOrConnectWithoutWinnerInput[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutWinnerInput
      | ClanWarUpsertWithWhereUniqueWithoutWinnerInput[];
    createMany?: ClanWarCreateManyWinnerInputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutWinnerInput
      | ClanWarUpdateWithWhereUniqueWithoutWinnerInput[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutWinnerInput
      | ClanWarUpdateManyWithWhereWithoutWinnerInput[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type ClanMemberUncheckedUpdateManyWithoutClanNestedInput = {
    create?:
      | XOR<
          ClanMemberCreateWithoutClanInput,
          ClanMemberUncheckedCreateWithoutClanInput
        >
      | ClanMemberCreateWithoutClanInput[]
      | ClanMemberUncheckedCreateWithoutClanInput[];
    connectOrCreate?:
      | ClanMemberCreateOrConnectWithoutClanInput
      | ClanMemberCreateOrConnectWithoutClanInput[];
    upsert?:
      | ClanMemberUpsertWithWhereUniqueWithoutClanInput
      | ClanMemberUpsertWithWhereUniqueWithoutClanInput[];
    createMany?: ClanMemberCreateManyClanInputEnvelope;
    set?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    disconnect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    delete?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    connect?: ClanMemberWhereUniqueInput | ClanMemberWhereUniqueInput[];
    update?:
      | ClanMemberUpdateWithWhereUniqueWithoutClanInput
      | ClanMemberUpdateWithWhereUniqueWithoutClanInput[];
    updateMany?:
      | ClanMemberUpdateManyWithWhereWithoutClanInput
      | ClanMemberUpdateManyWithWhereWithoutClanInput[];
    deleteMany?: ClanMemberScalarWhereInput | ClanMemberScalarWhereInput[];
  };

  export type TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput = {
    create?:
      | XOR<
          TerritoryCreateWithoutControllingClanInput,
          TerritoryUncheckedCreateWithoutControllingClanInput
        >
      | TerritoryCreateWithoutControllingClanInput[]
      | TerritoryUncheckedCreateWithoutControllingClanInput[];
    connectOrCreate?:
      | TerritoryCreateOrConnectWithoutControllingClanInput
      | TerritoryCreateOrConnectWithoutControllingClanInput[];
    upsert?:
      | TerritoryUpsertWithWhereUniqueWithoutControllingClanInput
      | TerritoryUpsertWithWhereUniqueWithoutControllingClanInput[];
    createMany?: TerritoryCreateManyControllingClanInputEnvelope;
    set?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    disconnect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    delete?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    connect?: TerritoryWhereUniqueInput | TerritoryWhereUniqueInput[];
    update?:
      | TerritoryUpdateWithWhereUniqueWithoutControllingClanInput
      | TerritoryUpdateWithWhereUniqueWithoutControllingClanInput[];
    updateMany?:
      | TerritoryUpdateManyWithWhereWithoutControllingClanInput
      | TerritoryUpdateManyWithWhereWithoutControllingClanInput[];
    deleteMany?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
  };

  export type ClanWarUncheckedUpdateManyWithoutClan1NestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan1Input,
          ClanWarUncheckedCreateWithoutClan1Input
        >
      | ClanWarCreateWithoutClan1Input[]
      | ClanWarUncheckedCreateWithoutClan1Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan1Input
      | ClanWarCreateOrConnectWithoutClan1Input[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutClan1Input
      | ClanWarUpsertWithWhereUniqueWithoutClan1Input[];
    createMany?: ClanWarCreateManyClan1InputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutClan1Input
      | ClanWarUpdateWithWhereUniqueWithoutClan1Input[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutClan1Input
      | ClanWarUpdateManyWithWhereWithoutClan1Input[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type ClanWarUncheckedUpdateManyWithoutClan2NestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutClan2Input,
          ClanWarUncheckedCreateWithoutClan2Input
        >
      | ClanWarCreateWithoutClan2Input[]
      | ClanWarUncheckedCreateWithoutClan2Input[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutClan2Input
      | ClanWarCreateOrConnectWithoutClan2Input[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutClan2Input
      | ClanWarUpsertWithWhereUniqueWithoutClan2Input[];
    createMany?: ClanWarCreateManyClan2InputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutClan2Input
      | ClanWarUpdateWithWhereUniqueWithoutClan2Input[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutClan2Input
      | ClanWarUpdateManyWithWhereWithoutClan2Input[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type ClanWarUncheckedUpdateManyWithoutWinnerNestedInput = {
    create?:
      | XOR<
          ClanWarCreateWithoutWinnerInput,
          ClanWarUncheckedCreateWithoutWinnerInput
        >
      | ClanWarCreateWithoutWinnerInput[]
      | ClanWarUncheckedCreateWithoutWinnerInput[];
    connectOrCreate?:
      | ClanWarCreateOrConnectWithoutWinnerInput
      | ClanWarCreateOrConnectWithoutWinnerInput[];
    upsert?:
      | ClanWarUpsertWithWhereUniqueWithoutWinnerInput
      | ClanWarUpsertWithWhereUniqueWithoutWinnerInput[];
    createMany?: ClanWarCreateManyWinnerInputEnvelope;
    set?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    disconnect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    delete?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    connect?: ClanWarWhereUniqueInput | ClanWarWhereUniqueInput[];
    update?:
      | ClanWarUpdateWithWhereUniqueWithoutWinnerInput
      | ClanWarUpdateWithWhereUniqueWithoutWinnerInput[];
    updateMany?:
      | ClanWarUpdateManyWithWhereWithoutWinnerInput
      | ClanWarUpdateManyWithWhereWithoutWinnerInput[];
    deleteMany?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
  };

  export type UserCreateNestedOneWithoutClanMembershipInput = {
    create?: XOR<
      UserCreateWithoutClanMembershipInput,
      UserUncheckedCreateWithoutClanMembershipInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutClanMembershipInput;
    connect?: UserWhereUniqueInput;
  };

  export type ClanCreateNestedOneWithoutMembersInput = {
    create?: XOR<
      ClanCreateWithoutMembersInput,
      ClanUncheckedCreateWithoutMembersInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutMembersInput;
    connect?: ClanWhereUniqueInput;
  };

  export type UserUpdateOneRequiredWithoutClanMembershipNestedInput = {
    create?: XOR<
      UserCreateWithoutClanMembershipInput,
      UserUncheckedCreateWithoutClanMembershipInput
    >;
    connectOrCreate?: UserCreateOrConnectWithoutClanMembershipInput;
    upsert?: UserUpsertWithoutClanMembershipInput;
    connect?: UserWhereUniqueInput;
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutClanMembershipInput,
        UserUpdateWithoutClanMembershipInput
      >,
      UserUncheckedUpdateWithoutClanMembershipInput
    >;
  };

  export type ClanUpdateOneRequiredWithoutMembersNestedInput = {
    create?: XOR<
      ClanCreateWithoutMembersInput,
      ClanUncheckedCreateWithoutMembersInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutMembersInput;
    upsert?: ClanUpsertWithoutMembersInput;
    connect?: ClanWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanUpdateToOneWithWhereWithoutMembersInput,
        ClanUpdateWithoutMembersInput
      >,
      ClanUncheckedUpdateWithoutMembersInput
    >;
  };

  export type ClanCreateNestedOneWithoutWarsAsClan1Input = {
    create?: XOR<
      ClanCreateWithoutWarsAsClan1Input,
      ClanUncheckedCreateWithoutWarsAsClan1Input
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWarsAsClan1Input;
    connect?: ClanWhereUniqueInput;
  };

  export type ClanCreateNestedOneWithoutWarsAsClan2Input = {
    create?: XOR<
      ClanCreateWithoutWarsAsClan2Input,
      ClanUncheckedCreateWithoutWarsAsClan2Input
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWarsAsClan2Input;
    connect?: ClanWhereUniqueInput;
  };

  export type ClanCreateNestedOneWithoutWonWarsInput = {
    create?: XOR<
      ClanCreateWithoutWonWarsInput,
      ClanUncheckedCreateWithoutWonWarsInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWonWarsInput;
    connect?: ClanWhereUniqueInput;
  };

  export type TerritoryCreateNestedOneWithoutContestedWarsInput = {
    create?: XOR<
      TerritoryCreateWithoutContestedWarsInput,
      TerritoryUncheckedCreateWithoutContestedWarsInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutContestedWarsInput;
    connect?: TerritoryWhereUniqueInput;
  };

  export type ClanUpdateOneRequiredWithoutWarsAsClan1NestedInput = {
    create?: XOR<
      ClanCreateWithoutWarsAsClan1Input,
      ClanUncheckedCreateWithoutWarsAsClan1Input
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWarsAsClan1Input;
    upsert?: ClanUpsertWithoutWarsAsClan1Input;
    connect?: ClanWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanUpdateToOneWithWhereWithoutWarsAsClan1Input,
        ClanUpdateWithoutWarsAsClan1Input
      >,
      ClanUncheckedUpdateWithoutWarsAsClan1Input
    >;
  };

  export type ClanUpdateOneRequiredWithoutWarsAsClan2NestedInput = {
    create?: XOR<
      ClanCreateWithoutWarsAsClan2Input,
      ClanUncheckedCreateWithoutWarsAsClan2Input
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWarsAsClan2Input;
    upsert?: ClanUpsertWithoutWarsAsClan2Input;
    connect?: ClanWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanUpdateToOneWithWhereWithoutWarsAsClan2Input,
        ClanUpdateWithoutWarsAsClan2Input
      >,
      ClanUncheckedUpdateWithoutWarsAsClan2Input
    >;
  };

  export type ClanUpdateOneWithoutWonWarsNestedInput = {
    create?: XOR<
      ClanCreateWithoutWonWarsInput,
      ClanUncheckedCreateWithoutWonWarsInput
    >;
    connectOrCreate?: ClanCreateOrConnectWithoutWonWarsInput;
    upsert?: ClanUpsertWithoutWonWarsInput;
    disconnect?: ClanWhereInput | boolean;
    delete?: ClanWhereInput | boolean;
    connect?: ClanWhereUniqueInput;
    update?: XOR<
      XOR<
        ClanUpdateToOneWithWhereWithoutWonWarsInput,
        ClanUpdateWithoutWonWarsInput
      >,
      ClanUncheckedUpdateWithoutWonWarsInput
    >;
  };

  export type TerritoryUpdateOneWithoutContestedWarsNestedInput = {
    create?: XOR<
      TerritoryCreateWithoutContestedWarsInput,
      TerritoryUncheckedCreateWithoutContestedWarsInput
    >;
    connectOrCreate?: TerritoryCreateOrConnectWithoutContestedWarsInput;
    upsert?: TerritoryUpsertWithoutContestedWarsInput;
    disconnect?: TerritoryWhereInput | boolean;
    delete?: TerritoryWhereInput | boolean;
    connect?: TerritoryWhereUniqueInput;
    update?: XOR<
      XOR<
        TerritoryUpdateToOneWithWhereWithoutContestedWarsInput,
        TerritoryUpdateWithoutContestedWarsInput
      >,
      TerritoryUncheckedUpdateWithoutContestedWarsInput
    >;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | null;
    notIn?: number[] | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatFilter<$PrismaModel> | number;
  };

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedFloatFilter<$PrismaModel>;
    _min?: NestedFloatFilter<$PrismaModel>;
    _max?: NestedFloatFilter<$PrismaModel>;
  };

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> =
    {
      equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
      in?: Date[] | string[] | null;
      notIn?: Date[] | string[] | null;
      lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      not?:
        | NestedDateTimeNullableWithAggregatesFilter<$PrismaModel>
        | Date
        | string
        | null;
      _count?: NestedIntNullableFilter<$PrismaModel>;
      _min?: NestedDateTimeNullableFilter<$PrismaModel>;
      _max?: NestedDateTimeNullableFilter<$PrismaModel>;
    };

  export type ProfileCreateWithoutUserInput = {
    id?: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    skillLevel?: number;
    preferredGame?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ProfileUncheckedCreateWithoutUserInput = {
    id?: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    skillLevel?: number;
    preferredGame?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ProfileCreateOrConnectWithoutUserInput = {
    where: ProfileWhereUniqueInput;
    create: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
  };

  export type UserSettingsCreateWithoutUserInput = {
    id?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    privacySettings?: string;
    notificationSettings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserSettingsUncheckedCreateWithoutUserInput = {
    id?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    privacySettings?: string;
    notificationSettings?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserSettingsCreateOrConnectWithoutUserInput = {
    where: UserSettingsWhereUniqueInput;
    create: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
  };

  export type TerritoryCreateWithoutOwnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateWithoutOwnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryCreateOrConnectWithoutOwnerInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutOwnerInput,
      TerritoryUncheckedCreateWithoutOwnerInput
    >;
  };

  export type TerritoryCreateManyOwnerInputEnvelope = {
    data: TerritoryCreateManyOwnerInput | TerritoryCreateManyOwnerInput[];
  };

  export type UserNFTCreateWithoutUserInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    territory?: TerritoryCreateNestedOneWithoutNftsInput;
  };

  export type UserNFTUncheckedCreateWithoutUserInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    territoryId?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserNFTCreateOrConnectWithoutUserInput = {
    where: UserNFTWhereUniqueInput;
    create: XOR<
      UserNFTCreateWithoutUserInput,
      UserNFTUncheckedCreateWithoutUserInput
    >;
  };

  export type UserNFTCreateManyUserInputEnvelope = {
    data: UserNFTCreateManyUserInput | UserNFTCreateManyUserInput[];
  };

  export type ChallengeCreateWithoutChallengerInput = {
    id?: string;
    type: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    defender: UserCreateNestedOneWithoutChallengesAsDefenderInput;
    dojo: TerritoryCreateNestedOneWithoutChallengesInput;
  };

  export type ChallengeUncheckedCreateWithoutChallengerInput = {
    id?: string;
    type: string;
    defenderId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateOrConnectWithoutChallengerInput = {
    where: ChallengeWhereUniqueInput;
    create: XOR<
      ChallengeCreateWithoutChallengerInput,
      ChallengeUncheckedCreateWithoutChallengerInput
    >;
  };

  export type ChallengeCreateManyChallengerInputEnvelope = {
    data:
      | ChallengeCreateManyChallengerInput
      | ChallengeCreateManyChallengerInput[];
  };

  export type ChallengeCreateWithoutDefenderInput = {
    id?: string;
    type: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    challenger: UserCreateNestedOneWithoutChallengesAsChallengerInput;
    dojo: TerritoryCreateNestedOneWithoutChallengesInput;
  };

  export type ChallengeUncheckedCreateWithoutDefenderInput = {
    id?: string;
    type: string;
    challengerId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateOrConnectWithoutDefenderInput = {
    where: ChallengeWhereUniqueInput;
    create: XOR<
      ChallengeCreateWithoutDefenderInput,
      ChallengeUncheckedCreateWithoutDefenderInput
    >;
  };

  export type ChallengeCreateManyDefenderInputEnvelope = {
    data: ChallengeCreateManyDefenderInput | ChallengeCreateManyDefenderInput[];
  };

  export type NominationCreateWithoutPlayerInput = {
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type NominationUncheckedCreateWithoutPlayerInput = {
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type NominationCreateOrConnectWithoutPlayerInput = {
    where: NominationWhereUniqueInput;
    create: XOR<
      NominationCreateWithoutPlayerInput,
      NominationUncheckedCreateWithoutPlayerInput
    >;
  };

  export type NominationCreateManyPlayerInputEnvelope = {
    data: NominationCreateManyPlayerInput | NominationCreateManyPlayerInput[];
  };

  export type TerritoryCreateWithoutHomeDojoUsersInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateWithoutHomeDojoUsersInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryCreateOrConnectWithoutHomeDojoUsersInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutHomeDojoUsersInput,
      TerritoryUncheckedCreateWithoutHomeDojoUsersInput
    >;
  };

  export type ClanCreateWithoutLeaderInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateWithoutLeaderInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanCreateOrConnectWithoutLeaderInput = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutLeaderInput,
      ClanUncheckedCreateWithoutLeaderInput
    >;
  };

  export type ClanCreateManyLeaderInputEnvelope = {
    data: ClanCreateManyLeaderInput | ClanCreateManyLeaderInput[];
  };

  export type ClanMemberCreateWithoutUserInput = {
    id?: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
    clan: ClanCreateNestedOneWithoutMembersInput;
  };

  export type ClanMemberUncheckedCreateWithoutUserInput = {
    id?: string;
    clanId: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanMemberCreateOrConnectWithoutUserInput = {
    where: ClanMemberWhereUniqueInput;
    create: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
  };

  export type ProfileUpsertWithoutUserInput = {
    update: XOR<
      ProfileUpdateWithoutUserInput,
      ProfileUncheckedUpdateWithoutUserInput
    >;
    create: XOR<
      ProfileCreateWithoutUserInput,
      ProfileUncheckedCreateWithoutUserInput
    >;
    where?: ProfileWhereInput;
  };

  export type ProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: ProfileWhereInput;
    data: XOR<
      ProfileUpdateWithoutUserInput,
      ProfileUncheckedUpdateWithoutUserInput
    >;
  };

  export type ProfileUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ProfileUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    displayName?: NullableStringFieldUpdateOperationsInput | string | null;
    bio?: NullableStringFieldUpdateOperationsInput | string | null;
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    location?: NullableStringFieldUpdateOperationsInput | string | null;
    skillLevel?: IntFieldUpdateOperationsInput | number;
    preferredGame?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserSettingsUpsertWithoutUserInput = {
    update: XOR<
      UserSettingsUpdateWithoutUserInput,
      UserSettingsUncheckedUpdateWithoutUserInput
    >;
    create: XOR<
      UserSettingsCreateWithoutUserInput,
      UserSettingsUncheckedCreateWithoutUserInput
    >;
    where?: UserSettingsWhereInput;
  };

  export type UserSettingsUpdateToOneWithWhereWithoutUserInput = {
    where?: UserSettingsWhereInput;
    data: XOR<
      UserSettingsUpdateWithoutUserInput,
      UserSettingsUncheckedUpdateWithoutUserInput
    >;
  };

  export type UserSettingsUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserSettingsUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    emailNotifications?: BoolFieldUpdateOperationsInput | boolean;
    pushNotifications?: BoolFieldUpdateOperationsInput | boolean;
    darkMode?: BoolFieldUpdateOperationsInput | boolean;
    language?: StringFieldUpdateOperationsInput | string;
    timezone?: StringFieldUpdateOperationsInput | string;
    privacySettings?: StringFieldUpdateOperationsInput | string;
    notificationSettings?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TerritoryUpsertWithWhereUniqueWithoutOwnerInput = {
    where: TerritoryWhereUniqueInput;
    update: XOR<
      TerritoryUpdateWithoutOwnerInput,
      TerritoryUncheckedUpdateWithoutOwnerInput
    >;
    create: XOR<
      TerritoryCreateWithoutOwnerInput,
      TerritoryUncheckedCreateWithoutOwnerInput
    >;
  };

  export type TerritoryUpdateWithWhereUniqueWithoutOwnerInput = {
    where: TerritoryWhereUniqueInput;
    data: XOR<
      TerritoryUpdateWithoutOwnerInput,
      TerritoryUncheckedUpdateWithoutOwnerInput
    >;
  };

  export type TerritoryUpdateManyWithWhereWithoutOwnerInput = {
    where: TerritoryScalarWhereInput;
    data: XOR<
      TerritoryUpdateManyMutationInput,
      TerritoryUncheckedUpdateManyWithoutOwnerInput
    >;
  };

  export type TerritoryScalarWhereInput = {
    AND?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
    OR?: TerritoryScalarWhereInput[];
    NOT?: TerritoryScalarWhereInput | TerritoryScalarWhereInput[];
    id?: StringFilter<'Territory'> | string;
    name?: StringFilter<'Territory'> | string;
    description?: StringNullableFilter<'Territory'> | string | null;
    coordinates?: StringFilter<'Territory'> | string;
    requiredNFT?: StringFilter<'Territory'> | string;
    influence?: IntFilter<'Territory'> | number;
    ownerId?: StringNullableFilter<'Territory'> | string | null;
    clan?: StringNullableFilter<'Territory'> | string | null;
    isActive?: BoolFilter<'Territory'> | boolean;
    createdAt?: DateTimeFilter<'Territory'> | Date | string;
    updatedAt?: DateTimeFilter<'Territory'> | Date | string;
    venueOwnerId?: StringNullableFilter<'Territory'> | string | null;
    status?: StringFilter<'Territory'> | string;
    leaderboard?: StringFilter<'Territory'> | string;
    allegianceMeter?: IntFilter<'Territory'> | number;
    controllingClanId?: StringNullableFilter<'Territory'> | string | null;
  };

  export type UserNFTUpsertWithWhereUniqueWithoutUserInput = {
    where: UserNFTWhereUniqueInput;
    update: XOR<
      UserNFTUpdateWithoutUserInput,
      UserNFTUncheckedUpdateWithoutUserInput
    >;
    create: XOR<
      UserNFTCreateWithoutUserInput,
      UserNFTUncheckedCreateWithoutUserInput
    >;
  };

  export type UserNFTUpdateWithWhereUniqueWithoutUserInput = {
    where: UserNFTWhereUniqueInput;
    data: XOR<
      UserNFTUpdateWithoutUserInput,
      UserNFTUncheckedUpdateWithoutUserInput
    >;
  };

  export type UserNFTUpdateManyWithWhereWithoutUserInput = {
    where: UserNFTScalarWhereInput;
    data: XOR<
      UserNFTUpdateManyMutationInput,
      UserNFTUncheckedUpdateManyWithoutUserInput
    >;
  };

  export type UserNFTScalarWhereInput = {
    AND?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
    OR?: UserNFTScalarWhereInput[];
    NOT?: UserNFTScalarWhereInput | UserNFTScalarWhereInput[];
    id?: StringFilter<'UserNFT'> | string;
    tokenId?: StringFilter<'UserNFT'> | string;
    name?: StringFilter<'UserNFT'> | string;
    description?: StringNullableFilter<'UserNFT'> | string | null;
    imageUrl?: StringNullableFilter<'UserNFT'> | string | null;
    metadata?: StringFilter<'UserNFT'> | string;
    acquiredAt?: DateTimeFilter<'UserNFT'> | Date | string;
    userId?: StringFilter<'UserNFT'> | string;
    territoryId?: StringNullableFilter<'UserNFT'> | string | null;
    isActive?: BoolFilter<'UserNFT'> | boolean;
    createdAt?: DateTimeFilter<'UserNFT'> | Date | string;
    updatedAt?: DateTimeFilter<'UserNFT'> | Date | string;
  };

  export type ChallengeUpsertWithWhereUniqueWithoutChallengerInput = {
    where: ChallengeWhereUniqueInput;
    update: XOR<
      ChallengeUpdateWithoutChallengerInput,
      ChallengeUncheckedUpdateWithoutChallengerInput
    >;
    create: XOR<
      ChallengeCreateWithoutChallengerInput,
      ChallengeUncheckedCreateWithoutChallengerInput
    >;
  };

  export type ChallengeUpdateWithWhereUniqueWithoutChallengerInput = {
    where: ChallengeWhereUniqueInput;
    data: XOR<
      ChallengeUpdateWithoutChallengerInput,
      ChallengeUncheckedUpdateWithoutChallengerInput
    >;
  };

  export type ChallengeUpdateManyWithWhereWithoutChallengerInput = {
    where: ChallengeScalarWhereInput;
    data: XOR<
      ChallengeUpdateManyMutationInput,
      ChallengeUncheckedUpdateManyWithoutChallengerInput
    >;
  };

  export type ChallengeScalarWhereInput = {
    AND?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
    OR?: ChallengeScalarWhereInput[];
    NOT?: ChallengeScalarWhereInput | ChallengeScalarWhereInput[];
    id?: StringFilter<'Challenge'> | string;
    type?: StringFilter<'Challenge'> | string;
    challengerId?: StringFilter<'Challenge'> | string;
    defenderId?: StringFilter<'Challenge'> | string;
    dojoId?: StringFilter<'Challenge'> | string;
    status?: StringFilter<'Challenge'> | string;
    outcome?: StringNullableFilter<'Challenge'> | string | null;
    winnerId?: StringNullableFilter<'Challenge'> | string | null;
    requirements?: StringFilter<'Challenge'> | string;
    matchData?: StringNullableFilter<'Challenge'> | string | null;
    expiresAt?: DateTimeFilter<'Challenge'> | Date | string;
    acceptedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    declinedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    completedAt?: DateTimeNullableFilter<'Challenge'> | Date | string | null;
    createdAt?: DateTimeFilter<'Challenge'> | Date | string;
    updatedAt?: DateTimeFilter<'Challenge'> | Date | string;
  };

  export type ChallengeUpsertWithWhereUniqueWithoutDefenderInput = {
    where: ChallengeWhereUniqueInput;
    update: XOR<
      ChallengeUpdateWithoutDefenderInput,
      ChallengeUncheckedUpdateWithoutDefenderInput
    >;
    create: XOR<
      ChallengeCreateWithoutDefenderInput,
      ChallengeUncheckedCreateWithoutDefenderInput
    >;
  };

  export type ChallengeUpdateWithWhereUniqueWithoutDefenderInput = {
    where: ChallengeWhereUniqueInput;
    data: XOR<
      ChallengeUpdateWithoutDefenderInput,
      ChallengeUncheckedUpdateWithoutDefenderInput
    >;
  };

  export type ChallengeUpdateManyWithWhereWithoutDefenderInput = {
    where: ChallengeScalarWhereInput;
    data: XOR<
      ChallengeUpdateManyMutationInput,
      ChallengeUncheckedUpdateManyWithoutDefenderInput
    >;
  };

  export type NominationUpsertWithWhereUniqueWithoutPlayerInput = {
    where: NominationWhereUniqueInput;
    update: XOR<
      NominationUpdateWithoutPlayerInput,
      NominationUncheckedUpdateWithoutPlayerInput
    >;
    create: XOR<
      NominationCreateWithoutPlayerInput,
      NominationUncheckedCreateWithoutPlayerInput
    >;
  };

  export type NominationUpdateWithWhereUniqueWithoutPlayerInput = {
    where: NominationWhereUniqueInput;
    data: XOR<
      NominationUpdateWithoutPlayerInput,
      NominationUncheckedUpdateWithoutPlayerInput
    >;
  };

  export type NominationUpdateManyWithWhereWithoutPlayerInput = {
    where: NominationScalarWhereInput;
    data: XOR<
      NominationUpdateManyMutationInput,
      NominationUncheckedUpdateManyWithoutPlayerInput
    >;
  };

  export type NominationScalarWhereInput = {
    AND?: NominationScalarWhereInput | NominationScalarWhereInput[];
    OR?: NominationScalarWhereInput[];
    NOT?: NominationScalarWhereInput | NominationScalarWhereInput[];
    id?: StringFilter<'Nomination'> | string;
    playerId?: StringFilter<'Nomination'> | string;
    name?: StringFilter<'Nomination'> | string;
    address?: StringFilter<'Nomination'> | string;
    latitude?: FloatFilter<'Nomination'> | number;
    longitude?: FloatFilter<'Nomination'> | number;
    description?: StringNullableFilter<'Nomination'> | string | null;
    contactInfo?: StringNullableFilter<'Nomination'> | string | null;
    status?: StringFilter<'Nomination'> | string;
    verified?: BoolFilter<'Nomination'> | boolean;
    createdAt?: DateTimeFilter<'Nomination'> | Date | string;
    updatedAt?: DateTimeFilter<'Nomination'> | Date | string;
  };

  export type TerritoryUpsertWithoutHomeDojoUsersInput = {
    update: XOR<
      TerritoryUpdateWithoutHomeDojoUsersInput,
      TerritoryUncheckedUpdateWithoutHomeDojoUsersInput
    >;
    create: XOR<
      TerritoryCreateWithoutHomeDojoUsersInput,
      TerritoryUncheckedCreateWithoutHomeDojoUsersInput
    >;
    where?: TerritoryWhereInput;
  };

  export type TerritoryUpdateToOneWithWhereWithoutHomeDojoUsersInput = {
    where?: TerritoryWhereInput;
    data: XOR<
      TerritoryUpdateWithoutHomeDojoUsersInput,
      TerritoryUncheckedUpdateWithoutHomeDojoUsersInput
    >;
  };

  export type TerritoryUpdateWithoutHomeDojoUsersInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutHomeDojoUsersInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type ClanUpsertWithWhereUniqueWithoutLeaderInput = {
    where: ClanWhereUniqueInput;
    update: XOR<
      ClanUpdateWithoutLeaderInput,
      ClanUncheckedUpdateWithoutLeaderInput
    >;
    create: XOR<
      ClanCreateWithoutLeaderInput,
      ClanUncheckedCreateWithoutLeaderInput
    >;
  };

  export type ClanUpdateWithWhereUniqueWithoutLeaderInput = {
    where: ClanWhereUniqueInput;
    data: XOR<
      ClanUpdateWithoutLeaderInput,
      ClanUncheckedUpdateWithoutLeaderInput
    >;
  };

  export type ClanUpdateManyWithWhereWithoutLeaderInput = {
    where: ClanScalarWhereInput;
    data: XOR<
      ClanUpdateManyMutationInput,
      ClanUncheckedUpdateManyWithoutLeaderInput
    >;
  };

  export type ClanScalarWhereInput = {
    AND?: ClanScalarWhereInput | ClanScalarWhereInput[];
    OR?: ClanScalarWhereInput[];
    NOT?: ClanScalarWhereInput | ClanScalarWhereInput[];
    id?: StringFilter<'Clan'> | string;
    name?: StringFilter<'Clan'> | string;
    tag?: StringFilter<'Clan'> | string;
    description?: StringNullableFilter<'Clan'> | string | null;
    avatar?: StringNullableFilter<'Clan'> | string | null;
    banner?: StringNullableFilter<'Clan'> | string | null;
    leaderId?: StringFilter<'Clan'> | string;
    memberCount?: IntFilter<'Clan'> | number;
    maxMembers?: IntFilter<'Clan'> | number;
    level?: IntFilter<'Clan'> | number;
    experience?: IntFilter<'Clan'> | number;
    territoryCount?: IntFilter<'Clan'> | number;
    totalWins?: IntFilter<'Clan'> | number;
    totalLosses?: IntFilter<'Clan'> | number;
    isPublic?: BoolFilter<'Clan'> | boolean;
    requirements?: StringFilter<'Clan'> | string;
    createdAt?: DateTimeFilter<'Clan'> | Date | string;
    updatedAt?: DateTimeFilter<'Clan'> | Date | string;
  };

  export type ClanMemberUpsertWithoutUserInput = {
    update: XOR<
      ClanMemberUpdateWithoutUserInput,
      ClanMemberUncheckedUpdateWithoutUserInput
    >;
    create: XOR<
      ClanMemberCreateWithoutUserInput,
      ClanMemberUncheckedCreateWithoutUserInput
    >;
    where?: ClanMemberWhereInput;
  };

  export type ClanMemberUpdateToOneWithWhereWithoutUserInput = {
    where?: ClanMemberWhereInput;
    data: XOR<
      ClanMemberUpdateWithoutUserInput,
      ClanMemberUncheckedUpdateWithoutUserInput
    >;
  };

  export type ClanMemberUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan?: ClanUpdateOneRequiredWithoutMembersNestedInput;
  };

  export type ClanMemberUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    clanId?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserCreateWithoutProfileInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutProfileInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutProfileInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutProfileInput,
      UserUncheckedCreateWithoutProfileInput
    >;
  };

  export type UserUpsertWithoutProfileInput = {
    update: XOR<
      UserUpdateWithoutProfileInput,
      UserUncheckedUpdateWithoutProfileInput
    >;
    create: XOR<
      UserCreateWithoutProfileInput,
      UserUncheckedCreateWithoutProfileInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutProfileInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutProfileInput,
      UserUncheckedUpdateWithoutProfileInput
    >;
  };

  export type UserUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserCreateWithoutSettingsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutSettingsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutSettingsInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutSettingsInput,
      UserUncheckedCreateWithoutSettingsInput
    >;
  };

  export type UserUpsertWithoutSettingsInput = {
    update: XOR<
      UserUpdateWithoutSettingsInput,
      UserUncheckedUpdateWithoutSettingsInput
    >;
    create: XOR<
      UserCreateWithoutSettingsInput,
      UserUncheckedCreateWithoutSettingsInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutSettingsInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutSettingsInput,
      UserUncheckedUpdateWithoutSettingsInput
    >;
  };

  export type UserUpdateWithoutSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutSettingsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserCreateWithoutTerritoriesInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutTerritoriesInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutTerritoriesInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutTerritoriesInput,
      UserUncheckedCreateWithoutTerritoriesInput
    >;
  };

  export type UserNFTCreateWithoutTerritoryInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutNftsInput;
  };

  export type UserNFTUncheckedCreateWithoutTerritoryInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    userId: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserNFTCreateOrConnectWithoutTerritoryInput = {
    where: UserNFTWhereUniqueInput;
    create: XOR<
      UserNFTCreateWithoutTerritoryInput,
      UserNFTUncheckedCreateWithoutTerritoryInput
    >;
  };

  export type UserNFTCreateManyTerritoryInputEnvelope = {
    data: UserNFTCreateManyTerritoryInput | UserNFTCreateManyTerritoryInput[];
  };

  export type ChallengeCreateWithoutDojoInput = {
    id?: string;
    type: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    challenger: UserCreateNestedOneWithoutChallengesAsChallengerInput;
    defender: UserCreateNestedOneWithoutChallengesAsDefenderInput;
  };

  export type ChallengeUncheckedCreateWithoutDojoInput = {
    id?: string;
    type: string;
    challengerId: string;
    defenderId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateOrConnectWithoutDojoInput = {
    where: ChallengeWhereUniqueInput;
    create: XOR<
      ChallengeCreateWithoutDojoInput,
      ChallengeUncheckedCreateWithoutDojoInput
    >;
  };

  export type ChallengeCreateManyDojoInputEnvelope = {
    data: ChallengeCreateManyDojoInput | ChallengeCreateManyDojoInput[];
  };

  export type UserCreateWithoutHomeDojoInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutHomeDojoInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutHomeDojoInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutHomeDojoInput,
      UserUncheckedCreateWithoutHomeDojoInput
    >;
  };

  export type UserCreateManyHomeDojoInputEnvelope = {
    data: UserCreateManyHomeDojoInput | UserCreateManyHomeDojoInput[];
  };

  export type ClanCreateWithoutControlledDojosInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateWithoutControlledDojosInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanCreateOrConnectWithoutControlledDojosInput = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutControlledDojosInput,
      ClanUncheckedCreateWithoutControlledDojosInput
    >;
  };

  export type ClanWarCreateWithoutTerritoryInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Score?: number;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    clan1: ClanCreateNestedOneWithoutWarsAsClan1Input;
    clan2: ClanCreateNestedOneWithoutWarsAsClan2Input;
    winner?: ClanCreateNestedOneWithoutWonWarsInput;
  };

  export type ClanWarUncheckedCreateWithoutTerritoryInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateOrConnectWithoutTerritoryInput = {
    where: ClanWarWhereUniqueInput;
    create: XOR<
      ClanWarCreateWithoutTerritoryInput,
      ClanWarUncheckedCreateWithoutTerritoryInput
    >;
  };

  export type ClanWarCreateManyTerritoryInputEnvelope = {
    data: ClanWarCreateManyTerritoryInput | ClanWarCreateManyTerritoryInput[];
  };

  export type UserUpsertWithoutTerritoriesInput = {
    update: XOR<
      UserUpdateWithoutTerritoriesInput,
      UserUncheckedUpdateWithoutTerritoriesInput
    >;
    create: XOR<
      UserCreateWithoutTerritoriesInput,
      UserUncheckedCreateWithoutTerritoriesInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutTerritoriesInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutTerritoriesInput,
      UserUncheckedUpdateWithoutTerritoriesInput
    >;
  };

  export type UserUpdateWithoutTerritoriesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutTerritoriesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserNFTUpsertWithWhereUniqueWithoutTerritoryInput = {
    where: UserNFTWhereUniqueInput;
    update: XOR<
      UserNFTUpdateWithoutTerritoryInput,
      UserNFTUncheckedUpdateWithoutTerritoryInput
    >;
    create: XOR<
      UserNFTCreateWithoutTerritoryInput,
      UserNFTUncheckedCreateWithoutTerritoryInput
    >;
  };

  export type UserNFTUpdateWithWhereUniqueWithoutTerritoryInput = {
    where: UserNFTWhereUniqueInput;
    data: XOR<
      UserNFTUpdateWithoutTerritoryInput,
      UserNFTUncheckedUpdateWithoutTerritoryInput
    >;
  };

  export type UserNFTUpdateManyWithWhereWithoutTerritoryInput = {
    where: UserNFTScalarWhereInput;
    data: XOR<
      UserNFTUpdateManyMutationInput,
      UserNFTUncheckedUpdateManyWithoutTerritoryInput
    >;
  };

  export type ChallengeUpsertWithWhereUniqueWithoutDojoInput = {
    where: ChallengeWhereUniqueInput;
    update: XOR<
      ChallengeUpdateWithoutDojoInput,
      ChallengeUncheckedUpdateWithoutDojoInput
    >;
    create: XOR<
      ChallengeCreateWithoutDojoInput,
      ChallengeUncheckedCreateWithoutDojoInput
    >;
  };

  export type ChallengeUpdateWithWhereUniqueWithoutDojoInput = {
    where: ChallengeWhereUniqueInput;
    data: XOR<
      ChallengeUpdateWithoutDojoInput,
      ChallengeUncheckedUpdateWithoutDojoInput
    >;
  };

  export type ChallengeUpdateManyWithWhereWithoutDojoInput = {
    where: ChallengeScalarWhereInput;
    data: XOR<
      ChallengeUpdateManyMutationInput,
      ChallengeUncheckedUpdateManyWithoutDojoInput
    >;
  };

  export type UserUpsertWithWhereUniqueWithoutHomeDojoInput = {
    where: UserWhereUniqueInput;
    update: XOR<
      UserUpdateWithoutHomeDojoInput,
      UserUncheckedUpdateWithoutHomeDojoInput
    >;
    create: XOR<
      UserCreateWithoutHomeDojoInput,
      UserUncheckedCreateWithoutHomeDojoInput
    >;
  };

  export type UserUpdateWithWhereUniqueWithoutHomeDojoInput = {
    where: UserWhereUniqueInput;
    data: XOR<
      UserUpdateWithoutHomeDojoInput,
      UserUncheckedUpdateWithoutHomeDojoInput
    >;
  };

  export type UserUpdateManyWithWhereWithoutHomeDojoInput = {
    where: UserScalarWhereInput;
    data: XOR<
      UserUpdateManyMutationInput,
      UserUncheckedUpdateManyWithoutHomeDojoInput
    >;
  };

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[];
    OR?: UserScalarWhereInput[];
    NOT?: UserScalarWhereInput | UserScalarWhereInput[];
    id?: StringFilter<'User'> | string;
    email?: StringFilter<'User'> | string;
    password?: StringFilter<'User'> | string;
    role?: StringFilter<'User'> | string;
    createdAt?: DateTimeFilter<'User'> | Date | string;
    updatedAt?: DateTimeFilter<'User'> | Date | string;
    homeDojoId?: StringNullableFilter<'User'> | string | null;
    unlockedZones?: StringFilter<'User'> | string;
    relationships?: StringFilter<'User'> | string;
  };

  export type ClanUpsertWithoutControlledDojosInput = {
    update: XOR<
      ClanUpdateWithoutControlledDojosInput,
      ClanUncheckedUpdateWithoutControlledDojosInput
    >;
    create: XOR<
      ClanCreateWithoutControlledDojosInput,
      ClanUncheckedCreateWithoutControlledDojosInput
    >;
    where?: ClanWhereInput;
  };

  export type ClanUpdateToOneWithWhereWithoutControlledDojosInput = {
    where?: ClanWhereInput;
    data: XOR<
      ClanUpdateWithoutControlledDojosInput,
      ClanUncheckedUpdateWithoutControlledDojosInput
    >;
  };

  export type ClanUpdateWithoutControlledDojosInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateWithoutControlledDojosInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanWarUpsertWithWhereUniqueWithoutTerritoryInput = {
    where: ClanWarWhereUniqueInput;
    update: XOR<
      ClanWarUpdateWithoutTerritoryInput,
      ClanWarUncheckedUpdateWithoutTerritoryInput
    >;
    create: XOR<
      ClanWarCreateWithoutTerritoryInput,
      ClanWarUncheckedCreateWithoutTerritoryInput
    >;
  };

  export type ClanWarUpdateWithWhereUniqueWithoutTerritoryInput = {
    where: ClanWarWhereUniqueInput;
    data: XOR<
      ClanWarUpdateWithoutTerritoryInput,
      ClanWarUncheckedUpdateWithoutTerritoryInput
    >;
  };

  export type ClanWarUpdateManyWithWhereWithoutTerritoryInput = {
    where: ClanWarScalarWhereInput;
    data: XOR<
      ClanWarUpdateManyMutationInput,
      ClanWarUncheckedUpdateManyWithoutTerritoryInput
    >;
  };

  export type ClanWarScalarWhereInput = {
    AND?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
    OR?: ClanWarScalarWhereInput[];
    NOT?: ClanWarScalarWhereInput | ClanWarScalarWhereInput[];
    id?: StringFilter<'ClanWar'> | string;
    name?: StringFilter<'ClanWar'> | string;
    description?: StringNullableFilter<'ClanWar'> | string | null;
    startDate?: DateTimeFilter<'ClanWar'> | Date | string;
    endDate?: DateTimeFilter<'ClanWar'> | Date | string;
    status?: StringFilter<'ClanWar'> | string;
    clan1Id?: StringFilter<'ClanWar'> | string;
    clan1Score?: IntFilter<'ClanWar'> | number;
    clan2Id?: StringFilter<'ClanWar'> | string;
    clan2Score?: IntFilter<'ClanWar'> | number;
    winnerId?: StringNullableFilter<'ClanWar'> | string | null;
    territoryId?: StringNullableFilter<'ClanWar'> | string | null;
    rewards?: StringFilter<'ClanWar'> | string;
    matches?: StringFilter<'ClanWar'> | string;
    createdAt?: DateTimeFilter<'ClanWar'> | Date | string;
    updatedAt?: DateTimeFilter<'ClanWar'> | Date | string;
  };

  export type UserCreateWithoutNftsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutNftsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutNftsInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutNftsInput,
      UserUncheckedCreateWithoutNftsInput
    >;
  };

  export type TerritoryCreateWithoutNftsInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateWithoutNftsInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryCreateOrConnectWithoutNftsInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutNftsInput,
      TerritoryUncheckedCreateWithoutNftsInput
    >;
  };

  export type UserUpsertWithoutNftsInput = {
    update: XOR<
      UserUpdateWithoutNftsInput,
      UserUncheckedUpdateWithoutNftsInput
    >;
    create: XOR<
      UserCreateWithoutNftsInput,
      UserUncheckedCreateWithoutNftsInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutNftsInput = {
    where?: UserWhereInput;
    data: XOR<UserUpdateWithoutNftsInput, UserUncheckedUpdateWithoutNftsInput>;
  };

  export type UserUpdateWithoutNftsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutNftsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type TerritoryUpsertWithoutNftsInput = {
    update: XOR<
      TerritoryUpdateWithoutNftsInput,
      TerritoryUncheckedUpdateWithoutNftsInput
    >;
    create: XOR<
      TerritoryCreateWithoutNftsInput,
      TerritoryUncheckedCreateWithoutNftsInput
    >;
    where?: TerritoryWhereInput;
  };

  export type TerritoryUpdateToOneWithWhereWithoutNftsInput = {
    where?: TerritoryWhereInput;
    data: XOR<
      TerritoryUpdateWithoutNftsInput,
      TerritoryUncheckedUpdateWithoutNftsInput
    >;
  };

  export type TerritoryUpdateWithoutNftsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutNftsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type UserCreateWithoutChallengesAsChallengerInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutChallengesAsChallengerInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutChallengesAsChallengerInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutChallengesAsChallengerInput,
      UserUncheckedCreateWithoutChallengesAsChallengerInput
    >;
  };

  export type UserCreateWithoutChallengesAsDefenderInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutChallengesAsDefenderInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutChallengesAsDefenderInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutChallengesAsDefenderInput,
      UserUncheckedCreateWithoutChallengesAsDefenderInput
    >;
  };

  export type TerritoryCreateWithoutChallengesInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateWithoutChallengesInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryCreateOrConnectWithoutChallengesInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutChallengesInput,
      TerritoryUncheckedCreateWithoutChallengesInput
    >;
  };

  export type UserUpsertWithoutChallengesAsChallengerInput = {
    update: XOR<
      UserUpdateWithoutChallengesAsChallengerInput,
      UserUncheckedUpdateWithoutChallengesAsChallengerInput
    >;
    create: XOR<
      UserCreateWithoutChallengesAsChallengerInput,
      UserUncheckedCreateWithoutChallengesAsChallengerInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutChallengesAsChallengerInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutChallengesAsChallengerInput,
      UserUncheckedUpdateWithoutChallengesAsChallengerInput
    >;
  };

  export type UserUpdateWithoutChallengesAsChallengerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutChallengesAsChallengerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserUpsertWithoutChallengesAsDefenderInput = {
    update: XOR<
      UserUpdateWithoutChallengesAsDefenderInput,
      UserUncheckedUpdateWithoutChallengesAsDefenderInput
    >;
    create: XOR<
      UserCreateWithoutChallengesAsDefenderInput,
      UserUncheckedCreateWithoutChallengesAsDefenderInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutChallengesAsDefenderInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutChallengesAsDefenderInput,
      UserUncheckedUpdateWithoutChallengesAsDefenderInput
    >;
  };

  export type UserUpdateWithoutChallengesAsDefenderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutChallengesAsDefenderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type TerritoryUpsertWithoutChallengesInput = {
    update: XOR<
      TerritoryUpdateWithoutChallengesInput,
      TerritoryUncheckedUpdateWithoutChallengesInput
    >;
    create: XOR<
      TerritoryCreateWithoutChallengesInput,
      TerritoryUncheckedCreateWithoutChallengesInput
    >;
    where?: TerritoryWhereInput;
  };

  export type TerritoryUpdateToOneWithWhereWithoutChallengesInput = {
    where?: TerritoryWhereInput;
    data: XOR<
      TerritoryUpdateWithoutChallengesInput,
      TerritoryUncheckedUpdateWithoutChallengesInput
    >;
  };

  export type TerritoryUpdateWithoutChallengesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutChallengesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type UserCreateWithoutNominationsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutNominationsInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutNominationsInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutNominationsInput,
      UserUncheckedCreateWithoutNominationsInput
    >;
  };

  export type UserUpsertWithoutNominationsInput = {
    update: XOR<
      UserUpdateWithoutNominationsInput,
      UserUncheckedUpdateWithoutNominationsInput
    >;
    create: XOR<
      UserCreateWithoutNominationsInput,
      UserUncheckedCreateWithoutNominationsInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutNominationsInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutNominationsInput,
      UserUncheckedUpdateWithoutNominationsInput
    >;
  };

  export type UserUpdateWithoutNominationsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutNominationsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserCreateWithoutLedClansInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    clanMembership?: ClanMemberCreateNestedOneWithoutUserInput;
  };

  export type UserUncheckedCreateWithoutLedClansInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    clanMembership?: ClanMemberUncheckedCreateNestedOneWithoutUserInput;
  };

  export type UserCreateOrConnectWithoutLedClansInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutLedClansInput,
      UserUncheckedCreateWithoutLedClansInput
    >;
  };

  export type ClanMemberCreateWithoutClanInput = {
    id?: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
    user: UserCreateNestedOneWithoutClanMembershipInput;
  };

  export type ClanMemberUncheckedCreateWithoutClanInput = {
    id?: string;
    userId: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanMemberCreateOrConnectWithoutClanInput = {
    where: ClanMemberWhereUniqueInput;
    create: XOR<
      ClanMemberCreateWithoutClanInput,
      ClanMemberUncheckedCreateWithoutClanInput
    >;
  };

  export type ClanMemberCreateManyClanInputEnvelope = {
    data: ClanMemberCreateManyClanInput | ClanMemberCreateManyClanInput[];
  };

  export type TerritoryCreateWithoutControllingClanInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryUncheckedCreateWithoutControllingClanInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
    contestedWars?: ClanWarUncheckedCreateNestedManyWithoutTerritoryInput;
  };

  export type TerritoryCreateOrConnectWithoutControllingClanInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutControllingClanInput,
      TerritoryUncheckedCreateWithoutControllingClanInput
    >;
  };

  export type TerritoryCreateManyControllingClanInputEnvelope = {
    data:
      | TerritoryCreateManyControllingClanInput
      | TerritoryCreateManyControllingClanInput[];
  };

  export type ClanWarCreateWithoutClan1Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Score?: number;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    clan2: ClanCreateNestedOneWithoutWarsAsClan2Input;
    winner?: ClanCreateNestedOneWithoutWonWarsInput;
    territory?: TerritoryCreateNestedOneWithoutContestedWarsInput;
  };

  export type ClanWarUncheckedCreateWithoutClan1Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateOrConnectWithoutClan1Input = {
    where: ClanWarWhereUniqueInput;
    create: XOR<
      ClanWarCreateWithoutClan1Input,
      ClanWarUncheckedCreateWithoutClan1Input
    >;
  };

  export type ClanWarCreateManyClan1InputEnvelope = {
    data: ClanWarCreateManyClan1Input | ClanWarCreateManyClan1Input[];
  };

  export type ClanWarCreateWithoutClan2Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Score?: number;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    clan1: ClanCreateNestedOneWithoutWarsAsClan1Input;
    winner?: ClanCreateNestedOneWithoutWonWarsInput;
    territory?: TerritoryCreateNestedOneWithoutContestedWarsInput;
  };

  export type ClanWarUncheckedCreateWithoutClan2Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateOrConnectWithoutClan2Input = {
    where: ClanWarWhereUniqueInput;
    create: XOR<
      ClanWarCreateWithoutClan2Input,
      ClanWarUncheckedCreateWithoutClan2Input
    >;
  };

  export type ClanWarCreateManyClan2InputEnvelope = {
    data: ClanWarCreateManyClan2Input | ClanWarCreateManyClan2Input[];
  };

  export type ClanWarCreateWithoutWinnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Score?: number;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    clan1: ClanCreateNestedOneWithoutWarsAsClan1Input;
    clan2: ClanCreateNestedOneWithoutWarsAsClan2Input;
    territory?: TerritoryCreateNestedOneWithoutContestedWarsInput;
  };

  export type ClanWarUncheckedCreateWithoutWinnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateOrConnectWithoutWinnerInput = {
    where: ClanWarWhereUniqueInput;
    create: XOR<
      ClanWarCreateWithoutWinnerInput,
      ClanWarUncheckedCreateWithoutWinnerInput
    >;
  };

  export type ClanWarCreateManyWinnerInputEnvelope = {
    data: ClanWarCreateManyWinnerInput | ClanWarCreateManyWinnerInput[];
  };

  export type UserUpsertWithoutLedClansInput = {
    update: XOR<
      UserUpdateWithoutLedClansInput,
      UserUncheckedUpdateWithoutLedClansInput
    >;
    create: XOR<
      UserCreateWithoutLedClansInput,
      UserUncheckedCreateWithoutLedClansInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutLedClansInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutLedClansInput,
      UserUncheckedUpdateWithoutLedClansInput
    >;
  };

  export type UserUpdateWithoutLedClansInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutLedClansInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type ClanMemberUpsertWithWhereUniqueWithoutClanInput = {
    where: ClanMemberWhereUniqueInput;
    update: XOR<
      ClanMemberUpdateWithoutClanInput,
      ClanMemberUncheckedUpdateWithoutClanInput
    >;
    create: XOR<
      ClanMemberCreateWithoutClanInput,
      ClanMemberUncheckedCreateWithoutClanInput
    >;
  };

  export type ClanMemberUpdateWithWhereUniqueWithoutClanInput = {
    where: ClanMemberWhereUniqueInput;
    data: XOR<
      ClanMemberUpdateWithoutClanInput,
      ClanMemberUncheckedUpdateWithoutClanInput
    >;
  };

  export type ClanMemberUpdateManyWithWhereWithoutClanInput = {
    where: ClanMemberScalarWhereInput;
    data: XOR<
      ClanMemberUpdateManyMutationInput,
      ClanMemberUncheckedUpdateManyWithoutClanInput
    >;
  };

  export type ClanMemberScalarWhereInput = {
    AND?: ClanMemberScalarWhereInput | ClanMemberScalarWhereInput[];
    OR?: ClanMemberScalarWhereInput[];
    NOT?: ClanMemberScalarWhereInput | ClanMemberScalarWhereInput[];
    id?: StringFilter<'ClanMember'> | string;
    userId?: StringFilter<'ClanMember'> | string;
    clanId?: StringFilter<'ClanMember'> | string;
    role?: StringFilter<'ClanMember'> | string;
    contribution?: IntFilter<'ClanMember'> | number;
    territoryCount?: IntFilter<'ClanMember'> | number;
    matchWins?: IntFilter<'ClanMember'> | number;
    joinedAt?: DateTimeFilter<'ClanMember'> | Date | string;
    updatedAt?: DateTimeFilter<'ClanMember'> | Date | string;
  };

  export type TerritoryUpsertWithWhereUniqueWithoutControllingClanInput = {
    where: TerritoryWhereUniqueInput;
    update: XOR<
      TerritoryUpdateWithoutControllingClanInput,
      TerritoryUncheckedUpdateWithoutControllingClanInput
    >;
    create: XOR<
      TerritoryCreateWithoutControllingClanInput,
      TerritoryUncheckedCreateWithoutControllingClanInput
    >;
  };

  export type TerritoryUpdateWithWhereUniqueWithoutControllingClanInput = {
    where: TerritoryWhereUniqueInput;
    data: XOR<
      TerritoryUpdateWithoutControllingClanInput,
      TerritoryUncheckedUpdateWithoutControllingClanInput
    >;
  };

  export type TerritoryUpdateManyWithWhereWithoutControllingClanInput = {
    where: TerritoryScalarWhereInput;
    data: XOR<
      TerritoryUpdateManyMutationInput,
      TerritoryUncheckedUpdateManyWithoutControllingClanInput
    >;
  };

  export type ClanWarUpsertWithWhereUniqueWithoutClan1Input = {
    where: ClanWarWhereUniqueInput;
    update: XOR<
      ClanWarUpdateWithoutClan1Input,
      ClanWarUncheckedUpdateWithoutClan1Input
    >;
    create: XOR<
      ClanWarCreateWithoutClan1Input,
      ClanWarUncheckedCreateWithoutClan1Input
    >;
  };

  export type ClanWarUpdateWithWhereUniqueWithoutClan1Input = {
    where: ClanWarWhereUniqueInput;
    data: XOR<
      ClanWarUpdateWithoutClan1Input,
      ClanWarUncheckedUpdateWithoutClan1Input
    >;
  };

  export type ClanWarUpdateManyWithWhereWithoutClan1Input = {
    where: ClanWarScalarWhereInput;
    data: XOR<
      ClanWarUpdateManyMutationInput,
      ClanWarUncheckedUpdateManyWithoutClan1Input
    >;
  };

  export type ClanWarUpsertWithWhereUniqueWithoutClan2Input = {
    where: ClanWarWhereUniqueInput;
    update: XOR<
      ClanWarUpdateWithoutClan2Input,
      ClanWarUncheckedUpdateWithoutClan2Input
    >;
    create: XOR<
      ClanWarCreateWithoutClan2Input,
      ClanWarUncheckedCreateWithoutClan2Input
    >;
  };

  export type ClanWarUpdateWithWhereUniqueWithoutClan2Input = {
    where: ClanWarWhereUniqueInput;
    data: XOR<
      ClanWarUpdateWithoutClan2Input,
      ClanWarUncheckedUpdateWithoutClan2Input
    >;
  };

  export type ClanWarUpdateManyWithWhereWithoutClan2Input = {
    where: ClanWarScalarWhereInput;
    data: XOR<
      ClanWarUpdateManyMutationInput,
      ClanWarUncheckedUpdateManyWithoutClan2Input
    >;
  };

  export type ClanWarUpsertWithWhereUniqueWithoutWinnerInput = {
    where: ClanWarWhereUniqueInput;
    update: XOR<
      ClanWarUpdateWithoutWinnerInput,
      ClanWarUncheckedUpdateWithoutWinnerInput
    >;
    create: XOR<
      ClanWarCreateWithoutWinnerInput,
      ClanWarUncheckedCreateWithoutWinnerInput
    >;
  };

  export type ClanWarUpdateWithWhereUniqueWithoutWinnerInput = {
    where: ClanWarWhereUniqueInput;
    data: XOR<
      ClanWarUpdateWithoutWinnerInput,
      ClanWarUncheckedUpdateWithoutWinnerInput
    >;
  };

  export type ClanWarUpdateManyWithWhereWithoutWinnerInput = {
    where: ClanWarScalarWhereInput;
    data: XOR<
      ClanWarUpdateManyMutationInput,
      ClanWarUncheckedUpdateManyWithoutWinnerInput
    >;
  };

  export type UserCreateWithoutClanMembershipInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileCreateNestedOneWithoutUserInput;
    settings?: UserSettingsCreateNestedOneWithoutUserInput;
    territories?: TerritoryCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeCreateNestedManyWithoutDefenderInput;
    nominations?: NominationCreateNestedManyWithoutPlayerInput;
    homeDojo?: TerritoryCreateNestedOneWithoutHomeDojoUsersInput;
    ledClans?: ClanCreateNestedManyWithoutLeaderInput;
  };

  export type UserUncheckedCreateWithoutClanMembershipInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    homeDojoId?: string | null;
    unlockedZones?: string;
    relationships?: string;
    profile?: ProfileUncheckedCreateNestedOneWithoutUserInput;
    settings?: UserSettingsUncheckedCreateNestedOneWithoutUserInput;
    territories?: TerritoryUncheckedCreateNestedManyWithoutOwnerInput;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutUserInput;
    challengesAsChallenger?: ChallengeUncheckedCreateNestedManyWithoutChallengerInput;
    challengesAsDefender?: ChallengeUncheckedCreateNestedManyWithoutDefenderInput;
    nominations?: NominationUncheckedCreateNestedManyWithoutPlayerInput;
    ledClans?: ClanUncheckedCreateNestedManyWithoutLeaderInput;
  };

  export type UserCreateOrConnectWithoutClanMembershipInput = {
    where: UserWhereUniqueInput;
    create: XOR<
      UserCreateWithoutClanMembershipInput,
      UserUncheckedCreateWithoutClanMembershipInput
    >;
  };

  export type ClanCreateWithoutMembersInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateWithoutMembersInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanCreateOrConnectWithoutMembersInput = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutMembersInput,
      ClanUncheckedCreateWithoutMembersInput
    >;
  };

  export type UserUpsertWithoutClanMembershipInput = {
    update: XOR<
      UserUpdateWithoutClanMembershipInput,
      UserUncheckedUpdateWithoutClanMembershipInput
    >;
    create: XOR<
      UserCreateWithoutClanMembershipInput,
      UserUncheckedCreateWithoutClanMembershipInput
    >;
    where?: UserWhereInput;
  };

  export type UserUpdateToOneWithWhereWithoutClanMembershipInput = {
    where?: UserWhereInput;
    data: XOR<
      UserUpdateWithoutClanMembershipInput,
      UserUncheckedUpdateWithoutClanMembershipInput
    >;
  };

  export type UserUpdateWithoutClanMembershipInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    homeDojo?: TerritoryUpdateOneWithoutHomeDojoUsersNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
  };

  export type UserUncheckedUpdateWithoutClanMembershipInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    homeDojoId?: NullableStringFieldUpdateOperationsInput | string | null;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
  };

  export type ClanUpsertWithoutMembersInput = {
    update: XOR<
      ClanUpdateWithoutMembersInput,
      ClanUncheckedUpdateWithoutMembersInput
    >;
    create: XOR<
      ClanCreateWithoutMembersInput,
      ClanUncheckedCreateWithoutMembersInput
    >;
    where?: ClanWhereInput;
  };

  export type ClanUpdateToOneWithWhereWithoutMembersInput = {
    where?: ClanWhereInput;
    data: XOR<
      ClanUpdateWithoutMembersInput,
      ClanUncheckedUpdateWithoutMembersInput
    >;
  };

  export type ClanUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanCreateWithoutWarsAsClan1Input = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateWithoutWarsAsClan1Input = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanCreateOrConnectWithoutWarsAsClan1Input = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutWarsAsClan1Input,
      ClanUncheckedCreateWithoutWarsAsClan1Input
    >;
  };

  export type ClanCreateWithoutWarsAsClan2Input = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    wonWars?: ClanWarCreateNestedManyWithoutWinnerInput;
  };

  export type ClanUncheckedCreateWithoutWarsAsClan2Input = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    wonWars?: ClanWarUncheckedCreateNestedManyWithoutWinnerInput;
  };

  export type ClanCreateOrConnectWithoutWarsAsClan2Input = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutWarsAsClan2Input,
      ClanUncheckedCreateWithoutWarsAsClan2Input
    >;
  };

  export type ClanCreateWithoutWonWarsInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    leader: UserCreateNestedOneWithoutLedClansInput;
    members?: ClanMemberCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarCreateNestedManyWithoutClan2Input;
  };

  export type ClanUncheckedCreateWithoutWonWarsInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    leaderId: string;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    members?: ClanMemberUncheckedCreateNestedManyWithoutClanInput;
    controlledDojos?: TerritoryUncheckedCreateNestedManyWithoutControllingClanInput;
    warsAsClan1?: ClanWarUncheckedCreateNestedManyWithoutClan1Input;
    warsAsClan2?: ClanWarUncheckedCreateNestedManyWithoutClan2Input;
  };

  export type ClanCreateOrConnectWithoutWonWarsInput = {
    where: ClanWhereUniqueInput;
    create: XOR<
      ClanCreateWithoutWonWarsInput,
      ClanUncheckedCreateWithoutWonWarsInput
    >;
  };

  export type TerritoryCreateWithoutContestedWarsInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    owner?: UserCreateNestedOneWithoutTerritoriesInput;
    nfts?: UserNFTCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserCreateNestedManyWithoutHomeDojoInput;
    controllingClan?: ClanCreateNestedOneWithoutControlledDojosInput;
  };

  export type TerritoryUncheckedCreateWithoutContestedWarsInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
    nfts?: UserNFTUncheckedCreateNestedManyWithoutTerritoryInput;
    challenges?: ChallengeUncheckedCreateNestedManyWithoutDojoInput;
    homeDojoUsers?: UserUncheckedCreateNestedManyWithoutHomeDojoInput;
  };

  export type TerritoryCreateOrConnectWithoutContestedWarsInput = {
    where: TerritoryWhereUniqueInput;
    create: XOR<
      TerritoryCreateWithoutContestedWarsInput,
      TerritoryUncheckedCreateWithoutContestedWarsInput
    >;
  };

  export type ClanUpsertWithoutWarsAsClan1Input = {
    update: XOR<
      ClanUpdateWithoutWarsAsClan1Input,
      ClanUncheckedUpdateWithoutWarsAsClan1Input
    >;
    create: XOR<
      ClanCreateWithoutWarsAsClan1Input,
      ClanUncheckedCreateWithoutWarsAsClan1Input
    >;
    where?: ClanWhereInput;
  };

  export type ClanUpdateToOneWithWhereWithoutWarsAsClan1Input = {
    where?: ClanWhereInput;
    data: XOR<
      ClanUpdateWithoutWarsAsClan1Input,
      ClanUncheckedUpdateWithoutWarsAsClan1Input
    >;
  };

  export type ClanUpdateWithoutWarsAsClan1Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateWithoutWarsAsClan1Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUpsertWithoutWarsAsClan2Input = {
    update: XOR<
      ClanUpdateWithoutWarsAsClan2Input,
      ClanUncheckedUpdateWithoutWarsAsClan2Input
    >;
    create: XOR<
      ClanCreateWithoutWarsAsClan2Input,
      ClanUncheckedCreateWithoutWarsAsClan2Input
    >;
    where?: ClanWhereInput;
  };

  export type ClanUpdateToOneWithWhereWithoutWarsAsClan2Input = {
    where?: ClanWhereInput;
    data: XOR<
      ClanUpdateWithoutWarsAsClan2Input,
      ClanUncheckedUpdateWithoutWarsAsClan2Input
    >;
  };

  export type ClanUpdateWithoutWarsAsClan2Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateWithoutWarsAsClan2Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUpsertWithoutWonWarsInput = {
    update: XOR<
      ClanUpdateWithoutWonWarsInput,
      ClanUncheckedUpdateWithoutWonWarsInput
    >;
    create: XOR<
      ClanCreateWithoutWonWarsInput,
      ClanUncheckedCreateWithoutWonWarsInput
    >;
    where?: ClanWhereInput;
  };

  export type ClanUpdateToOneWithWhereWithoutWonWarsInput = {
    where?: ClanWhereInput;
    data: XOR<
      ClanUpdateWithoutWonWarsInput,
      ClanUncheckedUpdateWithoutWonWarsInput
    >;
  };

  export type ClanUpdateWithoutWonWarsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    leader?: UserUpdateOneRequiredWithoutLedClansNestedInput;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
  };

  export type ClanUncheckedUpdateWithoutWonWarsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    leaderId?: StringFieldUpdateOperationsInput | string;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
  };

  export type TerritoryUpsertWithoutContestedWarsInput = {
    update: XOR<
      TerritoryUpdateWithoutContestedWarsInput,
      TerritoryUncheckedUpdateWithoutContestedWarsInput
    >;
    create: XOR<
      TerritoryCreateWithoutContestedWarsInput,
      TerritoryUncheckedCreateWithoutContestedWarsInput
    >;
    where?: TerritoryWhereInput;
  };

  export type TerritoryUpdateToOneWithWhereWithoutContestedWarsInput = {
    where?: TerritoryWhereInput;
    data: XOR<
      TerritoryUpdateWithoutContestedWarsInput,
      TerritoryUncheckedUpdateWithoutContestedWarsInput
    >;
  };

  export type TerritoryUpdateWithoutContestedWarsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutContestedWarsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
  };

  export type TerritoryCreateManyOwnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
    controllingClanId?: string | null;
  };

  export type UserNFTCreateManyUserInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    territoryId?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateManyChallengerInput = {
    id?: string;
    type: string;
    defenderId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateManyDefenderInput = {
    id?: string;
    type: string;
    challengerId: string;
    dojoId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type NominationCreateManyPlayerInput = {
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    contactInfo?: string | null;
    status?: string;
    verified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanCreateManyLeaderInput = {
    id?: string;
    name: string;
    tag: string;
    description?: string | null;
    avatar?: string | null;
    banner?: string | null;
    memberCount?: number;
    maxMembers?: number;
    level?: number;
    experience?: number;
    territoryCount?: number;
    totalWins?: number;
    totalLosses?: number;
    isPublic?: boolean;
    requirements?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type TerritoryUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    controllingClan?: ClanUpdateOneWithoutControlledDojosNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateManyWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    controllingClanId?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
  };

  export type UserNFTUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    territory?: TerritoryUpdateOneWithoutNftsNestedInput;
  };

  export type UserNFTUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserNFTUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUpdateWithoutChallengerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    defender?: UserUpdateOneRequiredWithoutChallengesAsDefenderNestedInput;
    dojo?: TerritoryUpdateOneRequiredWithoutChallengesNestedInput;
  };

  export type ChallengeUncheckedUpdateWithoutChallengerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUncheckedUpdateManyWithoutChallengerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUpdateWithoutDefenderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    challenger?: UserUpdateOneRequiredWithoutChallengesAsChallengerNestedInput;
    dojo?: TerritoryUpdateOneRequiredWithoutChallengesNestedInput;
  };

  export type ChallengeUncheckedUpdateWithoutDefenderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUncheckedUpdateManyWithoutDefenderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    dojoId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type NominationUncheckedUpdateManyWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    address?: StringFieldUpdateOperationsInput | string;
    latitude?: FloatFieldUpdateOperationsInput | number;
    longitude?: FloatFieldUpdateOperationsInput | number;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    contactInfo?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    verified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanUpdateWithoutLeaderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateWithoutLeaderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    members?: ClanMemberUncheckedUpdateManyWithoutClanNestedInput;
    controlledDojos?: TerritoryUncheckedUpdateManyWithoutControllingClanNestedInput;
    warsAsClan1?: ClanWarUncheckedUpdateManyWithoutClan1NestedInput;
    warsAsClan2?: ClanWarUncheckedUpdateManyWithoutClan2NestedInput;
    wonWars?: ClanWarUncheckedUpdateManyWithoutWinnerNestedInput;
  };

  export type ClanUncheckedUpdateManyWithoutLeaderInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    tag?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    avatar?: NullableStringFieldUpdateOperationsInput | string | null;
    banner?: NullableStringFieldUpdateOperationsInput | string | null;
    memberCount?: IntFieldUpdateOperationsInput | number;
    maxMembers?: IntFieldUpdateOperationsInput | number;
    level?: IntFieldUpdateOperationsInput | number;
    experience?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    totalWins?: IntFieldUpdateOperationsInput | number;
    totalLosses?: IntFieldUpdateOperationsInput | number;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    requirements?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserNFTCreateManyTerritoryInput = {
    id?: string;
    tokenId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    metadata?: string;
    acquiredAt?: Date | string;
    userId: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ChallengeCreateManyDojoInput = {
    id?: string;
    type: string;
    challengerId: string;
    defenderId: string;
    status?: string;
    outcome?: string | null;
    winnerId?: string | null;
    requirements?: string;
    matchData?: string | null;
    expiresAt: Date | string;
    acceptedAt?: Date | string | null;
    declinedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserCreateManyHomeDojoInput = {
    id?: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    unlockedZones?: string;
    relationships?: string;
  };

  export type ClanWarCreateManyTerritoryInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserNFTUpdateWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutNftsNestedInput;
  };

  export type UserNFTUncheckedUpdateWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    userId?: StringFieldUpdateOperationsInput | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserNFTUncheckedUpdateManyWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tokenId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: StringFieldUpdateOperationsInput | string;
    acquiredAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    userId?: StringFieldUpdateOperationsInput | string;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUpdateWithoutDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    challenger?: UserUpdateOneRequiredWithoutChallengesAsChallengerNestedInput;
    defender?: UserUpdateOneRequiredWithoutChallengesAsDefenderNestedInput;
  };

  export type ChallengeUncheckedUpdateWithoutDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ChallengeUncheckedUpdateManyWithoutDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    type?: StringFieldUpdateOperationsInput | string;
    challengerId?: StringFieldUpdateOperationsInput | string;
    defenderId?: StringFieldUpdateOperationsInput | string;
    status?: StringFieldUpdateOperationsInput | string;
    outcome?: NullableStringFieldUpdateOperationsInput | string | null;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    requirements?: StringFieldUpdateOperationsInput | string;
    matchData?: NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    acceptedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    declinedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    completedAt?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserUpdateWithoutHomeDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateWithoutHomeDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
    profile?: ProfileUncheckedUpdateOneWithoutUserNestedInput;
    settings?: UserSettingsUncheckedUpdateOneWithoutUserNestedInput;
    territories?: TerritoryUncheckedUpdateManyWithoutOwnerNestedInput;
    nfts?: UserNFTUncheckedUpdateManyWithoutUserNestedInput;
    challengesAsChallenger?: ChallengeUncheckedUpdateManyWithoutChallengerNestedInput;
    challengesAsDefender?: ChallengeUncheckedUpdateManyWithoutDefenderNestedInput;
    nominations?: NominationUncheckedUpdateManyWithoutPlayerNestedInput;
    ledClans?: ClanUncheckedUpdateManyWithoutLeaderNestedInput;
    clanMembership?: ClanMemberUncheckedUpdateOneWithoutUserNestedInput;
  };

  export type UserUncheckedUpdateManyWithoutHomeDojoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    email?: StringFieldUpdateOperationsInput | string;
    password?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    unlockedZones?: StringFieldUpdateOperationsInput | string;
    relationships?: StringFieldUpdateOperationsInput | string;
  };

  export type ClanWarUpdateWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan1?: ClanUpdateOneRequiredWithoutWarsAsClan1NestedInput;
    clan2?: ClanUpdateOneRequiredWithoutWarsAsClan2NestedInput;
    winner?: ClanUpdateOneWithoutWonWarsNestedInput;
  };

  export type ClanWarUncheckedUpdateWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUncheckedUpdateManyWithoutTerritoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanMemberCreateManyClanInput = {
    id?: string;
    userId: string;
    role?: string;
    contribution?: number;
    territoryCount?: number;
    matchWins?: number;
    joinedAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type TerritoryCreateManyControllingClanInput = {
    id?: string;
    name: string;
    description?: string | null;
    coordinates: string;
    requiredNFT: string;
    influence?: number;
    ownerId?: string | null;
    clan?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    venueOwnerId?: string | null;
    status?: string;
    leaderboard?: string;
    allegianceMeter?: number;
  };

  export type ClanWarCreateManyClan1Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateManyClan2Input = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Score?: number;
    winnerId?: string | null;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanWarCreateManyWinnerInput = {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status?: string;
    clan1Id: string;
    clan1Score?: number;
    clan2Id: string;
    clan2Score?: number;
    territoryId?: string | null;
    rewards?: string;
    matches?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type ClanMemberUpdateWithoutClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    user?: UserUpdateOneRequiredWithoutClanMembershipNestedInput;
  };

  export type ClanMemberUncheckedUpdateWithoutClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanMemberUncheckedUpdateManyWithoutClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    role?: StringFieldUpdateOperationsInput | string;
    contribution?: IntFieldUpdateOperationsInput | number;
    territoryCount?: IntFieldUpdateOperationsInput | number;
    matchWins?: IntFieldUpdateOperationsInput | number;
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TerritoryUpdateWithoutControllingClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    owner?: UserUpdateOneWithoutTerritoriesNestedInput;
    nfts?: UserNFTUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateWithoutControllingClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
    nfts?: UserNFTUncheckedUpdateManyWithoutTerritoryNestedInput;
    challenges?: ChallengeUncheckedUpdateManyWithoutDojoNestedInput;
    homeDojoUsers?: UserUncheckedUpdateManyWithoutHomeDojoNestedInput;
    contestedWars?: ClanWarUncheckedUpdateManyWithoutTerritoryNestedInput;
  };

  export type TerritoryUncheckedUpdateManyWithoutControllingClanInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    coordinates?: StringFieldUpdateOperationsInput | string;
    requiredNFT?: StringFieldUpdateOperationsInput | string;
    influence?: IntFieldUpdateOperationsInput | number;
    ownerId?: NullableStringFieldUpdateOperationsInput | string | null;
    clan?: NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    venueOwnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: StringFieldUpdateOperationsInput | string;
    leaderboard?: StringFieldUpdateOperationsInput | string;
    allegianceMeter?: IntFieldUpdateOperationsInput | number;
  };

  export type ClanWarUpdateWithoutClan1Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan2?: ClanUpdateOneRequiredWithoutWarsAsClan2NestedInput;
    winner?: ClanUpdateOneWithoutWonWarsNestedInput;
    territory?: TerritoryUpdateOneWithoutContestedWarsNestedInput;
  };

  export type ClanWarUncheckedUpdateWithoutClan1Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUncheckedUpdateManyWithoutClan1Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUpdateWithoutClan2Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan1?: ClanUpdateOneRequiredWithoutWarsAsClan1NestedInput;
    winner?: ClanUpdateOneWithoutWonWarsNestedInput;
    territory?: TerritoryUpdateOneWithoutContestedWarsNestedInput;
  };

  export type ClanWarUncheckedUpdateWithoutClan2Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUncheckedUpdateManyWithoutClan2Input = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    winnerId?: NullableStringFieldUpdateOperationsInput | string | null;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUpdateWithoutWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    clan1?: ClanUpdateOneRequiredWithoutWarsAsClan1NestedInput;
    clan2?: ClanUpdateOneRequiredWithoutWarsAsClan2NestedInput;
    territory?: TerritoryUpdateOneWithoutContestedWarsNestedInput;
  };

  export type ClanWarUncheckedUpdateWithoutWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ClanWarUncheckedUpdateManyWithoutWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string;
    status?: StringFieldUpdateOperationsInput | string;
    clan1Id?: StringFieldUpdateOperationsInput | string;
    clan1Score?: IntFieldUpdateOperationsInput | number;
    clan2Id?: StringFieldUpdateOperationsInput | string;
    clan2Score?: IntFieldUpdateOperationsInput | number;
    territoryId?: NullableStringFieldUpdateOperationsInput | string | null;
    rewards?: StringFieldUpdateOperationsInput | string;
    matches?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
