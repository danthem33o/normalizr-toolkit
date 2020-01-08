import { entity, navigation, id } from '../decorators/decorators';
import { nameof, EntityBase } from '../utils/utils';
import NormaliseScanner from './NormaliseScanner';

@entity(nameof(MyOtherIterableEntites))
class MyOtherIterableEntites extends EntityBase {
	public name: string;
}

@entity(nameof(MyIterableEntities))
class MyIterableEntities extends EntityBase {
	@navigation(MyOtherIterableEntites, { iterable: true })
	public requests = new Set<MyOtherIterableEntites>();
}

@entity(nameof(Entity))
class Entity extends EntityBase {
	@navigation(MyIterableEntities, { iterable: true })
	public categories = new Set<MyIterableEntities>();
}

const MyOtherIterableEntitesExpected = {
	schemaKey: 'MyOtherIterableEntites',
	properties: undefined
};

const MyIterableEntitiesExpected = {
	schemaKey: 'MyIterableEntities',
	properties: {
		requests: {
			...MyOtherIterableEntitesExpected,
			schemaType: 'Array'
		}
	}
};

const EntityExpected = {
	schemaKey: 'Entity',
	properties: {
		categories: {
			...MyIterableEntitiesExpected,
			schemaType: 'Array'
		}
	}
};

