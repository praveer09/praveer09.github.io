---
layout: post
title:  "How functional programming helps me write clean code"
date:   2016-08-05 08:30:00 +05:30
comments: true
categories: technology
---

I have been writing code for several years now. One thing that I have realized is that I have spent much more 
time in reading code than writing code. Hence, as a part of continuous improvement, I invest a lot of time in learning new techniques to 
write clean code. By clean code I mean, code that is easy to read and easy to reason about. Till now, I have mostly written code 
using object oriented programming techniques. Lately I have been learning functional programming techniques. 
These techniques, when mixed the techniques from object oriented style, have helped me a great deal in writing 
cleaner code. In this article, I will be showing what improvements can been brought into code by using these 
techniques. Also I will be providing a small explanation for each of the techniques shown. 

> Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live. 
> - John Woods

## Ability to write code having single responsibility
Functional programming talks about writing ***pure functions***, which means that the output produced by a function 
should not change for a given set of inputs. 

Not all functionality can be coded using pure functions as IO operations are inherently impure. As an example, consider 
you are writing logs to a file. Every time you write to a file the state of the file is changed. On the contrary 
computations that happen in memory are good candidates to be represented as pure functions. 

To be able to write pure functions, I am forced to break down the problem in small parts, separating out the 
pure and impure parts. Breaking down into small parts leads to functions which have [single responsibility][srp]. For 
IO operations (impure functions), *monads* are used, which I will be explaining later in the article. 

Below are two snippets of code that show pure vs impure functions.

```javascript
 // sum(1, 2) will always return 3, hence pure
var sum = (a, b) => a + b;

// sumImpure(1) will return different results based on the value of globalVar, hence impure
var globalVar = ... ;
var sumImpure = (a) => a + globalVar;
```

## Ability to easily understand the problem being solved
Functional programming uses techniques like ***chaining*** and ***composition*** clubbed along with small 
*pure functions* that allow you to write code at a higher level of abstraction. These abstractions generally 
represent standard verbs or verbs related to your domain making it easy for you to understand the problem . 
This style is also referred to as ***declarative programming*** where your focus in on *what* rather than on *how*.   

Most of the functionality, you need while writing programs, are provided as small pure functions by a functional 
language or a functional tool/library. Using chaining or composition you combine them in different ways to build 
functions customized for your needs. 

#### Composition
Let's see an example of *composition* in JavaScript using a library [Ramda][ramdajs]. This example has been taken 
from it's documentation. The point worth noting is that there are no intermediate variables defined. Due to this 
there are less distractions and the main focus is on just understanding the order of combination logic. 
The below code be understood as follows: 

* Two numbers will be used to calculate the powered number
* The result of previous step will be negated
* The result of previous step will be incremented by 1  

```javascript
// composition - evaluated right to left
var f = R.compose(R.inc, R.negate, Math.pow);
f(3, 4); // -(3^4) + 1

// another form of composition with left to right evaluation
var g = R.pipe(Math.pow, R.negate, R.inc);

g(3, 4); // -(3^4) + 1
```

#### Chaining
Chaining is another form of combining small functions using a [*Builder Pattern*][builder]. Mostly a container is 
used to hold the functions being combined. These containers can use techniques like [*lazy evaluation*][lazy], 
[*short-circuiting*][short-circuiting] or [*loop fusion*][loop-fusion] to optimize the computation and thus 
offsetting the overhead that may be caused due to coding at higher level of abstraction. 

As an example see the below code that has been using Java 8. The code has been written in a declarative fashion using 
chaining methods on the *IntStream* object. 

```java
int sum = IntStream.rangeClosed(1, 10)
    .filter(number -> number % 2 == 0) // 2 + 4 + 6 + 8 + 10
    .sum(); // 30
```

## Ability to reuse code
Code reuse leads to lesser lines of code, which then leads to less chances of error when you have to make modifications to 
code. This is known as [DRY][dry] principle. Functional programming provides techniques like *function composition*, 
***higher order functions***, ***currying*** and ***partial functions*** which helps reuse code. 

#### Higher Order Functions
In the previous snippet, the *filter* method takes a function, which accepts any type of value but returns a boolean. Such 
functions are called predicates. A function which takes another function as an argument is called a *higher order function*. 
The important thing to note is that the filter is defined once and the behaviour changes based on the predicate provided 
to the filter method. This is the kind of reusablity provided by higher order functions. 

