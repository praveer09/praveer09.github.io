---
layout: post
title:  "Writing Test Data Builders Made Easy With Kotlin"
date:   2015-12-26 18:00:00
comments: true
categories: technology
---
 
In this article I will be focusing on few features of [Kotlin][KotlinLang] that help in __writing 
concise and readable code__. To explain the features, I will be using the concept of Test Data Builders, 
as described in the book [Growing Object-Oriented Software, Guided by Tests][TDDBook]. I hope that by the end of 
this article I will have generated enough interest in you to try out Kotlin. 

If you are not aware, Kotlin, developed by [JetBrains][JetBrains], is a statically 
typed programming language for the JVM. It is fully interoperable with Java (i.e. Kotlin code can be 
called from Java and vice versa). 

I will be focusing on the following features of Kotlin:

* [Default Arguments][DefaultArguments]
* [Named Arguments][NamedArguments]
* [Data Classes][DataClasses]

### Concept of Test Data Builders
When you write a test, unit or integration, you need test data. A domain object may exist in many different states, 
depending on how it is constructed and modified. These different states of an object generally form the test data. 
The code for construction and modification of objects has to be written in every test which uses the object. When 
the object is complex, the code to construct and modify it becomes complex thus reducing the readability 
and maintainability of the tests.
 
By using __Test Data Builders__, which uses [Builder Pattern][BuilderPattern], the 
construction and modification of a complex object can be made simple. We will see how the usage of builders leads to 
better readability and maintainability and see ___how Kotlin makes it easy to write these builders___.


### Example Object
Before we look at one of these builders, lets see an example of an object for which a test data builder may be 
useful. This example has been taken from the documentation of [make-it-easy][MakeItEasy], a tiny framework that 
makes it easy to write the Test Data Builders in Java.

```java
class Apple(private val leaves: Int) {
    private var ripeness = 0.0

    fun ripen(amount: Double) {
        ripeness = Math.min(1.0, ripeness + amount)
    }

    fun isRipe() = ripeness == 1.0
    
    fun numberOfLeaves() = leaves
}
``` 

From the code above the following observations can be made:

* The object in this case in an `Apple`
* Number of `leaves` is defined using a constructor in the first line. Notice how concise the constructor definition is.
* By default an apple is unripe (i.e. `ripeness` = 0.0).
* Ripeness can be modified using the `ripen()` method.

Examples of test data involving apple can be: 

* An _unripe apple with 2 leaves_ (leaves = 2 and ripeness = 0.0), 
* A _ripe apple with 1 leaf_ (leaves = 1 and ripeness = 1.0), and many more.

### Test Data Builder for Apple
Lets define a Builder for the Apple now.

```java
data class AppleBuilder(val ripeness: Double = 0.0, val leaves: Int = 1) {
    fun build() = Apple(leaves).apply { ripen(ripeness) }
}
```

From the code above the following observations can be made:

* The builder defines two properties `ripeness` and `leaves` in its constructor and both of them have default values.
* It uses the `leaves` property to construct an apple by making the call `Apple(leaves)`.
* It uses the `ripeness` property to set the appropriate ripeness on the constructed apple using  
`apply { ripen(ripeness) }`, which is an [extension function][ExtensionFunctions]. 
I am not covering extension functions in this article. `apply` is simply calling the `{ ripen(ripeness) }` 
function on newly created apple.
* The `data` keyword in the first line defines the `AppleBuilder` as a Data Class. I will be explaining it later in 
the article.

The `AppleBuilder` can be created in the following ways to construct instances of apples in tests.

__Using Default Arguments__  

```java
val unripeAppleWith1Leaf = AppleBuilder().build()
```

In the code above, the `AppleBuilder` is created by not specifying any constructor arguments. Note that this 
is possible because the arguments in the constructor definition has default values. The instance of builder 
takes the default values of `ripeness` and `leaves` defined on its constructor and thus builds and unripe apple with 
one leaf. This feature is called [Default Arguments][DefaultArguments] in Kotlin. _Using the default values in 
the arguments of functions and constructor definitions obviates the need of specifying the arguments while making 
the constructor or function calls. The defined default values are assumed when arguments are not specified._

