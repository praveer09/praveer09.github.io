---
layout: post
title:  "Testing REST APIs with REST-assured"
date:   2016-02-06 23:55:00
comments: true
categories: technology
---

REST APIs are HTTP-based web services that adhere to [REST architectural constraints][REST]. If you look 
up now-a-days systems that talk to each other over web, it is highly probable that you will find REST APIs being used. 
In this article I will focus on [REST-assured][RestAssured], a tool from [Jayway][Jayway] for REST API testing. 
It provides a Java [DSL][DSL] for executing HTTP requests and making assertions on responses. If you are planning to 
automate your testing of REST API and your choice of language is Java, using REST-assured will make writing the 
tests easy and the tests will be very readable and maintainable.

## Why REST-assured?
Let's look at what is expected from a tool that helps in writing automated tests for REST APIs and how 
REST-assured lives upto these expectations. 

#### Easy HTTP Request Building and Execution
Requesting building comprises of defining many things like query params, cookies, headers, path params 
and request body. Using it's DSL, REST-assured hides away the complexity of building and executing an HTTP 
request behind a [fluent interface][FluentInterface]. We will see this in action in the next section.

#### Response Assertions
REST-assured also handles, within its library, the parsing of responses. It provides many constructs for making 
assertions on cookies, response headers and response body. For doing assertions on response body it provides 
[JsonPath][JsonPath] for assertions on JSON responses and [XmlPath][XmlPath] for assertions on XML responses. 
It also also uses [Java Hamcrest Matchers][Hamcrest] to make readable assertions.

#### Ability to write Clean Code
The real value of automated tests is realized when they are easy to understand and takes very less effort to 
maintain them. In the dictionary of REST-assured's DSL, you can also find constructs for writing in  
[Given-When-Then][GivenWhenThen] style. Using this style helps in specifying pre-conditions under the Given section, 
behavior under test under the When section and verifications under the Then section. This helps in maintaining a clear 
separation of concerns within a test, thus leading to a very readable test.
 
## REST API Testing in Action
Let's assume that there is a REST API with the following documentation:
 
{% highlight java %}
PATHS
GET /people/{id}

PARAMETERS
Name    Description         Required        Schema
----    -----------         --------        ------
id      Id of the person    Yes             number

RESPONSES
Code    Description         Schema
----    -----------         ------
200     Person              {id: number, name: string}
{% endhighlight %}

An automated test for the REST API written using REST-assured will look like below. After reading the test 
I think that you will agree with me that the test is easily readable and self-explanatory. Also note that the 
code is written in a declarative style, which means that I had to just specify the operations and 
the library takes care of the mechanics of how the request is made, how the response is handled and how assertions 
are made.

{% highlight java %}
... // some imports hidden for brevity
import static com.jayway.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;

public class PersonApiTest {
    @Test
    public void shouldReturnPersonForTheId() {
        given().
            accept(ContentType.JSON).
            pathParam("id", 1).        
        when().
            get("/people/{id}").            
        then().
            statusCode(200).            
            body(                       
                "id", is(1),            
                "name", is("Praveer")   
            );
    }
}
{% endhighlight %}

Though what I have showcased above is a very basic test for a REST API, the library with its DSL can very 
easily handle the rising complexity of the tests. The reason for this is the availability of various 
constructs in the library for almost all the cases that you may come across while testing a REST API. 
Check out [the REST-Assured Guide][RestAssuredGuide] for a detailed description on all available constructs. 

The code sample for the above example can be found [here on github][CodeSample]. 

## Summary
If you are planning to automate your testing of REST API and your choice of language is Java you should definitely 
try out [REST-assured][RestAssured].

[Jayway]: http://www.jayway.com
[RestAssured]: https://github.com/jayway/rest-assured
[RestAssuredGuide]: https://github.com/jayway/rest-assured/wiki/Usage
[GivenWhenThen]: http://martinfowler.com/bliki/GivenWhenThen.html
[CodeSample]: https://github.com/praveer09/api-testing-rest-assured
[REST]: https://en.wikipedia.org/wiki/Representational_state_transfer#Architectural_constraints
[DSL]: https://en.wikipedia.org/wiki/Domain-specific_language
[FluentInterface]: http://martinfowler.com/bliki/FluentInterface.html
[JsonPath]: http://static.javadoc.io/com.jayway.restassured/json-path/2.8.0/com/jayway/restassured/path/json/JsonPath.html
[XmlPath]: http://static.javadoc.io/com.jayway.restassured/xml-path/2.8.0/com/jayway/restassured/path/xml/XmlPath.html
[Hamcrest]: http://hamcrest.org/JavaHamcrest/