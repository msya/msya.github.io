---
title: "Multiplatform Testing Pattern inside Coroutine Lib"
excerpt: "In this article, we'll learn about how testing is setup inside the coroutine's library."
date: 2020-10-26
categories:
  - coroutines
tags:
  - coroutines
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

_Featured in [Kotlin Weekly #222](http://www.kotlinweekly.net/)_

What is the testing pattern used inside the Kotlin Coroutine library? It's a multiplatform library that uses a pattern which tests functionality for JS, JVM and native. In this article, we will explore how testing is performed and explore examples of unit tests in the library itself.

Let’s start by looking at a very simple unit test in the library. 

```kotlin
class CoroutinesTest : TestBase() {

    @Test
    fun testSimple() = runTest {
        expect(1)
        finish(2)
    }

}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt)

This unit test creates a coroutine and verifies it finishes. But, how does it work? 

## Multiplatform Setup

This test inherits a class called TestBase. It sets up scaffolding for the unit tests and provides utilities to perform verifications. As the coroutine library is multiplatform, an implementation for it provided for JS, JVM and Native.

![test-base-image](/assets/images/multiplatform-testing-inside-coroutine-lib/test-base-diagram.png){: .align-center}

## Test Utilities


```kotlin
expect open class TestBase constructor() {
   
   fun error(message, cause): Nothing

   fun expect(index: Int)

   fun expectUnreached()
   
   fun finish(index: Int)
   
   fun ensureFinished()
   
   fun reset()

   fun runTest(
       expected: ((Throwable) -> Boolean)? = null,
       unhandled: List<(Throwable) -> Boolean> = emptyList(),
       block: suspend CoroutineScope.() -> Unit
   )
}
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/TestBase.common.kt)


Each method in the class above is a utility to do the following.

- Run tests 
- Verify errors 
- Order of execution 
- Verify coroutine finished

```kotlin
@Test
fun testSimple() = runTest {
   expect(1)
   finish(2)
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt)

## Run Test

We will look at how these utilities are implemented for JVM. This test creates a coroutine using runTest method. 

```kotlin
actual fun runTest(
   block: suspend CoroutineScope.() -> Unit
) {
   runBlocking(
       block = block, 
       context = CoroutineExceptionHandler { }
   ) {
       ...
   }
}
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt)

The method doesn’t use runBlockingTest to create a coroutine. It uses a simple runBlocking coroutine. It also defines a handler to catch any exceptions that may occur. 

## Expect

In the coroutine, the method first calls expect(1). The expect method is a utility provided by the base test class. 

```kotlin
/**
* Asserts that this invocation is `index`-th in the execution    
*  sequence (counting from one).
*/
fun expect(index: Int)
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt#L96)

The purpose of this method is to verify the order of execution in the coroutine using an integer value. Internally, the base class defines an atomic integer called action index.

```kotlin
private var actionIndex = AtomicInteger()
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt#L49)

It has a value of 0 when the coroutine is started. When you first call the expect method, it increments the atomic integer. 

```kotlin
actual fun expect(index: Int) {
   val wasIndex = actionIndex.incrementAndGet()
   check(index == wasIndex) { 
       "Expecting action index $index but it is actually 
       $wasIndex" 
   }
}
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt#L96)

Lastly, it performs a check to determine whether you haven’t previously called the method with the same index.

In the test below, the action index has a value of 1. Calling expect(1) again will throw an exception.

## Finish

```kotlin
@Test
fun testSimple() = runTest {
   expect(1)
   finish(2)
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt)

The last call to the finish method verifies the coroutine has completed execution. It will increment the action index once again. But, it will also set an atomic boolean inside of the TestBase class. 

