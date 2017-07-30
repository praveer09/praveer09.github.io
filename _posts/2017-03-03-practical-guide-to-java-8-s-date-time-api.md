---
layout: post
published: true
title: Practical Guide to Java 8’s Date Time API
date: '2017-03-03'
comments: true
categories: technology
---
I will be covering the features of the Java 8’s Date Time API from a practical standpoint, which means those features that a developer uses on a daily basis. This API was introduced as part of the [JSR-310]. In addition to improvements over existing `Date` and `Calendar` in representing date and time, you can also witness design choices like [immutability] and [fluent style] of programming. The API can be found under the [java.time] package in the JDK.

## Types representing date and time
The main types that you need to know in order to represent date and time are `LocalDate`, `LocalTime`, `LocalDateTime`, `OffsetDateTime`, `ZonedDateTime`, `ZoneOffset`, and `ZoneId`.

> The types representing the date and time are immutable and hence are thread-safe.

The following graphical can be useful in understanding the different types, the information they represent and their relation to each other. The graphical will be a little distorted when viewing on small screens.

```
|----------------------ZonedDateTime----------------------|
        2017-02-12T06:42:19.433+05:30[Asia/Kolkata]
        
|---------------OffsetDateTime---------------|
        2017-02-12T06:42:19.433+05:30
        
|--------LocalDateTime--------|
    2017-02-12T06:42:19.433                
    
|--LocalDate--|---LocalTime---|--ZoneOffSet--|---ZoneId---|
   2017-02-12    06:42:19.433      +05:30     Asia/Kolkata
```

The API uses [ISO-8601] standard to represent date and time. This means that when you print using the `toString()` method, by default it will use the ISO-8601 formatting. While parsing, using the `parse()` static factory methods, the library by default assumes that the string to be parsed is in ISO-8601 format.

_All static methods or variables in this article will be shown in italicized font._

### Date Time API in action
In the example below I have used two of the many static factory methods, `now()` and `from()`, that the API provides.

```java
ZonedDateTime now = ZonedDateTime.now();

// 2017-02-12T06:42:19.433+05:30[Asia/Kolkata]
System.out.println(now);

// 2017-02-12T06:42:19.433+05:30
System.out.println(OffsetDateTime.from(now));

// 2017-02-12T06:42:19.433
System.out.println(LocalDateTime.from(now));

// 2017-02-12
System.out.println(LocalDate.from(now));

// 06:42:19.433
System.out.println(LocalTime.from(now));

// +05:30
System.out.println(ZoneOffset.from(now));

// Asia/Kolkata
System.out.println(ZoneId.from(now));
```

## Conversion between types
Simple conversion between the types, introduced in the previous section, is possible.

### Simple conversion
If all information required by the output value is present in the input value, the toXXX() instance methods can be used. Few examples are:  
- `LocalDateTime.now().toLocalDate()` converts to `LocalDate`  
- `ZonedDateTime.now().toLocalTime()` converts to `LocalTime`

### Conversion with additional information
If enough information is not present the `atXXX()` method can be used to provide the additional missing information. Few example are:
- `LocalDate.now().atTime(6, 42, 19)` converts to `LocalDateTime` (in this case LocalDate does not have time information hence it had to be provided) 
- `LocalDateTime.now().atOffset(ZoneOffset.UTC)` converts to `OffsetDateTime` (in this case `LocalDateTime` did not have zone offset information, hence it had to be provided)

## Parsing and formatting using custom formats
The `DateTimeFormatter` class is used to specify custom formats using which you can covert a string to any of the date-time types using the `parse()` static factory method. You can obtain the string representation by calling the `format()` instance method on any of the date-time types.

```java
DateTimeFormatter pattern = 
        DateTimeFormatter.ofPattern("MMM d yyyy hh:mm a");

// Feb 12 2017 06:42 AM
LocalDateTime.now().format(pattern);
LocalDateTime.parse("Feb 12 2017 06:42 AM", pattern);
```

`DateTimeFormatter` is an immutable and thread-safe. Hence it can safely be shared. You can also use the `DateTimeFormatterBuilder` to fluently build the `DateTimeFormatter`.

## Modifying date and time

> The fluent methods on the date and time types makes the code easy to read.

### Modifying using the instance methods
The date and time objects have methods like `plusXXXX()`, `minusXXX()` and `withXXX()`. You can use either of these methods to get new modified instances of the objects you call these methods upon . The source object is immutable and hence is not modified.

```java
// the below three expressions are equivalent
LocalDate.now().plusWeeks(1);
LocalDate.now().plus(Period.ofWeeks(1));
LocalDate.now().plus(1, ChronoUnit.WEEKS);
```

