---
layout: post
title:  "Java 8 Optional as a Monad"
date:   2016-07-14 21:30:00 +05:30
comments: true
categories: technology
---

Lately there has been a lot of discussions around functional programming and object oriented programming 
and their differences. A few functional programming constructs had also been introduced in Java 8 release couple of years back. 
Since then I have been exploring functional programming and I have realized that using a mix of both functional and 
object oriented styles in my code has enabled me to write code that is both easy to read and easy to explain.   

In this article I will show the following:

- How Java 8's [`Optional`][Optional] can be used to write code in a functional way.   
- Understand Monads using Optional as an example and how it can be used to bring robustness into the code.

Code sample for this article can be found at [this link][CodeSample]. As a part of my exploration of functional 
programming, I have been reading [Functional Programming in JavaScript][book], by [Luis Atencio][author]. I have 
found the text very useful for understanding the concepts in a practical way.

## Example use case
Let's try to understand the concepts using an example. Let's say you have to write a program to find out the 
current location of an order based on it's order id. While writing the program, the following conditions 
should be kept in mind:

- An order should have a tracking id for us to be able to tell the current location.
- If location information cannot be found then return *No location found*.

We will be using the following domain models and services when writing the implementation for the logic mentioned above.

```java
class Order {
    private final String trackingId;
    Order(String trackingId) { this.trackingId = trackingId;}
    boolean hasTrackingId() { return trackingId != null; }
    String getTrackingId() { return trackingId; }
}

class TrackingInfo {
    private final String currentLocation;
    TrackingInfo(String currentLocation) { this.currentLocation = currentLocation; }
    String getCurrentLocation() { return currentLocation; }
}

interface OrderService {
    Order findOrderByOrderId(String orderId);
}

interface ShippingService {
    TrackingInfo findTrackingInfoByTrackingId(String trackingId);
}
```

## An imperative implementation
By [imperative][imperative], I mean a style of writing programs generally used when we write programs using 
object oriented principles. The following points are worth noting for code implementation shown below:

- There can be many situations that can break the program in runtime. For the purpose of this article we are 
just focussing on nullability of values.
- By guarding against the null values you can make your program robust.
- Building robustness in the code has led to introduction of if-else blocks which reduces the readability of code.

```java
String getCurrentLocationOfOrderWithId(String orderId) {
    if (orderId != null) {
        Order order = orderService.findOrderByOrderId(orderId);

        if (order != null && order.hasTrackingId()) {
            TrackingInfo trackingInfo =
                shippingService.findTrackingInfoByTrackingId(order.getTrackingId());

            if (trackingInfo != null) {
                return trackingInfo.getCurrentLocation();
            }
        }
    }

    return "No location found";
}
```

## A declarative implementation
Now let's rewrite the above program using a declarative style using Java 8's `Optional`. By [declarative][declarative], 
I mean a style of writing programs generally used when we write programs using functional programming principles.

The following points are worth noting for the code implementation shown below:

- Though the null checks cannot be seen in the code below, the code is as robust as it was before. 
- This is because the null checks have been taken care of by the implementation of `Optional`.
- The implementation has been written as a series of computation steps that, I hope, is easy for you to comprehend.
- None of the interfaces and domain objects had to be changed to be able to write the below code.

```java
String monadicGetCurrentLocationOfOrderWithId(String orderId) {
    return Optional.ofNullable(orderId)
        .map(orderService::findOrderByOrderId)
        .filter(Order::hasTrackingId)
        .map(Order::getTrackingId)
        .map(shippingService::findTrackingInfoByTrackingId)
        .map(TrackingInfo::getCurrentLocation)
        .orElse("No location found");
}
```

## Understanding Monads
By definition a Monad is a structure that wraps a value and does the following two things:

- Provide methods or constructs to build programs as a series or pipeline of computations. 
- Decorate each computation with additional processing rules provided by the Monad.

Let's compare this definition to Java 8's Optional introduced above which is also a Monad. 

- `map`, `filter` and `flatMap` (not shown above) are the methods on Optional that uses method chaining to build 
series or pipeline of computations. 
- The computation as a part of each of these methods is decorated with a null value check functionality, 
executing the computation only if the value contained within it is not null.

### Understanding Optional as a Monad 
Let's use the declarative implementation using Optionals, shown above, to explain Monad in a little more detail.     
We can see from above that the different values `orderId`, `order`, `trackingId` and `trackingInfo` could have been null. 
But we wrapped or decorated each of them with a structure, Optional, which provided the null checking. 

`ofNullable` returns an empty Optional if orderId is null. Otherwise it stores the id in an internal field of Optional 
and returns the Optional object containing the value. The below is taken from the Java source code for `ofNullable`. 

```java
public static <T> Optional<T> ofNullable(T value) {
    return value == null ? empty() : of(value);
}
```

The computations as part of arguments of methods [`map`][map] and [`filter`][filter] on the Optional are performed only 
when the underlying value is not null i.e. when the Optional object is not empty. The below is taken from the Java source code 
for `filter` method. Note the predicate passed to filter is evaluated only when Optional is not empty i.e. value is 
present. Also the return type is again `Optional` so that further chaining can be done.

```java
public Optional<T> filter(Predicate<? super T> predicate) {
    Objects.requireNonNull(predicate);
    if (!isPresent())
        return this;
    else
        return predicate.test(value) ? this : empty();
}

```

[`orElse`][orElse] returns the *No location found* only when the instance of Optional, upon which the method is called, is empty.
The below is taken from the Java source code for `orElse`. If the values contained within is not null, then the actual value 
is passed back. 

```java
public T orElse(T other) {
    return value != null ? value : other;
}
```

We saw above the Optional is a monad that decorates each computation with a null value check. Similarly there are 
monads for decorating computations with other functionalities like error handling (try-catch), etc. 

## Summary
I hope I was able to show how using Monads in your code can help you in writing robust code while preserving the 
declarative coding style. I also showed how Java 8's Optional is also a Monad. We saw how introducing functional 
programming concepts into your code can increase the code's clarity and comprehension. Writing functional programs may 
not be immediately intuitive however with practice and learning the functional programming vocabulary you will 
be able make your code more expressive.


[CodeSample]: https://github.com/praveer09/optional-as-monad/blob/master/src/main/java/monad/Implementation.java
[tests]: https://github.com/praveer09/optional-as-monad/blob/master/src/test/java/monad/ImplementationTest.java
[ofNullable]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html#ofNullable-T-
[filter]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html#filter-java.util.function.Predicate-
[map]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html#map-java.util.function.Function-
[flatMap]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html#flatMap-java.util.function.Function-
[monad]: https://en.wikipedia.org/wiki/Monad_(functional_programming)
[functional]: https://en.wikipedia.org/wiki/Functional_programming
[book]: https://www.manning.com/books/functional-programming-in-javascript
[author]: https://twitter.com/luijar
[imperative]: https://en.wikipedia.org/wiki/Imperative_programming
[Optional]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html
[declarative]: https://en.wikipedia.org/wiki/Declarative_programming
[orElse]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html#orElse-T-