---
layout: post
title:  "Functional Programming for the Object Oriented Minds"
date:   2014-06-13 21:00:00
categories: jekyll update
---

If you are one of those who build software solutions for everyday business problems, there is a high chance that you
might be using an object oriented language to build high quality and maintainable software. Like me, you would also 
explore new ways to continuously improve in building software. Lately with most of the languages supporting the 
programming paradigm of functional programming, it is being talked about a lot. In this article I make an attempt to 
share my understanding of functional programming and how it can help improving in our daily work.

## Current style of writing code

I will begin with an example 
You'll find this post in your `_posts` directory - edit this post and re-build (or run with the `-w` switch) to see your changes!
To add new posts, simply add a file in the `_posts` directory that follows the convention: YYYY-MM-DD-name-of-post.ext.

{% highlight java %}
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  List<Product> filteredProducts = new ArrayList<>();
  for (Product product : products) {
    if (product.getPrice() < 200) filteredProducts.add(product);
  }
  return filteredProducts;
}
{% endhighlight %}

## The functional way of writing code

{% highlight java %}
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  return products
          .stream()
            .filter(product -> product.getPrice() < 200)
            .collect(Collectors.toList());
}
{% endhighlight %}

Check out the [Jekyll docs][jekyll] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll's GitHub repo][jekyll-gh].
[jekyll-gh]: https://github.com/jekyll/jekyll
[jekyll]:    http://jekyllrb.com
