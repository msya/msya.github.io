---
title: "gRPC with Kotlin Coroutines"
date: 2020-08-24
header:
   teaser: "/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-1.png"
categories:
  - grpc
tags:
  - coroutines
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this blog post, we will explore how to use gRPC with Kotlin coroutines on both the server and client (Android) using the [gRPC-Kotlin](https://github.com/grpc/grpc-kotlin) library.

## What is gRPC?

[gRPC](https://grpc.io/docs/what-is-grpc/introduction/) is a framework by Google for making RPC requests. It allows you to call a method on the server as if it was a local method on the client. The server defines all the different types of RPC requests the client could make using protocol buffers. [Protocol buffers](https://developers.google.com/protocol-buffers) is a data formatting language. It allows you to specify the request and response from rpc calls. 

gRPC has support for clients and servers that are built using different programming languages.

![client-server-diagram](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-1.png)

## Use Case

![client-server-user-case](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-2.png){: .align-left}

Assume we are building an Android app that allows users to explore locations on map as they traverse from one location to another. The user may be able to check-in to a place or chat with other's at the location. The user could also explore new venues such as restaurants and retail stores nearby. How could we build a server and client for this hypothetical use case?

<br/>
## Building gRPC Server

There are many open source libraries that could be used to build a gRPC server and client such as [Wire](https://github.com/square/wire), [Kroto-Plus](https://github.com/marcoferrer/kroto-plus) and [gRPC-Kotlin](https://github.com/grpc/grpc-kotlin). Let's explore how to use gRPC-Kotlin to build a gRPC server for our case.

### RPC Calls

The first step is to define the RPC calls a client could make. We'll use protocol buffers to define the request and response. The RPC calls are defined in a file with an extension `.proto`. All RPC calls are defined in a service. The snippet below defines `VenueService` using the [`service`](https://developers.google.com/protocol-buffers/docs/proto#services) keyword. The proto file also specifies the version of protocol buffer to use. I have specified to use [protocol buffer version 3[(https://developers.google.com/protocol-buffers/docs/proto3). 

```proto
syntax = "proto3"

service VenueService {

}
```

#### Unary RPC Call

The first RPC call type we will define is a simple client and server request. Suppose in our use case, we wanted to get a venue (restaurant, retail store) at a particular location. We could define this RPC call as follows.

```proto
service VenueService {

   rpc GetVenue(Location) returns (Venue) {}

}
```

The `GetVenue` method takes in a `Location` message and returns a `Venue`. 

```proto
message Location {
   double latitude = 1;
   double longitude = 2;
}
```

A type is defined using the `message` keyword. `Location` is a message that has two fields - latitude and longitude. These fields have a type of `double`. The [Protocol Buffer Guide](https://developers.google.com/protocol-buffers/docs/proto#scalar) defines all the supported types such as enums or strings. Each field is assigned a unqiue number starting from 1. For each field defined subsequently, the unique number is incremented. 

```proto
message Venue {
   string name = 1;
   Location location = 2;
   VenueType venueType = 3;

   enum VenueType {
     Landmark = 0;
     Driving_Range = 1;
     Golf_Course = 2;
     Restaurant = 3;
     Retail = 4;
   }

   int64 checkins = 4;
   int64 reviews = 5;
}
```

A `Venue` is represented as a message above. The name of the venue is a `string`. It references an existing message `Location` to return the latitude and longitude of the venue. The third field is an enum which represents the type of venue - landmark, driving range, restaurant or retail store. Each enum is specified with a unique number starting from 0. The last two fields checkins and reviews are int scalar types. In Kotlin, they map to a Long. 

We have specified a simple unary RPC call that returns a venue based on a location.

```proto
service VenueService {

   rpc GetVenue(Location) returns (Venue) {}

}
```

#### Server Streaming

The `GetVenue` RPC call above returns only one response. But, we could define RPC calls where the server returns a stream of data. Assume we wanted to define an RPC where the client gives a location and the server returns a stream of venues nearby.

![server-side-streaming](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-3.png){: .align-center}

```proto
service VenueService {

    rpc listVenues(Location) returns (stream Venue) { }

}
```

We have added a server streaming RPC call to the service above. What's new about this call specification? The return type `Venue` is marked with a `stream` keyword. This specifies that the returned data from the server will stream venues. The server will wait until the client send a message. Once it has a message, it will return a stream of responses.

#### Client Streaming

We saw in the server side streaming example that server was returning a stream of messages. The client only had sent one message. Client could also send a stream of messages. 

Assume we wanted to return a summary of all the venues a person visted during their trip. For this use case, the client will have to send a stream of locations as they go from one location to another. 

![client-side-streaming](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-4.png){: .align-center}

In this diagram, the client is sending a stream of locations to the server. The server will wait until al the messages are received and send back a summary back to the client.

```proto
service VenueService {

   rpc RecordTrip(stream Location) returns (TripSummary) {}

}
```

The example above defines a `RecordTrip` rpc call that conforms to our use case. The `stream` keyword is used inside the parentheses to define the client side streaming RPC call.

#### Bidirectional Streaming

Both the client and server can be streaming messages. This use case is good for implementing a chat room. A client could stream messages sent by a user. The server could return replies from other users. 

![bidirectional-streaming](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-5.png){: .align-center}

```proto
import "google/protobuf/timestamp.proto";

service VenueService {

   rpc chat(stream Comment) returns (stream Comment) {}

}

message Comment {
   string text = 1;
   google.protobuf.Timestamp sentTime = 3;
}
```

The rpc method `chat` takes a stream of comments and returns a replies. A comment is a message that has text and a timestamp for when it was sent. A [Timestamp](https://developers.google.com/protocol-buffers/docs/reference/java/com/google/protobuf/Timestamp) is well known types in protocol buffers. In order to use it, you have to import the [`timestamp.proto`](https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/timestamp.proto) file. 

```proto
import "google/protobuf/timestamp.proto";
```

In the rpc method, both request and response comments are marked with the `stream` keyword. The server could wait until comments are received in order to send all the replies. Or, the server could send a reply as it receives a comment. Its up to you how you want to implement the streaming logic. 

```proto
rpc chat(stream Comment) returns (stream Comment) {}
```

We've defined all the different types of RPC calls for our use case. How do we implement our logic to execute for the RPC calls?

### Implementing RPC Calls

When we run our build, the protocol buffer compiler will run. It will generates base implementation class for us from service. 

```kotlin
abstract class VenueServiceCoroutineImplBase(coroutineContext) {

  open suspend fun getVenue(request: Location): Venue

  open fun listVenues(request: Location): Flow<Venue>

  open suspend fun recordTrip(requests: Flow<Location>): TripSummary

  open fun chat(requests: Flow<Comment>): Flow<Comment>

}
```

Each open method in the generated class above corresponds to an RPC call. In order to add our own logic when these methods are called, we will create a service that inherits this class.


```kotlin
class VenueGrpcService: VenueServiceGrpcKt.VenueServiceCoroutineImplBase() {


}
```

#### Unary RPC Call

Our unary RPC call took a location and returned a venue.


```kotlin
service VenueService {

   rpc GetVenue(Location) returns (Venue) {}

}
```

This RPC call is implemented as a suspending method in our service. 

```kotlin
class VenueGrpcService: VenueServiceGrpcKt.VenueServiceCoroutineImplBase() {

  override suspend fun getVenue(request: Location): Venue {
        return db.getVenue(request)
    }

}
```

We could add logic to query a database to get a venue based on a location. The suspending method above returns a `Venue`. In our protocol buffer file, we had defined this as a message. 

```proto
message Venue {
   string name = 1;
   Location location = 2;
   VenueType venueType = 3;

   enum VenueType {
     Landmark = 0;
     Driving_Range = 1;
     Golf_Course = 2;
     Restaurant = 3;
     Retail = 4;
   }

   int64 checkins = 4;
   int64 reviews = 5;
}
```

The protocol buffer compiler creates a builder for the `Venue` message. It has setters for each field defined above. We could map to this type using its builder. 

```kotlin
Venue.newBuilder()
  .setName(...)
  .setLocation(...)
  .setVenueType(...)
  .setCheckins(...)
  .setReviews(...)
  .build()
```

#### Server Streaming

```proto
rpc listVenues(Location) returns (stream Venue) { }
```

A server streaming RPC call was defined using the `listVenues` method that returns a stream of venues. This translates into method that returns a [Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/) of `Venue`.

```kotlin
class VenueGrpcService: VenueServiceGrpcKt.VenueServiceCoroutineImplBase() {

  override fun listVenues(request: Location): Flow<Venue> {
      return db.getVenues(request).asFlow()
  }

}
```

We might have logic to query our database to get a list of venues nearby. The list return could be transformed into a `Flow` using the `asFlow` extension.

#### Client Streaming

A client streaming RPC call is also mapped to a `Flow`. But, the parameter of the generated is a Flow of requests. 

```proto
rpc RecordTrip(stream Location) returns (TripSummary) {}
```

This RPC method is translated as follows.

```kotlin
class VenueGrpcService: VenueServiceGrpcKt.VenueServiceCoroutineImplBase() {

   override suspend fun recordTrip(requests: Flow<Location>): TripSummary {
        ...
    }

}
```

In this generated method, the return type is a single message `TripSummary`. The request is a flow of locations.


#### Bidirectional Streaming

As we saw earlier, a bidirectional streaming call is a streaming responses and requests. 

```proto
rpc chat(stream Comment) returns (stream Comment) {}
```

```kotlin
class VenueGrpcService: VenueServiceGrpcKt.VenueServiceCoroutineImplBase() {

   override fun chat(requests: Flow<Comment>): Flow<Comment> {
        ...
   }

}
```

The chat RPC call translates to a method that takes a Flow of comments and returns a Flow of comments. 

### Config & Start gRPC Server

We have implemented each RPC call. How do we configure and start our gRPC server? The gRPC-Kotlin library is built on top of [gRPC-Java](https://github.com/grpc/grpc-java). It provides a [builder](https://github.com/grpc/grpc-java/blob/master/api/src/main/java/io/grpc/ServerBuilder.java) to get configure and start a gRPC server. 

```kotlin
val server = ServerBuilder
    .forPort(port)
    .addService(VenueService())
    .build()
```

In the code snippet above, we are creating a server by specifying a port and our `VenurService`. We could specify as many services we want.

```kotlin
fun main() {
   val server = ServerBuilder
    .forPort(port)
    .addService(VenueService())
    .build()

   server.start()
   server.blockUntilShutdown()
}

```

We could start and shutdown as desired in a main method.

## Testing with Bloom RPC

[Bloom RPC](https://github.com/uw-labs/bloomrpc) is a GUI client that allows you test your RPC service. The `VenueService` protocol buffer file could be added to it with the host and port. With Bloom RPC, you could call any RPC method with request and view the response.

## Building gRPC Andorid Client

We have built a gRPC server using gRPC-Kotlin. How do we use this library to make RPC calls to this server on Android? 

### RPC Calls

The first step is to copy the protocol buffer file from the server to the client. We had specified these RPC calls on the service. 

```kotlin 
service VenueService {

   rpc GetVenue(Location) returns (Venue) {}

   rpc listVenues(Location) returns (stream Venue) { }

   rpc RecordTrip(stream Location) returns (TripSummary) {}

   rpc chat(stream Comment) returns (stream Comment) {}

}
```

We'll create a similar protocol buffer line in the proto folder in the Android app. We'll add the service above and all the RPC calls.

### Creating Channel

The next step to make an RPC call is to create a [ManagedChannel](https://grpc.github.io/grpc-java/javadoc/io/grpc/ManagedChannel.html). A `ManagedChannel`  specifies the server and port of the gRPC server. The [ManagedChannelBuilder](https://grpc.github.io/grpc-java/javadoc/io/grpc/ManagedChannelBuilder.html) can be used to build this object.

```kotlin
val managedChannel = ManagedChannelBuilder
    .forAddress(host, port)
    .useTransportSecurity()
    .build()
```

The method [`useTransportSecurity`](https://grpc.github.io/grpc-java/javadoc/io/grpc/ManagedChannelBuilder.html#useTransportSecurity--) is used if your host uses `https`. Otherwise, [`usePlainText`](https://grpc.github.io/grpc-java/javadoc/io/grpc/ManagedChannelBuilder.html#usePlaintext--) can be used.

I may need to setup an intercept that will be called when an RPC call is made. An `intercept` method is provided in the builder which takes in a `ClientInterceptor`.

```kotlin
val managedChannel = ManagedChannelBuilder
    .forAddress(host, port)
    .intercept(object : ClientInterceptor {
        fun interceptCall(method, callOptions, channel) {
          ...
    })
  .build()

```

### Generated Client

When you build the Android app, it will run a task to generate a client from your service defined in the protocol buffer file.

```kotlin
class VenueServiceCoroutineKt {

  suspend fun getVenue(request: Location): Venue

  fun listVenues(request: Location): Flow<Venue>

  suspend fun recordTrip(requests: Flow<Location>): TripSummary

  fun chat(requests: Flow<Comment>): Flow<Comment>

}
```

This is the generated class. It looks very similar to the service generated on backend. For a unary RPC call, the `getVenue` method is suspended. Any streaming messages are mapped to a Flow. For example the chat method takes in a Flow of comments and returns a Flow of comments.

### Setup Client

In order to create the generated client, we need to pass to it the `ManagedChannel` object we had created. 

```kotlin
val managedChannel = ManagedChannelBuilder
    .forAddress(host, port)
    .useTransportSecurity()
    .build()

val client = VenueServiceCoroutineKt(managedChannel)
```

### How the Client makes RPC Calls

The generated client stub contains logic to make an RPC call. Each rpc calls the method below which is in the gRPC-kotlin library.

```kotlin
 private fun <RequestT, ResponseT> rpcImpl(...): Flow<ResponseT> = flow {
    coroutineScope {
      val clientCall: ClientCall<RequestT, ResponseT> = channel.newCall(method, callOptions)

      val responses = Channel<ResponseT>(1)
      val readiness = Readiness { clientCall.isReady }

      clientCall.start(
        object : ClientCall.Listener<ResponseT>() {
          override fun onMessage(message: ResponseT) {
            if (!responses.offer(message)) {
              throw AssertionError("onMessage should never be called until responses is ready")
            }
          }

          override fun onClose(status: Status, trailersMetadata: GrpcMetadata) {
            responses.close(
              cause = if (status.isOk) null else status.asException(trailersMetadata)
            )
          }

          override fun onReady() {
            readiness.onReady()
          }
        },
        headers
      )

      val sender = launch(CoroutineName("SendMessage worker for ${method.fullMethodName}")) {
        try {
          request.sendTo(clientCall, readiness)
          clientCall.halfClose()
        } catch (ex: Exception) {
          clientCall.cancel("Collection of requests completed exceptionally", ex)
          throw ex // propagate failure upward
        }
      }

      try {
        clientCall.request(1)
        for (response in responses) {
          emit(response)
          clientCall.request(1)
        }
      } catch (e: Exception) {
        withContext(NonCancellable) {
          sender.cancelAndJoin("Collection of responses completed exceptionally", e)
          // we want sender to be done cancelling before we cancel clientCall, or it might try
          // sending to a dead call, which results in ugly exception messages
          clientCall.cancel("Collection of responses completed exceptionally", e)
        }
        throw e
      }
      if (!sender.isCompleted) {
        sender.cancel("Collection of responses completed before collection of requests")
      }
    }
  }
}
```
Source: [ClientCalls.kt](https://github.com/grpc/grpc-kotlin/blob/master/stub/src/main/java/io/grpc/kotlin/ClientCalls.kt)

Let's breakdown how this method works. The `rpcImpl` method creates Flow of responses. Here is a diagram that explains what's happening in this method.

![client-server-diagram](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-6.png)

The Flow above created a coroutines using [`coroutineScope`](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) builder. The gRPC-Java library has the class [`ClientCall`](https://grpc.github.io/grpc-java/javadoc/io/grpc/ClientCall.html) that can be used to start the RPC connection and make a call. When an RPC method is called, the gRPC client is started in the coroutine. It takes in a callback [ClientCall.Listener](https://grpc.github.io/grpc-java/javadoc/io/grpc/ClientCall.Listener.html) to receive reponses.

```kotlin
clientCall.start(
  object : ClientCall.Listener<ResponseT>() {
    override fun onMessage(message: ResponseT) {
      if (!responses.offer(message)) {
        throw AssertionError("onMessage should never be called until responses is ready")
      }
    }

    override fun onClose(status: Status, trailersMetadata: GrpcMetadata) {
      responses.close(
        cause = if (status.isOk) null else status.asException(trailersMetadata)
      )
    }

    override fun onReady() {
      readiness.onReady()
    }
  },
  headers
)
```
Source: [ClientCalls.kt](https://github.com/grpc/grpc-kotlin/blob/master/stub/src/main/java/io/grpc/kotlin/ClientCalls.kt)

When a message is recieved, the response is stored in a coroutines [Channel](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel/) with a buffer size of 1. 

```kotlin
val responses = Channel<ResponseT>(1)

override fun onMessage(message: ResponseT) {
  if (!responses.offer(message)) {
    throw AssertionError("onMessage should never be called until responses is ready")
  }
}
```

The coroutine also creates a child coroutine using the [launch](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) method. It suspends the coroutine until a response is received.

```kotlin
val sender = launch(CoroutineName("SendMessage worker for ${method.fullMethodName}")) {
    try {
      request.sendTo(clientCall, readiness)
      clientCall.halfClose()
    } catch (ex: Exception) {
      clientCall.cancel("Collection of requests completed exceptionally", ex)
      throw ex // propagate failure upward
    }
  }
```

Finally, the request is sent using the [`request`](https://grpc.github.io/grpc-java/javadoc/io/grpc/ClientCall.html#request-int-) method. The parameter takes in the number of messages to deliver.

```kotlin
flow {
   ...

   clientCall.request(1)

   for (response in responses) {
     emit(response)
     clientCall.request(1)
  }

  ...

}
```

Any response received from the responses channel is emitted to Flow. This is how RPC calls are made using coroutines in the gRPC Kotlin library.

### Client Usage

We could use the generated client in a [ViewModel](https://developer.android.com/reference/android/arch/lifecycle/ViewModel).

![client-viewmodel-diagram](/assets/images/grpc-kotlin-coroutines/grpc-kotlin-coroutines-7.png)

```kotlin
class MyViewModel(val clientStub: VenueServiceCoroutineKt): ViewModel() {

    fun listPlaces(location: Location) {
        clientStub.listVenues(location)
                  .collect {
                       ...
                   }
    }

}
```

When the `listPlaces` server streaming method is called, it will make the RPC call and the responses will be given in the [collect](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) method.

We have created a server and consumed it in an Android client. I hope this article was useful in using gRPC with Kotlin coroutines. Please check out my talk on gRPC with Kotlin coroutines at the [Kotlin London Meetup](https://youtu.be/V3BzDyQVeGw?t=255).

## Resources

* [gRPC-Kotlin Talk @ Kotlin London Meetup](https://youtu.be/V3BzDyQVeGw?t=255)

* [gRPC-Kotlin](https://github.com/grpc/grpc-kotlin)

* [grpc-Java](https://github.com/grpc/grpc-java)

* [Protocol Buffers](https://developers.google.com/protocol-buffers)

* [Bloom RPC](https://github.com/uw-labs/bloomrpc)




