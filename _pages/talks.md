---
permalink: /talks/
title: "Talks"
categories:
  - Layout
  - Uncategorized
tags:
  - video
  - layout
toc: true
toc_label: "Talks"
toc_icon: "chalkboard-teacher"
---

## Conferences

### DroidCon NYC 2018

<br/>
{% include video id="LT6m5_LO2DQ" provider="youtube" %}
<br/>

__Static Code Analysis with Kotlin__

Detekt is a static code analysis tool for Kotlin. It can analyze your Kotlin projects for various types of code smells. The tool contains rules for style, performance and potential bugs. The tool is fully configurable so that you may turn off and set thresholds for these rules. It is also extensible so that you could create your own custom rules from your style guide. This tool goes a long way to enforcing good practices in your code base.

Under the hood, the library performs checks against these rules by analyzing the abstract syntax tree provided by the Kotlin Compiler. In this talk, we will learn about how to setup Detekt and how to create custom rules. We will also take a deep dive into how the library enforces these rules by using the abstract syntax tree.

### DroidCon SF 2018

<br/>
{% include video id="xsoQpcvGZgI" provider="youtube" %}
<br/>

__Working Effectively with (Android) Legacy Code__

* How are we going to add this new feature when the code is a mess?
* We can’t change this file-- it’s too risky!
* How do I test this class when it depends on X, Y, and Z?
* There is not enough time to make the changes you want!
* What does this code even do!?
* I feel overwhelmed and it’s never going to get any better.

Android isn’t new anymore. Most applications are not greenfield projects. Many of us find ourselves in the position of working on code we didn't author and which we don’t fully understand.

In the spirit of Michael Feathers' classic book, this talk explores ways we can navigate, maintain, improve and evolve Android legacy code. We will cover topics like architecture, refactoring, testing, and dependency breaking techniques using examples from the speakers’ combined 16+ years of experience working on Android. 

### DroidCon EMEA 2020

<script async class="speakerdeck-embed" data-id="d79c32b49ac840138d365f3d263eeb00" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
<br/>

__Writing Kotlin Compiler Plugins with Arrow Meta__

We’ll learn about how to write and test compiler plugins with Arrow Meta. This library provides an API for source transformations, automatic code refactoring, and much more. We’ll look at main use cases from type classes, comprehensions, and lenses that are made possible with Arrow Meta. We’ll also look at how to test each use case.

### Android Summit 2020

<script async class="speakerdeck-embed" data-id="39478411379b450387c26e10e80eacce" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
<br/>

__Unit Testing Kotlin Channels & Flows__

We’ll learn about how to write and test compiler plugins with Arrow Meta. This library provides an API for source transformations, automatic code refactoring, and much more. We’ll look at main use cases from type classes, comprehensions, and lenses that are made possible with Arrow Meta. We’ll also look at how to test each use case.

### Devfest UK & Ireland 2020

<br/>
{% include video id="803jB3RLi_s" provider="youtube" %}
<br/>

__Unit Testing Kotlin Channels & Flows__

Unit testing Channels and Flows can be a challenge as they are fairly new. In this talk, I will share with you how to implement and test practical examples from my experience. These examples are testing delays, retries, and errors. I'll also share testing more complex examples such as polling. For each use case, we'll look at how to use features in the coroutines library such as runBlockingTest and TestCoroutineDispatcher. From my journey of using and testing Flows in production, I'll share the challenges I experienced.

## Meetups

### Kotlin NYC Meetup 
----

#### Channels & Flows 
<br/>  
<script async class="speakerdeck-embed" data-id="5a4e8a2864e54ae0a38b35090d33725b" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>  

In this talk, I will presented on how to use constructs such as actors, channels and flows in use cases. These use cases are modeling streams with channels and flows and using actors to ensure one concurrent job is running. Channels and Flows are experimental features that allow us to represent a stream of data. Flows represent a cold stream whereas a Channel is like a hot observable. We’ll dive into these topics.

#### Dissecting Coroutines
<br/>
<script async class="speakerdeck-embed" data-id="3d0bbbe23015455eaa848840cc55f981" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

2019 maybe be the year of Kotlin coroutines. What is a coroutine anyway? A coroutine is an instance of a state machine and a suspending function defines the state machine. What does that mean? Join me in this talk as we will explore the ins and out of coroutines. We will dive deep into channels, actors and the reactive streams modules. We’ll also look at their usage to solve common async problems in Android.

#### Kotlin Muiltiplatform
<br/>
<script async class="speakerdeck-embed" data-id="127463ba51044d378f1bf9b76e781213" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

This presentation is a walk through on how to build a multiplatform app for Android & iOS. We look at how to structure and setup a project for Android and iOS. Then, we look how to a build an Android & iOS app with this structure. The sample app is built using Model View Presenter. We explore how to share our models and presenters in a multiplatform project. We also look at the limitations that you will come across along the way.

#### Functional Programming with Arrow
<br/>
<script async class="speakerdeck-embed" data-id="4b938d99415a416c8f908ac5302a66cb" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

