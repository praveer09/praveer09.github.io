---
layout: post
title:  "RxJava - Part 2 - Creating an Observable"
date:   2016-02-21 09:00:00
comments: true
categories: technology
---

An [Observable][Observable] is the heart of RxJava. It is the source of data or events in Reactive Programming. 
RxJava provides many methods in its library to create an Observable. Choosing which one to use can be difficult. 
My goal from this article is to help you in making this choice simpler by providing you with a mental map of 
different scenarios and which methods to use in each scenario.

The code samples for this article can be found [here][CodeSample]. This article is second in the series of 
RxJava articles that I am writing. [Part 1 can be found here][Part1].

## Observable and OnSubscribe
Think of Observable as an action which starts getting executed as soon as a [Subscriber][Subscriber] subscribes to it. 
During the execution of this action, data/events are generated and passed on to the subscriber. Let's try to understand 
it by an example. I will be using [Observable.create()][Create] method to create an Observable. 

```java
// Note that below code is not optimal but it helps in demonstration of concepts
// A better version is shown in the next section
Observable.create(new Observable.OnSubscribe<String>() {
    @Override
    public void call(Subscriber<? super String> subscriber) {
        try {
            String result = doSomeTimeTakingIoOperation();
            subscriber.onNext(result);    // Pass on the data to subscriber
            subscriber.onCompleted();     // Signal about the completion subscriber
        } catch (Exception e) {
            subscriber.onError(e);        // Signal about the error to subscriber
        }
    }
});
```

In the code above, the following are worth noticing: 

* The Action - The create method receives an implementation of [Observable.OnSubscribe][OnSubscribe] interface. This 
implementation defines what action will be taken when a subscriber subscribes to the Observable.
* The Action is lazy - The `call` method is called by library each time a subscriber subscribes to the Observable. 
Till then the action is not executed, i.e. it is lazy.
* Events are pushed to subscriber - [onNext][OnNext], [onError][OnError] and [onCompleted][OnCompleted] methods 
on `Subscriber` are used to push the events onto it. As per [Rx Design Guidelines][RxDesignGuidelines], the events 
pushed from Observable should follow the below rules:
    * Zero, one or more than one calls to `onNext`
    * Zero or only one call to either of `onCompleted` or `onError`

In all the different methods for creation of Observable that RxJava library provides, an implementation of the 
`Observable.OnSubscribe` interface is created internally. We will be seeing these methods in the next section.

## Scenarios for creating an Observable
Grouping the different scenarios into categories helps in deciding which method to use for creating an Observable. In
the following sections I will be providing the scenarios and what methods are available in the library to help in 
each scenario.

### An Observable that emits a single value after computation
Among all the scenarios, the one that you will come across the most is where you define a computation which returns a single value 
and then completes. Defining a function that makes an HTTP call to retrieve some information is an example of such a 
scenario. Such an action can be defined by using the [Callable][Callable] interface. RxJava provides a 
[fromCallable][FromCallable] factory method for creating an Observable from a Callable.

The code example which I have shown above emits only one value. We can replace it by the `fromCallable` method as 
shown below. The emission of value to the subscriber using onNext and either onCompleted or onError is handled by 
the library.

```java
Observable.fromCallable(new Callable<String>() {
    @Override
    public String call() throws Exception {
        return doSomeTimeTakingIoOperation();
    }
});
```

### An Observable that emits multiple values during computation
In few cases more than one value is passed to the Subscriber from the Observer. 
An example can be making an HTTP call to retrieve a list but the list in the response is paginated. In this case you will have 
to make multiple request to retrieve the complete list and keep on calling Subscriber's onNext method multiple times 
till all the values have been emitted. In such a scenario `Observable.create()` can be used. 
However creating an Observable using the `create()` factory method [requires some advanced handling which might be 
difficult to write][BackPressure]. RxJava library has introduced [SyncOnSubscribe][SyncOnSubscribe] and 
[AsyncOnSubscribe][AsyncOnSubscribe] to handle the difficulties.

### An Observable created by combining two or more Observables
There are scenarios where you have two or more observables and you would want to combine the result from all of them before 
doing any further processing. An example of this can be on a server side implementation where a request has to be 
processed by collecting information from two external services which can be run in parallel. In such a case you can start 
two parallel computations using two Observables and combine the results of each by using a method like 
[Observable.concat()][Concat]. 

