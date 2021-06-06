---
title: "Learning State & Shared Flows with Unit Tests"
excerpt: "Learn about all of the features of State & Shared Flows."
date: 2021-06-06
header:
   teaser: "/assets/images/learning_state_and_shared_flows_with_tests/learning_state_and_shared_flows_with_tests.jpeg"
categories:
  - coroutines
tags:
  - flows
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

State and shared Flows are hot streams that can propagate items to multiple consumers. State Flows have features such as sharing strategies and conflation. Whereas, shared flows allow you to replay and buffer emissions. In this article, we will explore features of shared and state flows with unit testing.

## State Flow

__Problem__

The most common task in Android is to manage and propagate state. Suppose, we had a setup of a View Model that communicates with a view. We could use LiveData to communicate state changes to the view. However, a State Flow is an alternative that is provided by the coroutines library. 

![stateflow-diagram-1](/assets/images/learning_state_and_shared_flows_with_tests/stateflow-diagram-1.jpeg)

How do we set up a StateFlow?

```kotlin
val stateFlow = MutableStateFlow(UIState.Success())
```

The MutableStateFlow method takes a default value in its constructor. In this case, it is an instance of a success state. I have defined the UIState as a sealed class. You could have the Success type as a class and add any data for your use case.

```kotlin
sealed class UIState {
   object Success: UIState()
   object Error: UIState()
}
```

How do we emit to the state flow?

```kotlin
stateFlow.emit(UIState.Error)
```

### State Flow Collection

Let’s look at simple unit tests to learn about the behavior of a MutableStateFlow. 

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

@Test
fun `should emit default value`() = runBlockingTest {
     stateFlow.test {
        expectItem() shouldBe UIState.Success
     }
}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

### Test Setup

The `runBlockingTest` method creates a coroutine. It is the subscriber of the state flow. 

![stateflow-diagram-2](/assets/images/learning_state_and_shared_flows_with_tests/stateflow-diagram-2.jpeg)

