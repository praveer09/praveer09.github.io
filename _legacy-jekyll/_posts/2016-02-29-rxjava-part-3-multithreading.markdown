---
layout: post
title:  "RxJava - Part 3 - Multithreading"
date:   2016-02-29 18:00:00
comments: true
categories: technology
tags: [java, reactive-programming, multi-threading]
---

[RxJava][RxJava] makes it easy to write asynchronous and concurrent applications. To be able to do that you 
will have to write programs that get executed on multiple threads. In this article I will show how RxJava 
helps in writing multithreaded programs using [Scheduler][Scheduler] and [Observable][Observable]'s 
[subscribeOn()][subscribeOn] and [observeOn()][observeOn] methods. 

The code samples for this article can be found [here][CodeSample]. This article is third in the series of 
RxJava articles that I am writing. [Part 1 can be found here][Part1] and [Part 2 can be found here][Part2]. 

## Default Threading Behaviour of RxJava 
An RxJava construct is composed of __one Observable followed by zero or more Operators followed by one Subscriber__. 
The default threading behavior for such a construct can be described as below: 

* The computation declared as part of an Observable gets executed on the thread from where the `subscribe()` 
method is called. 
* The computation declared as part of an [Operator][Operator] gets executed on the thread where the computation 
of previous Operator is executed. If there is no Operator declared before the current Operator, it gets executed 
on the thread where the computation of the Observable is executed. 
* The computation declared as part of a [Subscriber][Subscriber] gets executed on the thread where the computation 
of previous Operator is executed. If there is no Operator declared before the Subscriber, it gets executed 
on the thread where the computation of the Observable is executed. 

From the code sample below the default behaviour becomes evident. Notice the names of threads printed in the output. All 
the three, the Observable, the Operator and the Subscriber get executed on the main thread. Hence we can say that 
__by default the execution of RxJava is blocking__. 

```java
public static void main(String[] args) {
    Observable.fromCallable(thatReturnsNumberOne())     // the Observable
            .map(numberToString())                      // the Operator
            .subscribe(printResult());                  // the Subscriber
}

/*
    Output of the above program:
    ---------------------------
    Observable thread: main
    Operator thread: main
    Subscriber thread: main
    Result: 1
*/

        
private Callable<Integer> thatReturnsNumberOne() {
    return () -> {
        System.out.println("Observable thread: " + Thread.currentThread().getName());
        return 1;
    };
}

private Func1<Integer, String> numberToString() {
    return number -> {
        System.out.println("Operator thread: " + Thread.currentThread().getName());
        return String.valueOf(number);
    };
}

private Action1<String> printResult() {
    return result -> {
        System.out.println("Subscriber thread: " + Thread.currentThread().getName());
        System.out.println("Result: " + result);
    };
}
```

## Scheduler
[Scheduler][Scheduler] in RxJava defines the thread on which a unit of work will be performed. RxJava provides 
a few Schedulers out of the box. Some of them are [Schedulers.newThread()][newThread], 
[Schedulers.computation()][computation], [Schedulers.io()][io] and [Schedulers.from(Executor)][fromExecutor]. 
I will be showing the usage of Scheduler in the upcoming sections. 

## Changing execution thread using SubscribeOn
The `subscribeOn` method tells the RxJava library to perform the computation, declared as part of the Observable, on a 
thread provided by the Scheduler. In the example below the `subscribeOn(Schedulers.newThread())` instructs RxJava to do 
the computation on a new thread. Check the output of code below to see this behaviour in action. Notice the names of 
the threads printed in the output.
 
As defined by the default behaviour, the computations as part of Operator and the Subscriber run on the thread which 
Observable runs, which in this case is a new thread. The output below also shows this behaviour. 

#### What happens if I have multiple subscribeOn declarations?
In case of multiple declaration of `subscribeOn`s, only the first declaration takes preference. This is because the 
Observable computation can be executed only on one thread. 

#### Why the name subscribeOn?
This is because the computation as part of Observable gets executed only when the `subscribe()` method is called on 
the Observable.

```java
public static void main(String[] args) {
    Observable.fromCallable(thatReturnsNumberOne())
            .subscribeOn(Schedulers.newThread())    // <<<<
            .map(numberToString())
            .subscribe(printResult());
}
/*
    Output of the above program:
    ---------------------------
    Observable thread: RxNewThreadScheduler-1
    Operator thread: RxNewThreadScheduler-1
    Subscriber thread: RxNewThreadScheduler-1
    Result: 1
*/
```