```kotlin
private var finished = AtomicBoolean()
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt#L50)

```kotlin
/**
* Asserts that this it the last action in the test. It must be invoked by any test that used [expect].
*/
public actual fun finish(index: Int) {
   expect(index)
   check(!finished.getAndSet(true)) { 
     "Should call 'finish(...)' at most once" 
   }
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt#L112)

This simple test verifies the coroutines starts and finishes. It does so using these atomic counters and booleans. 

```kotlin
@Test
fun testSimple() = runTest {
   expect(1)
   finish(2)
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt)

The key idea is that we have a way to verify the order of execution in a coroutine. 

## Verifying Order of Execution

Here is a slightly more complex example.

```kotlin
@Test
fun testWaitChild() = runTest {
   expect(1)
   launch {
       expect(3)
       yield() // to parent
       finish(5)
   }
   expect(2)
   yield()
   expect(4)
   // parent waits for child's completion
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt#L74)

This test launches a coroutine using runTest. It also launches a child coroutine. Observe the index values of the action methods. It's used to verify order of execution in the coroutines. 

The second action is after the launch call. However, after the yield in the outer coroutines, we expect the execution to transfer to the inner coroutine. The inner coroutine has an expect call with an index of three.

```kotlin
launch {
  expect(3)
  yield() // to parent
  finish(5)
}
 expect(2)
 yield()
```

## Except Unreached

```kotlin
@Test
fun testCancelParentOnChildException() = runTest(expected = { it is TestException }) {
   expect(1)
   launch {
       finish(3)
       throwTestException() // does not propagate exception to launch, but cancels parent (!)
       expectUnreached()
   }
   expect(2)
   yield()
   expectUnreached() // because of exception in child
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt#L154)

This verifies a parent coroutine is cancelled if a child coroutine throws an exception. The launch block inside the parent coroutine throws a test exception. Any logic after throwing the exception should not be executed. This is confirmed with the expectUnreached method. So, the expectUnreached method allows you to verify an order of execution is not reached in the coroutine.

## Errors

```kotlin
@Test
fun testConflate() = runTest {
   expect(1)
   // emit all and conflate / then collect first & last
   flow {
       repeat(n) { i ->
           expect(i + 2)
           emit(i)
       }
   }
       .buffer(Channel.CONFLATED)
       .collect { i ->
           when (i) {
               0 -> expect(n + 2) // first value
               n - 1 -> expect(n + 3) // last value
               else -> error("Unexpected $i")
           }
       }
   finish(n + 4)
}
```
Source: [BufferConflationTest](https://github.com/Kotlin/kotlinx.coroutines/blob/1b34e1c7dd6207d7683c307bae0b934a3dc18d09/kotlinx-coroutines-core/common/test/flow/operators/BufferConflationTest.kt#L18)

This test is verifying values emitted by a Flow are conflated when you buffer it using Channel.CONFLATED. We expect the first and value to be collected, while other values are conflated. This is accomplished in the when check in the collect method.

```kotlin
when (i) {
    0 -> expect(n + 2) // first value
    n - 1 -> expect(n + 3) // last value
    else -> error("Unexpected $i")
}
```

The else clause has a call to the error method with a message if conflation doesn’t work.

## Excepted Errors

```kotlin
@Test
fun testCancelParentOnChildException() = runTest(
    expected = { it is TestException }
) {
   expect(1)
   launch {
       finish(3)
       throwTestException() // does not propagate exception to launch, but cancels parent (!)
       expectUnreached()
   }
   expect(2)
   yield()
   expectUnreached() // because of exception in child
}
```
Source: [CoroutinesTest](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/CoroutinesTest.kt#L154)

We saw this example earlier. It verifies the parent coroutine is cancelled when an inner coroutine throws an exception. 

When the coroutine is created in the test, it specifies an expected exception. In the TestBase class, there are a set of test exceptions that can be used. 

```kotlin
class TestException(...)
class TestException1(...)
class TestException2(...)
class TestException3(...)
class TestCancellationException(...)
class TestRuntimeException(...)
class RecoverableTestException(...)
class RecoverableTestCancellationException(...)
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/common/test/TestBase.common.kt#L62)

The runTest method allows you to handle excepted and unhandled exceptions. In this example above, it is an expected exception. 

```kotlin
fun runTest(
   expected: ((Throwable) -> Boolean)? = null,
   unhandled: List<(Throwable) -> Boolean> = emptyList(),
   block: suspend CoroutineScope.() -> Unit
)
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt)

This test verifies an actor throws an exception. It create an actor and consumes its channel. While consuming the channel, an IllegalArgumentException is thrown. The test verifies this exception is thrown by specifying it as an argument in the runTest method.

```kotlin
@Test
fun testThrowingActor() = runTest(unhandled = listOf({e -> e is IllegalArgumentException})) {
   val parent = Job()
   val actor = actor<Int>(parent) {
       channel.consumeEach {
           expect(1)
           throw IllegalArgumentException()
       }
   }

   actor.send(1)
   parent.cancel()
   parent.join()
   finish(2)
}
```
Source: [ActorTest](https://github.com/Kotlin/kotlinx.coroutines/blob/d7de5f5ba66a8d005e5cbd03b18522112303fd54/kotlinx-coroutines-core/jvm/test/channels/ActorTest.kt#L137)

An exception handler is specified when a coroutine is created by runTest. 

```kotlin
runBlocking(block = block, context = CoroutineExceptionHandler { _, e ->
   when {
       exCount > unhandled.size ->
           printError("Too many unhandled exceptions $exCount, expected 
                      ${unhandled.size}, got: $e", e)
       !unhandled[exCount - 1](e) ->
           printError("Unhandled exception was unexpected: $e", e)
   }
})
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/a70022d6e7d9aa5d8fe27a2c46e987a2e8b85c21/kotlinx-coroutines-core/jvm/test/TestBase.kt)

The second clause in the when statement will make sure if there are any unhandled exceptions that you didn’t specify. 

## JS Implementation

The Javascript implementation for the runTest method is different. In order to launch a coroutine, it uses the promise method on a GlobalScope.

```kotlin
GlobalScope.promise(block = block, context = CoroutineExceptionHandler { context, e ->

}
```
Source: [TestBase](https://github.com/Kotlin/kotlinx.coroutines/blob/d7de5f5ba66a8d005e5cbd03b18522112303fd54/kotlinx-coroutines-core/js/test/TestBase.kt#L82)

But, the logic for handling exceptions, keeping track of the order of execution and whether a coroutine is the same. 

## Summary

We looked at testing work internally in the coroutine library itself. As it is a multiplatform library, it has a framework for testing coroutines for JVM, JS and native. Although run blocking test is provided for testing, the pattern inside the library is different. We looked at the following utilities it has for testing. 

- Specifies a base test utility in the common module. 
- Actual implementations for Javascript, JVM and native are given in separate platform modules.
- Expect/Finish declarations are used verifying order of execution. 
- Utilities are provided for handling expected and unexpected exceptions.
