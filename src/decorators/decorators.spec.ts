import { navigation, entity, id } from './decorators';
import { nameof, EntityBase } from '../utils/utils';

describe('normalisation', () => {
	describe('decorators', () => {
		const STATE_KEYS = {
			Entity: 'Entity',
			IterableEntity: 'IterableEntity'
		};

		class Entity extends EntityBase {
			public name: string = '';

			@navigation(Entity, { iterable: true })
			public IterableEntities: any = new Set();
		}

		describe('NavigationProperty', () => {
			it('should add the navigation property to a given object.', () => {
				const entity = new Entity();

				expect(
					(entity as any).__NavigationProperties__
				).toBeTruthy();
			});

			it('should expect the navigation property to be a dictionary of key and iterable.', () => {
				const entity = new Entity();

				expect(
					(entity as any).__NavigationProperties__
				).toEqual({
					IterableEntities: {
						constructorfn: Entity,
						iterable: true,
						key: 'Entity'
					}
				});
			});

			it('should expect the navigation property to be a dictionary of key and iterable, where iterable is undefined.', () => {
				class IterableEntity extends EntityBase {}

				class IterableTest extends EntityBase {
					@navigation(IterableEntity)
					public IterableEntities: any = {};
				}

				const iterable = new IterableTest();

				expect(
					(iterable as any).__NavigationProperties__
				).toEqual({
					IterableEntities: {
						constructorfn: IterableEntity,
						iterable: undefined,
						key: 'IterableEntity'
					}
				});
			});

			it('should work with many nav props.', () => {
				class MultiNav extends EntityBase {
					@navigation(Entity)
					public entity;

					@navigation(IterableEntity)
					public iterableEntities;
				}

				const entity = new MultiNav();
				expect(
					(entity as any).__NavigationProperties__
				).toBeTruthy();
				expect(
					(entity as any).__NavigationProperties__
				).toEqual({
					entity: {
						key: STATE_KEYS.Entity,
						constructorfn: Entity,
						iterable: undefined
					},
					iterableEntities: {
						key: STATE_KEYS.IterableEntity,
						constructorfn: IterableEntity,
						iterable: undefined
					}
				});
			});
		});

		@entity(STATE_KEYS.IterableEntity)
		class IterableEntity extends EntityBase {
			public name: string;

			@navigation(Entity, { iterable: true })
			public IterableEntities: any = new Set();
		}

		describe('entity', () => {
			it('should add the entity property to a given object.', () => {
				const iterable = new IterableEntity();

				expect(
					(iterable as any).__NormaliseSchemaKey__
				).toBeTruthy();
			});

			it('should use the key given for an entity.', () => {
				const iterable = new IterableEntity();

				expect((iterable as any).__NormaliseSchemaKey__).toEqual(
					STATE_KEYS.IterableEntity
				);
			});

			it('should work with using nameof', () => {
				@entity(nameof(NameOfTest))
				class NameOfTest extends EntityBase {}

				const test = new NameOfTest();
				expect((test as any).__NormaliseSchemaKey__).toEqual(
					'NameOfTest'
				);
			});

			it('should add ID seperator if config is used', () => {
				@entity(nameof(IdSepTest), { idSeperator: '-' })
				class IdSepTest extends EntityBase {}

				const test = new IdSepTest();

				expect(test.__NormaliseIdSeperator__).toEqual('-');
			});
		});

		describe('id', () => {
			it('Should add the id property to the class', () => {
				class EntityTest {
					@id
					public name: string;

					@id
					public compound: number;
				}

				const entityTest = new EntityTest();

				expect((entityTest as any).__NormaliseIds__).toBeTruthy();
			});

			it('Should add all of the properties marked as id in the IDs array', () => {
				class EntityTest extends EntityBase {
					@id
					public name: string;

					@id
					public compound: number;
				}

				const entityTest = new EntityTest();

				expect((entityTest as any).__NormaliseIds__).toEqual([
					'name',
					'compound'
				]);
			});
		});

		describe('all', () => {
			it('should be able to use all', () => {
				const entity = new Entity();
				const iterableEntity = new IterableEntity();

				expect(
					(iterableEntity as any).__NormaliseSchemaKey__
				).toBeTruthy();
				expect(
					(entity as any).__NavigationProperties__
				).toBeTruthy();
			});
		});
	});
});
