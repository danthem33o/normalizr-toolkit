import {
	NavClass,
	NavigationPropertyConfig,
	EntityClassConfig
} from 'normalizr-toolkit';
import { nameof } from '../utils/utils';

/**
 * Marks the wrapped class as an Entity class which will enable Normalisation abilities.
 *
 * @param key The key to use for the outputed Schema.
 */
export function entity(key: string, config?: EntityClassConfig) {
	return function(constructor: any): any {
		const options = config ? config : {};

		const { idSeperator } = options;
		return class extends constructor {
			__NormaliseSchemaKey__ = key;
			__NormaliseIdSeperator__ = idSeperator;
		};
	};
}

/**
 * Marks the wrapped property as a navigation property.
 *
 * @param key Constructor type of target entity.
 * @param config Additional configuration of the wrapped property.
 */
export function navigation<T extends NavClass>(
	key: new () => T,
	config: NavigationPropertyConfig = {}
) {
	// We must pretend that the third argument is optional, although it is not for method properties.
	// See: https://stackoverflow.com/questions/37694322/typescript-ts1241-unable-to-resolve-signature-of-method-decorator-when-called-a, comment by "DomQ".
	return function(
		target: any,
		propertyName: string,
		descriptor?: TypedPropertyDescriptor<any>
	): any {
		let navProps;
		if ('__NavigationProperties__' in target) {
			navProps = (target as NavClass).__NavigationProperties__;
		} else {
			navProps = {};
		}

		const { iterable } = config;
		Object.assign(target, {
			__NavigationProperties__: {
				...navProps,
				[propertyName]: {
					key: nameof(key),
					iterable,
					constructorfn: key
				}
			}
		});
	};
}

export function id(
	target,
	propertyName: string,
	descriptor?: TypedPropertyDescriptor<any>
) {
	let idArray;
	if ('__NormaliseIds__' in target) {
		idArray = (target as NavClass).__NormaliseIds__;
	} else {
		idArray = [];
	}

	Object.assign(target, {
		__NormaliseIds__: [...idArray, propertyName]
	});
}
