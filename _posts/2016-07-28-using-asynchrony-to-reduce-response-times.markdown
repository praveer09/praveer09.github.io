---
layout: post
title:  "Using asynchrony to reduce response times in Java 8"
date:   2016-07-28 11:00:00 +05:30
comments: true
categories: technology
tags: [java, functional-programming, multi-threading]
---

Java 8, among other changes, had introduced [`CompletableFuture`][Cf] which has made writing asynchronous programs in Java easy. 
In this article I will be using *CompletableFuture* to explain how asynchronous programs are written and what value 
asynchronous programs bring in the context of backend services' response times. I will also be covering different 
features of the *CompletableFuture* itself. 

Though the concepts explained here use Java as an example, it can be applied in any other language. In fact 
*CompletableFutures* are similar to [*Promises*][Promise] in JavaScript. 

The content in this article is organized as below:

* [Why do we need asynchronous programs](#why-do-we-need-asynchronous-programs)
* [Designing asynchronous interfaces](#designing-asynchronous-interfaces)
* [CompletableFuture Recipes](#completableFuture-recipes)
    * [Recipes for an implementor of an asynchronous interface](#recipes-for-an-implementor-of-an-asynchronous-interface)
    * [Recipes for a client using the asynchronous interface](#recipes-for-a-client-using-the-asynchronous-interface)
* [Summary](#summary)

## Why do we need asynchronous programs
With growing dependence of business on information technology, expectations from business serving applications have 
become high. They need to be fast and highly available. While serving requests, applications rarely work in isolation. 
For serving a request, applications have to talk to one or more external services like databases, third-party services, 
and internal applications. All of these happen over network and thus have a tendency to increase response times and increase 
chances of errors. We may not have much control over network errors, but we can use asynchronous programming techniques 
to reduce response time. Let's see, using an example, how this reduction can be achieved. 

Suppose that to serve a request an application has to talk to two services, Service A and Service B. Let's assume that 
average response time of Service A is 2 seconds and that of Service B is 3 seconds. 

* If we call them serially, then minimum response time of the application is 5 seconds (2 seconds + 3 seconds). 
* If Service A and Service B is called in parallel, then minimum response time of the application becomes 3 seconds 
(maximum time among 2 seconds and 3 seconds). This is assuming that both services can be called in parallel i.e. to call 
one service there is no dependency on any data from the other service. 

***You will have to use asynchronous programming techniques to be able to make calls in parallel which will lead 
to a reduction in response times***.

Let's see what it means to use asynchronous programming techniques in the applications you develop.  

## Designing asynchronous interfaces
Let's say we have an interface as below. Any implementation of this interface can either extract the data from 
a database or call another service to get the details. In either of the cases, the processing will be done on the 
calling thread, the thread from which the interface method is called, and the execution will be stopped till the order 
value is received. Such kind of interface definitions are ***blocking***.  

```java
interface OrderService {
    Order findOrderByOrderId(String orderId); // synchronous 
}
```

Now let's transform this interface to make it ***non-blocking*** a.k.a ***asynchronous***. In the code snippet below, 
notice that I have changed the return type from `Order` to `CompletableFuture<Order>`. Instead of returning the value 
of order, which blocks the calling thread, a container or holder of order is returned. Any implementation of the 
interface can now: 

* Immediately return the container with no value populated in the beginning.
* Start the processing, of order retrieval, in a thread different from the calling thread. 
* Populate the container with the order value when the processing completes. 

The advantage to the calling thread is that it can do something else till the time the result, the order, is 
available in the container.  

```java
interface OrderService {
    CompletableFuture<Order> findOrderByOrderId(String orderId);  // asynchronous 
}
```

### What all interfaces should be asynchronous
The implementations of interfaces that perform IO operations or long running computations are good candidates for 
making asynchronous. 

## CompletableFuture Recipes
I will be highlighting the features of *CompletableFuture* using some recipes. 

### Recipes for an implementor of an asynchronous interface
We saw in the previous section that, while writing asynchronous code, we returned a container of a value rather 
than the value itself. This changes the way you have been writing implementations of service interfaces. Let's see the 
changes using a few recipes.

#### Returning the container and populating the container with the computed value at a later time
Let's say you have an interface and it's implementation as below. This represents the synchronous way. 

```java
interface SomeSyncService {
    SomeReponse someMethod(String someParam); 
}

class SomeSyncServiceImpl implements SomeSyncService {
    @Override SomeReponse someMethod(String someParam) { 
        return retrieveResponse(someParam); 
    }

    private SomeResponse retrieveResponse(String someParam) { ... }
}
```

Let's convert this to asynchronous using *CompletableFuture*. Note the use of `supplyAsync` method. *CompletableFuture* 
will execute the task passed to *supplyAsync* in a separate thread provided by *ForkJoinPool*. This method will also take care 
to populate the container with the computed value if processing completes successfully. It will populate with the 
error if any *RuntimeException* occurs during execution. We will see later how to handle success or failure responses. 

```java
interface SomeAsyncService {
    CompletableFuture<SomeReponse> someMethod(String someParam); 
}

class SomeAsyncServiceImpl implements SomeAsyncService {
    @Override CompletableFuture<SomeReponse> someMethod(String someParam) { 
        return CompletableFuture.supplyAsync(() -> retrieveResponse(someParam)); 
    }

    private SomeResponse retrieveResponse(String someParam) { ... }
}
```

#### Handling checked exceptions in implementations
Let's modify to the previous example by letting the `retrieveResponse` private method to now throw a checked exception. 
The following points are worth noting:

* In (1) an empty container is created
* In (2) the asynchronous task is started by submitting the task to an `ExecutorService` which runs the task in a 
separate thread
* In (5) the empty container is immediately returned hence does not block the calling thread
* At a later point in time submitted task can complete successfully as in (3) or complete with error as in (4) 

```java
class SomeAsyncServiceImpl implements SomeAsyncService {
    @Override CompletableFuture<SomeReponse> someMethod(String someParam) { 
        CompletableFuture<SomeResponse> future = new CompletableFuture<>(); // 1
        executorService.submit(() -> {  // 2
            try {
                future.complete(retrieveResponse(someParam)); // 3
            } catch (IOException e) {
                future.completeExceptionally(e); // 4
            }
        });
        return future; // 5
    }

    private SomeResponse retrieveResponse(String someParam) throws IOException { ... }

    // fields and constructors not shown for brevity
}
```

### Recipes for a client using the asynchronous interface
Let's see some recipes of how to code a client using the interfaces that return *CompletableFuture*.

#### Running two computations in parallel
Suppose we have two services `AsyncServiceA` and `AsyncServiceB` and we want to execute them in parallel. When 
both complete, we want to join the responses `ResponseA` and `ResponseB` to return the result. In the example below:

* The `thenCombine` method collects the result of both the futures, *futureA* and *futureB*. Once both of them complete 
successfully, the combiner function is called. 
* The `join` method which blocks till the *combinedFuture* completes.  

```java
// start task A asynchronously
CompletableFuture<ResponseA> futureA = asyncServiceA.someMethod(someParam);
// start task B asynchronously
CompletableFuture<ResponseB> futureB = asyncServiceB.someMethod(someParam);

CompletableFuture<String> combinedFuture = futureA
        .thenCombine(futureB, (a, b) -> a.toString() + b.toString());

// wait till both A and B complete
String finalValue = combinedFuture.join();
```

#### Handling errors that occur during asynchronous task execution
We have seen that the *CompletableFuture* is a container, which when completes, has the successfully computed value or 
the exception when computation completes exceptionally. In the last example, calling the `join` directly is dangerous 
because in case of exceptional completion, it may throw `CompletionException`. *CompletableFuture* provides some 
handler methods like `exceptionally`, `handle` and `whenComplete` to provide error handling. 

Let's see below how we can use the `exceptionally` method to make our code more robust. In the example below: 

* The join is safe because we have declared in (2) that return `Optional.empty()` whenever any exception occurs. 
* The function passed to `thenApply` in (1) will get executed only when *futureA* completes without any error.  

```java
CompletableFuture<SomeResponseA> futureA = someAsyncServiceA.someMethod(someParam);

Optional<SomeResponseA> safeResponse = futureA
        .thenApply(Optional::ofNullable)  // 1
        .exceptionally(ex -> Optional.empty()) // 2
        .join();
```

#### Adding timeout to asynchronous executions
In all the examples that we have seen till now, there is a chance that the asynchronous tasks takes too long to complete. 
You may want to apply some sensible timeout properties. [This blog post][timeout] does a very good job of explaining this. 
I will mention here a summary for this recipe. 

Suppose you want to add a timeout of 30 seconds to the example shown in the previous section. In the example below: 

* Notice the use of `applyToEither` method on the *CompletableFuture* to achieve the timeout. It waits asynchronously 
for either of the two futures to complete first.
* When either of the *futureA* or *timeout* completes, the value from it is transferred to subsequent computations 
using `Function.identity()`.

```java
// start task A asynchronously
CompletableFuture<SomeResponseA> futureA = someAsyncServiceA.someMethod(someParam);
// Start a timeout task asynchronously
CompletableFuture<SomeResponseA> timeout = failAfter(Duration.ofSeconds(30));

Optional<SomeResponseA> safeResponse = futureA
        .applyToEither(timeout, Function.identity()) 
        .thenApply(Optional::ofNullable)
        .exceptionally(ex -> Optional.empty())
        .join();

public static <T> CompletableFuture<T> failAfter(Duration duration) {
    // schedule a task that throws exception after specified duration 
}
```  

## Summary
I hope that after reading this blog you will agree with me that asynchronous programming brings benefits when we want to 
achieve faster response times. I also hope that after seeing the recipes you will agree that *CompletableFuture* has made 
it easy to write asynchronous code in Java. It provides a rich set of methods for defining flows. I assure you that this 
will definitely be a good addition to your technology tool kit. 

There are other libraries like RxJava that make writing asynchronous programs in Java easy. 
[Check out this link to know more][RxJava]. 

[Cf]: https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html
[Promise]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[timeout]: http://www.nurkiewicz.com/2014/12/asynchronous-timeouts-with.html
[RxJava]: https://praveer09.github.io/technology/2016/02/13/rxjava-part-1-a-quick-introduction
