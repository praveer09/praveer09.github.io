---
layout: post
title:  "Writing Comparators - The Java 8 Way"
date:   2016-06-21 08:00:00 +05:30
comments: true
categories: technology
---

Java 8 introduced a few default methods and static factory methods on the [Comparator interface][ComparatorInterface] 
that allow developers to write Comparators in a declarative way. The Comparator interface combines the principles from 
[Builder Pattern][Builder], [Factory Method Pattern][FactoryMethod], [Decorator Pattern][Decorator] and 
[Functional Programming][Functional] to come up with a very expressive API.  

In this article I will be using a few examples to show how you can write Comparators using the newly defined methods. 
I will try to cover most of the use-cases that one would come across while writing Comparators.

The code samples can be found [here][CodeSample].

### What is a Comparator?
The Java documentation provides a good definition of a `Comparator`.

> A comparison function, which imposes a total ordering on some collection of objects. Comparators can be passed to a sort 
method (such as Collections.sort or Arrays.sort) to allow precise control over the sort order. Comparators can also be 
used to control the order of certain data structures (such as sorted sets or sorted maps), or to provide an 
ordering for collections of objects that don't have a natural ordering.

## Example domain object
For the purpose of demonstration I will be using the following domain object.

```java
class Person {
    private final String name;
    private final int age;

    Person(String name, int age) { ... } 

    String getName() { return name; }
    int getAge() { return age; }
}
```

## Use Cases
Let's go through the below four use cases and see how we can write Comparators for each one of them

* A Comparator that sorts on a single property
* A concise version of _comparing_
* Writing efficient Comparators
* A Comparator that sorts on multiple properties
* Handling _null_ values in a property


### A Comparator that sorts on a single property
Let's try to write a Comparator that would sort a collection of Person in the ascending order of a Person's name.

```java
import static java.util.Comparator.comparing;
import static java.util.Comparator.naturalOrder;
...
Comparator<Person> comparator = comparing(Person::getName, naturalOrder());
```
The `comparing` method is a static factory method on the `Comparator` interface for creating Comparators. This method 
takes in two arguments:

* _keyExtractor_ - This is a function which gives the sort key. In the example above the keyExtractor is 
`Function<Person, String>` represented by `Person::getName`.
* _keyComparator_ - This is the Comparator which compares the sort key. In the example above the keyComparator is 
`Comparator<String>` represented by `naturalOrder()`.

Below are other variations of the example above.

```java
// sort in descending order
Comparator<Person> comparator = comparing(Person::getName, reverseOrder());
// sort in case insensitive descending order 
Comparator<Person> comparator = 
         comparing(Person::getName, String.CASE_INSENSITIVE_ORDER.reversed());
```

#### A concise version of _comparing_
There is an overloaded version of `comparing` where only the keyExtractor has to be provided. If the key implements 
the `Comparable` interface then a `naturalOrder()` is assumed for the keyComparator. When you use this overloaded version 
the code will look like below: 

```java
Comparator<Person> comparator = comparing(Person::getName);
```

### Writing efficient Comparators
Let's try to write a Comparator that would sort a collection of Person in the ascending order of a Person's age.  

```java
import static java.util.Comparator.comparingInt;
...
Comparator<Person> comparator = comparingInt(Person::getAge);
```
As the age property in Person is a primitive int, we can use the primitive specialization of the static 
factory method `comparing`. The costs associated with auto-boxing and unboxing are removed when the primitive 
specializations are used. Here the keyExtractor, `Person::getAge`, is a `ToIntFunction<Person>`.  

Similar to `comparingInt`, the Comparator interface also has `comparingDouble` and `comparingLong`.

### A Comparator that sorts on multiple properties
Let's try to write a Comparator that would sort a collection of Person in the ascending order of a Person's age and, within 
each age group, the Person objects should be sorted in ascending order of name.

```java
Comparator<Person> comparator = 
        comparingInt(Person::getAge).thenComparing(Person::getName);
```

The `thenComparing` is a default method on the Comparator interface that helps in composing multiple comparators. For 
primitive properties the primitive specializations of the default method are `thenComparingInt`, `thenComparingLong` 
and `thenComparingDouble`. These methods use the [builder pattern][Builder] to chain multiple Comparators. 

### Handling _null_ values in a property 
Let's assume that the name property of Person can be null. Now let's try to write a Comparator that would sort 
a collection of Person in the ascending order of a Person's name. The question that would arise in your mind is that 
what should be sorting criteria for the null values of name? Let's keep the Person objects, having null names, towards the 
end of the sorted collection. 

```java
import static java.util.Comparator.nullsLast;
...
Comparator<Person> comparing = 
        comparing(Person::getName, nullsLast(naturalOrder()));
```

`nullsLast(naturalOrder())` sorts the non-null values is ascending order and keeps the null values at the end of a 
sorted collection. Here `nullsLast` is again a static factory method for creating a Comparators. It takes in a 
Comparator as an argument which it [decorates][Decorator] with null value handling functionality. Similarly 
there is `nullsFirst`, which considers null values ahead of non-null values.

## Summary
Comparator in Java 8 has leveraged the new language features that were introduced in Java 8. By studying the source 
code of Comparator interface and using its APIs, I have gained insight into how I can write expressive code. 

[ComparatorInterface]: https://docs.oracle.com/javase/8/docs/api/java/util/Comparator.html
[FactoryMethod]: https://en.wikipedia.org/wiki/Factory_method_pattern
[Decorator]: https://en.wikipedia.org/wiki/Decorator_pattern
[Builder]: https://en.wikipedia.org/wiki/Builder_pattern
[Functional]: https://en.wikipedia.org/wiki/Functional_programming
[CodeSample]: https://github.com/praveer09/java8-comparators/blob/master/src/test/java/experiments/ComparatorsTest.java