There are many other methods which help in combining observables. The differences among them are in the 
way they combine the observables. [Observable.amb()][amb], [Observable.combineLatest()][combineLatest], 
[Observable.merge()][merge] and [Observable.zip()][zip] are few that are very useful in combining observables.

### Some useful pre-defined Observables
The RxJava library provides few methods for pre-defined Observables. One such method is [Observable.interval()][interval]. 
This observable emits a sequential number every specified interval of time. Other such methods are 
[Observable.empty()][empty], [Observable.never()][never], [Observable.error()][error], [Observable.just()][just],
[Observable.from()][from], [Observable.timer()][timer] and [Observable.range()][range]. 

### An Observable from applying operator on an instance of Observable
All the methods that we have seen for Observable creation till now are static factory methods on Observable. There is another 
group of methods which are on instances of an Observable. These are called [operators][operator]. Whenever an operator 
is applied on an instance, a new instance of Observable, chained to previous one, is provided. Internally all the 
operators use [lift function][lift] to do the chaining. I will be writing about operators in detail in other 
blog posts in this series. 

## Summary
There are many methods that are provided by the RxJava library for Observable creation. Using the mental map of 
scenarios can help in deciding which method to use in a particular scenario.
 
Next post in this series - [RxJava - Part 3 - Multithreading][Part3]

--- 
_Update: In May 2016, I had done a talk on RxJava, where I had explained on how to think in RxJava. As this was an introductory 
talk on RxJava, it serves as a good addition to this blog post._  

<style>.embed-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; } .embed-container iframe, .embed-container object, .embed-container embed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }</style>
<div class='embed-container'><iframe src='https://player.vimeo.com/video/170796165' frameborder='0' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>
[GeeCON 2016: Praveer Gupta - How to Think, in RxJava, Before Reacting](https://vimeo.com/170796165) from [GeeCON Conference](https://vimeo.com/geecon) on Vimeo.

[Observable]: http://reactivex.io/RxJava/javadoc/rx/Observable.html
[RxJava]: https://github.com/ReactiveX/RxJava
[CodeSample]: https://github.com/praveer09/rxjava-examples/blob/master/src/test/java/CreatingObservables.java
[ObservableCreation]: https://github.com/ReactiveX/RxJava/wiki/Creating-Observables
[ReactiveProgramming]: https://en.wikipedia.org/wiki/Reactive_programming
[Part1]: http://praveer09.github.io/technology/2016/02/13/rxjava-part-1-a-quick-introduction/
[RxDesignGuidelines]: http://go.microsoft.com/fwlink/?LinkID=205219
[BackPressure]: http://stackoverflow.com/a/34206454/1137789
[SyncOnSubscribe]: http://reactivex.io/RxJava/javadoc/rx/observables/SyncOnSubscribe.html
[AsyncOnSubscribe]: http://reactivex.io/RxJava/javadoc/rx/observables/AsyncOnSubscribe.html
[FromCallable]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#fromCallable(java.util.concurrent.Callable)
[Callable]: https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Callable.html
[OnSubscribe]: http://reactivex.io/RxJava/javadoc/rx/Observable.OnSubscribe.html
[Create]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#create(rx.Observable.OnSubscribe)
[Subscriber]: http://reactivex.io/RxJava/javadoc/rx/Subscriber.html
[OnNext]: http://reactivex.io/RxJava/javadoc/rx/Observer.html#onNext(T)
[OnError]: http://reactivex.io/RxJava/javadoc/rx/Observer.html#onError(java.lang.Throwable)
[OnCompleted]: http://reactivex.io/RxJava/javadoc/rx/Observer.html#onCompleted()
[Concat]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#concat(rx.Observable)
[amb]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#amb(java.lang.Iterable)
[combineLatest]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#combineLatest(java.lang.Iterable,%20rx.functions.FuncN)
[merge]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#merge(java.lang.Iterable)
[zip]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#zip(java.lang.Iterable,%20rx.functions.FuncN)
[error]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#error(java.lang.Throwable)
[never]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#never()
[empty]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#empty()
[just]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#just(T)
[from]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#from(java.lang.Iterable)
[operator]: http://reactivex.io/RxJava/javadoc/rx/Observable.Operator.html
[lift]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#lift(rx.Observable.Operator)
[timer]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#timer(long,%20java.util.concurrent.TimeUnit)
[interval]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#interval(long,%20java.util.concurrent.TimeUnit)
[range]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#range(int,%20int)
[Part3]: {% post_url 2016-02-29-rxjava-part-3-multithreading %}