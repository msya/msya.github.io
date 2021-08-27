---
title: "Shared Mutable State with Kotlin & Swift"
excerpt: "Learn about how to handle shared mutable state in Kotlin and Swift."
date: 2021-08-24
header:
   teaser: "/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image.jpeg"
categories:
  - coroutines
tags:
  - kotlin
  - swift
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this article, we’ll explore how to handle shared mutable state in Kotlin and Swift. The coroutines library provides features such as mutex and actors to handle synchronizing state updates. We’ll dive deep into approaches for using these features. On the other hand, we’ll look at how to handle the same problem with the introduction of actors in Swift 5.5.

## Problem

Assume we wanted to build an app that displayed a counter and had two buttons to increment and decrement it. 

![shared-mutable-state-1](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_1.png){: .align-center}

Suppose we had the following constraints to increment and decrement the counter.

- Both increment and decrement operation should occur after a delay of 5 seconds.

- The order in which the user clicks on the increment and decrement button should be applied to the value. For example, if the user clicks on the increment button 5 times and then decrements the counter. The first 5 increment operation should be applied first followed by the last decrement operation.


![shared-mutable-state-2](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_2.png){: .align-center}


This diagram illustrates that the user has clicked on the increment button three times. Each operation should be implemented in order.

![shared-mutable-state-3](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_3.png){: .align-center}


Lastly, the user clicked on the decrement button which is an operation that should occur after the previous three increments. 


## Solutions

How do we approach this problem with Kotlin and Swift? In Kotlin, we could use actors or a mutex. In Swift, we could use a Dispatch Queue or Swift 5.5 features of Tasks and Actors. 

### Kotlin

The UI can be built using Jetpack Compose. In the code snippet below, the composable function displays two buttons for incrementing and decrementing the counter. It also displays a TextView with current value. 

#### Jetpack Compose

```kotlin
@Composable
fun CounterView(
   counterValue: Int,
   onIncrease: () -> Unit,
   onDecrease: () -> Unit
) {
   Row(
       modifier = Modifier.fillMaxSize(),
       verticalAlignment = Alignment.CenterVertically,
       horizontalArrangement = Arrangement.SpaceEvenly
   ) {
       TextButton(
           onClick = onIncrease
       ) {
           Text(
               text = "+",
               textAlign = TextAlign.Center,
               fontSize = 25f.sp
           )
       }
       Text(
           text = counterValue.toString(),
           textAlign = TextAlign.Center,
           fontSize = 25f.sp
       )
       TextButton(
           onClick = onDecrease
       ) {
           Text(
               text = "-",
               textAlign = TextAlign.Center,
               fontSize = 25f.sp
           )
       }
   }
}
```

The composable function above has two arguments `onIncrease` and `onDecrease` to propagate events to the view model. It also has an argument of the current counter value to display.

```kotlin
val counterViewModel by viewModels<ActorCounterViewModel>()

CounterView(
   counterViewModel.counter, {
   counterViewModel.increment()
}) {
   counterViewModel.decrement()
}
```

#### Actors

What is an actor?

An actor is a coroutine that encapsulates some state that can be updated based on events from a channel. The actor internally has a channel called a mailbox. Events can be sent to the channel to update the state. The actor will process the events from the channel in the order they are received. 

![shared-mutable-state-4](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_4.png){: .align-center}

We could create an actor with the counter value encapsulated that is updated based on increment and decrement events. 

```kotlin
class ActorCounterViewModel: ViewModel() {

var counter by mutableStateOf(0)
   private set

   private val counterActor = viewModelScope.actor<CounterMsg>(Dispatchers.IO) {
       for (msg in channel) {
           when (msg) {
               is IncCounter -> {
                   delay(INCREMENT_DELAY_MILLISECONDS)
                   counter++
               }
               else -> counter--
           }
       }
   }
}
```

The actor is created in the view model launched via the viewModelScope. Inside the actor, events are processed in a loop from the actor’s internal channel. There are two events that can be sent to the actor specified using a sealed class. 

```kotlin
sealed class CounterMsg
object IncCounter : CounterMsg()
object DecrementCounter : CounterMsg()
```

The counter value is specified using `mutableStateOf` from the Jetpack Compose library.

```kotlin
var counter by mutableStateOf(0)

class ActorCounterViewModel: ViewModel() {

      ...
  
      fun increment() {
           viewModelScope.launch {
               counterActor.send(IncCounter)
           }
      }

     fun decrement() {
            viewModelScope.launch {
               counterActor.send(DecrementCounter)
           }
     }
}
```

Every time increment or decrement is called a coroutine is launched which sends a message to the channel. 

These methods could be called multiple times. We have multiple coroutines attempting to mutate the same counter value. The actor provides synchronization for updating the counter. 

![shared-mutable-state-5](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_5.png){: .align-center}

#### Mutex

Besides actor, Mutex is another synchronization mechanism in the coroutines library. 

```kotlin
class MutexCounterViewModel: ViewModel() {

   private val mutex = Mutex()

   var counter by mutableStateOf(0)
       private set

   fun increment() {
       viewModelScope.launch {
           mutex.withLock {
               delay(INCREMENT_DELAY_MILLISECONDS)
               counter++
           }
       }
   }

   fun decrement() {
       viewModelScope.launch {
           mutex.withLock {
               delay(INCREMENT_DELAY_MILLISECONDS)
               counter--
           }
       }
   }
}
```

