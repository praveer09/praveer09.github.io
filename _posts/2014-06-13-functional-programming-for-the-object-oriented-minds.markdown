---
layout: post
title:  "Functional Programming for the Object Oriented Minds"
date:   2014-06-13 21:00:00
categories: jekyll update
---

You'll find this post in your `_posts` directory - edit this post and re-build (or run with the `-w` switch) to see your changes!
To add new posts, simply add a file in the `_posts` directory that follows the convention: YYYY-MM-DD-name-of-post.ext.

Jekyll also offers powerful support for code snippets:

{% highlight java %}
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  List<Product> filteredProducts = new ArrayList<>();
  for (Product product : products) {
    if (product.getPrice() < 200) filteredProducts.add(product);
  }
  return filteredProducts;
}
{% endhighlight %}

Check out the [Jekyll docs][jekyll] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll's GitHub repo][jekyll-gh].

{% highlight java %}
public List<Product> findProductsWithPriceLessThan200(final List<Product> products) {
  return products
          .stream()
            .filter(product -> product.getPrice() < 200)
            .collect(Collectors.toList());
}
{% endhighlight %}

[jekyll-gh]: https://github.com/jekyll/jekyll
[jekyll]:    http://jekyllrb.com
