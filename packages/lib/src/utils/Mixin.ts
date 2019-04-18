type Constructable<T = {}> = new (...args: any[]) => T;
export type Callable<T = any> = (...args: any[]) => T;
export type AbstractType<T = {}> = () => void & { prototype: T };

export type GetMixinType<T extends Callable> = InstanceType<ReturnType<T>>;

export default Constructable;
