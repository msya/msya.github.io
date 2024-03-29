---
title: "Kotlin London Meetup - gRPC Kotlin Coroutines"
excerpt: "August 05, 2020 - In this talk, I will share with you how to build a gRPC server using the gRPC-Kotlin library. We’ll explore how to use protocol buffers to define different types of rpc calls that are unary and bidirectional."
layout: single
classes: wide
author_profile: true
---

gRPC is a technology that allows you to call server side logic from any platform using protocol buffers. What are the libraries available that allow you to create and consume gRPC services using coroutines? What are the debugging and monitoring tools we could use for gRPC?

In this talk, I will share with you how to build a gRPC server using the gRPC-Kotlin library. We’ll explore how to use protocol buffers to define different types of rpc calls that are unary and bidirectional. On the client side, we’ll also use this library to consume our gRPC service. gRPC-Kotlin provides an API that uses Flows to make rpc calls. We’ll explore how it works internally. For each rpc call we implement using coroutines, I’ll show you how to unit test it.

In addition to gRPC Kotlin, other libraries for creating and consuming gRPC services are Wire by Square and Kroto-plus. We’ll compare its features and its coroutines API with gRPC-Kotlin. By the end of this talk, you will have a better understanding on how to build and consume gRPC services with Kotlin coroutines.

**Video**

{% include video id="V3BzDyQVeGw" provider="youtube" %}

<br/>

**Slides**

<script async class="speakerdeck-embed" data-id="6b5a4015397849959085664b3e807612" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