I will use the [Turbine library](https://github.com/cashapp/turbine) by Square to verify emissions from the flow.  The library provides a `test` extension that internally launches a coroutine and collects from the flow. It provides methods such as `expectItem`, `expectError` and `expectComplete` to verify different events when collecting from a flow.

This test will succeed. When we collect from the state flow using the `test` extension, it will emit a successful UI state which is the default value. However, does the flow complete?

### State Flow Completion

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

  @Test
  fun `should emit default value`() = runBlockingTest {
       stateFlow.test {
          expectItem() shouldBe UIState.Success
          expectComplete()
       }
}
```

The test fails when we attempt to verify the flow has completed emitting everything by using the `expectComplete` method. This is the error you will see in the test result. 

![failed-test](/assets/images/learning_state_and_shared_flows_with_tests/failed-test.png) Test Failed <br/><br/> Timed out waiting for 1000 ms kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 1000 ms 
{: .notice--danger}

The unit test failed with a timed out exception. The coroutine launched by the test extension times out waiting for an emission from the state flow. 

![stateflow-diagram-3](/assets/images/learning_state_and_shared_flows_with_tests/stateflow-diagram-3.jpeg)


### State Flow Never Completes

A call to [Flow.collect] on a state flow never completes normally, and neither does a coroutine started by the [Flow.launchIn] function.
{: .notice--info}

Let’s look at another example of consuming a state flow. This example is not a unit test. 

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

fun main() = runBlocking {
   stateFlow
       .onCompletion { println("ON COMPLETE") }
       .collect {
           println(it)
       }
}
```

__Output__<br/><br/>
UIState.Success
{: .notice--success}

In this example, I am logging the completion and collection of a StateFlow. The completion will never be logged, because the flow never completes. But, what happens if I add this logging to my unit test?

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

@Test
fun `should emit default value`() = runBlockingTest {
    stateFlow
        .onCompletion { println("ON COMPLETE") }
        .test {
            expectItem() shouldBe UIState.Success
        }
}
```

__Output__<br/><br/>
ON COMPLETE
{: .notice--success}

Why does it log the completion in this unit test? The flow completes exceptionally in this example. If you look under the hood in the Turbine library, the `test` extensions launch a coroutine to collect from the state flow. The coroutine’s job is cancelled in the `test` extension.

```kotlin
fun <T> Flow<T>.test(
 timeout: Duration = Duration.seconds(1),
 validate: suspend FlowTurbine<T>.() -> Unit
) {
        coroutineScope {
            val events = Channel<Event<T>>(UNLIMITED)

            val collectJob = launch(UNDISPATCHED, Unconfined) {
            val terminalEvent = try {
                collect { item ->
                    events.send(Event.Item(item))
                }

            val flowTurbine = ChannelBasedFlowTurbine(events, collectJob, timeout)
            flowTurbine.cancel()
        }


class ChannelBasedFlowTurbine<T>(…, val collectJob: Job, …,) : FlowTurbine<T> {

    override suspend fun cancel() {
          collectJob.cancel()
    }
}
```
Source: [Turbine Library](https://github.com/cashapp/turbine/blob/56e222422b3ac49fdb7f6c89021094d76138f4a9/src/commonMain/kotlin/app/cash/turbine/FlowTurbine.kt#L51)

The flow in this example doesn’t complete normally.

### Conflation

How do you emit to a state flow? We send an item to a state flow by calling the `emit` method on the flow. Here is a unit test where we are emitting the error state and listening to the flow. We are asserting whether we get the default state and the emitted item. Let’s see what happens when we run our unit test. 

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

   @Test
   fun `should emit default value`() = runBlockingTest {
        stateFlow.emit(UIState.Error)
        stateFlow.test {
            expectItem() shouldBe UIState.Success
            expectItem() shouldBe UIState.Error
        }
    }
}
```

![failed-test](/assets/images/learning_state_and_shared_flows_with_tests/failed-test.png) Test Failed <br/><br/> Expected `<UIState.Success>`, actual `<UIState.Error>` are not the same instance.
{: .notice--danger}

The unit test fails, because the default value is conflated. Only the most recent item is cached in the state flow and emitted to the subscriber. Here is the passing test. 

```kotlin
val stateFlow = MutableStateFlow<UIState>(UIState.Success)

    @Test
    fun `should emit default value`() = runBlockingTest {
        stateFlow.emit(UIState.Error)
        stateFlow.test {
            expectItem() shouldBe UIState.Error
        }
    }
}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

## Cold Stream vs Hot Stream

Before we move forward discussing state flows, let’s look at what is a cold flow and a hot flow with a unit test.

### Cold Stream

What is a cold stream? A cold stream is a flow that triggers the same code every time it is collected. 

```kotlin
val coldFlow = flowOf(1, 2, 3).map { it + 1 }

@Test
fun `should emit from cold flow`() = runBlockingTest {
   coldFlow.test {
       expectItem() shouldBeEqualTo 2
       expectItem() shouldBeEqualTo 3
       expectItem() shouldBeEqualTo 4
       expectComplete()
   }

   coldFlow.test {
       expectItem() shouldBeEqualTo 2
       expectItem() shouldBeEqualTo 3
       expectItem() shouldBeEqualTo 4
       expectComplete()
   }
}
```

In this example, we have a flow that emits numbers 1, 2 and 3. A map operator is applied to it to increment each value. We’re collecting from the flow two times. Each time we collect from the flow, the emission is started again and the map operator is applied. 

### Hot Stream

What is a hot flow? A hot flow is a stream whose active instance exists independently of the presence of collectors. A state flow and a shared flow are examples of hot flows. We could convert a cold flow into state or shared flow in different ways. 

## Convert Cold Flow to State Flow

The stateIn extension allows us to convert a cold flow to a state flow. Assume we had a simple cold flow that emitted two strings. 


```kotlin
val flowOfEvents = flowOf(
     "Event 1", 
     "Event 2"
)

fun <T> Flow<T>.stateIn(
     scope: CoroutineScope
): StateFlow<T>

```

The `stateIn` method takes in a scope to start the cold flow. 

```kotlin
@Test
fun `convert cold flow to state flow`() = runBlockingTest {
   val stateFlow = flowOfEvents.stateIn(this)

   stateFlow.test {
       expectItem() shouldBeEqualTo "Event 2"
   }

   stateFlow.test {
       expectItem() shouldBeEqualTo "Event 2"
   }
}
```

In this unit test, the stateIn method is given the test coroutine scope which is created by runBlockingTest. We have two subscribers listening to the state flow. The most recent value emitted by the upstream flow which is the string “Event 2” is emitted by the state flow. 

## Shared Flow

A shared flow is also a hot flow that features such as replaying and buffering. 

How do you set a shared flow?

```kotlin
val sharedFlow = MutableSharedFlow<String>()
```

Unlike a state flow, the share flow doesn’t need a default value. The shared flow can be given a replay cout, buffer capacity or buffer overflow capacity. 

### Shared Flow Collection

```kotlin
val sharedFlow = MutableSharedFlow<String>()

@Test
fun `collect from shared flow`() = runBlockingTest {
   val job = launch(start = CoroutineStart.LAZY) {
       sharedFlow.emit("Event 1")
   }

   sharedFlow.test {
       job.start()
       expectItem() shouldBeEqualTo "Event 1"
   }
}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

In this test, we have a coroutine that is launched lazily which emits a string. It is started lazily, because the replay count is 0. If I emit before subscribing to the shared flow, it would emit anything with a replay count of 0. We start collecting from the shared flow and emit something to it. We verify that we get the string “Event 1”. 

Here is the failing unit test where the producer coroutine that emits to the shared flow wasn’t launched lazily. 

```kotlin
val sharedFlow = MutableSharedFlow<String>()

@Test
fun `collect from shared flow`() = runBlockingTest {
   sharedFlow.emit("Event 1")

   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 1"
   }
}
```

![failed-test](/assets/images/learning_state_and_shared_flows_with_tests/failed-test.png) Test Failed <br/><br/>kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 1000 ms
{: .notice--danger}

The coroutine launched by the `test` extension will fail waiting for emission. The consumer subscribed to the shared flow.

### Replay Count

We could set up a replay count in the shared flow to pass the previous test. A replay count specifies how many previous emissions to replay to any subscribers. 

```kotlin
val sharedFlow = MutableSharedFlow<String>(replay = 1)

@Test
fun `collect from shared flow`() = runBlockingTest {
   sharedFlow.emit("Event 1")

   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 1"
   }
}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

In this test, the shared flow has a replay count of 1. The previous emission “Event 1” was sent to the new subscriber launched with the `test` extension. 

## Sharing Strategies

We could convert cold flows to hot flows using the `shareIn` operator. The shareIn operator takes in three arguments.

```kotlin
fun <T> Flow<T>.shareIn(
   scope,   ----> The coroutine scope in which sharing is started
   started, ----> Sharing Policy
   replay ----> The number of values replayed to new subscriber
)
```

There are three different strategies you could apply. 

### While Subscribed

Assume we want to convert the following colf flow to a shared flow. 

```kotlin
val flow = flowOf(
   "Event 1",
   "Event 2",
   "Event 3"
)
```

The behavior of the `SharingStarted.WhileSubscribed` strategy is to start upstream when a subscriber is present and it will stop after the last subscriber disappears. Let’s explore this behavior with unit tests. 

```kotlin
@Test
fun `collect with while subscribed strategy`() = runBlockingTest {
   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
        .onStart { println("ON START") }
        .shareIn(
            sharingScope,
            SharingStarted.WhileSubscribed(),
            1
         )
}
```

When we run this test, you’ll see that the statement in the `onStart` method is not logged. Since we don’t have a subscriber the flow hasn't started. 

```kotlin
@Test
fun `collect with while subscribed strategy`() = runBlockingTest {

   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
        .onCompletion { println("SHARED FLOW COMPLETED") }
        .shareIn(
            sharingScope,
            SharingStarted.WhileSubscribed(),
            1
        )


   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 1"
       expectItem() shouldBeEqualTo "Event 2"
       expectItem() shouldBeEqualTo "Event 3"
   }

}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

The shared flow will complete, because the test subscriber is cancelled internally. This test will pass.

### Eagerly

The `SharingStarted.Eagerly` strategy starts the upstream flow even where there are no subscribers and never stops. 

```kotlin
@Test
fun `collect with eager strategy`() = runBlockingTest {
   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
       .onStart { println("ON START") }
       .shareIn(
               sharingScope,
               SharingStarted.Eagerly,
               1
           )
}
```

__Output__<br/><br/>
ON START
{: .notice--success}


```kotlin
@Test
fun `collect with eager strategy`() = runBlockingTest {
   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
       .shareIn(
       sharingScope,
       SharingStarted.Eagerly,
       1
   )

   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 3"
   }
}
```


![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed 
{: .notice--success}

In this test, we’re verifying the item emitted by the shared flow is the string “Event 3”. Since the flow starts eagerly and it is a hot flow, the collection will not start from the beginning. By the time we subscribe to the shared flow, it will have emitted “Event 3”. 

### Lazily

A lazily sharing strategy starts the upstream flow when the first subscriber appears. This behavior is similar to the while subscribed strategy. However, the lazily behavior never stops the upstream flow. 

Let’s run the test above with the lazily strategy. 

```kotlin
@Test
fun `collect with eager strategy`() = runBlockingTest {
   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
       .onStart { println("ON START") }
       .onCompletion { println("SHARED FLOW COMPLETED") }
       .shareIn(
       sharingScope,
       SharingStarted.Lazily,
       1
   )

   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 3"
   }
}
```

![failed-test](/assets/images/learning_state_and_shared_flows_with_tests/failed-test.png) Test Failed <br/><br/>java.lang.AssertionError: Expected `<Event 3>`, actual `<Event 1>`.
{: .notice--danger}

The assertion will fail this time. When the test extension begins to execute, the shared flow will have its first subscriber. It will emit the item which is “Event 1”.

Here is the passing test. 

```kotlin
@Test
fun `collect with eager strategy`() = runBlockingTest {
   val sharingScope = TestCoroutineScope()

   val sharedFlow = flow
       .shareIn(
               sharingScope,
               SharingStarted.Lazily,
               1
           )

   sharedFlow.test {
       expectItem() shouldBeEqualTo "Event 1"
       expectItem() shouldBeEqualTo "Event 2"
       expectItem() shouldBeEqualTo "Event 3"
   }
}
```

![check-arrow](/assets/images/learning_state_and_shared_flows_with_tests/check-arrow.png) Tests Passed
{: .notice--success}

## Conclusion

We went over features of a state flow and shared flow with unit tests. We looked at how to set up a state flow and how to emit items to it. We look at conflation with various unit tests. We also looked at how to set up a shared flow. I hope it was helpful for you. 

## Resources

- [State Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/)
- [Shared Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/)
- [StateFlow and SharedFlow on Android](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
