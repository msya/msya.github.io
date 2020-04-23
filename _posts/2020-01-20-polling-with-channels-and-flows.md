---
title: "Polling with Kotlin Channels & Flows"
date: 2020-01-20
categories:
  - coroutines
tags:
  - polling
layout: single
classes: wide
---

In this article, I will explore how to implement and test polling with Channels and Flow. Prior to reading on, please check out this article for understanding the basics of coroutines.

## Problem

Suppose we would like to hit an endpoint every second and gather the data to display it in the UI. This use case fits many contexts such as continuously updating a live feed or updating scores for a sports event. How could we go about implementing this?

## Solution

The approach we could take is to create a poller that launches a coroutine that delays for a second, makes an API request and returns the data in a hot Flow. We want the polling to start only when there is a subscriber. Let’s dive into the implementation.

```kotlin
interface Poller {
   fun poll(delay: Long): Flow<Data>
   fun close()
}
```

I have created an interface with a `poll` and `close` method. Thepollmethod takes in a delay in milliseconds and returns a Flow for the given data. The `close` method stops the polling. The advantage of creating this interface is so that you could provide different implementations of polling if needed.

Let’s begin by creating a coroutine implementation of the poller.

```kotlin
class CoroutinePoller(
    val dataRepository: DataRepository,
    val dispatcher: CoroutineDispatcher
): Poller {

    override fun poll(delay: Long): Flow<Data> { ... }

    override fun close() { ... }

}
```

In this class, I am injecting a repository and a Dispatcher into the poller. The repository makes the request and gives us back the data. The purpose of the Dispatcher is to specify the thread pool the polling should occur on. It also allows me to inject a custom dispatcher for testing as we’ll see later.

## Using channelFlow

In order to implement the actual logic of polling, we need to launch a coroutine that iteratively delays, makes a request and emits data into a stream. We want this process to start when a client has subscribed to the stream. In order to do this, we will use the [channelFlow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/channel-flow.html) method provided by the coroutines library. It launches a coroutine and creates a channel that we could send items to.

```kotlin
class CoroutinePoller(
    val repository: DataRepository,
    val dispatcher: CoroutineDispatcher
): Poller {

    override fun poll(delay: Long): Flow<Data> {
        return channelFlow {
            while (!isClosedForSend) {
                val data = repository.getData()
                send(data)                 
                delay(delay)
            }
        }.flowOn(dispatcher)
    }

    override fun close() {
        dispatcher.cancel()
    }

}
```

In the `poll` method above, I am getting the data and sending it to the channel. This occurs on the injected Dispatcher by using the `flowOn` extension. I have added a polling delay after the request. The delay and request are happening repeatedly until the channel is closed for send. The polling is halted in the `close` method by invoking cancel on the injected Dispatcher.

## Error Handling

In this logic, how do we handle errors? We may want to log the error and continue polling. One way to handle this is to return an [Either](https://arrow-kt.io/docs/apidocs/arrow-core-data/arrow.core/-either/) type from the `getData` method. A Either type allows you to represent one of two types. In this case, it is an Exception or Data. [Arrow](https://github.com/arrow-kt) is a library that provides many functional data types like Either. It also provides useful extensions on the Either type.


```kotlin
class CoroutinePoller(
    val repository: DataRepository,
    val dispatcher: CoroutineDispatcher,
    val logger: Logger
): Poller {

    override fun poll(delay: Long): Flow<Data> {
        return channelFlow {
            while (!isClosedForSend) {
                delay(delay)
                val either = repository.getData()
                either.fold({ exception ->
                    logger.log(“Failed to get data”)
                }, {
                    send(data)
                })
            }
        }.flowOn(dispatcher)
    }
    override fun close() {
        dispatcher.cancel()
    }

}
```

In the `poll` method, we are using the `fold` extension on an Either which accepts two lambda parameters. The first lambda is invoked when an error occurs from the API request. We are logging the error in this scenario. In this use case, I am not halting the polling when an error occurs. I want to keep polling and only log the error. The second lambda is invoked when the request was successful. We are sending the data to the channel in this lambda.

## Testing

In order to test coroutines, you have to set up a test harness. We need to create and launch a coroutine under which our test code could run. A suspend method cannot be called from a regular method. There are two ways to go about setting up a test harness. One way is to use the `runBlocking` coroutine builder in each of your tests. The other way to test your code is to use the `runBlockingTest` method. This is provided by the [coroutine test library](https://github.com/Kotlin/kotlinx.coroutines/tree/master/kotlinx-coroutines-test). `runBlockingTest` is used for testing delays. The library gives you methods such as `advanceTimeBy` or `advanceTimeUntilIdl` to control the passage of time. In our use case, we have a delay of 1 second that we want to control.

Let’s test that our poller emits data every second.

```kotlin
class CoroutinePollerTest {

    val data = mock<Data>()
    val repository = mock<DataRepository>() {
        onBlocking { getData()  } doReturn data
    }
    val testDispatcher = TestCoroutineDispatcher()
    val poller = CoroutinePoller(repository, testDispatcher)

    @Test
    fun `should poll every second`() = runBlockingTest {
        val flow = poller.poll(1_000)

        launch {
            val dataList = flow.take(2).toList()
            assertEquals(dataList.size, 2)
        }

        testDispatcher.advanceTimeBy(2_000)

        poller.close()
    }
}
```

In this test, I am controlling the delay in the poller by calling `advanceTimeBy` on the injected Dispatcher. The `advanceTimeBy` method advances forward 2 seconds and two data items are emitted by the `channelFlow`. The test is using the take extension on the flow to only collect 2 items and store it in a list. We perform an assertion on the list’s size.

## Flow Assertions

[RxJava](https://github.com/ReactiveX/RxJava) has a useful test method on an Observable. The [SQLDelight](https://github.com/cashapp/sqldelight/blob/master/extensions/coroutines-extensions/src/commonMain/kotlin/com/squareup/sqldelight/runtime/coroutines/FlowExtensions.kt) library has a similar convenient test extension on a Flow. It would be very useful if it was in a standalone library. Here is how we would use it:

```kotlin
class CoroutinePollerTest {

    val data = mock<Data>()
    val repository = mock<DataRepository>() {
        onBlocking { getData()  } doReturn data
    }
    val testDispatcher = TestCoroutineDispatcher()
    val poller = CoroutinePoller(repository, testDispatcher)

    @Test
    fun `should poll every second`() = runBlockingTest {
        val flow = poller.poll(1_000)

        launch {
           flow.test {
             expectItem() assertEquals data
             expectItem() assertEquals data
             expectComplete()
           }
        }

        testDispatcher.advanceTimeBy(2_000)

        poller.close()
    }
}
```

The test extension on Flow launches a coroutine, collects from the flow, and sends the items to an unlimited channel. The channel’s type is an Event that is a sealed class. It defines whether a value was received from the flow, no more items were sent or an exception occurred. You could query this channel by calling `expectItem`, `expectError` and `expectComplete` methods. It makes your test cleaner to read.

This is how you could implement polling and add unit tests for it. If you have any questions or suggestions, please feel free to comment below.
