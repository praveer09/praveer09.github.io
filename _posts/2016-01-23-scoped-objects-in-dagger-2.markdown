---
layout: post
title:  "Scoped Objects in Dagger 2"
date:   2016-01-23 09:00:00
comments: true
categories: technology
tags: [java]
---

When you use [Dependency Injection][DependencyInjection], you may want to create objects that have different 
life-cycles. As an example, you may want some objects to live as long as the application lives, and some to 
live only for a short duration, like only for the duration of a request. Such objects can be referred to as 
___Scoped Objects___. In this article, I will show how [Dagger 2][Dagger2] provides the following 
functionality in relation to Scoped Objects:

* Defining the Scoped Objects
* Relating these Scoped Objects (using __Components__ and __Subcomponents__)
* Creating objects of one Scope from a related Scope
 
Dagger 2 is a dependency injection framework. Unlike other frameworks, which use reflection, it provides dependency 
injection functionality by generating code which makes it performant 
([Java reflection performance cost][ReflectionCost]) and traceable. One of the greatest advantages of Dagger 2 above 
other frameworks is the ___object graph validation during compilation___ as opposed to runtime validation in other 
frameworks. 

_From this point onwards in the article, I will refer Dagger 2 as just Dagger_. Also the code for the sample below
can be found here ([link to the sample code][SampleCode]).
 
## Defining the Scoped Objects
The definition of Scoped Objects can be broken into two steps. Firstly, defining the custom scopes and secondly, using 
these custom scopes to make Scoped Objects. Dagger uses several annotations from [javax.inject][JavaxInject] 
to provide the dependency injection functionality. In the code samples below `@Scope`, `@Inject` and `@Named` 
annotations are from the `javax.inject` package.
 
#### Defining Custom Scopes
The [Scope] annotation is used to define the scopes. 

```java
// objects marked with this will live for lifetime of application
@Scope 
public @interface ApplicationScoped {}

// objects marked with this will live for lifetime of a request
@Scope 
public @interface RequestScoped {}
``` 

#### Using Custom Scopes on Objects
From the code sample below the following observations can be made:
 
* Scopes are applied on classes. 
* Scopes can also be applied on provider methods (methods annotated with `@Provides` on classes annotated 
with `@Module`). 
* `GreetingProvider` is `ApplicationScoped`. 
* `Greeter` and `@Named("Visitor") String` are `RequestScoped`.

```java
@ApplicationScoped  // <<<<<<
public class GreetingProvider {
    @Inject
    public GreetingProvider() { }

    public String get() { return "Hello"; }
}

@RequestScoped  // <<<<<<
public class Greeter {
    private final String visitor;
    private final GreetingProvider greetingProvider;

    @Inject
    public Greeter(GreetingProvider greetingProvider, 
                        @Named("Visitor") String visitor) {
        this.visitor = visitor;
        this.greetingProvider = greetingProvider;
    }

    public String greet() {
        return greetingProvider.get() + " " + visitor;
    }
}

@Module
public class GreeterModule {
    private final String visitor;

    public GreeterModule(String visitor) { this.visitor = visitor; }

    @Provides @RequestScoped @Named("Visitor")  // <<<<<<
    public String provideVisitor() { return visitor; }
}
```

##### A Note on `@Inject`, `@Module` and `@Provides`
* Annotating a constructor of an object with `@Inject` instructs Dagger to create that object and inject dependencies
in it. 
    * `GreetingProvider` has a no-argument constructor with the Inject annotation. Dagger will just create this 
    object. 
    * `Greeter` has a two argument constructor. That means Dagger will create the object and also ensure 
    the dependencies are already created before the construction of Greeter.
* Classes annotated with `@Module` contribute objects to object graph using methods annotated with `@Provides`. These 
methods are called as __Provider Methods__. These are useful in cases where objects cannot be created by Dagger. 
Like when libraries/frameworks provide those objects. In the case above @Inject cannot be put on the constructor of 
`String`. Hence the String can be provided using the provider method. To differentiate this String from other 
Strings in the application `@Named` has been used.

## Relating and Creating the Scoped Objects
Dagger provides two ways of establishing relationships between different scopes. You can define the relationships 
by either using __Component Dependencies__ or __Subcomponents__. I will show how both of these can be used to relate 
and create the scopes defined above. But before that lets understand how Dagger uses `Component`s and 
`Subcomponent`s.
 
#### What is a Component in Dagger
Component is defined using the `@Component` annotation on an interface. When Dagger generates code, it generates
an implementation for this interface and this implementation acts as a Factory for creating objects. As an example, 
if there is an interface named `ApplicationComponent` that has the annotation, Dagger will generate an implementation 
named `DaggerApplicationComponent` which will be used to construct objects. We will see this in detail in the 
subsequent sections.

#### What is a Subcomponent in Dagger
Like Component, Subcomponent is defined using `@Subcomponent` annotation on an interface. The difference is that 
it cannot live standalone and has to be defined as a method on an interface marked as `Component` and that method 
should return the interface marked as Subcomponent. This means that the Subcomponent interface 
implementation can only be gotten using the parent Component's implementation. We will see this in detail in subsequent 
sections.

### Subcomponents
First we will see, in the following two sub-sections, how the Scoped Objects are related and created when using 
Subcomponents.

