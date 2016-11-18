---
layout: post
title:  "Functional Programming for the Object Oriented Minds"
date:   2014-06-13 21:00:00
comments: true
categories: technology
---

In this article I make an attempt to share my understanding of functional programming and how it can help in improving 
your daily work.

If you are one of those who build software solutions for everyday business problems, there is a high chance that you
might be using an object oriented language to build high quality and maintainable software. Like me, you might also be
exploring new ways to continuously improve yourself in building software. Lately with most of the languages supporting 
the programming paradigm of functional programming, it is being talked about a lot. Let's see how it helps in writing 
better code. 

## Current style of writing code

I will begin with an example. Although the example has been made simple enough to reflect clearly the idea being 
discussed, yet it covers most of the tasks a programmer comes across on a normal work day. Also I have selected the 
language as __Java__ but this is applicable to any other language.

Suppose you have to implement a functionality ___to filter from a list of products that have price less than 200___. 
 
```java
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  List<Product> filteredProducts = new ArrayList<>();
  for (Product product : products) {
    if (product.getPrice() < 200) filteredProducts.add(product);
  }
  return filteredProducts;
}
```

On careful observation of the above code, we can see that the following has been done:

1. Initializing a list `filteredProducts` to hold the products satisfying the criteria
2. Creating a loop to iterate over the list of products
3. Apply the filtering criteria
4. Adding the products passing the criteria to the filtered list
5. Returning the filtered list

Firstly, the above mentioned steps of _initializing a list_, _looping_ and _adding to a list_ are a set of instructions 
given to the computer to solve the problem at hand. Clearly we see that the focus has been shifted from 
___what to do___ to ___how to do___. Secondly, the ___mutable variable___ `filteredProducts` can cause problems when 
the complexity of the code increases. 

## The functional way of writing code

Now let's see how we can implement the functionality using functional programming paradigm. This is possible in Java 8.

```java
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  return products
          .stream()
            .filter(product -> product.getPrice() < 200)
            .collect(Collectors.toList());
}
```

Again on careful observation of the above code, we can see that the following has been done:

1. Create a stream
2. Apply the filtering criteria
3. Return the collected products that satisfied the filter

You might have noticed that in this form of implementation the focus is on ___what to do___. The ___how to do___ part 
is taken care of by the language platform. This also gives a chance to the language platform to perform optimizaitons. 
For example the streams are lazy, which means that computations on source elements are done only when necessary. 
Moreover we can see that we could also do away with the ___mutability___, thus reducing the chances of errors due to it.

## Summary
Thus we can see that using the functional programming paradigm we get to focus on ___what to do___ which, we as 
software solution builders should do. Though I showcased only a few benefits of thinking or practicing functional 
programming among umpteen of them, I think I was able to generate your interest towards considering functional 
programming as an addition to your daily job.