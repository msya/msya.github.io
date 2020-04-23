---
title: "Unit Testing Delays, Errors & Retries with Kotlin Flows"
date: 2020-03-19
categories:
  - coroutines
tags:
  - testing
layout: single
classes: wide
---

_Featured in [Android Weekly #406](https://androidweekly.net/issues/issue-406)_

In February, I gave a presentation at the [NY Android Meetup](https://www.meetup.com/nyandroiddevelopers/events/268273123/) on unit testing Channels and Flows with practical use cases. In this blog post, I will share with you how to test delays, retries, and errors with Flows. I’ve also added useful tips and things to watch out for when unit testing.

## Use Case

Before, we could write unit tests. We need a use case. Suppose we are building a feature in an app that displays user details. We may have a setup as shown below.

![unit-testing-flow-1](/assets/images/unit-testing-flow/unit-testing-flow-1.png){: .align-center}

We have a Repository that goes out to the API and gets the user’s details and gives it to the View Model to display it to the UI. In this article, I will focus on creating the repository and testing it. How would we go about implementing the Repository using a Flow?

## Repository

The [repository](https://developer.android.com/jetpack/docs/guide#fetch-data) will use an API service to get the user’s details. We could implement this using [Retrofit](https://square.github.io/retrofit/) which has support for suspending functions.

```kotlin
interface ApiService {
    @GET("/users/{id}")
    suspend fun userDetails(@Path("id") id: Int): UserDetails
}
```

In this API service, we are going to hit an endpoint that takes an `id` and return the data in a `UserDetails` response.

```kotlin
fun <T> flow(
    block: suspend FlowCollector<T>.() -> Unit
): Flow<T>
```
Source: [Builders.kt](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/flow/Builders.kt#L49)

Using the `flow` method, we could implement our Repository as follows.

```kotlin
class UserRepository(val apiService: ApiService) {
 
    fun userDetails(id: Int): Flow<Result<UserDetails>> {
         return flow {
            val users = apiService.userDetails(id)
            emit(Result.success(users))
         }
    }
}
```

## Tips

This Flow is emitting a single item. I could the [single]("https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/single.html") method on the Flow and have the `userDetails` return `Result<UserDetails>`. However, the restriction on using Result type is that it can’t be returned from a method.

This could be implemented without using Flows. But, I want to use a simple example to illustrate testing Flows.

## Error Handling

What happens if an error occurs in our example? If the method `apiService.userDetails(id)` throws an exception, it will cause a crash if not handled properly. Here is an example of collecting from a Flow inside of a coroutine launched in a view model scope. It would crash due to the exception.

```kotlin
viewModelScope.launch {
     val flow = repository.getUserDetails("id")
     flow.collect { result: Result<UserDetails>
          showUI(result.data)
     }
}
```

There are three ways to handle exceptions.

1. Provide an [exception handler](https://kotlinlang.org/docs/reference/coroutines/exception-handling.html#coroutineexceptionhandler) to the coroutine in the launch method.

2. Use a try and catch around the getUserDetails method.

3. Catch the exception in the Flow.

All of these approaches are valid depending on your use case. I will show you how to use the third approach.

```kotlin
class UserRepository(val apiService: ApiService) {
 
  fun userDetails(id: Int): Flow<Result<UserDetails>> {
       return flow {
           val users = apiService.userDetails(id)
           emit(Result.success(users))
      }
    .catch { throwable ->
         emit(Result.error(throwable))
     }
  }    
}
```

The [catch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) extension on a Flow intercepts the exception. We then emit it in a wrapper type like a Result. That’s exactly what I’m doing above using `Result.error(throwable)`. With this approach, the exception is caught and won’t crash our application. Instead, it will be incorporated into our Result type.

## Retry

If an error happens, I may want to retry the request a number of times. The coroutines library provides a [retry](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/retry.html) extension that allows you to specify the number of retries and when to perform it. Using the retry extension, our Repository will now look as follows.

```kotlin
class UserRepository(val apiService: ApiService) {
 
  fun userDetails(id: Int): Flow<Result<UserDetails>> {
       return flow {
           val users = apiService.userDetails(id)
           emit(Result.success(users))
      }
      .retry(2) { e ->
         (e is Exception).also { if (it) delay(1000) }
      }
      .catch { throwable ->
         emit(Result.error(throwable))
     }
}
```

I am specifying that I want to perform two retries when an exception occurs. However, before retrying the request, I will delay the coroutine for one second. Each retry will execute the Flow block again.

## Dispatcher

In order to test delays and have control over them, we need to be able to inject a dispatcher. Currently, our repository will use a dispatcher from the coroutine it is called from. But, it is a good practice to explicitly inject into the repository which dispatcher the Flow will use. The coroutines test library provides a test dispatcher that allows us to control virtual time. We could modify our repository to take in a dispatcher in its constructor.

```kotlin
class UserRepository(
    val apiService: ApiService,
    val dispatcher: CoroutineDispatcher
) {
 
  fun userDetails(id: Int): Flow<Result<UserDetails>> {
       return flow {
           val users = apiService.userDetails(id)
           emit(Result.success(users))
      }
      .retry(2) { e ->
         (e is Exception).also { if (it) delay(1000) }
      }
      .catch { throwable ->
         emit(Result.error(throwable))
     }
     .flowOn(dispatcher)   
  }
}
```

The injected dispatcher is used in the Flow by using the [flowOn](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html) extension. This means everything before `flowOn` method which is the retry, catch and the flow block itself will run on the inject dispatcher.

## Tips

A common pattern followed in the community is to inject a provider for the dispatcher. The provider could give you a [Dispatchers.IO](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/) or [Dispatchers.Default](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/).

## Unit Tests

How do we unit test the repository? There are three cases we want to test in our example.

1. Flow emits successfully.

2. Flow completes all retries with an error.

3. Flow retries and a successful response occurs.

## Test Success

How do we test the simplest case of a successful emission? We need to mock the API service to return data. I will use [mockito-kotlin](https://github.com/nhaarman/mockito-kotlin) for stubbing our API service.

```kotlin
class UserRepositoryTest {
    val testDispatcher = TestCoroutineDispatcher()
    val apiService = mock<ApiService>()
    val repository = UserRepository(apiService, testDispatcher)
}
```

Create the repository we will test with that takes a test dispatcher and a mocked API service. In order to write our test case, we have to create a coroutine that our test will run in. There are two methods we could use from the coroutine library to do this.

1. [runBlocking](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html)

2. [runBlockingTest](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html)

The runBlocking method is good for testing non-delays while runBlockingTest gives you finer control over virtual time if you need it. For the successful case, we will use runBlocking to create a coroutine.

```kotlin
class UserRepositoryTest {
    val testDispatcher = TestCoroutineDispatcher()
    val apiService = mock<ApiService>()
    val repository = UserRepository(apiService, testDispatcher)
    @Test
    fun `flow emits successfully`() = runBlocking {
         
         // Mock API Service
         val userDetails = UserDetails(1, "User 1", "avatar_url")
         userService.stub {
             onBlocking { userDetails(1) } doReturn userDetails
         }
         // Test
         val flow = repository.getUserDetails(id = 1)
         // Verify
         flow.collect { result: Result<UserDetails> ->
              result.isSuccess.shouldBeTrue()
              result.onSuccess {
                 it shouldBeEqualTo userDetails
              }
         }
     }
}
```

There are three steps in this test — mock, test and verify.

_Mock API Service_

I am stubbing out the API service to return a mock UserDetails response. Since the `userDetails` method is a suspending function, I cannot use
`on { userDetails(id = 1) } doReturn userDetails`. It will give an error that a suspending method can only be called from another suspending method. The lambda block of the `on` method is not suspending. Mockito-kotlin provides an [onBlocking](https://github.com/nhaarman/mockito-kotlin/blob/3139a2c470e6cc9425b016e3d2267aaf7e9baa87/mockito-kotlin/src/main/kotlin/com/nhaarman/mockitokotlin2/KStubbing.kt#L79) method that takes in a suspending lambda and stubs the method out in a `runBlocking` coroutine.

_Test & Verify_

In the test phase, I get the Flow from the repository, collect from it and verify the data in the result. I am using the library [Kluent](https://markusamshove.github.io/Kluent/) for verification. It provides methods such as `shouldBeTrue` and `shouldBeEqualTo`.

## Tips

There is a library called [MockK](https://mockk.io/) that provides methods to verify Flow assertions. In the community, libraries have also built patterns to performs assertions. Check out the SQL Delight’s library [Flow Assert](https://mockk.io/) pattern.

## Test Retry

How do we test that the Flow handles exceptions and retries? There are two retry cases we want to test.

1. Flow completes all retries with an error.

2. Flow retries and a successful response occurs.

Let’s start with the first test case.

* Flow completes all retries with an error.

```kotlin
@Test
fun `should retry with error`() = 
  testCoroutineDispatcher.runBlockingTest {
      userService.stub {
        onBlocking { userDetails(1) } doAnswer {
            throw IOException()
        }
    }

    val flow = repository.getUserDetails(id = 1)

    flow.collect { result: Result<UserDetails> ->
        result.isFailure.shouldBeTrue()
    }
}
```

In our Repository, when an error occurs, we delay for 1 second before executing the `flow` block again.

```kotlin
flow {
    val users = apiService.userDetails(id)
    emit(Result.success(users))
}.retry(2) { e ->
    (e is Exception).also { if (it) delay(1000) }
}.catch { throwable ->
     emit(Result.error(throwable))
}.flowOn(dispatcher)
```

As we have delays in our code, we will use the `runBlockingTest` method in our test.

What does `runBlockingTest` do?

This method creates a coroutine with a `TestCoroutineScope` that has a `TestCoroutineDispatcher` and a `TestCoroutineExceptionHandler`. This method takes in a lambda block `testBody` and an optional `context`.

```kotlin
fun runBlockingTest(
   context: CoroutineContext = EmptyCoroutineContext, 
   testBody: suspend TestCoroutineScope.() -> Unit
)
```

In my test, I am using this method as

```kotlin
testCoroutineDispatcher.runBlockingTest {
    ...
}
```

This will create a coroutine with our own customtestCoroutineDispatcher.

This is equivalent to:

```kotlin
runBlockingTest(testCoroutineDispatcher) {
    ...
}
```

However, an extension is provided on `runBlockingTest` that I am using to provide my own dispatcher.

```kotlin
fun TestCoroutineDispatcher.runBlockingTest(
    block: suspend TestCoroutineScope.() -> Unit
)
```
Source: [TestBuilders.kt](https://github.com/Kotlin/kotlinx.coroutines/blob/d7de5f5ba66a8d005e5cbd03b18522112303fd54/kotlinx-coroutines-test/src/TestBuilders.kt#L78)

After creating the coroutine my test will run in, I am mocking my API service to throw an exception. Then, I proceed to collect from my Flow and perform an assertion.

```kotlin
@Test
fun `should retry with error`() = 
  testCoroutineDispatcher.runBlockingTest {
      // Mock
      userService.stub {
         onBlocking { userDetails(1) } doAnswer {
             throw IOException()
         }
     }

      // Test
      val flow = repository.getUserDetails(id = 1)
      // Verify
      flow.collect { result: Result<UserDetails> ->
         result.isFailure.shouldBeTrue()
      }
}
```

Let’s trace how this test runs. If I add logs or add breakpoints in the IDE, it will help visualize what happens.

```kotlin
fun getUserDetails(id: Int): Flow<Result<UserDetails>> {
    return flow {
        println("STARTING FLOW")
        val users = userService.userDetails(id)
        emit(Result.success(users))
    }
    .retry(retries = 2) { t ->
        println("RETRY")
        (t is IOException).also { 
            if (it) { 
                println("BEFORE DELAY")
                delay(DELAY_ONE_SECOND)
                println("AFTER DELAY")
            }
        }
    }
    .catch {
        println("CATCH")
        emit(Result.failure(it))
    }.flowOn(dispatcher)
}
```

Here is the output of running the test.

```
// Initial Run of Flow
STARTING FLOW
// 1st Retry
RETRY
BEFORE DELAY
AFTER DELAY
STARTING FLOW
// 2nd Retry
RETRY
BEFORE DELAY
AFTER DELAY
STARTING FLOW
// Both retries failed run catch block
CATCH
```

_Initial Run of Flow_

When I collect from the Flow in the test, it will execute the flow block and an exception will be thrown since we used doAnswer to train our Api Service to throw an IOException.

_1st and 2nd Retry_

It will then go into the retry block and delay for one second. After the delay, it will execute the Flow block again. An exception will occur again. This process will repeat itself for the 2nd retry.

_Catch Error_

Since we only specified two retries, it will finally halt the retries and go into the catch block since all retries failed and emit the error.

## Under the hood

```kotlin
// The ordered queue for the runnable tasks.
private val queue = ThreadSafeHeap<TimedRunnable>()
```

Every time it dispatches, it adds an `TimedRunnable` object to the queue. This object contains the Runnable task and a time to perform the task.

```kotlin
private fun post(block: Runnable) =              
     queue.addLast(
        TimedRunnable(block, _counter.getAndIncrement())
     )
class TimedRunnable(
    @JvmField val runnable: Runnable,
    private val count: Long = 0,
    @JvmField val time: Long = 0
)
```
Source: [TimedRunnable](https://github.com/Kotlin/kotlinx.coroutines/blob/d7de5f5ba66a8d005e5cbd03b18522112303fd54/kotlinx-coroutines-test/src/TestCoroutineDispatcher.kt#L200)

As time is advanced forward on the test dispatcher, the Runnable tasks are executed.

When you look at this test, I am not explicitly advancing time forward. How does it move virtual time forward?


```kotlin
@Test
fun `should retry with error`() = 
  testCoroutineDispatcher.runBlockingTest {
      userService.stub {
        onBlocking { userDetails(1) } doAnswer {
            throw IOException()
        }
    }

    val flow = repository.getUserDetails(id = 1)

    flow.collect { result: Result<UserDetails> ->
        result.isFailure.shouldBeTrue()
    }
}
```

Let’s look under the hood at the implementation of runBlockingTest . You will see that it will advance time forward until there are no more runnables to execute for all of your test.

```kotlin
val startingJobs = safeContext.activeJobs()
val scope = TestCoroutineScope(safeContext)
val deferred = scope.async {
    scope.testBody()
}
dispatcher.advanceUntilIdle()
deferred.getCompletionExceptionOrNull()?.let {
    throw it
}
scope.cleanupTestCoroutines()
val endingJobs = safeContext.activeJobs()
if ((endingJobs - startingJobs).isNotEmpty()) {
    throw UncompletedCoroutinesError(
         "Test finished with active jobs: $endingJobs"
    )
}
```
Source: [TestCoroutineDispatcher](https://github.com/Kotlin/kotlinx.coroutines/blob/d7de5f5ba66a8d005e5cbd03b18522112303fd54/kotlinx-coroutines-test/src/TestCoroutineDispatcher.kt#L200)

`dispatcher.advanceUntilIdle()` will advance the delays in our tests. In my tests, I am leveraging this to go through all the retries with delays and emit an error. This is how it works under the hood.

## Tips

The most common error you will get is `Test finished with active jobs` error when you use `runBlockingTest`. This happens, because you have an active coroutine running in your test. For example, if you had a producer using a Rendezvous Channel and you had called send and didn’t receive the value, you will get this error. That’s only one example of it. So, watch out for that error.

## Test Retry with Success

* Flow retries and a successful response occurs.

How do we test that a retry actually succeeds and emits the data?

```kotlin
@Test
fun `should retry with success`() 
    testCoroutineDispatcher.runBlockingTest {    
        
       // Mock
       var throwError = true
       val userDetails = UserDetails(1, "User 1", "avatar_url")

       userService.stub {
           onBlocking { userDetails(1) } doAnswer {
            if (throwError) throw IOException() else userDetails
          }
        }
       // Test
       val flow = repository.getUserDetails(id = 1)
       // Verify
       launch {
          flow.collect { result ->
              result.isSuccess.shouldBeTrue()
          }
       }
       // 1st Retry
       advanceTimeBy(DELAY_ONE_SECOND)
       // 2nd Retry
       throwError = false
       advanceTimeBy(DELAY_ONE_SECOND)
}
```

In this test, I am controlling whether an exception will be thrown or a successful response be given by using the `throwError` variable.

```kotlin
var throwError = true
val userDetails = UserDetails(1, "User 1", "avatar_url")

userService.stub {
   onBlocking { userDetails(1) } doAnswer {
      if (throwError) throw IOException() else userDetails
   }
}
```

I am collecting from the Flow in a child coroutine. This coroutine is the consumer. If I didn’t launch a child coroutine, this test would fail.

```kotlin
launch {
  flow.collect { result ->
     result.isSuccess.shouldBeTrue()
   }
}
```

I want to be able to advance time forward when it encounters a delay so that the first retry fails. But, I want the second retry to pass. I will set `throwError` to false so that when the `flow` block is executed it succeeds with data.

```kotlin
// 1st Retry
advanceTimeBy(DELAY_ONE_SECOND)

// 2nd Retry
throwError = false
advanceTimeBy(DELAY_ONE_SECOND)
```

## Tips:

Watch out for an undocumented edge case of `runBlockingTest`. If you wrote a test that has multiple errors, `runBlockingTest` will drop the first one. See [TestCoroutineExceptionHandler](https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-test/src/TestCoroutineExceptionHandler.kt#L59).

## Resources

* [Unit Testing Channels & Flow in Practice](https://speakerdeck.com/heyitsmohit/unit-testing-kotlin-channels-and-flows)
* [Testing with Coroutines](https://www.youtube.com/watch?v=hMFwNLVK8HU)

I hope that was helpful to you. If you practice writing lots of tests using `runBlockingTest` for different scenarios, then it will get easier. If you have any questions, please let me know in the response. I gave more examples in my presentation. Please check out my slides on [Unit Testing Channels & Flow in Practice](https://speakerdeck.com/heyitsmohit/unit-testing-kotlin-channels-and-flows).
