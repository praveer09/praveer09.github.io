---
layout: post
published: true
title: Offline installation of Python packages and Ruby gems
date: '2018-03-06'
comments: true
categories: technology
tags: [devops]
---

In this article I will show how one can perform offline installation of Python packages and Ruby gems. 
For Python packages I will be using [pip] and [cached wheels](wheel). For Ruby gems I will be using [RubyGems].

# Need for offline installation
Often on production systems there are security policies of no/controlled internet access. In such scenarios 
you may not be able to access the Python Package Index or the RubyGems.org hosting service.

Or you may be performing automated installations as part of your automated infrastructure setup, say as in 
AWS AutoScalingGroup. In such scenarios, using offline installation can safeguard against any package index/gem 
hosting service outage. The artifacts can be stored in a storage service like AWS S3 and can be used 
for installation.

Additionally offline installation is faster than the online installation as all the required artifacts and 
its dependencies are available and do not need to be searched online.

# Python package offline installation

## Step 1 (build the wheel archive)

The first step is to build the wheel archive for the required package and its dependencies. 

```
$ mkdir /tmp/wheel-ansible
$ pip wheel --wheel-dir=/tmp/ansible-wheel 'ansible==2.4.1.0'
```

The `--wheel-dir` option is used to specify the folder where wheel archives will be stored.

## Step 2 (use the archive to perform offline installation)

Now this `wheel-ansible` folder can be used to perform an offline installation. The folder can be made 
available to the machine where you plan to perform an installation.

```
$ pip install --no-index --find-links=/tmp/wheel-ansible ansible
```

The `--no-index` option is used to 
instruct the `pip install` command to look for artifact at the `--find-links` URL instead of the package 
index hosted online.

# Ruby gem offline installation

## Step 1 (build the gem archive)

Execute the below commands to create the gem archive.

```
$ mkdir gem-redis-3.3.5
$ gem install redis --version 3.3.5 --install-dir gem-redis-3.3.5
```

The `--install-dir` option is used to specify 
the directory where the gems will be installed. The `cache` directory within the install directory has the 
gem installed. For the below case the gem `redis-3.3.5.gem` can be found inside the `gem-redis-3.5.5/cache/` folder.

## Step 2 (use the archive to perform offline installation)

Now this folder `gem-redis-3.3.5/cache` can be made available to the machine where you plan to perform an 
installation.

```
$ cd gem-redis-3.3.5/cache/
$ gem install --local redis-3.3.5.gem
```

The `--local` option is used to tell the `gem install` to restrict to local domain and not go 
out to the gem hosting site.

# Summary
Offline installation of Python packages and Ruby gems can be a useful tool when the hosting service access 
is not available due to security controls on the deployment environment or when you want to speed up your 
installation or when you want to safeguard your automated installation against any hosting service failures.

[pip]: https://pip.pypa.io/en/stable/
[wheel]: https://wheel.readthedocs.io/en/latest/
[RubyGems]: https://rubygems.org/
