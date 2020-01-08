import { NavClass } from 'normalizr-toolkit';

/**
 * Gets the name of a given constructor type.
 *
 * @param constructor Class type.
 */
export function nameof<T>(constructor: new () => T): string {
	const type = new constructor();

	return type.constructor.name;
}

/**
 * All classes inherited by EntityBase are marked as an Entity type class, which
 * enables normalisation abilities.
 */
export class EntityBase implements NavClass {
	__NormaliseSchemaKey__: string;
	__NavigationProperties__: {
		[key: string]: {
			key: string;
			constructorfn: new () => any;
			iterable?: boolean;
		};
	};
	__NormaliseIdSeperator__: string;
	__NormaliseIds__: string[];
}