__Using Named Arguments__

```java
val unripeAppleWith2Leaves = AppleBuilder(leaves = 2).build()
```

In this case the `AppleBuilder` instance is created with the customized value of `leaves` i.e. 2 and the default value 
of `ripeness` i.e. 0.0 (an unripe apple with 2 leaves). Note that only one of two constructor arguments is specified 
in the constructor call. This feature is called [Named Arguments][NamedArguments] 
in Kotlin. _Using the Named Arguments while making function or constructor calls obviates the need of specifying 
all the arguments defined in the constructor or function definition._ 

> Default Arguments and Named Arguments features of Kotlin help in writing concise code by removing the need 
overloaded functions and constructors.

One more benefit of Named Arguments is that the code becomes more clear on the client/calling side. Compare 
`AppleBuilder(0.5, 2)` with `AppleBuilder(ripeness = 0.5, leaves = 2)`. The latter is definitely more readable. In 
the former you will have to go to the constructor definition to check what properties 0.5 and 2 and correspond to. 
Also `AppleBuilder(ripeness = 0.5, leaves = 2)` is same as `AppleBuilder(leaves = 2, ripeness = 0.5)`.
_Using the Named Arguments while making function or constructor calls the arguments can be defined in any order 
irrespective of the order defined in the constructor or function definition._

> Named Arguments feature of Kotlin helps in making the code readable.

The features provided by Default Arguments and Named Arguments is achieved in Java using overloaded constructors 
and methods, which increases a lot of boilerplate on the definition side. Also on the usage side the arguments have 
to be passed in specific order which makes the code prone to errors (in cases when more than one argument of same 
type is present, there is a risk on the values getting interchanged).

__Using Copies of Pre-defined Builders__

Suppose many tests use ripe apples as a common condition in their test data but the number of leaves are different 
in each test. Defining a builder, which can be re-used by the tests, will be helpful. Each test can then create 
a copy of this generic builder and specify the test specific parameters, which in this case will be leaves, and 
build apples out of them.

```java
val ripeAppleBuilder = AppleBuilder(ripeness = 1, leaves = 0)

val ripeAppleWith2Leaves = ripeAppleBuilder.copy(leaves = 2).build()
```

In the above code, `ripeAppleBuilder` is the reusable builder which can be used by many tests. Though in this case 
it seems an overhead to create a reusable builder, it becomes beneficial when builders are complex. The `copy()` 
method is provided by the [Data Classes][DataClasses]. If you look at the definition of `AppleBuilder` again, it has 
`data class AppleBuilder` instead of just `class AppleBuilder`. The `copy()` method provides a copy of the 
reusable builder but with 2 leaves instead of 0. All the other properties remain the same as original builder. Kotlin 
automatically also generates other functions like `equals()/hashcode()` and `toString()` using the 
properties of data classes. 

> Data Classes in Kotlin also help in writing concise code by generating few useful functions.

## Summary
[Default Arguments][DefaultArguments], [Named Arguments][NamedArguments] and [Data Classes][DataClasses] are some of 
many features that Kotlin provide which can be used to write concise and readable code. Kotlin has a potential to be 
a good addition to your development toolbox.

[KotlinLang]: https://kotlinlang.org/
[TDDBook]: http://www.growing-object-oriented-software.com/
[MakeItEasy]: https://github.com/npryce/make-it-easy
[DataClasses]: https://kotlinlang.org/docs/reference/data-classes.html
[DataClassesCopy]: https://kotlinlang.org/docs/reference/data-classes.html#copying
[NamedArguments]: https://kotlinlang.org/docs/reference/functions.html#named-arguments
[DefaultArguments]: https://kotlinlang.org/docs/reference/functions.html#default-arguments
[BuilderPattern]: https://en.wikipedia.org/wiki/Builder_pattern
[JetBrains]: http://jetbrains.com/
[ExtensionFunctions]: https://kotlinlang.org/docs/reference/extensions.html#extension-functions