#### Relating the Scoped Objects
In the code below the following points are worth noting: 

* `ApplicationComponent` is defined as `Component` and has ApplicationScope.
* `RequestComponent` has been defined as a `Subcomponent` and has RequestScope.
* RequestComponent has been defined as a method on ApplicationComponent interface. ___The Subcomponent will have to 
be defined as a method on the Component interface definition to which it relates___. We can say that there 
is a ___parent-child relationship___ between ApplicationComponent and RequestComponent. 
* Unlike in component dependencies, which we will see in next section, the `GreetingProvider` does not have to 
be defined on ApplicationComponent even though it is being used in `Greeter`. ___The objects from parent scope are 
visible to the child scope___. 

```java
@ApplicationScoped
@Component
public interface ApplicationComponent {
    Controller controller();  // controller will be discussed in next section
    RequestComponent requestComponent(GreeterModule greeterModule);  // <<<<<<
}

@RequestScoped
@Subcomponent(modules = GreeterModule.class)  // <<<<<<
public interface RequestComponent {
    Greeter greeter();
}
```

#### Creating the Scoped Objects
In the code sample below:
 
* `Controller` has an application scope. 
* Its `handleRequest` method delegates the request handling to `Greeter`'s `greet` method. 
* As Greeter has a request scope, different from that of Controller, it has to be created using the RequestComponent, 
the instance of which is created from ApplicationComponent. This is why ApplicationComponent has been 
injected into the Controller. ___Components can also be injected into objects, but only those that have same scope 
defined as that on the object___.
* The `Controller` itself is created using `DaggerApplicationComponent` which Dagger has generated.
 
```java
@ApplicationScoped
public class Controller {
    private final ApplicationComponent applicationComponent;

    @Inject
    public Controller(ApplicationComponent applicationComponent) {
        this.applicationComponent = applicationComponent;
    }

    public String handleRequest(String name) {
        RequestComponent requestComponent = applicationComponent
                .requestComponent(new GreeterModule(name));
        return requestComponent.greeter().greet();
    }
}

public class App {
    public static void main(String[] args) {
        Controller controller = DaggerApplicationComponent.create().controller();
        System.out.println(controller.handleRequest("Hello")); // prints Hello World!
    }
}
```

### Component Dependencies
Now we will see how the Scoped Objects are related using Component Dependencies and how they are created.

#### Relating the Scoped Objects
In the code below the following points are worth noting: 

* Both `ApplicationComponent` and `RequestComponent` are declared as `Component`. 
* The component definition on RequestComponent uses the `dependencies` attribute to define its relationship to 
ApplicationComponent. 
* Also note that ApplicationComponent has to define `GreetingProvider` as it is used by `Greeter`. ___The objects 
which are used in other related scopes have to be defined on the Component definition interface___.

```java
@ApplicationScoped
@Component
public interface ApplicationComponent {
    Controller controller();  // controller will be discussed in next section
    GreetingProvider greetingProvider();  // <<<<<<
}

@RequestScoped
@Component(
        dependencies = ApplicationComponent.class,  // <<<<<< 
        modules = GreeterModule.class)
public interface RequestComponent {
    Greeter greeter();
}
```

#### Creating the Scoped Objects
In the code sample below:
 
* `Controller` has an application scope. 
* Its `handleRequest` method delegates the request handling to `Greeter`'s `greet` method. 
* As Greeter has a request scope, different from that of Controller, it has to be created using the RequestComponent. 
`DaggerRequestComponent`, which is generated by Dagger, is used here to create RequestComponent. As 
ApplicationComponent has been defined as __dependencies__, as shown above, an instance of it is required while 
building the RequestComponent. This is why 
ApplicationComponent has been injected into the Controller.
* The `Controller` itself is created using `DaggerApplicationComponent` which Dagger has generated.

```java
@ApplicationScoped
public class Controller {
    private final ApplicationComponent applicationComponent;

    @Inject
    public Controller(ApplicationComponent applicationComponent) {
        this.applicationComponent = applicationComponent;
    }

    public String handleRequest(String name) {
        RequestComponent requestComponent = DaggerRequestComponent.builder()
                .applicationComponent(applicationComponent)
                .greeterModule(new GreeterModule(name))
                .build();

        return requestComponent.greeter().greet();
    }
}

public class App {
    public static void main(String[] args) {
        Controller controller = DaggerApplicationComponent.create().controller();
        System.out.println(controller.handleRequest("Hello")); // prints Hello World!
    }
}
```

## Summary
Dagger has full support for defining the __Scoped Objects__. __Subcomponets__ and __Component Dependencies__ 
are used by Dagger to relate the Scoped Objects. Dagger generates __Factories__ that are used to create 
the Scoped Objects. 

[DependencyInjection]: https://en.wikipedia.org/wiki/Dependency_injection
[Dagger2]: https://google.github.io/dagger/
[ReflectionCost]: http://stackoverflow.com/questions/435553/java-reflection-performance
[Scope]: https://docs.oracle.com/javaee/6/api/javax/inject/Scope.html
[JavaxInject]: http://docs.oracle.com/javaee/7/api/javax/inject/package-summary.html
[SampleCode]: https://github.com/praveer09/dagger2-scopes
