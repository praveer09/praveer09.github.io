---
layout: post
published: true
title: Practical Guide to Java 8's Stream
date: '2017-09-03'
comments: true
categories: technology
---

`Stream` interface, introduced in Java 8, provides a new way to iterate and perform various operations over a 
collection. Until Java 7, `for` and `for each` were the only options. In this article I will introduce you to 
the `Stream` API and how it provides an abstraction over the common operations performed over a collection. 
I will show how to replace the `for` and `for each` looping constructs with the `Stream` interface 
and its methods. 

The operations over a collection can be categorized into the following. I will try to cover all of them. 

- Transforming
- Filtering
- Searching
- Rearranging
- Summarizing
- Collecting
- Grouping

I will show usages of different `Stream` interface and methods using examples. In each example I will show 
the traditional approach and show how the same can be written using `Stream`. For the purpose of illustration I 
will used a collection of `Person` objects. The `Person` class is shown below. 

```java
public class Person {
    private final String name;
    private final int age;
    private final Gender gender;

    public Person(String name, int age, Gender gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    public String getName() { return name; }

    public int getAge() { return age; }

    public Gender getGender() { return gender; }
}

public enum Gender {
    MALE, FEMALE;
}
```

# Transforming 
Let's say we want to collect all the names people in the person collection. 

```java
public List<String> transformingWithForLoop() {
    List<Person> people = people();
    final List<String> namesOfPeople = new ArrayList<>();
    for (Person person : people) {
        namesOfPeople.add(person.getName());
    }
    return namesOfPeople;
}

public List<String> transformingWithStream() {
    List<Person> people = people();
    List<String> namesOfPeople = people.stream()
        .map(Person::getName)
        .collect(Collectors.toList());
    return namesOfPeople;
}
```

# A quick introduction to Stream
Let's use an example to understand Stream. 

```java
List<Person> people = ...
List<String> namesOfPeopleBelow20 = people.stream()  // bulding a stream
    .filter(person -> person.getAge() < 20)  // pipelining a computation
    .map(Person::getName)  // pipelining another computation
    .collect(Collectors.toList());  // terminating a stream
```

As you can see in the above example, multiple operations are chained together to form something like a pipeline, 
hence it is also referred to as a ___stream pipeline___. The stream pipeline consists of three parts, that complete the 
whole pipeline:

1. ___Source___ - In the above example, we have a collection of `Person` represented by `people`. The `stream()` 
method, that was added on the `Collection` interface in Java 8, is called upon `people` to build the stream. Common 
sources for stream apart from Collection are arrays (`Arrays.stream()`) and generator functions (`Stream.iterate()`
and `Stream.generate()`). 
2. ___Intermediate operations___ - Once a stream object is created, you can apply zero, one or more than one operations 
on the stream by chaining the operations, like in a builder pattern. All the methods that you see in the above example, 
`filter` and `map`, are methods on the `Stream` interface and they return the instance of `Stream` itself to enable 
chaining. 
3. ___Terminal operation___ - Once all the computations are applied, you finish the pipeline by applying a mandatory 
terminal operator. The terminal operators are also methods on the `Stream` interface and return a resultant type that 
is not a Stream. In the example above the `collect(Collectors.toList())` returns an instance of `List`. 

Let's now look at the basic operations that we can do using Stream. Though we will be learning about the operations 
applied individually on Stream, you can always mix and match them to derive different results.

# Filtering
As the word suggests, filtering operations allow objects to flow through itself only if the object fulfills the 
conditions laid upon by a `Predicate`. The filter operator is composed with the `Predicate` before it is applied 
to the Stream.   

```java
List<Person> listOfPeopleBelow20 = people.stream() 
    .filter(person -> person.getAge() < 20)  // pipelining a computation
    .collect(Collectors.toList());  // terminating a stream
```
     
# Transforming

```java
List<String> namesOfPeople = people.stream()
    .map(Person::getName)
    .collect(Collectors.toList());
```

# Searching

```java
boolean isAnyOneInGroupLessThan20Years = people.stream()
    .anyMatch(person -> person.getAge() < 20);
```

# Rearranging

```java
List<Person> peopleSortedEldestToYoungest = people.stream()
    .sorted(Comparator.comparing(Person::getAge).reversed())
    .collect(Collectors.toList());
```

# Summarizing

```java
IntSummaryStatistics ageStatistics = people.stream()
    .mapToInt(Person::getAge)
    .summaryStatistics();

ageStatistics.getAverage();
ageStatistics.getCount();
ageStatistics.getMax();
ageStatistics.getMin();
ageStatistics.getSum();
```

# Collecting

# Grouping
```java
Map<Gender, Double> averageAgeByGender = people.stream()
    .collect(Collectors.groupingBy(
        Person::getGender, 
        Collectors.averagingInt(Person::getAge)
    ));
```

## Summary