Discussion of data types and type classes available in the library called Arrow for Kotlin.

#### GraphQL + Kotlin
<br/>
<script async class="speakerdeck-embed" data-id="2c9cef2676b7463499ab48d356c1cf12" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

GraphQL is a query language for APIs developed by Facebook. It allows you to retrieve only the data you need by sending a GraphQL query on the client side. In this talk, I will show you how you could integrate GraphQL with Kotlin on the server. I will demonstrate how to use the Java implementation of the GraphQL specifications with Kotlin extensions. Through examples, I will show the benefits of GraphQL versus a traditional REST API implementation.

### Kotlin London Meetup
----

#### gRPC Kotlin Coroutines
<br/>
{% include video id="V3BzDyQVeGw" provider="youtube" %}
<br/>

gRPC is a technology that allows you to call server side logic from any platform using protocol buffers. What are the libraries available that allow you to create and consume gRPC services using coroutines? What are the debugging and monitoring tools we could use for gRPC?

In this talk, I will share with you how to build a gRPC server using the gRPC-Kotlin library. We’ll explore how to use protocol buffers to define different types of rpc calls that are unary and bidirectional. On the client side, we’ll also use this library to consume our gRPC service. gRPC-Kotlin provides an API that uses Flows to make rpc calls. We’ll explore how it works internally. For each rpc call we implement using coroutines, I’ll show you how to unit test it.

In addition to gRPC Kotlin, other libraries for creating and consuming gRPC services are Wire by Square and Kroto-plus. We’ll compare its features and its coroutines API with gRPC-Kotlin. By the end of this talk, you will have a better understanding on how to build and consume gRPC services with Kotlin coroutines.

<script async class="speakerdeck-embed" data-id="6b5a4015397849959085664b3e807612" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

### Brooklyn Kotlin Meetup 
----

#### Channels & Flow in Practice
<br/>
<script async class="speakerdeck-embed" data-id="fade5cd679b04e92b8d25655c2397cb9" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

In this talk, Mohit will present on how to use constructs such as channels and flows in various use cases. These use cases are modeling streams that are hot or cold, multicasting, polling, handling errors and testing. A Channel is similar to a blocking queue or a subject from RxJava. There are different types of channels that fit different use cases. On the other hand, a Flow represents a cold stream. We’ll look at how they work and thier APIs for consuming and producing a stream. I also cover how to go by testing your code using the coroutines testing library that is provided. I’ll share various helper extensions that you could use to improve your testing. By the end of this talk, you will have expanded your toolset for solving problems using Coroutines.

#### Functional Programming in Kotlin
<br/>
<script async class="speakerdeck-embed" data-id="b010b0c6041c4912af8703167f0212b8" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

Functional programming is in fashion today even though it has been around since the 1940s. We will look at the principles of functional programming and how they can applied with Kotlin. Functional programming has many techniques such as composition, currying and partial application. It also provides structures such as Monads. How do we apply these techniques and structures with Kotlin? Kotlin is not a purely functional language like Haskell. It is a multi-paradigm language. But, we will see how we could build reusable functional constructs in Kotlin that languages like Haskell provide. Even though Android and Backend apps are written following an OOP paradigm, you could still apply many of the techniques of functional programming to build consistent and testable applications.

### San Diego Kotlin Meetup
----

#### Unit testing Kotlin Channels & Flows
<br/>
{% include video id="h8bLIUi6HWU" provider="youtube" %}
<br/>

<script async class="speakerdeck-embed" data-id="8f8168837a0b4aa4aff30f99a7d45f0f" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

Unit testing Channels and Flows can be a challenge as they are fairly new. In this talk, I will share with you how to implement and test practical examples from my experience. These examples are testing delays, retries, and errors. I'll also share testing more complex examples such as polling. For each use case, we'll look at how to use features in the coroutines library such as runBlockingTest and TestCoroutineDispatcher. From my journey of using and testing Flows in production, I'll share the challenges I experienced.


### Android NYC Meetup
----

#### Unit testing Kotlin Channels & Flows
<br/>
<script async class="speakerdeck-embed" data-id="f5bbba31146a4f6c92feed435f6bbde8" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

Mohit will share with you best practices for testing Channels and Flows. He will show practical use cases where we have to handle retries, errors and delays. For each of these scenarios, he will show you patterns to use for testing. We will look at features of the coroutine testing library such as advancing time forward. We will also look at ways to do assertions on a Flow.

#### Coroutines in Practice
<br/>
<script async class="speakerdeck-embed" data-id="46e01fc77b0d474bb1d5052e7dae7e98" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

To implement asynchronous logic, many devs use RxJava. But, Kotlin provides us with another toolset called Coroutines. I have been integrating Coroutines at Vimeo. In this talk, I will share with you my journey and the challenges I encountered. We will look at how to handle simple to complex uses cases with Coroutines. Some of these use cases are bridging a callback based SDK to coroutines, using Coroutines with MVP, handling polling and writing tests. I'll also show the usage of actors, channels and supervisor scope in real examples. Please join me to learn about my ongoing journey to introduce coroutines in an app.
