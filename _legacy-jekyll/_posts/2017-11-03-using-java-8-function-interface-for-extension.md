---
layout: post
published: true
title: Using Java 8's Function interface for extension
date: '2017-11-03'
comments: true
categories: technology
tags: [java, functional-programming]
---

In this article I will show how existing interfaces can be extended to provide additional features by using the 
`Function` interface, introduced in Java 8, without breaking existing code. I will show, through practical examples, 
the usages of the `apply`, `compose` and `andThen` methods from the `Function` interface.

Let's consider a use case to solve and we will see how the `Function` interface can help us to implement it with 
minimal changes to existing code. 

# Use case
Suppose I have an existing interface `SomeInterface` which takes an input `SomeInput` and returns an output 
`SomeOutput`. I want to extend the interface so that: 
              
- it can work with different inputs, say `SomeOtherInput`, and 
- be able to produce different outputs, say `SomeOtherOutput`, and
- the change should be done in a way that no existing code should break. 

In code the existing interface and classes will look something like below. I have also shown client code, 
`SomeClient`, that uses the interface. 

```java
interface SomeInterface {
    SomeOutput transform(SomeInput someInput);
}

class SomeInterfaceImpl implements SomeInterface {
    @Override
    public SomeOutput transform(SomeInput someInput) {
        // does some processing or 
        // calls some external systems to build someOutput
        SomeOutput someOutput = ...
        return someOutput;
    }
}

class SomeInput {
    // variables and methods not shown
}

class SomeOutput {
    // variables and methods not shown
}

class SomeClient {
    SomeInterface someInterface;
    
    SomeOutput someClientMethod(SomeInput someInput) {
        SomeOutput someOutput = someInterface.transform(someInput);
        return someOutput;
    }
}
```

Though this use case can be solved in different ways, I will show how we can use the `Function` interface to 
solve this use case.

# Implementing the use case
Let's change the `SomeInterface` by extending the `Function` interface and implement the `apply` method from 
the `Function` interface. This is the only change needed and our use case is done. Really, that's all that's needed to 
be done. I will use examples in following sections to show how this was the only change required.
In code it will look something like below. Some points, worth noting, in the code below are:

- By making the below change, none of the existing code breaks. 
- The Function interface's `apply` method has been implemented in the `SomeInterface` using ___default methods___ 
feature introduced in Java 8. 
- Even though from the interface definition of `SomeInterface` it seems that it works only with `SomeInput` and 
produces only `SomeOutput`, with the change we did `SomeInterface` can now work with any input types and can produce 
any output types.

```java
import java.util.function.Function;

interface SomeInterface extends Function<SomeInput, SomeOutput> {
    default SomeOutput apply(SomeInput someInput) {
        return transform(someInput);
    }

    SomeOutput transform(SomeInput someInput);
}
```

Let's see via examples how our use case got fulfilled with just this small change.

# Working with different input types
The below code shows how `SomeInterface` can work with an unknown input type `SomeOtherInput`. The following points 
are worth noting in the code below:

- The `compose` method from `Function` is used to transform `SomeOtherInput` to `SomeInput`.
- The `SomeOtherInput` to `SomeInput` transformation logic lives inside the `toSomeInput()` instance method 
on `SomeOtherInput`. This logic is passed into `compose` method via ___method references___ feature introduced 
in Java 8. `SomeOtherInput::toSomeInput` is a method reference.
- The `apply` method from Function is called to build `SomeOutput` from `SomeInput`.

```java
class SomeClient {
    SomeInterface someInterface;
    
    SomeOutput someClientMethod(SomeOtherInput someOtherInput) {
        SomeOutput someOutput = someInterface
            .compose(SomeOtherInput::toSomeInput)
            .apply(someOtherInput);
        
        return someOutput;
    }
}

class SomeOtherInput {
    // variables and methods not shown
    
    SomeInput toSomeInput() {
        // logic to build SomeInput from this object
        SomeInput someInput = ...
        return someInput;
    }
}
```

# Producing different output types
The below code shows how `SomeInterface` can produce an unknown output type `SomeOtherOutput`. The following points 
are worth noting in the code below:

- The `andThen` method from the `Function` interface transforms the `SomeOutput` to `SomeOtherOutput`.
- The transformation logic for `SomeOutput` to `SomeOtherOutput` resides in the `SomeOtherOutput` class as a 
static factory method. It is provided to the `andThen` method using method references feature of Java 8.
- The `apply` method, like in the previous example, builds `SomeOutput` to `SomeOtherOutput`.

```java
class SomeClient {
    SomeInterface someInterface;
    
    SomeOtherOutput someClientMethod(SomeInput someInput) {
        SomeOtherOutput someOtherOutput = someInterface
            .andThen(SomeOtherOutput::fromSomeOutput)
            .apply(someInput);
        
        return someOtherOutput;
    }
}

class SomeOtherOutput {
    static SomeOtherOutput fromSomeOutput(SomeOutput someOutput) {
        // logic to build SomeOtherOutput from SomeOutput
        SomeOtherOutput someOtherOutput = ...
        return someOtherOutput;
    }
}
```

# Working with and producing different input and output types together
The following points are worth noting in the code below:

- The `compose` and `andThen` methods from `Function` is chained together to build `SomeOtherOutput` from 
`SomeOtherInput`.

Explanations for `compose` and `andThen` can be found in above examples.

```java
class SomeClient {
    SomeInterface someInterface;
    
    SomeOtherOutput someClientMethod(SomeOtherInput someOtherInput) {
        SomeOtherOutput someOtherOutput = someInterface
            .compose(SomeOtherInput::toSomeInput)
            .andThen(SomeOtherOutput::fromSomeOutput)
            .apply(someOtherInput);
        
        return someOtherOutput;
    }
}
```

# Summary
By using the `Function` interface, you can easily extend your existing interfaces to provide additional features 
with minimal changes. 

The gist for the above example can be found here 
[at this link](https://gist.github.com/praveer09/be7787c35a5c62df09b405a3b41c1b0a).
