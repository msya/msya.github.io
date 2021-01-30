---
title: "Android Worldwide - gRPC with Kotlin Coroutines"
excerpt: "January 19, 2021 - Learn about how to consume a gRPC service on Android."
layout: single
classes: wide
author_profile: true
---

gRPC is a technology that allows you to call server side logic from any platform using protocol buffers. What are the libraries available that allow you to create and consume gRPC services using coroutines? What are the debugging and monitoring tools we could use for gRPC?

In this talk, I will share with you how to build a gRPC server using the gRPC-Kotlin library. We’ll explore how to use protocol buffers to define different types of rpc calls that are unary and bidirectional. On the client side, we’ll also use this library to consume our gRPC service. gRPC-Kotlin provides an API that uses Flows to make rpc calls. We’ll explore how it works internally. For each rpc call we implement using coroutines, I’ll show you how to unit test it.

{% include video id="3ARWVHKVBfk" provider="youtube" %}

<script async class="speakerdeck-embed" data-id="a22d32b355424d4ab13c022eb6c09554" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
