---
title: "Custom Kotlin Coroutine Context Uses Cases"
excerpt: "Learn about use cases for creating a custom context element. I'll share use cases for dispatcher provider, thread local data and database transactions."
date: 2020-05-02
categories:
  - coroutines
tags:
  - context
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this article, I will explore the use cases where a custom coroutine context element is useful. A Context is a set of elements that provides us with information about the coroutine. A Job, Dispatcher, and Exception Handler are examples of context elements provided by the coroutines library. But, sometimes you may want to create your own context element.

## What is a Context?

>A __Context__ is a map of elements that describes the environment of the coroutine. Internally, it is an interface that defines the operations you could do with it such as query, update, or add. The coroutines library provides several elements such as Job, Dispatcher, or Coroutine Name.

Let's look at the underlying implementation of a Context more closely.

```kotlin
public interface CoroutineContext {
     
     // Operations
     operator fun <E : Element> get(key: Key<E>): E?
     
     fun <R> fold(initial: R, operation: (R, Element) -> R): R
     
     operator fun plus(context: CoroutineContext): CoroutineContext
     
     fun minusKey(key: Key<*>): CoroutineContext

     // Key & Elements
     interface Key<E : Element>
     interface Element : CoroutineContext {
         
         public val key: Key<*>
         ...
     }
}
```
Source: [CoroutineContext](https://github.com/Kotlin/kotlinx.coroutines/blob/master/stdlib-stubs/src/CoroutineContext.kt)

This interface defines operations for getting and adding to a Context. Each item in the context is identified by a unique __Key__. To see a concrete implementation of this interface, let's look at a Job under the hood.

### What is a Job?
<br/>
A Job lets us query the life cycle of a coroutine. We could know whether a coroutine is active, canceled, or is completing from this construct. When the launch method is called, it returns an instance of a Job. This instance can be used to cancel the coroutine or query its lifecycle state as shown below.

```kotlin
val scope = CoroutineScope()
val job: Job = scope.launch {
}

job.isActive
job.cancel()
```

Besides getting the Job from the launch method, I could also get it by querying the context using index notation. The launch extension provides you with the scope of the coroutine as a receiver of a lambda block. See the signature of the method below.

```kotlin
fun CoroutineScope.launch(
    context: CoroutineContext = EmptyCoroutineContext,
    start: CoroutineStart = CoroutineStart.DEFAULT,
    block: suspend CoroutineScope.() -> Unit
): Job
```
Source: [Builders.common](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/Builders.common.kt#L45)

A `CoroutineScope` provides a context as a param.

```kotlin
public interface CoroutineScope {
   val coroutineContext: CoroutineContext
}
```
Source: [CoroutineScope](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/CoroutineScope.kt)

```kotlin
val scope = CoroutineScope(Dispatcher.IO)
scope.launch {
    val job = this.coroutineContext[Job]
}
```

In this example, I am creating a coroutine by defining scope with an IO Dispatcher. I am injecting which dispatcher the coroutine will run on into the context. The coroutine will automatically create a Job for me in the context. 

I am able to get the Job from the context because the get operator is defined in the context interface. Another way to define a coroutine is to merge context elements together. 

```kotlin
val scope = CoroutineScope(Job() + Dispatcher.IO)
```

In this example above, I'm using the plus operator defined in the context interface. We are merging a custom job and dispatcher together and injecting it into the context.


### Job Implementation
<br />
If we look at how a Job is defined, it gives an idea of how to define our own context element.

```kotlin
interface Job : CoroutineContext.Element {
   /**
    * Key for [Job] instance in the coroutine context.
    */    
    companion object Key : CoroutineContext.Key<Job> {
    }
}
```

Source: [Job](https://medium.com/r/?url=https%3A%2F%2Fgithub.com%2FKotlin%2Fkotlinx.coroutines%2Fblob%2Fmaster%2Fkotlinx-coroutines-core%2Fcommon%2Fsrc%2FJob.kt)


### Steps for writing a Coroutine Context Element
<br />
There are two steps to define your context element. 

1. Inherit the `CoroutineContext.Element` interface. This will give you the ability to get, update or merge your context element.

2. Define a key for your contextual element. This is done by creating a companion object Key that inherits `CoroutineContext.Key`. This allows the user to use the class name in the index notation to get the element from the context.

---

## Use Cases

In what scenarios, would you want to define your own context element?

### Dispatcher Provider
<br/>
__Problem__

A pattern for using a dispatcher is to inject it into the constructor via Dagger using a qualifier.

```kotlin
class Repository(@IODispatcher dispatcher: CoroutineDispatcher) {
   ...
}
```
<br/>
While this approache is valid, is there a type safe approach to using scopes and dispatchers?


__Solution__

An approach we could take is to create a custom context element that provides dispatchers. Around this context element we could create types that make sure we are launching a coroutine on the correct dispatcher. There is an awesome utility library by Rick Busarow called [Dispatch](https://github.com/RBusarow/Dispatch) that uses this pattern. Let's explore how it works.

![dispatch-diagram](/assets/images/custom-coroutine-context/dispatch-diagram.jpeg){: .align-center}

This diagram shows the types and utilities provided by the Dispatch library. All the utilities are based on custom dispatcher provider.


```kotlin
interface DispatcherProvider : CoroutineContext.Element {

  override val key: CoroutineContext.Key<*> get() = Key

  val default: CoroutineDispatcher
  val io: CoroutineDispatcher
  val main: CoroutineDispatcher
  val mainImmediate: CoroutineDispatcher
  val unconfined: CoroutineDispatcher

  companion object Key : CoroutineContext.Key<DispatcherProvider>
}

class DefaultDispatcherProvider : DispatcherProvider {

    override val default: CoroutineDispatcher = Dispatchers.Default
    
    override val io: CoroutineDispatcher = Dispatchers.IO
    
    override val main: CoroutineDispatcher get() = Dispatchers.Main
    
    override val mainImmediate: CoroutineDispatcher get() = Dispatchers.Main.immediate
    
    override val unconfined: CoroutineDispatcher = Dispatchers.Unconfined
}

```
Source: [DispatcherProvider](https://github.com/RBusarow/Dispatch/blob/master/dispatcher-provider/src/main/java/com/rickbusarow/dispatcherprovider/DispatcherProvider.kt)

The core of the library is this custom context element. This interface provides you with a `default`,`io`,`main` or `unconfined` dispatcher. A concrete implementation is provided to you with `DefaultDispatcherProvider`.

#### IO Scope
<br/>
If we want to ensure a person launches a coroutines on an IO dispatcher, we coulde use IOScope type.

```kotlin
val scope = IOCoroutineScope()
scope.launch {
   println(this.coroutineContext[ContinuationInterceptor])
}

Output

LimitingDispatcher[dispatcher = DefaultDispatcher]

```
<br/>
Internally, the method `IOCoroutineScope` create a scope with the IO Dispatcher used from the custom context element shown earlier. It is specifying it using the plus operator. 
<br/>
```kotlin
fun IOCoroutineScope(
    job: Job = SupervisorJob(),
    dispatcherProvider: DispatcherProvider =   
                        DefaultDispatcherProvider()
): IOCoroutineScope = object : IOCoroutineScope {
 
   override val coroutineContext = job +
           dispatcherProvider.io + dispatcherProvider
}

```
Source: [CoroutineScopes](https://github.com/RBusarow/Dispatch/blob/5f1511a073be435d234f963628fd09a40dd7d0d9/dispatcher-provider/src/main/java/com/rickbusarow/dispatcherprovider/CoroutineScopes.kt)

#### FlowOn Utilities
<br/>
Besides providing scopes with a specific dispatcher, the library takes provides utilities for changing the context for a Flow.

```kotlin
flowOf("A", "B", "C")
       .map {
           println(Thread.currentThread().name)
           "$it 1"
       }
       .flowOnIO()
       .collect {
           println(Thread.currentThread().name)
           println(it)
       }

Output

DefaultDispatcher-worker-1
DefaultDispatcher-worker-1
DefaultDispatcher-worker-1
main
A 1
main
B 1
main
C 1

```

Internally, it uses the same idea of updating the context of the Flow from the provider. 

```kotlin
fun <T> Flow<T>.flowOnIO(): Flow<T> = flow {
  flowOn(coroutineContext.dispatcherProvider.io)
   .collect { emit(it) }
}
```
Source: [Flow](https://github.com/RBusarow/Dispatch/blob/5f1511a073be435d234f963628fd09a40dd7d0d9/dispatcher-provider/src/main/java/com/rickbusarow/dispatcherprovider/Flow.kt)

Dispatch is a useful library that builds upon the custom context element that is a dispatcher provider. It also has testing utilies.


### Thread Context Element
<br/>
Some libraries use [ThreadLocal](https://docs.oracle.com/javase/7/docs/api/java/lang/ThreadLocal.html) to store context data. Examples are [Log4j](https://logging.apache.org/log4j/2.x/) and [kroto-plus](https://github.com/marcoferrer/kroto-plus/). How do we pass context data to a coroutine or from one coroutine to another?

#### Kroto-plus
<br/>
__Problem__

Let's look how this is accomplished in the [kroto-plus](https://github.com/marcoferrer/kroto-plus/) library. This library provides you with the ability to communicate with a [Grpc](https://grpc.io/) system. It provides an API using coroutines. 

The library generates a __io.grpc.Context__. It can be used to set values. When we launch a coroutine in a specific dispatcher, how could this context value to it?

__Solution__

```kotlin 
public class GrpcContextElement(
    /**
     * The value of [io.grpc.Context] grpc context.
     */
    public val context: io.grpc.Context = io.grpc.Context.current()
) : ThreadContextElement<io.grpc.Context>, AbstractCoroutineContextElement(Key) {
    /**
     * Key of [GrpcContextElement] in [CoroutineContext].
     */
    companion object Key : CoroutineContext.Key<GrpcContextElement>

    override fun updateThreadContext(context: CoroutineContext): io.grpc.Context =
        this@GrpcContextElement.context.attach()

    override fun restoreThreadContext(context: CoroutineContext, oldState: io.grpc.Context) {
        this@GrpcContextElement.context.detach(oldState)
    }

}

```
Source: [GrpcContextElement](https://github.com/marcoferrer/kroto-plus/blob/master/kroto-plus-coroutines/src/main/kotlin/com/github/marcoferrer/krotoplus/coroutines/GrpcContextElement.kt)

This is a custom context element much like the dispatcher provider. It defines a unite for the context element. It overrides two methods from the `ThreadContextElement` to attach and detach its context with state. 

This allows you to set a value outside the coroutine in its context and read from it inside the coroutine. 

```kotlin
// Create a gRPC context key for putting a value into io.grpc.Context
 * val KEY_FOR_DATA = io.grpc.Context.key<String>("data")

launch(grpcContext.asContextElement()) {
   // Retrieve the value for KEY_FOR_DATA from the current io.grpc.Context // and print it
   println(KEY_FOR_DATA.get())
 }
```
Source:[GrpcContextElement](https://github.com/marcoferrer/kroto-plus/blob/master/kroto-plus-coroutines/src/main/kotlin/com/github/marcoferrer/krotoplus/coroutines/GrpcContextElement.kt)

#### Log4j
<br/>
The same pattern is also for the [Log4j](https://logging.apache.org/log4j/2.x/) library. The coroutines library provides an integration for it. 

```kotlin
class MDCContext(
    
    public val contextMap: MDCContextMap = MDC.getCopyOfContextMap()
) : ThreadContextElement<MDCContextMap>, AbstractCoroutineContextElement(Key) {
    
    companion object Key : CoroutineContext.Key<MDCContext>

    override fun updateThreadContext(context: CoroutineContext): MDCContextMap {
        val oldState = MDC.getCopyOfContextMap()
        setCurrent(contextMap)
        return oldState
    }

    override fun restoreThreadContext(context: CoroutineContext, oldState: MDCContextMap) {
        setCurrent(oldState)
    }

    private fun setCurrent(contextMap: MDCContextMap) {
        if (contextMap == null) {
            MDC.clear()
        } else {
            MDC.setContextMap(contextMap)
        }
    }
}
```
Source: [MDCContext](https://github.com/Kotlin/kotlinx.coroutines/blob/master/integration/kotlinx-coroutines-slf4j/src/MDCContext.kt)

This code snipped is setting and restoring the MDC context when there is a context change. In this example, I could set a value for MDC outside the coroutine and performing logging inside of it. 

```kotlin
MDC.put("key", "value") 

launch(MDCContext()) {
   logger.info { ... } 
}
```

This is a common pattern you will see in libraries that have their own context and use `ThreadLocal`.

### Database Transactions
<br/>
[Room](https://developer.android.com/topic/libraries/architecture/room), a presistance library, has support for performing database transaction with coroutines. It provides an extension [withTransaction](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-master-dev/room/ktx/src/main/java/androidx/room/RoomDatabase.kt#47) which accepts transactions you want to perform in its lambda block. 

```kotlin
database.withTransaction {
    dao().deleteAll()
    dao().insert(...)
} 
```

Everytime a transaction is performed, the library add a custom context element called `TransactionElement`.

```kotlin
internal class TransactionElement(
    private val transactionThreadControlJob: Job,
    internal val transactionDispatcher: ContinuationInterceptor
) : CoroutineContext.Element {

    // Key & Element
    companion object Key : CoroutineContext.Key<TransactionElement>
    override val key: CoroutineContext.Key<TransactionElement>
        get() = TransactionElement
    
    private val referenceCount = AtomicInteger(0)

    fun acquire() {
        referenceCount.incrementAndGet()
    }
    fun release() {
        val count = referenceCount.decrementAndGet()
        if (count < 0) {
            throw IllegalStateException("Transaction was never started or was already released.")
        } else if (count == 0) {
            // Cancel the job that controls the transaction thread, causing it to be released.
            transactionThreadControlJob.cancel()
        }
    }
}
```
<br/>
When transactions are performed, it acquires the context element. This increments the counter as seen above. Once all the transaction are completed, the Job of the coroutine is cancelled. This is a use case for handling transaction as you would see commonly in database coroutine intergations.

I hope seeing the various use cases for defining a custom context element was useful to solve your own problems. Thanks for reading!

## Resources

* [Dispatch](https://github.com/RBusarow/Dispatch)

* [Kroto-plus](https://github.com/marcoferrer/kroto-plus/tree/master/
kroto-plus-coroutines)

* [Room Database](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-master-dev/room/ktx/src/main/java/androidx/room/RoomDatabase.kt)

* [Kotlin Coroutines SLF4J MDC Integration](https://github.com/Kotlin/kotlinx.coroutines/tree/master/integration/kotlinx-coroutines-slf4j)