### Modifying using the temporal adjusters
The date and time objects have an instance method `with(TemporalAdjuster temporalAdjuster)`. The `TemporalAdjuster` is a tool for modifying the date and time objects using a strategy pattern. Examples of strategies can be, finding the first Monday of the month for a given date. Java 8 provides a standard set of temporal adjusters in the `TemporalAdjusters` class. A custom strategy can be provided by implementing the `TemporalAdjuster` interface.

```java
// returns the first Monday of the month i.e. 2017-02-06
LocalDate.now()
    .with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY));
```

## Adding time zone information to dates
I had briefly shown two types that represent the time zone information, `ZoneId` and `ZoneOffset`, in an earlier section. `ZoneId` may have both the fixed offset and geographical region information, whereas `ZoneOffset` has only the fixed offset. The below code snippet shows various ways of creating the `ZoneId` and `ZoneOffset`.

```java
// contains both geographical region 
// and the fixed offset based on rules
ZoneId.of("America/Los_Angeles");

// contains only the fixed offset
ZoneId.of("-08:00");

// contains only the fixed offset
ZoneOffset.of("-08:00");
```

> Wherever possible, preferably use the ZoneId as it covers the time zone offset changes due to Daylight Saving Time (DST).

As an example see the below code snippet. Carefully note the zone offsets for two different dates. One February 1, 2017 the DST if off and hence an offset of -08:00 is observed. On April 1, 2017 the DST is on and hence an offset of -07:00 is observed.

```java
ZoneId pst = ZoneId.of("America/Los_Angeles");

// 2017-02-01T00:00-08:00[America/Los_Angeles]
System.out.print(LocalDate.of(2017, FEBRUARY, 1).atStartOfDay(pst));

// 2017-04-01T00:00-07:00[America/Los_Angeles]
System.out.print(LocalDate.of(2017, APRIL, 1).atStartOfDay(pst));
```

To get a list of valid geographical regions `ZoneId.getAvailableZoneIds()` can be used. By default the [IANA time zone database](https://www.iana.org/time-zones) is used.

## Epoch
The API provides support of [epoch referenced instants](https://en.wikipedia.org/wiki/Epoch_%28reference_date%29) through the Instant class. The Instant class has the static factory method `ofEpochMilli()` and instance method `toEpochMilli()` that helps in conversion from and to epoch referenced instants. The `LocalDateTime` and `ZonedDateTime` objects can be created from epoch using the `Instant` object via the `ofInstant()` static factory method.

```java
// Milliseconds from epoch at the system's default time zone
Instant.now().toEpochMilli();

// 1970-01-01T00:00Z
Instant.ofEpochMilli(0L);

// 1970-01-01T00:00Z[UTC]
ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of("UTC"));

// 1970-01-01T00:00
LocalDateTime.ofInstant(Instant.EPOCH, ZoneId.of("UTC"));
```

## Intervals
The API provides classes to represent interval between two dates or two times. Intervals can also be represented as strings. This is especially useful when you want to provide intervals in form of some configuration. The `parse` static factory method on the classes representing intervals can be used to create the instances.

### Time Intervals
The `Duration` class is used to specify time intervals. Time intervals are specified using days, hours, minutes and seconds.

```java
// the below two expressions are equivalent
Duration.parse("P1DT1H2M3S");
Duration.ofDays(1).plusHours(1).plusMinutes(2).plusSeconds(3);

LocalDateTime.now().plus(Duration.ofMinutes(5));
```

### Date Intervals
The `Period` class is used to date intervals. Date intervals are specified using years, months, weeks and days.

```java
// the below two expressions are equivalent
Period.parse("P1Y2M3W4D");
Period.ofYears(1).plusMonths(2).plus(Period.ofWeeks(3)).plusDays(4);
LocalDate.now().plus(Period.ofWeeks(1));
```

## Switching between legacy and new API
Often, for backward compatibility, you will need to switch between legacy types and new API. Following are few examples for the same.

```java
new Date().toInstant();
Date.from(Instant.now());

TimeZone.getTimeZone("UTC").toZoneId();
TimeZone.getTimeZone(ZoneId.of("UTC"));

Calendar.getInstance().toInstant();
```

## Summary
I hope that this article covers most of the scenarios that you will come across while using the new Date Time API introduced as part of Java 8. In addition to serving as an improved library for date and time, it also serves as a good reference for designing fluent APIs.

[JSR-310]: http://jcp.org/en/jsr/detail?id=310
[immutability]: https://en.wikipedia.org/wiki/Immutable_object
[fluent style]: https://en.wikipedia.org/wiki/Fluent_interface
[java.time]: https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html
[ISO-8601]: http://www.iso.org/iso/home/standards/iso8601.htm
