declare module 'normalizr-toolkit' {
	import { Schema, schema } from 'normalizr';

	export type NavClass<T = any> = {
		__NormaliseSchemaKey__: string;
		__NavigationProperties__: {
			[key: string]: {
				key: string;
				constructorfn: new () => T;
				iterable?: boolean;
			};
		};
		__NormaliseIds__: string[];
		__NormaliseIdSeperator__: string;
	};

	export interface EntityClassConfig {
		idSeperator?: string;
	}

	export interface NavigationPropertyConfig {
		iterable?: boolean;
	}

	type SchemaTypes = 'Array' | 'Entity';

	export interface SchemaPropertyBlueprint {
		[propertyName: string]: SchemaBlueprint;
	}

	export interface SchemaBlueprint {
		schemaKey: string;
		schemaType?: SchemaTypes;
		properties?: SchemaPropertyBlueprint;
		ids?: string[];
		idSeperator?: string;
	}

	export interface INormaliseScanner {
		scan<T extends NavClass>(classType: new () => T): SchemaBlueprint;
	}

	export interface INormalisation {
		normalise<TData>(data: TData | TData[], schema: Schema): any;
		normaliseBy<TData, T extends NavClass>(
			data: TData | TData[],
			constructorfn: new () => T
		): any;
		denormalise<TState extends object>(
			state: TState,
			schema: Schema
		): any;
		denormaliseBy<TState extends object, T extends NavClass>(
			state: TState,
			constructorfn: new () => T
		): any;
		generateSchema(blueprint: SchemaBlueprint): schema.Entity;
	}
}