The view model above uses a Mutex to approach the same problem. A Mutex has a method called `withLock` that allows you to define a critical section of your code that updates shared state. The increment and decrement methods launch a coroutine that delays and updates the counter. 

The increment and decrement methods could be called multiple depending on the number of clicks from the user. Each call to these methods launches a coroutine and suspends at the `withLock` call. 

### Swift

How do we solve this use case with Swift and Swift’s 5.5 new concurrency language features?

#### Swift UI

Using the Swift UI framework, we have a view defined below that displays the increment and decrement buttons and the counter value.

```swift
struct ContentView: View {
 
    var body: some View {

        HStack {
            Button("+", action: { … })
                .padding()
            Text("\(...)")
                .padding()
            Button("-", action: { … })
                .padding()
        }
    }
}

```

#### Observable Object & Published

One approach we could take for this use case is to dispatch the increment or decrement operation in a queue. 

```swift
class CounterState: ObservableObject {
 
    @Published private (set) var counter = 0
    private var internalCounter = 0    
}
```

The `CounterState` above is an `ObservableObject` that has a published state which is the counter value. This is the value that is displayed to the user. Whereas the internal counter state is updated by the increment and decrement methods.

```swift
class CounterState: ObservableObject {
    
    @Published private (set) var counter = 0
    private var internalCounter = 0
    private var updateTask: DispatchWorkItem? = nil

    func increment() {
         internalCounter+=1
         delayedUpdated()
    }
    
    func decrement() {
         internalCounter-=1
         delayedUpdated()
    }
           
}
```

Both the increment and decrement methods update the internal counter value rather than the published value the view is listening to for updates.

#### Dispatch Queue

How do we implement the `delayedUpdated` method using a DispatchQueue? The method’s purpose is to synchronize the internal counter state to the published counter value.

```swift
private func delayedUpdated() {
    if let updateTask = updateTask {
        updateTask.cancel()
    }
    let nextTask = DispatchWorkItem { [self] in
        counter = internalCounter
        updateTask = nil
    }
    updateTask = nextTask
    DispatchQueue.main.asyncAfter(
        deadline: .now()+5, 
        execute: nextTask
    )
}
```

This method creates a `DispatchWorkItem` which encapsulates the work of updating the published counter value. The work is dispatched on the main queue to be executed after 5 seconds. If a previous task is already running when an operation (increment/decrement) is performed, then it is cancelled. 

![shared-mutable-state-6](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_6.png){: .align-center}

#### Swift 5.5 Actors

Swift 5.5 introduces async await and actors. It is introduced as a keyword in the language. 

```swift
actor CounterActor {
    
    var count: Int = 0

    func increment() {
            count += 1
    }
    
    func decrement() {
            count -= 1
    }
}
```

The actor provides synchronization of updates to the count value. 

We could take an approach of having an observable object that communicates with the actor for state updates. 

![shared-mutable-state-7](/assets/images/shared_mutable_state_with_kotlin_and_swift/shared_mutable_state_image_7.png){: .align-center}

```swift
class CounterState: ObservableObject {
    
    @Published var counter = 0
    
    private let counterActor = CounterActor()
    
    func increment() async {
            await Task.sleep(3 * 1_000_000_000)
            await counterActor.increment()
            counter = await counterActor.count
    }
    
    func decrement() async {
            await Task.sleep(3 * 1_000_000_000)
            await counterActor.decrement()
        counter = await counterActor.count
    }

}
```

The `ObservableObject` above uses the `CounterActor` for incrementing and decrementing the value using async and await. Every await call is a suspension point. 

Suspension Points

There are three suspension points in the operations performed. 

1. await Task.sleep(5 * 1_000_000_000)
2. await counterActor.increment()
3. counter = await counterActor.count

If the user clicks on the increment/decrement button multiple times, each operation will suspend at the await call until it has finished. 

Swift will prevent you from using the actor in the view. The methods in the actor are isolated and cannot be referenced from the main actor. 

```swift
var actor = CounterActor()

Button("+", action: {
        actor.increment()
}
```

Actor-isolated instance method 'increment()' can not be referenced from the main actor {: .notice--danger}


#### Tasks

The new Task API in Swift provides you with the ability to launch a task in a structured or unstructured manner. It is similar to launching a coroutine.

```swift
Task.init {

}

Task.detached {

}
```

Besides using a dispatch queue, another way to specify a delay is to use the sleep method on Task.

```swift
DispatchQueue.main.asyncAfter(deadline: .now()+5, execute: ...)

await Task.sleep(5 * 1_000_000_000)
```

#### Using Tasks

Since increment/decrement are async methods, we cannot directly call these methods in the view. We could use the task API to update the state.

```swift
Button("+", action: {
     Task.init {
         await state.increment()
     }
})
```

When a button is clicked, a task will be launched encapsulating the state update. 

## Conclusion

In this article, I went over a simple use case of updating a counter with a delay where you have to process each event in sequence. Even though this use case was simple, it was a good segway to learn about concucurrency in both Swift and Kotlin. In Swift 5.5, async and await and actors were introduced. I also shared how to approach the use case with a DispatchQueue. I hope this article was helpful in seeing different approaches to a use case in both Kotlin and Swift. 

## Resources

- [Kotlin Actors & Mutex](https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html)
- [Swift Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
