---
title: "Micronaut with Kotlin Coroutines"
excerpt: "Micronaut is a JVM framework for building microservices. In this article, we'll dive into how Micronaut provides coroutines support."
date: 2020-02-15
header:
   teaser: "/assets/images/micronaut-with-kotlin-coroutines/micronaut-with-kotlin-coroutines.jpeg"	
categories:
  - micronaut
tags:
  - micronaut
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

Featured in Kotlin Weekly [#239]("https://mailchi.mp/kotlinweekly/kotlin-weekly-239")

Micronaut is a JVM framework for building microservices. In this article, we'll dive into how Micronaut provides coroutines support.

## Micronaut

Micronaut is a polyglot JVM framework to build microservices. Java, Kotlin or Groovy can be used to build Micronaut applications. It was created by Graeme Rocher. He built the Grails framework and applied many of his learning to create Micronaut. Micronaut provides many benefits as a framework.

- Fast startup time
- Low memory consumption
- Efficient Compile time dependency injection
- Reactive.

## Creating a Micronaut Project

There are three ways to build a Micronaut project. 

- [Command-line tool]("https://micronaut.io/download.html")
- [Intellij Plugin]("https://www.jetbrains.com/help/idea/micronaut.html")
- [Mircronaut Launch]("https://micronaut.io/launch/")

I will share with you how to use the command-line tool. Install the command-line tool via [SDKMAN]("https://sdkman.io/"). It contains commands to allow you to build scaffoldings for controllers, beans, and clients. 

## Use Case

Assume we wanted to build an API that takes a name in the URI and returns a greeting. 

~~~ apiblueprint
# GET /greet/{name}
+ Response 200 (text/plain)
    Hello {name}
~~~

## Project Scaffolding

We'll create the scaffolding for the project by invoking the following command in the terminal. 

~~~ zsh
$ mn create-app -l kotlin com.learn.micronautapp
~~~

Micronaut is a polyglot JVM framework. Java, Kotlin, or Groovy can be used to build your application. In the "create-app" command, I'm supplying a `-l kotlin` option to build a Kotlin project. By default, it will use Java. The last option is the package name for your project. 

![micronaut-with-kotlin-coroutines-scaffolding](/assets/images/micronaut-with-kotlin-coroutines/micronaut-with-kotlin-coroutines-scaffolding.png)


An `Application` file will be created for you. This file contains the main method to start the application. 

~~~ kotlin
fun main(args: Array<String>) {
       Micronaut.build()
                .args(*args)
                .packages("com.learn")
                .start()
}
~~~

The Micronaut application object is created and started in the main method. We have a starting point to implement our use case.

## Controller Scaffolding

The controller is the component that will handle the request to the greeting uri and send a response back to the client. We could create a scaffolding of the controller using the command line tool.

~~~ zsh
$ mn create-controller com.learn.micronautapp.Greeting

| Rendered controller to src/.../GreetingController.kt
| Rendered test to src/…/GreetingControllerTest.kt
~~~

The `create-controller` command creates two files for the controller. I’ll take a test driven development approach for our use case.

## Unit Test


For our use case, we want to write a unit test to verify the server returns a greeting with a specific name. 

### Test Setup

~~~ kotlin
@MicronautTest
class GreetingControllerTest(val embeddedServer: EmbeddedServer) { 

     @Client("/")
     interface GreetingClient {

           @Get("/greet/{name}")
           fun greetings(name: String): String
     }

     @Inject
     lateinit var greetingClient: GreetingClient

}
~~~

We have set up our test to start an embedded server and create a client. The server will spin up during startups. It allows us to rapidly test our API. 

I have created a client that will call our greetings endpoint. The client is described as an interface and the annotation specifies which endpoint to call. The client is injected lazly in the test. 

### Test Case

We want to verify where invoking the endpoint with a name gives back a greeting. 

~~~ kotlin
@MicronautTest
class GreetingControllerTest(val embeddedServer: EmbeddedServer) { 

     @Client("/")
     interface GreetingClient {

           @Get("/greet/{name}")
           fun greetings(name: String): String
     }

     @Inject
     lateinit var greetingClient: GreetingClient

     @Test
     fun `should get greeting`() {

        val greeting = greetingClient.greetings("Micronaut")
        greeting shouldEqual "Greetings Micronaut"

    }

}
~~~

In this test, I’m using my client to communicate with the greetings endpoint with “Micronaut” as the name value. The return string is verified against “Greeting Micronaut”. How do we write the logic to handle the greetings endpoint?

## Controller

In Micronaut, we define logic to handle calls to uris in a controller. 

~~~ kotlin
@Controller
class GreetingController { 

    @Get(uri=“/greet/{name}“)
    fun greet(name: String): String {
        return "Greetings $name"
    }
}
~~~

This is a simple implementation of a controller. The greeting just returns a concatenated string with the name passed in from the request. The annotations generated code to handle routing to the uri. 

## Usage

~~~ apiblueprint
# GET http://localhost:8080/greet/micronaut

+ HTTP/1.1 200 OK  
content-type: text/plain
  content-length: 19 
 connection: keep-alive

  Greetings micronaut 
~~~

The default port number is set 8080. If you go to the url http://localhost:8080/greet/micronaut in your browser, it will return the response above. 

## Coroutines Support

How do we use coroutines in Micronaut? Micronaut has support for suspending functions and flows. Micronaut is built using the [Reactive Stream](https://www.reactive-streams.org/) framework. However, an integration layer sits on top to support coroutines. 

### Suspending Method

~~~ kotlin
@Controller
class GreetingController { 

    @Get(uri=“/greet/{name}“)
    suspend fun greet(name: String): String {
         return "Greetings $name"
    }
}
~~~

In this example, the `greet` method has been marked with the `suspend` modifier. How is the handle under the hood by Micornaut?

### Suspending Method Support Under the Hood

An interceptor is defined under the hood that checks a method in your controller is marked with the suspend keyword.

~~~ java
/**
 * Checks if the method invocation is a Kotlin coroutine.
 *
 * @param context {@link MethodInvocationContext}
 * @return true if Kotlin coroutine
 */
public static KotlinInterceptedMethod of(MethodInvocationContext<?, ?> context) {
    if (!KotlinUtils.KOTLIN_COROUTINES_SUPPORTED || !context.getExecutableMethod().isSuspend()) {
        return null;
    }
    ...
}
~~~
[micronaut-core/KotlinInterceptedMethod.java](https://github.com/micronaut-projects/micronaut-core/blob/2.3.x/aop/src/main/java/io/micronaut/aop/internal/intercepted/KotlinInterceptedMethod.java#L64)

 A suspending method adds a continuation object as the last parameter of the method. The interceptor extracts the continuation object 

~~~ java
/**
 * Checks if the method invocation is a Kotlin coroutine.
 *
 * @param context {@link MethodInvocationContext}
 * @return true if Kotlin coroutine
 */
public static KotlinInterceptedMethod of(MethodInvocationContext<?, ?> context) {
    ...
    Object lastArgumentValue = parameterValues[lastParameterIndex];
    if (lastArgumentValue instanceof Continuation) {
        Continuation continuation = (Continuation) lastArgumentValue;
        Consumer<Object> replaceContinuation = value -> 
                      parameterValues[lastParameterIndex] = value;
        ...
    }
    return null;
}
~~~
[micronaut-core/KotlinInterceptedMethod.java](https://github.com/micronaut-projects/micronaut-core/blob/2.3.x/aop/src/main/java/io/micronaut/aop/internal/intercepted/KotlinInterceptedMethod.java#L64)

During the interception stage, it will create a `CompletableFutureContinutation` object. Micronuat internally defines a custom `Continuation` object. It creates a `CompletableFuture`. When the continuation object is resumed, the completable future will complete with a result or with an exception. 

~~~ java
@Override
public CompletableFuture<Object> interceptResultAsCompletionStage() {
    
    CompletableFutureContinuation completableFutureContinuation;
    if (continuation instanceof CompletableFutureContinuation) {
        completableFutureContinuation = (CompletableFutureContinuation) continuation;
    } else {
        completableFutureContinuation = new 
                          CompletableFutureContinuation(continuation);
        replaceContinuation.accept(completableFutureContinuation);
    }
    ...
    return completableFutureContinuation.getCompletableFuture();
}
~~~
[micronaut-core/KotlinInterceptedMethod.java](https://github.com/micronaut-projects/micronaut-core/blob/2.3.x/aop/src/main/java/io/micronaut/aop/internal/intercepted/KotlinInterceptedMethod.java#L98)

### Dispatchers

We could also launch a coroutine on a dispatcher using the `withContext` method. 

~~~ kotlin
@Controller
class GreetingController(val executor: ExecutorService) { 

    val coroutineDispatcher: CoroutineDispatcher

    init {
       coroutineDispatcher = executor.asCoroutineDispatcher()
    }

    @Get(uri="/greet/{name}")
    suspend fun greetings(name: String) = withContext(coroutineDispatcher) {
            ...
    }
}
~~~

In this example, a dispatcher is created from an executor service. The `withContext` method creates a coorutines on the passed in dispatcher. Inside of it, you may perform any work needed and return the results. 

### Coroutine Scope

Besides using `withContext`, the `coroutineScope` builder can be used to create a coroutine. 

~~~ kotlin
@Controller
class GreetingController(val executor: ExecutorService) { 

     @Get(uri="/greet/{name}")
     suspend fun greetings(name: String) = coroutineScope {
           ...
     }
}
~~~

### Flows

Assume you wanted to build an API that returned a stream of values. Micronaut allows you to use Flows in the controller. 

![micronaut-with-kotlin-coroutines-flow](/assets/images/micronaut-with-kotlin-coroutines/micronaut-with-kotlin-coroutines-flow.png)

``` kotlin
@Controller
class GreetingController { 

    @Get(uri=“/stream“)
    fun stream(): Flow<Int> = 
               flowOf(1,2,3)
                  .onEach { delay(2000) }

}
```

In this example, the controller defines a `/stream` endpoint. The stream method returns a Flow of Int values. After each emission, the flow is delayed by 2000 milliseconds. 

In order to use Flows in your controller, be sure to add a dependency on the `kotlinx-coroutines-rx2` module. 

~~~ apiblueprint
# GET http://localhost:8080/stream

+ HTTP/1.1 200 OK
transfer-encoding: chunked

[
  1,
  2,
  3
]

~~~

### Flow Support Under the Hood

How is a Kotlin coroutine Flow supported under the hood? Micronaut’s core architecture uses the reactive framework. An integration layer is added to top to handle Kotlin coroutine Flows. 

~~~ kotlin
public class FlowConverterRegistrar implements TypeConverterRegistrar {
    @Override
    public void register(ConversionService<?> conversionService) {

        // Flow
        conversionService.addConverter(
        	 Flow.class, 
        	 Flowable.class, 
        	 flow -> Flowable.fromPublisher(ReactiveFlowKt.asPublisher(flow))
        );

        ...
    }
}
~~~
[FlowConverterRegistrar](https://github.com/micronaut-projects/micronaut-core/blob/2.3.x/runtime/src/main/java/io/micronaut/reactive/flow/converters/FlowConverterRegistrar.java)

The Flow is converted to a `Publisher`.  The converter above uses the `asPublisher` extension provided by Kotlin coroutine reactor integration library. 


## Conclusion

I hope this article was helpful to you to start building Micronaut applications. I shared a simple example of creating an app that has a greetings endpoint. It takes in a name and gives you back a greeting for it. For this example, we looked at how to create a project, set up a unit test and REST controller. 

We could also use suspending methods, create coroutines and use Flows in the controller. We looked at how they are supported in Micronaut. 

Please check out my talk from the Kotlin London meetup [Micronaut with Kotlin Coroutines](https://youtu.be/63Zc4DJPr8E?t=3711).

Resources

- [Micronaut](https://micronaut.io/)
- [Micronaut with Kotlin Coroutines](https://youtu.be/63Zc4DJPr8E?t=3711)
- [Reactive Streams](https://www.reactive-streams.org/)
- [Kotlin Coroutine Utilities for RxJava](https://github.com/Kotlin/kotlinx.coroutines/tree/master/reactive/kotlinx-coroutines-rx2)

