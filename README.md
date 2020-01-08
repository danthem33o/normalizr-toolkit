## normalizr-toolkit

### Description

A Normalisation package that provides abstractions around `Normalizr` and gives abilities to create Schemas by writing entity classes using default conventions and 
annotations, which will ultimately be ran through the `NormaliseScanner` to produce a Schema. 

### Decorators

#### Entity

The `@entity(key: string)` decorator marks the wrapped class as an Entity class, enabling normalisation abilities. The wrapped class **must** contain the following
properties `__NormaliseSchemaKey__` and `__NavigationProperties__`. A helper base class has been created to help aid with this: `EntityBase`. A helper method
has been provided to get the name of the wrapped class: `nameof<T>(classType: new () => T)`.

```JavaScript

Use case:

// nameof is a utility function provided by normalizr-toolkit
@entity(nameof(MyEntity))
export default class MyEntity extends EntityBase {
    ...
}

```

#### Navigation

The `@navigation<T>(classType: new () => T, config?: NavigationConfig)` decorator marks the wrapped property as a navigation property - meaning that the 
wrapped property will have a corresponding Schema. The class type **must** be wrapped in `@entity(...)`, see Entity section. If the given property is 
an iterable property (array, sets, etc.), then the navigation property **must** be marked as an iterable.

```JavaScript

Use case: 

// MyIterableEntity.ts
@entity(nameof(MyIterableEntity))
export default class MyIterableEntity extends EntityBase {
    ...
}

// MyEntity.ts
@entity(nameof(MyEntity))
export default class MyEntity extends EntityBase {
    @navigation(MyIterableEntity, { iterable: true })
    public iterableEntities = new Set<MyIterableEntity>();
}

```

**Configration options**

| **Property Name** | **Description** | **Possible Values** |
| `iterable` | Marks the navigation property as an array-like value and the Schema should be reflected as such. | `Default`: undefined `Boolean: true | false` |

### NormaliseScanner

Normalise scanner is used internally to build each entity's Schema blueprint. Any navigation properties used will then be checked recursively until the full
dependancy tree is worked out. It is the bridge between entity declarations and the Normalizr library.

**Expected output per Entity**

```JavaScript

// Key is the property name within the class that we're running the scanner on.
// Each child within properties may also have a list of their own properties.
{
    schemaKey: string,
    properties: {
        [key: string]: {
            schemaKey: string;
            schemaType: 'Array' | 'Entity';
            properties: { .... }
        }
    }
}

```

### Utils

Normalise package utility functions and classes.

#### nameof

`nameof<T>(constructorfn: new () => T)` will output the constructor function's name - this is typically your class' name. 

#### EntityBase

`EntityBase` provides properties needed for our normalisation process to work. They are vital to NormaliseScanner and are therefor added to a base class
to help when creating entity classes.