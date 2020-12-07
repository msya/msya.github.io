---
title: "Apollo Android GraphQL Flow Bindings"
excerpt: "In this blog post, we'll explore how the Apollo-Android library gives you the ability to use Flows when making queries. The library provides a coroutines integration module. How does the module bridge to Flows? Let's explore in this article."
date: 2020-12-05
header:
   teaser: "/assets/images/apollo-android-graphql-flow-bindings/apollo-android-graphql-flow-bindings.png"
categories:
  - coroutines
  - graphql
tags:
  - coroutines
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

Author: Mohit Sarveiya [Google Developer Expert Kotlin](https://developers.google.com/community/experts/directory/profile/profile-mohit_sarveiya)

In this blog post, we'll explore how the [Apollo-Android](https://github.com/apollographql/apollo-android) library gives you the ability to use Flows when making queries. The library provides a [coroutines integration](https://github.com/apollographql/apollo-android/tree/main/apollo-coroutines-support) module. How does the module bridge to Flows? Let's explore in this article. 

## GraphQL Query with Callbacks

The first step to making a GraphQL query with Apollo-Android is to create an [Apollo Client](https://github.com/apollographql/apollo-android/blob/main/apollo-runtime/src/main/java/com/apollographql/apollo/ApolloClient.java). The library provides a builder to create the client. 

```kotlin
val client: ApolloClient = ApolloClient.builder()
      .serverUrl("url")
      .build()

```

We set a URL to the GraphQL server and retrieve an instance of our client. The second step is to supply a query to the client. Assume we have a query specified. 

```kotlin
val testQuery = TestQuery.builder().build()

client.query(testQuery).enqueue(
    
    object : ApolloCall.Callback<T>() {

        override fun onResponse(response: Response<T>) {
            ...
        }
        override fun onFailure(e: ApolloException) {
            ...
        }
        override fun onStatusEvent(event: ApolloCall.StatusEvent) {
            ...
        }
    })

```

In the code snippet above, I call the query method and enqueue a callback to get the request's result. Each method in the callback informs us about different types of information. The `onFailure` method will tell us of a thrown exception while making a request. The library will call the `onStatusEvent` status changes such as scheduled, completed, and whether the data came from the cache or network. See the [Apollo Call](https://github.com/apollographql/apollo-android/blob/main/apollo-runtime/src/main/java/com/apollographql/apollo/ApolloCall.java#L155) class for a list of status events. 

## Bridge Apollo Callback to Flow

How does the library allow you to make queries using Flows? The library uses [callbackFlow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html) provided by the Kotlin coroutines library to provide a bridge from the callback shown above to Flows. 

### Callback Flow

The documentation for the [callbackFlow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html) method states, 

> "Creates an instance of a cold [Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/index.html) with elements that are sent to a [SendChannel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/index.html) provided to the builder's [block](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html#kotlinx.coroutines.flow$callbackFlow(kotlin.SuspendFunction1((kotlinx.coroutines.channels.ProducerScope((kotlinx.coroutines.flow.callbackFlow.T)), kotlin.Unit)))/block) of code via [ProducerScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-producer-scope/index.html). It allows elements to be produced by code that is running in a different context or concurrently."

See below how the Apollo Client uses `callbackFlow`. 

```kotlin
fun <T> ApolloCall<T>.toFlow() = callbackFlow {
    clone().enqueue(
        object : ApolloCall.Callback<T>() {
             override fun onResponse(response: Response<T>) {
                  runCatching {
                     offer(response)
                  }
             }

            override fun onFailure(e: ApolloException) {
                   close(e)
            }

            override fun onStatusEvent(event: ApolloCall.StatusEvent) {
                   if (event == ApolloCall.StatusEvent.COMPLETED) {
                      close()
                  }
            }
        }
     )
     awaitClose { this@toFlow.cancel() }
}

```
Source: [Apollo Android's Coroutines Extensions](https://github.com/apollographql/apollo-android/blob/main/apollo-coroutines-support/src/main/kotlin/com/apollographql/apollo/coroutines/CoroutinesExtensions.kt)

The library provides the `toFlow` extension above on the Apollo Client. As we did earlier, inside the method, the client enqueues an Apollo Callback. It does so inside callbackFlow. Callback Flow provides a channel to send data inside a producer coroutine scope. Anytime a method in Apollo Callback is invoked, an operation is performed on the channel. 

The `onResponse` method sends data to the callback flow's channel via the channel's offer method. The `onFailure` method and completed status event close the channel. Lastly, the `awaitClose` function keeps the flow running. Otherwise, invoking the callback will close the channel. 

__The More You Know!__<br/><br/> In the implementation above, the channel's offer method is used to send the returned result. The call to offer method is wrapped around a try and catch. This is due to an known issue in the Kotlin coroutines library. See [SendChannel.offer should never throw](https://github.com/Kotlin/kotlinx.coroutines/issues/974). At times, calling offer causes a `JobCancellationException` to surface to the client.
{: .notice--warning}

### Usage

The `toFlow` method returns a Flow upon which we could apply operators, handle retries, and errors. 

```kotlin
val client: ApolloClient = ApolloClient.builder()
      .serverUrl("url")
      .build()

val query = TestQuery.builder().build())

val flow = client.query(query).toFlow()

```

### Flow Retries

Flow has operators to handle retries and errors. The [retry](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/retry.html) extension on a Flow allows you to specify the number of retries to perform and a condition to determine when to perform a retry.

```kotlin
client
    .query(query)
     .toFlow()
     .retries(2) { throwable ->

      }

```

The first parameter to the retry block is the number of retries to perform. The second parameter gives you a throwable to specify if you want to do a retry on a specific exception. 

### Flow Errors

If an exception occurs, the [catch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) Flow extension can intercept it. 

```kotlin
client
    .query(query)
     .toFlow()
     .catch { throwable ->

      }

```

The catch operator provides a [FlowCollector](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/) that allows you to emit a wrapper type when an exception occurs. 

Using the coroutines integration module in Apollo Android's library provides you the benefit of using these operators. 

## How Apollo Flow Binding Evolved

The strategy to bridge from [ApolloCallback](https://github.com/apollographql/apollo-android/blob/main/apollo-android-support/src/main/java/com/apollographql/apollo/ApolloCallback.java) to Flows has evolved in the previous releases of the library. Previously, the library provided an API that gives you a Channel or a Flow when making a query. Let's look at the initial implementation of the `toChannel` and `toFlow` method in the library.

### Channel Extension

An earlier version of the library provided a `toChannel` method to read results. 

```kotlin
class ChannelCallback<T>(
   val channel: Channel<Response<T>>
) : ApolloCall.Callback<T>() {   

     override fun onResponse(response: Response<T>) {   
         channel.offer(response)  
     }  
 
      override fun onFailure(e: ApolloException) {   
          channel.close(e)   
      }  
 
      override fun onStatusEvent(event: ApolloCall.StatusEvent) {  
          if (event == ApolloCall.StatusEvent.COMPLETED) {   
            channel.close()  
          }
      }
}

fun <T> ApolloCall<T>.toChannel(): Channel<Response<T>> {  
  
      checkCapacity(capacity)  
      val channel = Channel<Response<T>>(capacity)   
 
      channel.invokeOnClose {  
         cancel()   
      }  
  
      enqueue(ChannelCallback(channel))  
      return channel   
}

```
Source: [Apollo Android's Early Channel Extension](https://github.com/apollographql/apollo-android/commit/df09d73d9a646b1a7b21cee34d11cc218fa60cac#diff-427eb30a188aa64486730dfb36452ebfde8a53f1e2ef5b54185236447a1138f2R53)

The approach is similar to using the callbackFlow method we saw earlier. The `toChannel` method enqueues a callback which communicates with a channel to send data. However, in this case, the channel is created manually and given to the callback. 

You could get the results of the request by using the [receive](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-receive-channel/receive.html) method on a channel. 

```kotlin
val channel = client
    .query(query)
    .toChannel()

val response = channel.receive()

```

### Flow Extension

The initial implementation also had a variant of the `toFlow` extension on the Apollo Client.

```kotlin
fun <T> ApolloQueryWatcher<T>.toFlow(capacity: Int) = flow {   
  
    checkCapacity(capacity)  
    val channel = Channel<Response<T>>(capacity)   
  
     enqueueAndWatch(ChannelCallback(channel = channel))  
  
     try {  
        for (item in channel) {  
           emit(item)   
        }  
     } finally {  
        cancel()
     }
}

```
Source: [Apollo Android's Early Flow Extension](https://github.com/apollographql/apollo-android/commit/ab63da714731ff3f83ec359dc8bec77656dbd7e3#diff-427eb30a188aa64486730dfb36452ebfde8a53f1e2ef5b54185236447a1138f2R51)

This implementation doesn't use a `callbackFlow`. It creates a Flow using the flow builder. It reads from a channel inside a loop to read the results and emit them to the flow. 

As we could see, the approaches for bridging from Apollo Callback to Flow has evolved, and it has gotten straightforward as the Kotlin coroutines library has added more features. The `callbackFlow` makes it easier to bride callbacks to Flows. 

## Summary

- Use a callbackFlow to bridge callbacks to Flows

- CallbackFlow method launches a coroutine on a producer scope and provides a 
  channel to send data from the callback. 

- Converting to a Flow gives you the benefits of using its extensive operators 
  for retries, errors, or mapping operators.

## Resources

- [Apollo Android Library](https://github.com/apollographql/apollo-android)

- [Callback Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html)

- [Flow Operators](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/index.html)

- [Building a GraphQL server with Kotlin](https://speakerdeck.com/heyitsmohit/graphql-with-kotlin)