## Changing execution thread using ObserveOn
The `observeOn` method tells RxJava library to perform the computation, as part of Operator or Subscriber declared 
after its definition, on a thread provided by the Scheduler. 

#### What happens if I have multiple observeOn declarations?
If multiple observeOns are declared then computation 
declared after each of them gets performed on different threads defined by Scheduler.  

#### Why the name observeOn?
This is because both the Operators and Subscriber observe the events/data emitted by Observable. Operators, after 
observing events/data, transmits them to subsequent Operators, if any, or transmits them to a Subscriber. 

Below are code samples for the usage of observeOn. Notice the names of the threads printed in the output. 

```java
public static void main(String[] args) {
    Observable.fromCallable(thatReturnsNumberOne())
            .map(numberToString())
            .observeOn(Schedulers.newThread())      // subscriber on different thread
            .subscribe(printResult());
}
/*
    Output of the above program:
    ---------------------------
    Observable thread: main
    Operator thread: main
    Subscriber thread: RxNewThreadScheduler-1
    Result: 1
*/

public static void main(String[] args) {
    Observable.fromCallable(thatReturnsNumberOne())
            .observeOn(Schedulers.newThread())      // operator on different thread
            .map(numberToString())
            .subscribe(printResult());
}
/*
    Output of the above program:
    ---------------------------
    Observable thread: main
    Operator thread: RxNewThreadScheduler-1
    Subscriber thread: RxNewThreadScheduler-1
    Result: 1
*/

public static void main(String[] args) {
    Observable.fromCallable(thatReturnsNumberOne())
            .observeOn(Schedulers.newThread())      // operator on different thread
            .map(numberToString())
            .observeOn(Schedulers.newThread())      // subscriber on different thread
            .subscribe(printResult());
}
/*
    Output of the above program:
    ---------------------------
    Observable thread: main
    Operator thread: RxNewThreadScheduler-2
    Subscriber thread: RxNewThreadScheduler-1
    Result: 1
*/
```

## Summary
RxJava makes it very easy to write multithreaded code using simple declarations as part of `subscribeOn` and 
`observerOn` in combination with `Scheduler`. If none of these threading utilities are declared then RxJava is 
by default blocking i.e. the computation gets done on the same thread where the declaration is done. 

--- 
_Update: In May 2016, I had done a talk on RxJava, where I had explained on how to think in RxJava. As this was an introductory 
talk on RxJava, it serves as a good addition to this blog post._  

<style>.embed-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; } .embed-container iframe, .embed-container object, .embed-container embed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }</style>
<div class='embed-container'><iframe src='https://player.vimeo.com/video/170796165' frameborder='0' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>
[GeeCON 2016: Praveer Gupta - How to Think, in RxJava, Before Reacting](https://vimeo.com/170796165) from [GeeCON Conference](https://vimeo.com/geecon) on Vimeo.

[RxJava]: https://github.com/ReactiveX/RxJava
[Scheduler]: http://reactivex.io/documentation/scheduler.html
[subscribeOn]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#subscribeOn(rx.Scheduler)
[observeOn]: http://reactivex.io/RxJava/javadoc/rx/Observable.html#observeOn(rx.Scheduler)
[Observable]: http://reactivex.io/RxJava/javadoc/rx/Observable.html
[Operator]: http://reactivex.io/RxJava/javadoc/rx/Observable.Operator.html
[Subscriber]: http://reactivex.io/RxJava/javadoc/rx/Subscriber.html
[CodeSample]: https://github.com/praveer09/rxjava-examples/blob/master/src/test/java/MultiThreading.java
[Part1]: http://praveer09.github.io/technology/2016/02/13/rxjava-part-1-a-quick-introduction/
[Part2]: http://praveer09.github.io/technology/2016/02/21/rxjava-part-2-creating-an-observable/
[computation]: http://reactivex.io/RxJava/javadoc/rx/schedulers/Schedulers.html#computation()
[fromExecutor]: http://reactivex.io/RxJava/javadoc/rx/schedulers/Schedulers.html#from(java.util.concurrent.Executor)
[newThread]: http://reactivex.io/RxJava/javadoc/rx/schedulers/Schedulers.html#newThread()
[io]: http://reactivex.io/RxJava/javadoc/rx/schedulers/Schedulers.html#io()
