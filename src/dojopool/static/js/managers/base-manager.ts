export abstract class BaseManager<T extends BaseManager<T>> {
    private static instances = new Map<string, BaseManager<any>>();

    protected constructor() {
        if (BaseManager.instances.has(this.constructor.name)) {
            throw new Error(`${this.constructor.name} is a singleton and cannot be instantiated multiple times`);
        }
        BaseManager.instances.set(this.constructor.name, this);
    }

    protected static getInstance<U extends BaseManager<U>>(this: new () => U): U {
        const name = this.name;
        if (!BaseManager.instances.has(name)) {
            new this();
        }
        return BaseManager.instances.get(name) as U;
    }

    public abstract cleanup(): void;

    protected onCleanup(): void {
        BaseManager.instances.delete(this.constructor.name);
    }
} 