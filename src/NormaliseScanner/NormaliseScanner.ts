import { NavClass, SchemaBlueprint, INormaliseScanner } from 'normalizr-toolkit';
import { nameof } from '../utils/utils';

export default class NormaliseScanner implements INormaliseScanner {
	public scan<T extends NavClass>(classType: new () => T) {
		const instance = new classType();

		if (
			!instance.__NormaliseSchemaKey__ ||
			!instance.__NormaliseSchemaKey__.trim().length
		) {
			throw Error(
				'NormaliseScanner can only scan Entity classes. Please ensure that it has a valid key.'
			);
		}

		const schema: SchemaBlueprint = {
			schemaKey: instance.__NormaliseSchemaKey__,
			properties: undefined,
			ids: undefined
		};

		const properties = instance.__NavigationProperties__
			? Object.keys(instance.__NavigationProperties__).map(p => {
					return {
						instance: instance.__NavigationProperties__[p],
						key: p,
						schemaType: instance.__NavigationProperties__[p]
							.iterable
							? 'Array'
							: 'Entity'
					};
			  })
			: [];

		if (properties.find(p => schema.schemaKey === p.instance.key)) {
			throw Error(
				`NormaliseScanner has found a circular reference within ${nameof(
					classType
				)}. Conflicting key found: ${schema.schemaKey}.`
			);
		}

		const ids =
			'__NormaliseIds__' in instance
				? instance.__NormaliseIds__
				: undefined;

		schema.ids = ids;

		const idSeperator =
			'__NormaliseIdSeperator__' in instance
				? instance.__NormaliseIdSeperator__
				: undefined;

		schema.idSeperator = idSeperator;

		if (properties.length) {
			properties.forEach(p => {
				Object.assign(schema, {
					properties: {
						...schema.properties,
						[p.key]: {
							...this.scan(p.instance.constructorfn),
							schemaType: p.schemaType
						}
					}
				});
			});
		}

		return schema;
	}
}
