import { Schema, normalize, denormalize, schema } from 'normalizr';
import { NavClass, SchemaBlueprint, INormalisation } from 'normalizr-toolkit';
import { NormaliseScanner } from '../NormaliseScanner';

class NormalizrAdapter implements INormalisation {
	/**
	 * Generates a Normalizr Schema object based on the given blueprint.
	 *
	 * @param blueprint Blueprint of the Schema you wish to create.
	 */
	public generateSchema(blueprint: SchemaBlueprint): schema.Entity {
		const getOptions = () => {
			let options;

			if (blueprint.ids) {
				options = Object.assign(options || {}, {
					idAttribute: value =>
						blueprint.ids
							.map(k => value[k].toString())
							.join(blueprint.idSeperator || '')
				});
			}

			return options;
		};

		const getDefinitions = () => {
			let definitions;

			if (blueprint.properties) {
				Object.keys(blueprint.properties || {}).forEach(k => {
					switch (blueprint.properties[k].schemaType) {
						case 'Array':
							definitions = Object.assign(
								definitions || {},
								{
									[k]: [
										this.generateSchema(
											blueprint.properties[k]
										)
									]
								}
							);
							break;
						case 'Entity':
						default:
							definitions = Object.assign(
								definitions || {},
								{
									[k]: this.generateSchema(
										blueprint.properties[k]
									)
								}
							);
							break;
					}
				});
			}

			return definitions;
		};

		return new schema.Entity(
			blueprint.schemaKey,
			getDefinitions(),
			getOptions()
		);
	}

	/**
	 * Normalises a given data set by a Schema.
	 *
	 * @param data Data to normalise to a common form.
	 * @param constructorfn The class to use as a normalisation
	 */
	public normaliseBy<TData, T extends NavClass>(
		data: TData | TData[],
		constructorfn: new () => T
	) {
		const scanner = new NormaliseScanner();

		const schema = this.generateSchema(scanner.scan(constructorfn));

		return this.normalise(data, schema);
	}

	/**
	 * Normalises a data set by a given entity.
	 *
	 * @param data Data to normalise to a common form.
	 * @param schema The Schema to use - describes the structure of the normalised data set.
	 */
	public normalise<TData>(data: TData | TData[], schema: Schema<any>) {
		try {
			if (Array.isArray(data)) {
				return normalize(data, [schema] as Schema);
			} else {
				return normalize(data, schema);
			}
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Denormalises a target structure by the given entity.
	 *
	 * @param state Location of where target state is situated. Denormalise needs the full store structure.
	 * @param constructorfn The entity to denormalise by.
	 */
	public denormaliseBy<TState extends object, T extends NavClass, TId>(
		state: TState,
		constructorfn: new () => T,
		ids?: TId[]
	): any {
		const scanner = new NormaliseScanner();

		const schema = this.generateSchema(scanner.scan(constructorfn));

		if (ids) {
			return this.denormaliseByIds(ids, schema, state);
		} else {
			return this.denormalise(state, schema);
		}
	}

	/**
	 * Denormalises a data set by a given Schema.
	 *
	 * @param state Location of where target state is situated. Denormalise needs the fulle store sructure.
	 * @param schema The Schema used to normalise the target state.
	 * @throws {Error} Target not found exception. Exception will be thrown if the target state does not exist within the given state.
	 */
	public denormalise<TState extends object>(
		state: TState,
		schema: Schema<any>
	) {
		const key = (schema as schema.Entity).key;
		const targetState = state[key];

		if (!targetState) {
			throw new Error(
				`Unable to denormalise target as the target key does not exist in state. Target: ${key}`
			);
		}

		return Object.keys(targetState).map(k =>
			denormalize(targetState[k], schema as schema.Entity, state)
		);
	}

	/**
	 * Denormalises entities based on the given schema.
	 *
	 * @param ids Target entities.
	 * @param schema Schema used to denormalise.
	 * @param state The target state.
	 * @throws {Error} Throws an error if a key is not present on the given Schema.
	 */
	public denormaliseByIds<TId, TState extends object>(
		ids: TId[],
		schema: Schema<any>,
		state: TState
	) {
		const key = (schema as schema.Entity).key;

		if (!key) {
			throw new Error(
				'Key must be present in Schema when denormalising.'
			);
		}

		// We expect the schema structure to be an array of entities, with the given key.
		const schemaAsArray = { [key]: [schema] };

		return denormalize({ [key]: ids }, schemaAsArray, state);
	}
}

export default NormalizrAdapter;