describe('normalisation', () => {
	describe('NormaliseScanner', () => {
		it('Should produce a simple SchemaBlueprint.', () => {
			@entity(nameof(SimpleEntity))
			class SimpleEntity extends EntityBase {
				public name: string;
			}

			const scanner = new NormaliseScanner();
			expect(scanner.scan<SimpleEntity>(SimpleEntity)).toEqual({
				schemaKey: 'SimpleEntity'
			});
		});

		it('Should produce a simple SchemaBlueprint with simple nav properties.', () => {
			@entity(nameof(SimpleChild))
			class SimpleChild extends EntityBase {}

			@entity(nameof(SimpleEntity))
			class SimpleEntity extends EntityBase {
				public name: string;

				@navigation(SimpleChild)
				public child: SimpleChild;
			}

			const scanner = new NormaliseScanner();
			expect(scanner.scan<SimpleEntity>(SimpleEntity)).toEqual({
				schemaKey: 'SimpleEntity',
				properties: {
					child: {
						schemaKey: 'SimpleChild',
						schemaType: 'Entity'
					}
				}
			});
		});

		it('Should produce a simple SchemaBlueprint with simple nav properties, where property is an array.', () => {
			@entity(nameof(SimpleChild))
			class SimpleChild extends EntityBase {}

			@entity(nameof(SimpleEntity))
			class SimpleEntity extends EntityBase {
				public name: string;

				@navigation(SimpleChild, { iterable: true })
				public child = new Set<SimpleChild>();
			}

			const scanner = new NormaliseScanner();

			expect(scanner.scan<SimpleEntity>(SimpleEntity)).toEqual({
				schemaKey: 'SimpleEntity',
				properties: {
					child: {
						schemaKey: 'SimpleChild',
						schemaType: 'Array'
					}
				}
			});
		});

		it('Should produce a complicated SchemaBlueprint', () => {
			@entity(nameof(ComplicatedSubChild))
			class ComplicatedSubChild extends EntityBase {
				public name: string;

				public date: Date;
			}

			@entity(nameof(ComplicatedChild))
			class ComplicatedChild extends EntityBase {
				public name: string;

				public date: Date;

				@navigation(ComplicatedSubChild, { iterable: true })
				public child = new Set<ComplicatedSubChild>();

				@navigation(ComplicatedSubChild)
				public child2 = new Set<ComplicatedSubChild>();
			}

			@entity(nameof(ComplicatedEntity))
			class ComplicatedEntity extends EntityBase {
				public name: string;

				public date: Date;

				@navigation(ComplicatedChild, { iterable: true })
				public child = new Set<ComplicatedChild>();

				@navigation(ComplicatedChild, { iterable: true })
				public child2 = new Set<ComplicatedChild>();

				@navigation(ComplicatedChild)
				public child3 = new ComplicatedChild();
			}

			const ComplicatedSubChildExpected = {
				schemaKey: 'ComplicatedSubChild'
			};

			const ComplicatedChildExpected = {
				schemaKey: 'ComplicatedChild',
				properties: {
					child: {
						...ComplicatedSubChildExpected,
						schemaType: 'Array'
					},
					child2: {
						...ComplicatedSubChildExpected,
						schemaType: 'Entity'
					}
				}
			};

			const ComplicatedEntityExpected = {
				schemaKey: 'ComplicatedEntity',
				properties: {
					child: {
						...ComplicatedChildExpected,
						schemaType: 'Array'
					},
					child2: {
						...ComplicatedChildExpected,
						schemaType: 'Array'
					},
					child3: {
						...ComplicatedChildExpected,
						schemaType: 'Entity'
					}
				}
			};

			const scanner = new NormaliseScanner();
			expect(scanner.scan(ComplicatedEntity)).toEqual(
				ComplicatedEntityExpected
			);
		});

		it('Should handle stack overflow error', () => {
			@entity(nameof(Entity))
			class Entity extends EntityBase {
				@navigation(Entity)
				public entity = new Set<Entity>();
			}

			const scanner = new NormaliseScanner();
			expect(() => scanner.scan(Entity)).toThrowError(
				Error(
					`NormaliseScanner has found a circular reference within Entity. Conflicting key found: Entity.`
				)
			);
		});

		it('Should show id seperator', () => {
			@entity(nameof(EntityTest), { idSeperator: '-' })
			class EntityTest extends EntityBase {}

			const scanner = new NormaliseScanner();
			expect(scanner.scan(EntityTest)).toEqual({
				schemaKey: 'EntityTest',
				properties: undefined,
				ids: undefined,
				idSeperator: '-'
			});
		});

		it('Should show id', () => {
			@entity(nameof(ChildEntity))
			class ChildEntity extends EntityBase {
				public id: number;
			}

			@entity(nameof(EntityTest), { idSeperator: '-' })
			class EntityTest extends EntityBase {
				@id
				public name: string;

				@id
				public sequence: string;

				@navigation(ChildEntity)
				public child: ChildEntity;
			}

			const scanner = new NormaliseScanner();
			expect(scanner.scan(EntityTest)).toEqual({
				schemaKey: 'EntityTest',
				properties: {
					child: {
						schemaKey: 'ChildEntity',
						properties: undefined,
						ids: undefined,
						schemaType: 'Entity',
						idSeperator: undefined
					}
				},
				idSeperator: '-',
				ids: ['name', 'sequence']
			});
		});

		it('Should handle scanning entity without entity decorator', () => {
			class Entity extends EntityBase {
				public name: string;
			}

			const scanner = new NormaliseScanner();

			expect(() => scanner.scan(Entity)).toThrowError(
				Error(
					'NormaliseScanner can only scan Entity classes. Please ensure that it has a valid key.'
				)
			);
		});

		it('Should produce a complicated SchemaBlueprint, where N+6 deep', () => {
			@entity(nameof(ComplicatedSubChild))
			class ComplicatedSubChild extends EntityBase {
				public name: string;

				public date: Date;

				@navigation(Entity)
				public engagement: Entity;
			}

			@entity(nameof(ComplicatedChild))
			class ComplicatedChild extends EntityBase {
				public name: string;

				public date: Date;

				@navigation(ComplicatedSubChild, { iterable: true })
				public child = new Set<ComplicatedSubChild>();

				@navigation(ComplicatedSubChild)
				public child2 = new Set<ComplicatedSubChild>();
			}

			@entity(nameof(ComplicatedEntity))
			class ComplicatedEntity extends EntityBase {
				public name: string;

				public date: Date;

				@navigation(ComplicatedChild, { iterable: true })
				public child = new Set<ComplicatedChild>();

				@navigation(ComplicatedChild, { iterable: true })
				public child2 = new Set<ComplicatedChild>();

				@navigation(ComplicatedChild)
				public child3 = new ComplicatedChild();
			}

			const ComplicatedSubChildExpected = {
				schemaKey: 'ComplicatedSubChild',
				properties: {
					engagement: {
						...EntityExpected,
						schemaType: 'Entity'
					}
				}
			};

			const ComplicatedChildExpected = {
				schemaKey: 'ComplicatedChild',
				properties: {
					child: {
						...ComplicatedSubChildExpected,
						schemaType: 'Array'
					},
					child2: {
						...ComplicatedSubChildExpected,
						schemaType: 'Entity'
					}
				}
			};

			const ComplicatedEntityExpected = {
				schemaKey: 'ComplicatedEntity',
				properties: {
					child: {
						...ComplicatedChildExpected,
						schemaType: 'Array'
					},
					child2: {
						...ComplicatedChildExpected,
						schemaType: 'Array'
					},
					child3: {
						...ComplicatedChildExpected,
						schemaType: 'Entity'
					}
				}
			};

			const scanner = new NormaliseScanner();
			expect(scanner.scan(ComplicatedEntity)).toEqual(
				ComplicatedEntityExpected
			);
		});
	});
});
