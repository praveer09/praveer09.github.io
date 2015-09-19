---
layout: post
title:  "Using Optional to Specify Presence or Absence of a Value"
date:   2015-09-19 09:00:00
comments: true
categories: technology
---

Let's say you have to use an interface to write some logic and you see the below interface definition. 

{% highlight java %} 
public interface OrderService {
  Order findOrderWithId(long orderId);
}
{% endhighlight %} 

What is the first thing that comes to your mind? Most probably it will be the question that, what happens if the 
order against the requested order id does not exist. 

To find the answer you will either:  

* Check out the documentation on the interface (What if documentation is missing?), or
* Look into the source code (What if the source code is not accessible?)

In any of the cases, the highest probability is that the interface will return a __null Order__. 

The client logic that you will write against such an interface will be something like:

{% highlight java %} 
Order order = orderService.findOrderWithId(orderId);
if (order == null) throw new OrderNotFoundException();
order.getTotalAmount();
... // do further processing
{% endhighlight %} 

Most of the times the life of a developer is not easy. There are deadlines that you have to meet and under delivery 
pressure you may forget to add that null check `if (order == null)`. And then you may see the dreaded 
`NullPointerException` when: 

* you run your unit tests (give a pat on your back for [writing unit tests][TDD]), or 
* your code is being [tested by a QA][QA] (thank the QA for catching the bug in code), or 
* in the worst case when your code is running in production.

## Representing the possibility of absence of a value using Optional

This is where `Optional` comes to rescue. It has been part of the [Google's Guava libraries][GoogleGuavaOptional] 
for long. It has also recently been included in [Java 8][Java8Optional]. Let's try to re-write the interface 
using the Java 8's version of `Optional`.

{% highlight java %}
public interface OrderService {
  Optional<Order> findOrderWithId(long id);
}
{% endhighlight %}

Now if you use this interface to write some logic, you will observe that the return type itself is telling you that 
it may or may not be present. ___The code itself has become the documentation___. As the return type is itself 
screaming out to you about its presence/absence, your chances of forgetting to handle the case of invalid order 
id becomes lesser. 

Let's see how a client code against such an interface will look like. The below code is intentionally made verbose 
for the purpose of illustration. A more concise version will also follow.

{% highlight java %} 
Optional<Order> orderOptional = orderService.findOrderWithId(orderId);
if (!orderOptional.isPresent()) throw new OrderNotFoundException();
Order order = orderOptional.get(); 
order.getTotalAmount();
... // do further processing
{% endhighlight %} 

Note that the client code against interface to call an `get()` on the `Optional` to get the object which also forces 
the writer of client code to think about and handle the cases then value is not present. You can use `isPresent()` to 
check the presence or absence of a value.

A more concise version of the above code will be. 
{% highlight java %} 
Order order = orderService.findOrderWithId(orderId)
    .orElseThrow(OrderNotFoundException::new);
order.getTotalAmount();
... // do further processing
{% endhighlight %} 

There are multiple factory methods like `Optional.of(T value)`, `Optional.ofNullable(T value)` and `Optional.empty()` 
which can used on the producer side. On the consumer side instance methods like `get()`, `orElse(T other)`, 
`orElseGet(Supplier<? extends T> other)` and `orElseThrow(Supplier<? extends X> exceptionSupplier)` can be used.

## Summary
Use `Optional` to represent the absence or presence of a value. Use it to specify return types when designing 
interfaces or APIs. Its usage gives the following advantages:
  
* ___The code becomes the documentation___ for any client using the code.
* The ___client code becomes less error-prone___ and can avoid `NullPointerException`s due to negligence.

[QA]: https://en.wikipedia.org/wiki/Software_quality_analyst
[TDD]: https://en.wikipedia.org/wiki/Test-driven_development
[GoogleGuavaOptional]: https://code.google.com/p/guava-libraries/wiki/UsingAndAvoidingNullExplained#Optional 
[Java8Optional]: https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html
