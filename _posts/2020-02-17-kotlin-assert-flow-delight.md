---
title: "Kotlin Flow Assert Delight"
date: 2020-03-01
categories:
  - coroutines
tags:
  - testing
layout: single
classes: wide
---

_Featured in [Kotlin Weekly #187](https://us12.campaign-archive.com/?u=f39692e245b94f7fb693b6d82&id=268ff90d99) & [Android Weekly #402](https://androidweekly.net/issues/issue-402)_

How do we assert items are being emitted from a Flow? We could use collect, single, toList extensions on a Flow. But, I found a nice pattern used in the SQL Delight library for Flow assertions. In this article, I will describe how this pattern works.

## Use Case

Let’s look at a simple example we could write a test for. The snippet below shows a repository that takes in an API service. The getUserDetails method uses the service to make a request to get UserDetails. The data is returned in a Flow. The example doesn’t have to be implemented with a Flow. However, for the sake of illustrating testing a Flow, I choose the simplest example possible.

```kotlin
class UsersRepository(private val apiService: ApiService) {

    fun getUserDetails(id: Int): Flow<UserDetails> {
        return flow {
            val userDetails = apiService.userDetails(id)
            emit(userDetails)
        }
    }
}
```

## Testing

Let’s write a test for this example. We want to test the Flow emits a `UserDetails` object.

```kotlin
@Test
fun `should get user details`() = runBlocking {
    val userDetails = UserDetails(
         id = 1,
         name = "User 1",
         address = "SF"
    )
    // Mock API Service
    val apiService = mock<ApiService>() {
        onBlocking { userDetails(id = 1) } doReturn userDetails
    }
    val repository = UsersRepository(apiService)
    // Test & Verify
    val flow: Flow<UserDetails> = repository.getUserDetails(1)
    flow.collect { data ->
        data shouldBeEqualTo userDetails
    }
}
```

I am creating a coroutine using the runBlocking method to run our test in. I have broken down this test into three steps which are mock, test and verify.

## Mocking

```kotlin
val userDetails = UserDetails(
         id = 1,
         name = "User 1",
         address = "SF"
    )
// Mock API Service
val apiService = mock<ApiService>() {
    onBlocking { userDetails(id = 1) } doReturn userDetails
}
```

I am using [mockito-kotlin](https://github.com/nhaarman/mockito-kotlin) that provides a lot of helpers for mocking and verifying. Using mock<ApiService>, I am mocking the API service and stubbing out theuserDetails method to return the UserDetails object.
The userDetails method is suspending. Mockito-Kotlin provides a method calledonBlocking that starts a coroutine using runBlocking and stubs the method for you.

## Testing & Assertion

```kotlin
val repository = UsersRepository(apiService)
val flow: Flow<UserDetails> = repository.getUserDetails(1)
flow.collect { data ->
    data shouldBeEqualTo userDetails
}
```

I am injecting the mocked API service into the repository and get the Flow by calling getUserDetails. I am collecting from the Flow and verifying the emission. I could also use the single extension on a Flow for this test.

This is a simple test. Let’s look at how we could perform the assertion on a Flow in a different way. The [SQL Delight library](https://github.com/cashapp/sqldelight) has an extension on a Flow called [test](https://github.com/cashapp/sqldelight/blob/master/extensions/coroutines-extensions/src/commonTest/kotlin/com/squareup/sqldelight/runtime/coroutines/FlowAssert.kt#L28). It gives you an API to collect items, errors and verify that nothing else has been emitted from your Flow. Although, it is not a standalone library current. It's a nice pattern to follow.

## Flow Assert

Here is a diagram of how the [test](https://github.com/cashapp/sqldelight/blob/master/extensions/coroutines-extensions/src/commonTest/kotlin/com/squareup/sqldelight/runtime/coroutines/FlowAssert.kt#L28) extension works.

![kotlin-flow-assert-arch](/assets/images/kotlin-flow-assert/kotlin-flow-assert-arch.png)

All the emissions from the flow you are testing a stored in an unlimited buffered Channel. An API is provided to you to query the channel in the test extension. You could query that there are no more emissions or an error was thrown.
Let’s look at the test extension implementation. Don’t worry about having to understand it all. I’m going to take you through it piece by piece

Let’s look at the test extension implementation. Don’t worry about having to understand it all. I’m going to take you through it piece by piece

```kotlin
suspend fun <T> Flow<T>.test(
         timeoutMs: Long = 1000L, 
         validate: suspend FlowAssert<T>.() -> Unit
) {
    coroutineScope {
        val events = Channel<Event<T>>(UNLIMITED)
        val collectJob = launch {
            val terminalEvent = try {
                collect { item ->
                    events.send(Event.Item(item))
                }
                Event.Complete
            } catch (_: CancellationException) {
                null
            } catch (t: Throwable) {
                Event.Error(t)
            }
            if (terminalEvent != null) {
                events.send(terminalEvent)
            }
            events.close()
        }
        val flowAssert = FlowAssert(events, collectJob, timeoutMs)
        val ensureConsumed = try {
            flowAssert.validate()
            true
        } catch (e: CancellationException) {
            if (e !== ignoreRemainingEventsException) {
                throw e
            }
            false
        }
        if (ensureConsumed) {
            flowAssert.expectNoMoreEvents()
        }
    }
}
internal sealed class Event<out T> {
    object Complete : Event<Nothing>()
    data class Error(val throwable: Throwable) : Event<Nothing>()
    data class Item<T>(val item: T) : Event<T>()
}
```
Source: [Flow Assert](https://github.com/cashapp/sqldelight/blob/master/extensions/coroutines-extensions/src/commonTest/kotlin/com/squareup/sqldelight/runtime/coroutines/FlowAssert.kt#L28)

The test extension is creating a coroutine with `coroutineScope` builder. The builder creates a coroutine that inherits the context of the parent coroutine.

```kotlin
suspend fun <T> Flow<T>.test(
         timeoutMs: Long = 1000L, 
         validate: suspend FlowAssert<T>.() -> Unit
) {
    coroutineScope { }
```

Inside this coroutine with `Channel<Event<T>>(UNLIMITED)`, we declare an unlimited buffered channel to store all the emissions. The type of stored items in this channel is an Event type which is a sealed class. This specifies whether an item was emitted, an error occurred or emission is complete.

```kotlin
suspend fun <T> Flow<T>.test(
         timeoutMs: Long = 1000L, 
         validate: suspend FlowAssert<T>.() -> Unit
) {
    coroutineScope {
        val events = Channel<Event<T>>(UNLIMITED)
    }
}
internal sealed class Event<out T> {
    object Complete : Event<Nothing>()
    data class Error(val throwable: Throwable) : Event<Nothing>()
    data class Item<T>(val item: T) : Event<T>()
}
```

A child coroutine is launched in the coroutineScope builder. In this coroutine, the flow is collected. If an item is emitted, it is sent to the channel. As this is an unlimited channel, the coroutine will not suspend itself when the send method is called. If an exception is thrown, it is caught and an error event is sent to the channel. After the collection, the channel is closed.

```kotlin
val collectJob = launch {
     val terminalEvent = try {
         collect { item ->
            events.send(Event.Item(item))
         }
         Event.Complete
       } catch (_: CancellationException) {
            null
       } catch (t: Throwable) {
           Event.Error(t)
       }
       if (terminalEvent != null) {
         events.send(terminalEvent)
       }
       events.close()
 }
```

After the Flow is collected, an instance of the FlowAssert is created. This is also the receiver of the lambda param of the test extension FlowAssert<T>.() -> Unit. This class provides an API to query the channel.

```kotlin
val flowAssert = FlowAssert(events, collectJob, timeoutMs)
```

Here are some of the methods the `FlowAssert` implements.

```kotlin
class FlowAssert<T> internal constructor(
    private val events: Channel<Event<T>>,
    private val collectJob: Job,
    private val timeoutMs: Long
) {
    
    ...
    suspend fun expectItem(): T {
        val event = withTimeout {
            events.receive()
        }
        if (event !is Event.Item<T>) {
            throw AssertionError("Expected item but was $event")
        }
        return event.item
    }

    suspend fun expectComplete() {
        val event = withTimeout {
            events.receive()
        }
        if (event != Event.Complete) {
            throw AssertionError("Expected complete but was $event")
        }
    }

    suspend fun expectError(): Throwable {
        val event = withTimeout {
            events.receive()
        }
        if (event !is Event.Error) {
            throw AssertionError("Expected error but was $event")
        }
        return event.throwable
    }
}
```
Source: [Flow Assert](https://github.com/cashapp/sqldelight/blob/master/extensions/coroutines-extensions/src/commonTest/kotlin/com/squareup/sqldelight/runtime/coroutines/FlowAssert.kt#L28)

Each method above is querying the events channel by calling the receive method on it. These methods could be used inside the test extension. This is an overview of how the test extension works. It's a good pattern used in the SQL Delight library.

## Usage

How do we modify our example I showed earlier to use this extension?

```kotlin
@Test
fun `should get user details`() = runBlocking {
     val userDetails = UserDetails(
             id = 1, 
             userName = "User 1", 
             city = "SF"
    )
    // Mock API Service
    val apiService = mock<ApiService>() {
        onBlocking { userDetails(id = 1) } doReturn userDetails
    }
    val repository = UsersRepository(apiService)
     // Test & Verify
    val flow: Flow<UserDetails> = repository.getUserDetails(1) 
    flow.test {
        assertEquals(expectItem(), userDetails)
        expectComplete()
    }
}
```

I am getting an emission with `expectItem` and performing an assertion. The `expectComplete` method ensures there were no more emissions.

How about testing errors? Let’s write a test for it.

```kotlin
@Test
fun `should throw error`() = runBlocking {
   
    // Mock
    val apiService = mock<ApiService>()
    whenever(apiService.userDetails()) doAnswer {
        throw IOException()
    }
    // Test and Verify 
    val repository = UsersRepository(apiService)
    val flow: Flow<UserDetails> = repository.getUserDetails()

    flow.test {
        assertThat(
            expectError(),     
            instanceOf(IOException::class.java)
        )
    }
}
```

In the test above, I have mocked the API service to throw an `IOException` when the `userDetails` method is called.

```kotlin
// Mock
val apiService = mock<ApiService>()
whenever(apiService.userDetails()) doAnswer {
     throw IOException()
}
```

When I call collect from the Flow, it will throw the exception and `Flow Assert` will catch it and add it as an event to its internal channel. I am querying the channel with the `expectError` method to verify an error was thrown.

```kotlin
// Test and Verify 
val repository = UsersRepository(apiService)
val flow: Flow<UserDetails> = repository.getUserDetails()

flow.test {
   assertThat(
       expectError(),     
       instanceOf(IOException::class.java)
   )
}
```

This is a pattern used in the SQL Delight library for Flow assertions. This test extension is not in a standalone library yet. There are improvements that could be made. But, there is an open [issue](https://github.com/cashapp/sqldelight/issues/1416) for it. Please contribute if you would like to do so.

If you have any issues and corrections, please let me know. Thanks for reading!
