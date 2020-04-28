---
title: "Combining Kotlin Flows with Select Expressions"
date: 2020-03-01
categories:
  - coroutines
tags:
  - flow
layout: single
classes: wide
---

_Featured in [Android Weekly #405](https://androidweekly.net/issues/issue-405)_

How do we combine emissions from multiple Flows? We could use operators such as [zip](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/zip.html), [flattenMerge](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flatten-merge.html) and [combine](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/combine.html). This article will explore how to use the combine operator and how it works under the hood. Interestingly, it uses an [experimental](https://kotlinlang.org/docs/reference/experimental.html) construct called a [Select expression](https://kotlinlang.org/docs/reference/coroutines/select-expression.html). We will look at how the select expressions work and how they are used internally in the combine operator.

## Combining Flows

__Use Case__

Let’s start with a simple example of combing two streams together.

![flow-combine-1](/assets/images/flow-combine/flow-combine-1.png){: .align-center}

In the diagram above, we have two Flows that are emitting items at different times. The first Flow is emitting numbers 1, 2 and 3 every second. The second Flow is emitting letters A, B, and C every 2 seconds. How do we combine these emissions?

```kotlin
fun main() = runBlocking {
    val numbersFlow = flowOf(1,2,3).delayEach(1000)
    val lettersFlow = flowOf("A", "B","C").delayEach(2000)
    
    numbersFlow.combine(lettersFlow) { number, letter ->
         "$number$letter"
    }.collect {
        println(it)
    }
    
}
```

In the code snippet above, I have implemented our example of two Flows each emitting at different times.

```kotlin
val numbersFlow = flowOf(1,2,3).delayEach(1000)
val lettersFlow = flowOf("A", "B","C").delayEach(2000)
```

Let’s look at the signature of the [combine](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/combine.html) operator. It is an extension on Flow that takes as an argument another Flow to combine with. The second argument it accepts is a lambda which gives you values __a: T1__ and __b: T2__ that were emitted most recently both Flows. This lambda represents the transformation you want to perform on the emissions from both Flows.

```kotlin
Flow<T1>.combine(
    flow: Flow<T2>,
    transform: suspend (a: T1, b: T2) -> R
): Flow<R> (source)
```
Source: [Zip.kt](https://github.com/kotlin/kotlinx.coroutines/tree/master/kotlinx-coroutines-core/common/src/flow/operators/Zip.kt#L34)

This how we could use this operator for our example.

```kotlin
numbersFlow.combine(lettersFlow) { number, letter ->
    "$number$letter"
}.collect {
     println(it)
}

Output
1A 
2A 
3A 
3B 
3C
```

I have specified the transformation to concatenate the number and letter. We print out the result of the transformation when collecting from the Flow. Let’s understand why the combine operator produces this output.

![flow-combine-2](/assets/images/flow-combine/flow-combine-2.png){: .align-center}

### How combine operator works?

> The combine operator returns a Flow whose values are generated with transform function by combining the most recently emitted values by each flow

* The first two values emitted by the numbers and letters Flow is `1` and `A`, respectively. These two values are combined together to produce `1A`.

* The numbers Flow is first to emit as it emits faster than the letters Flow. It emits the value of `2`. At this point, the letters Flow is suspended. It hasn’t emitted anything. What will we combine with? We will combine with the letter Flow’s most recently _emitted value_ of `A`. This will produce `2A`.

![flow-combine-3](/assets/images/flow-combine/flow-combine-3.png){: .align-center}

* The letters Flow now emits the value of `3`. This will follow the same logic and it will combine with the _most recently emitted value_ of A. Thus producing `3A`.

![flow-combine-4](/assets/images/flow-combine/flow-combine-4.png){: .align-center}

* Finally, the letters Flow emits the value of `B` after delaying for 2 seconds. It will combine with the _most recently emitted_ value of `3` from the numbers Flow producing `3B`.

![flow-combine-5](/assets/images/flow-combine/flow-combine-5.png){: .align-center}

At this point, everything has been emitted from the numbers Flow. The final emission from the letters Flow is C. It is combined with `3` to get a value of `3C`.

![flow-combine-6](/assets/images/flow-combine/flow-combine-6.png){: .align-center}

This is the trace of how the emissions are combined from each Flow. Feel free to run the code above and familiarize yourself with the combine operator.

How does the combine operator listen to two Flows emitting at different rates? This is accomplished by using select expressions. They are experimental but they are used in the implementations of the zip and the combine operator. Let’s see how it works.

## Select Expressions

> A [select expression](https://kotlinlang.org/docs/reference/coroutines/select-expression.html) is a construct that allows you to listen to multiple suspending coroutines simultaneously.

### Use Case

Suppose we have two coroutines that are sending values to a Channel. `Producer 1`delays for 1 second and send a value while `Producer 2` delays for 2 seconds before sending a value. These coroutines are created by using the [produce](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/produce.html) builder. It provides a Channel for you to send values to it and gives you back a [RecieveChannel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-receive-channel/index.html) instance to read values.

```kotlin
fun CoroutineScope.producer1() = produce<String> {
    while (true) {
        delay(1000)
        send("Producer Item 1")
    }
}
fun CoroutineScope.producer2() = produce<String> {
    while (true) {
        delay(2000)
        send("Producer Item 2")
    }
}
```

We could receive values from _either_ of these producers as shown below.

```kotlin
val channel1: ReceiveChannel = producer1()
val channel2: ReceiveChannel = producer2()
val item1: String = channel1.receive()
val item2: String = channel2.receive()
```

But, suppose I want to receive values _simultaneously_ from either producer. In order to do this, we will need to use a Select expression.

A Select expression takes a lambda block which allows you to use _clauses_ inside of it to listen for values from multiple Channels.

```kotlin
inline suspend fun <R> select(
    crossinline builder: SelectBuilder<R>.() -> Unit
): R
```

Source: [Select]("https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.selects/select.html")

How do we create a select expression for our example?

```kotlin
val channel1: ReceiveChannel = producer1()
val channel2: ReceiveChannel = producer2()
select<Unit> {
    channel1.onReceive {
        println(it)
    }
    channel2.onReceive {
        println(it)
    }
}
```

Inside the select expression’s lambda, I am calling the [onReceive](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-receive-channel/on-receive.html) clause on both Channels. This clause can only be used from inside a select expression. Therefore, I am listening to emissions on both of these Channels _simultaneously_. The first value received from either Channel will be printed to the console.

Here is a full example that you could play with.

```kotlin
fun main() = runBlocking {
    
    val channel1 = producer1()
    val channel2 = producer2()
    repeat(10) {
        select<Unit> {
            channel1.onReceive {
                println(it)
            }
            channel2.onReceive {
                println(it)
            }
        }
    }
    coroutineContext.cancelChildren()
}
fun CoroutineScope.producer1() = produce<String> {
    while (true) {
        delay(1000)
        send("Producer Item 1")
    }
}
fun CoroutineScope.producer2() = produce<String> {
    while (true) {
        delay(2000)
        send("Producer Item 2")
    }
}
```

If you run this example, you will see that each execution of the select expression produces a new value that could be from either Channel.

## Flow Combine Implementation

Under the hood, the combine operator uses a select expression to listen to emissions from multiple Flows. Let’s look closely at the source to understand the implementation. Here is a diagram showing how it works.

![flow-combine-7](/assets/images/flow-combine/flow-combine-7.png){: .align-center}

Suppose we want to combine Flow A and Flow B.

1. Two producer coroutines are created for Flow A and Flow B.

2. A select expression is created to listen to the emission of both producers. The select expression runs until a value is received from both producers’ channels. These values emitted from both Flows are stored locally in variables.

3. When emissions are received from both producers, they are combined with the transformation that you specify.

4. Finally, the transformed value is given back to you in a new Flow that you could collect from.

These are the steps that are taken when you use the combine operator. Here is the source for these steps.

```kotlin
suspend fun <T1, T2, R> FlowCollector<R>.combineTransformInternal(
    first: Flow<T1>, second: Flow<T2>,
    transform: suspend FlowCollector<R>.(a: T1, b: T2) -> Unit
) {
    coroutineScope {
        val firstChannel = asFairChannel(first)
        val secondChannel = asFairChannel(second)
        var firstValue: Any? = null
        var secondValue: Any? = null
        var firstIsClosed = false
        var secondIsClosed = false
        while (!firstIsClosed || !secondIsClosed) {
            select<Unit> {
                onReceive(
                    firstIsClosed, 
                    firstChannel, 
                    { firstIsClosed = true }
                ) { value ->
                    firstValue = value
                    if (secondValue !== null) {
                        transform(...)
                    }
                }

                onReceive(
                    secondIsClosed, 
                    secondChannel, 
                    { secondIsClosed = true }
                ) { value ->
                    secondValue = value
                    if (firstValue !== null) {
                        transform(...)
                    }
                }
            }
        }
    }
}
```

Source: [Combine.kt](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/flow/internal/Combine.kt)

Lets breakdown this source to see the steps in action.

```kotlin
suspend fun <T1, T2, R> FlowCollector<R>.combineTransformInternal(
    first: Flow<T1>, second: Flow<T2>,
    transform: suspend FlowCollector<R>.(a: T1, b: T2) -> Unit
) {

}
```

This function is internal and private. It takes in two Flows and a transformation that you want to apply.

* Two producer coroutines are created for Flow A and Flow B.

```kotlin
suspend fun <T1, T2, R> FlowCollector<R>.combineTransformInternal(
    first: Flow<T1>, second: Flow<T2>,
    transform: suspend FlowCollector<R>.(a: T1, b: T2) -> Unit
) {
    coroutineScope {
        val firstChannel = asFairChannel(first)
        val secondChannel = asFairChannel(second)
    }
}
fun CoroutineScope.asFairChannel(
       flow: Flow<*>
): ReceiveChannel<Any> = produce {
    val channel = channel as ChannelCoroutine<Any>
    flow.collect { value ->
        return@collect channel.sendFair(value ?: NULL)
    }
}
```

A coroutine is created using the produce coroutine builder. It provides you with a Channel that you could send values emitted from a Flow. This is what the `asFairChannel` method is doing.

* A select expression is created to listen to the emission of both producers.

```kotlin
suspend fun <T1, T2, R> FlowCollector<R>.combineTransformInternal(
    first: Flow<T1>, second: Flow<T2>,
    transform: suspend FlowCollector<R>.(a: T1, b: T2) -> Unit
) {
    coroutineScope {
        val firstChannel = asFairChannel(first)
        val secondChannel = asFairChannel(second)
        var firstValue: Any? = null
        var secondValue: Any? = null
        var firstIsClosed = false
        var secondIsClosed = false
}
```

For each channel we store it’s emission into a variable and maintain whether it’s closed with a flag.

```kotlin
suspend fun <T1, T2, R> FlowCollector<R>.combineTransformInternal(
    first: Flow<T1>, second: Flow<T2>,
    transform: suspend FlowCollector<R>.(a: T1, b: T2) -> Unit
) {
    coroutineScope {
        val firstChannel = asFairChannel(first)
        val secondChannel = asFairChannel(second)
        var firstValue: Any? = null
        var secondValue: Any? = null
        var firstIsClosed = false
        var secondIsClosed = false
        while (!firstIsClosed || !secondIsClosed) {
            select<Unit> {
              ...
            }  
        }              
    }
}
```

Why is the select expression above in a while loop?

So, let’s recall the simple example we looked at for a select expression. You will find that it completes execution when one of the Channels you are listening to emits a value. Depending on the rate of the emissions from the Channels, you may get value from either the first or second Channel in any order. Therefore, we have variables `firstValue` and `secondValue` to store the emitted value. Since we need the first emission from both Channels, the select expression is run until either Channel is closed to ensure we read from both Channels.

* When items are received from both producers, they are combined with the transformation that you specify.

```kotlin
while (!firstIsClosed || !secondIsClosed) {
      select<Unit> {
          onReceive(...) { value ->
              firstValue = value
               if (secondValue !== null) {
                   transform(...)
               }
           }

           onReceive(...) { value ->
               secondValue = value
               if (firstValue !== null) {
                        transform(...)
               }
            }
        }
    }
}
fun SelectBuilder<Unit>.onReceive(
    ...,
    channel: ReceiveChannel<Any>,
    ...,
    onReceive: suspend (value: Any) -> Unit
) {
    if (isClosed) return
    channel.onReceiveOrNull {
        if (it === null) onClosed()
        else onReceive(it)
    }
}
```

How are values read in from the Channels in the select expression?

`onReceiveOrNull` is a select clause on Channel. It is being used to read the value emission from the channel above in the `onReceive`. If there are no more emissions from the Flow, the channel is closed. The emitted values are stored in the variables `firstValue` and `secondValue`. These values are used to apply the transformation you had specified.

* Finally, the transformed value is given back to you in a new Flow that you could collect from.

```kotlin
fun <T1, T2, R> Flow<T1>.combine(
   flow: Flow<T2>, 
   transform: suspend (a: T1, b: T2) -> R
): Flow<R> = flow {
    combineTransformInternal(this@combine, flow) { a, b ->
        emit(transform(a, b))
    }
}
```

Source: [Zip.kt](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/flow/operators/Zip.kt)

As you could see in the code snippet above, the combine operator calling the internal method I showed above. It creates a new Flow and emits the transformed values.

This is how the combine operator uses select expressions internally. Although they are experimental, when you look under the hood, they are used in many places. Furthermore, the combine operator is very useful in many use cases such as implementing an MVI architecture. Understanding how combine works internally is valuable when debugging and testing.

I hope this article was helpful. If you have any questions, feel free to respond to this article.