#### Partial Functions
Sometimes you have functions which take more than one argument. By applying a different set of arguments you can derive 
multiple functions out of the same function. The below snippet has been taken from a JavaScript library [lodash][lodash]. 
Note how the *greet* function is reused to create functions *sayHelloTo* and *greetFred*. 

```javascript
var greet = (greeting, name) => greeting + ' ' + name;

var sayHelloTo = _.partial(greet, 'hello');
sayHelloTo('fred'); // 'hello fred'

// Partially applied with placeholders.
var greetFred = _.partial(greet, _, 'fred');
greetFred('hi'); // 'hi fred'
```

#### Currying
*Currying* is somewhat similar to *partial function*. Though both help in function reuse, the difference are in the usage. 
It becomes evident when you have 3 or more arguments on a function. If you create a partial function by providing one 
argument initially, then you have to provide the remaining two arguments together whenever you use the partial function. 
However in case of currying, arguments can be provided in multiple steps. See the example below which is again taken from 
the [lodash][lodash] library documentation. 

```javascript
var abc = (a, b, c) => [a, b, c];

var curried = _.curry(abc);

// calling with three arguments separately
curried(1)(2)(3); // [1, 2, 3]

// calling with 2 arguments and then with 1 argument
curried(1, 2)(3); // [1, 2, 3]

// calling with all three arguments together
curried(1, 2, 3); // [1, 2, 3]

// Curried with placeholders.
curried(1)(_, 3)(2); // [1, 2, 3]
``` 

## Ability to write robust code 
There is hardly any program which do not interact with outside systems. Examples of interacting with outside systems 
can be reading from file or a database or a user trying to save or query for some information. Outside systems can also be 
other programs. In such cases, either unavailability of the system or unexpected or missing data can make your system brittle. 
You make your system robust by handling exceptions using *try-catch*, doing checks like *null checks* or performing 
*validations* using *if-else blocks*. Using these *try-catch* and *if-else* blocks make it difficult to use the functional 
concepts I mentioned before. This is where ***Monads*** come into picture. 

#### Monads 
These are containers that encapsulate the functionality of, lets say, null checking, validation or exception handling 
while still allowing you to write code using the functional concepts mentioned before. Let's see this in action using 
a *Try* monad from a functional library in Java named [Javaslang][Javaslang]. Note that in the snippet below you are 
able to code in functional style and still be able to write robust code. 

```java
// if you want to handle all exceptions in the same way
Try.of(() -> bunchOfWork()).getOrElse(other);

// if you want to provide different handling per exception type
A result = Try.of(this::bunchOfWork)
    .recover(x -> Match(x).of(
        Case(instanceOf(Exception_1.class), ...),
        Case(instanceOf(Exception_2.class), ...),
        Case(instanceOf(Exception_n.class), ...)
    ))
    .getOrElse(other);
```

Another example of a monad [encapsulating null checks can be found at this link][optional].

## Summary
I have covered only a small set of techniques which I have found beneficial. If you are not accustomed to using functional 
style, I would recommend you to invest time in learning it. This will surely be a good addition to your toolkit. I 
will end this article with a quote from Michael Feathers.  

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">OO makes code understandable by encapsulating moving parts.  FP makes code understandable by minimizing moving parts.</p>&mdash; Michael Feathers (@mfeathers) <a href="https://twitter.com/mfeathers/status/29581296216">November 3, 2010</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

[ramdajs]: http://ramdajs.com/docs/#compose
[dry]: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
[builder]: https://en.wikipedia.org/wiki/Builder_pattern
[loop-fusion]: https://en.wikipedia.org/wiki/Loop_fusion
[short-circuiting]: https://en.wikipedia.org/wiki/Short-circuit_evaluation
[lazy]: https://en.wikipedia.org/wiki/Lazy_evaluation
[srp]: https://en.wikipedia.org/wiki/Single_responsibility_principle
[lodash]: https://lodash.com
[javaslang]: http://www.javaslang.io
[optional]: {% post_url 2016-07-14-java-8-optional-as-a-monad %}