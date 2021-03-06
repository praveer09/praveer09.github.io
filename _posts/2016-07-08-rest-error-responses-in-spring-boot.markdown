---
layout: post
title:  "REST Error Responses in Spring Boot"
date:   2016-07-08 08:30:00 +05:30
comments: true
categories: technology
tags: [java, spring]
---

The format of error responses from [REST][REST] web services has always been a topic of grey area for me. According 
to me, whatever format you choose, it should give enough information to the clients, consuming the REST web services, 
so that the clients can handle the error situations gracefully. Spring Boot takes an opinionated view on this. In 
this article I will show what is [Spring Boot][Boot]'s way formatting error responses. 

_Note: As of writing this article, the current release of Spring Boot is 1.3.6._ 

## Example REST web service
Suppose we have a REST web service with the following specification:

```
HTTP Method and URL:
POST /some-resource

Request Headers:
Content-Type - application/json is allowed

Request JSON Body Attributes:
name (required) - type is string
age (required) - type is integer and should be between 0 and 100 inclusive 
```

## Error Responses
Let's see examples of a few error messages returned by the REST web service when implemented using Spring Boot. In 
each example notice what all information is sent back by the service in the response body.

* `POST /some-resource with Content-Type as application/xml`  
In this case the value of the `Content-Type` header is not the one that the service supports.

```json
{
    "timestamp": 1467943353634,
    "status": 415,
    "error": "Unsupported Media Type",
    "exception": "org.springframework.web.HttpMediaTypeNotSupportedException",
    "message": "Content type 'application/xml' not supported",
    "path": "/some-resource"
}
```

* `GET /some-resource`  
In this case the HTTP Method is not the one that the service supports.

```json
{
    "timestamp": 1467943482730,
    "status": 405,
    "error": "Method Not Allowed",
    "exception": "org.springframework.web.HttpRequestMethodNotSupportedException",
    "message": "Request method 'GET' not supported",
    "path": "/some-resource"
}
```

* `POST /some-other-resource`  
In this case a wrong URL is called.

```json
{
    "timestamp": 1467943759106,
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/some-other-resource"
}
```

* `POST /some-resource with Content-Type as application/json and body as {"age": 10}`  
In this case the request body format is incorrect. The `name` attribute is missing from the request body.  
Notice that in this case a client can be provided with more information about what is not valid in the request body. 
This is done through the `errors` key in the JSON response.

```json
{
    "timestamp": 1467945423675,
    "status": 400,
    "error": "Bad Request",
    "exception": "org.springframework.web.bind.MethodArgumentNotValidException",
    "errors": [
        {
            "codes": [
                "NotNull.someRequest.name",
                "NotNull.name",
                "NotNull.java.lang.String",
                "NotNull"
            ],
            "arguments": [
                {
                    "codes": [
                        "someRequest.name",
                        "name"
                    ],
                    "arguments": null,
                    "defaultMessage": "name",
                    "code": "name"
                }
            ],
            "defaultMessage": "may not be null",
            "objectName": "someRequest",
            "field": "name",
            "rejectedValue": null,
            "bindingFailure": false,
            "code": "NotNull"
        }
    ],
    "message": "Validation failed for object='someRequest'. Error count: 1",
    "path": "/some-resource"
}
```

## Mechanism behind Spring Boot error messages
Spring Boot redirects all error messages to `/error` mapping. Spring Boot has a [`BasicErrorController`][BEC] which handles 
the error mapping. The response bodies shown above are generated by [`DefaultErrorAttributes`][DEA]. 

To replace the default behaviour completely you can implement [`ErrorController`][EC] and register a bean definition 
of that type, or simply add a bean of type [`ErrorAttributes`][EA] to use the existing mechanism but replace the contents.

## Summary
When building REST web services a careful thought should be given to the format in which error responses will 
be communicated to clients. Choose a format which would help the consuming client to handle the errors gracefully. 
Spring Boot has an opinionated way of achieving this which you can leverage without any extra coding. 

[REST]: https://en.wikipedia.org/wiki/Representational_state_transfer
[Boot]: http://projects.spring.io/spring-boot/
[BEC]: https://github.com/spring-projects/spring-boot/blob/master/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/BasicErrorController.java
[DEA]: https://github.com/spring-projects/spring-boot/blob/master/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/DefaultErrorAttributes.java
[EC]: https://github.com/spring-projects/spring-boot/blob/master/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/ErrorController.java
[EA]: https://github.com/spring-projects/spring-boot/blob/master/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/ErrorAttributes.java
