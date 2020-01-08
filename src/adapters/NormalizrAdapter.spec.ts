import { entity, navigation, id } from '../decorators/decorators';
import { nameof, EntityBase } from '../utils/utils';
import { schema, Schema } from 'normalizr';
import NormalizrAdapter from './NormalizrAdapter';
import NormaliseScanner from '../NormaliseScanner/NormaliseScanner';

describe('NormalizrAdapter', () => {
	describe('generateSchema', () => {
		@entity(nameof(MyOtherIterableEntites))
		class MyOtherIterableEntites extends EntityBase {
			public name: string;
		}

		@entity(nameof(MyIterableEntities))
		class MyIterableEntities extends EntityBase {
			public otherIterables = new Set<MyOtherIterableEntites>();
		}

		@entity(nameof(MyEntity))
		class MyEntity extends EntityBase {
			@id
			public name: string;

			@navigation(MyIterableEntities, { iterable: true })
			public iterables = new Set<MyIterableEntities>();
		}

		// .toEqual will fail on Schema objects due to it storing functions, which, when doing
		// shallow comparisons, will fail tests as the expected schema's functions and target
		// schema's functions do not share the same reference in memory.
		function mockSchema(schema: any): Schema {
			const Mock = jest.fn();

			schema._getId = new Mock();
			schema._mergeStrategy = new Mock();
			schema._processStrategy = new Mock();

			const mockTheFollowingIfFunc = ['_idAttribute'];
			mockTheFollowingIfFunc.forEach(k => {
				if (
					~Object.keys(schema).findIndex(a => a === k) &&
					typeof schema[k] === 'function'
				) {
					schema[k] = new Mock();
				}
			});

			const schemaKeys = Object.keys(schema.schema || {});
			if (schemaKeys.length) {
				schemaKeys.forEach(k => {
					schema.schema = {
						...schema.schema,
						[k]: Array.isArray(schema.schema[k])
							? // We can't mock array types - expect only does a shallow comparison so even if the string
							  // result is correct, it fails due to reference comparison.
							  // ? [mockSchema(schema.schema[k])]
							  new Mock()
							: mockSchema(schema.schema[k])
					};
				});
			}

			return schema;
		}

		it('Should generate a simple Schema based on the blueprint provided', () => {
			const adapter = new NormalizrAdapter();

			const expectedSchema = mockSchema(
				adapter.generateSchema({
					schemaKey: 'Entity'
				})
			);

			const targetSchema = mockSchema(new schema.Entity('Entity'));

			expect(expectedSchema).toEqual(targetSchema);
		});

		it('Should generate a complicated Schema based on the blueprint provided', () => {
			const adapter = new NormalizrAdapter();

			const expectedSchema = mockSchema(
				adapter.generateSchema({
					schemaKey: 'Entity',
					properties: {
						child: {
							schemaKey: 'Child',
							schemaType: 'Entity',
							ids: ['name']
						}
					}
				})
			);

			const targetSchema = mockSchema(
				new schema.Entity('Entity', {
					child: mockSchema(
						new schema.Entity('Child', undefined, {
							idAttribute: value => value['name']
						})
					)
				})
			);

			expect(expectedSchema).toEqual(targetSchema);
		});

		it('Should generate a simple Schema based on the blueprint provided from decorators', () => {
			const scanner = new NormaliseScanner();
			const adapter = new NormalizrAdapter();

			const expectedSchema = mockSchema(
				adapter.generateSchema(scanner.scan(MyOtherIterableEntites))
			);

			const targetSchema = mockSchema(
				new schema.Entity('MyOtherIterableEntites')
			);

			expect(expectedSchema).toEqual(targetSchema);
		});

		it('Should generate a complicated Schema based on the blueprint provided from decorators', () => {
			const scanner = new NormaliseScanner();
			const adapter = new NormalizrAdapter();

			const expectedSchema = mockSchema(
				adapter.generateSchema(scanner.scan(MyEntity))
			);

			const targetSchema = mockSchema(
				new schema.Entity(
					'MyEntity',
					{
						iterables: [
							new schema.Entity('MyIterableEntities', {
								requests: new schema.Entity(
									'MyOtherIterableEntites'
								)
							})
						]
					},
					{ idAttribute: value => value['name'] }
				)
			);

			expect(expectedSchema).toEqual(targetSchema);
		});

		describe('normalise', () => {
			it('Should normalise with array of data.', () => {
				const adapter = new NormalizrAdapter();

				const expectedNormalise = JSON.stringify({
					entities: {
						Entity: {
							1: {
								id: 1,
								name: 'Entity 1'
							},
							2: {
								id: 2,
								name: 'Entity 2'
							}
						}
					},
					result: [1, 2]
				});

				const dataAsArray = [
					{ id: 1, name: 'Entity 1' },
					{ id: 2, name: 'Entity 2' }
				];

				const entitySchema = new schema.Entity('Entity');

				expect(
					JSON.stringify(
						adapter.normalise(dataAsArray, entitySchema)
					)
				).toEqual(expectedNormalise);
			});

			it('Should normalise with data as an object', () => {
				const adapter = new NormalizrAdapter();

				const expectedNormalise = JSON.stringify({
					entities: {
						Entity: {
							1: {
								id: 1,
								name: 'Entity 1'
							}
						}
					},
					result: 1
				});

				const dataAsObject = { id: 1, name: 'Entity 1' };

				const entitySchema = new schema.Entity('Entity');
				expect(
					JSON.stringify(
						adapter.normalise(dataAsObject, entitySchema)
					)
				).toEqual(expectedNormalise);
			});

			it('Should normalise with an enitity class', () => {
				const adapter = new NormalizrAdapter();

				const expectedNormalise = JSON.stringify({
					entities: {
						MyEntity: {
							1: {
								id: 1,
								name: 'Entity 1'
							},
							2: {
								id: 2,
								name: 'Entity 2'
							}
						}
					},
					result: [1, 2]
				});

				const dataAsArray = [
					{ id: 1, name: 'Entity 1' },
					{ id: 2, name: 'Entity 2' }
				];

				@entity(nameof(MyEntity))
				class MyEntity extends EntityBase {
					public id: number;
					public name: string;
				}

				expect(
					JSON.stringify(
						adapter.normaliseBy(dataAsArray, MyEntity)
					)
				).toEqual(expectedNormalise);
			});
		});
	});

	describe('denormalise', () => {
		it('should throw an error if target state is not present', () => {
			const adapter = new NormalizrAdapter();

			const state = {};

			expect(() =>
				adapter.denormalise(state, new schema.Entity('test'))
			).toThrowError(
				Error(
					`Unable to denormalise target as the target key does not exist in state. Target: test`
				)
			);
		});

		it('should denormalise all from state given a target schema.', () => {
			const adapter = new NormalizrAdapter();

			const state = {
				Entity: {
					1: {
						id: 1,
						name: 'entity'
					},
					2: {
						id: 2,
						name: 'entity 2'
					}
				}
			};

			const entity = new schema.Entity('Entity');

			expect(adapter.denormalise(state, entity)).toEqual([
				{
					id: 1,
					name: 'entity'
				},
				{
					id: 2,
					name: 'entity 2'
				}
			]);
		});

		it('should denormalise by ids', () => {
			const adapter = new NormalizrAdapter();

			const state = {
				entities: {
					1: {
						id: 1,
						name: 'entities'
					},
					2: {
						id: 2,
						name: 'entities 2'
					},
					3: {
						id: 3,
						name: 'entities 3'
					}
				}
			};

			const entity = new schema.Entity('entities');

			expect(
				adapter.denormaliseByIds([1, 3], entity, state)
			).toEqual({
				entities: [
					{
						id: 1,
						name: 'entities'
					},
					{
						id: 3,
						name: 'entities 3'
					}
				]
			});
		});

		it('should throw an error if key is not present in the Schema', () => {
			const adapter = new NormalizrAdapter();

			const state = {
				entities: {
					1: {
						id: 1,
						name: 'entities'
					},
					2: {
						id: 2,
						name: 'entities 2'
					},
					3: {
						id: 3,
						name: 'entities 3'
					}
				}
			};

			const entity = new schema.Entity('entities');
			const entities = { entities: [entity] };

			expect(() =>
				adapter.denormaliseByIds([1, 3], entities, state)
			).toThrowError(
				Error('Key must be present in Schema when denormalising.')
			);
		});

		it('should denormalise by entity', () => {
			const adapter = new NormalizrAdapter();

			const state = {
				entities: {
					1: {
						id: 1,
						name: 'entities'
					},
					2: {
						id: 2,
						name: 'entities 2'
					},
					3: {
						id: 3,
						name: 'entities 3'
					}
				}
			};

			@entity('entities')
			class Entity extends EntityBase {
				public id: number;

				public name: string;
			}

			expect(adapter.denormaliseBy(state, Entity)).toEqual([
				{
					id: 1,
					name: 'entities'
				},
				{
					id: 2,
					name: 'entities 2'
				},
				{
					id: 3,
					name: 'entities 3'
				}
			]);
		});

		it('should denormalise by entity, where we give it specific IDs', () => {
			const adapter = new NormalizrAdapter();

			const state = {
				entities: {
					1: {
						id: 1,
						name: 'entities'
					},
					2: {
						id: 2,
						name: 'entities 2'
					},
					3: {
						id: 3,
						name: 'entities 3'
					}
				}
			};

			@entity('entities')
			class Entity extends EntityBase {
				public id: number;

				public name: string;
			}

			expect(
				adapter.denormaliseBy(state, Entity, [1, 3])
			).toEqual({
				entities: [
					{
						id: 1,
						name: 'entities'
					},
					{
						id: 3,
						name: 'entities 3'
					}
				]
			});
		});
	});
});
