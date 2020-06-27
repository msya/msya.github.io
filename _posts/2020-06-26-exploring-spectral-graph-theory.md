---
title: "Exploring Spectral Graph Theory"
excerpt: "Learn about how we could use Linear Algebra to explore spectral properties of graphs."
header:
   teaser: "/assets/images/exploring-spectral-graph-theory/graph-example-3.png"
date: 2020-06-26
categories:
  - math
tags:
  - graphs
layout: single
author_profile: false
classes: widest
toc: true
toc_label: "Table of Contents"
toc_sticky: true
---

In this article, I'll explore spectral properties of graphs using Linear Algebra. I will make this article as self contained as possible. But, having prior knowledge of Linear Algebra is important. I'll introduce any background needed.

## Set Theory

Mathematics is a language. The definitions of concepts in mathematics are defined precisely. It allows us to reason about them with proofs. The concepts are explained through set theory. Set theory could be used as a possible foundation for mathematics. There is a rigirous treatment of set theory itself called [Zermalo-Fraenkel Set Theory](https://en.wikipedia.org/wiki/Zermelo%E2%80%93Fraenkel_set_theory). I'll introduce enough set theory to explain graphs. 

__Definition__: A __set__ is a collection of objects. We could denote the elements of a set in a comma separated list that is enclosed with braces.<br/><br/> Ex: <br/><br/>A = {1, 2, 3, 4} <br/><br/>We could specify an element belongs to a set. The expression 1 $$\varepsilon$$ A is read as 1 is a member of A. 
{: .notice--warning}

### Subset

A set can be contained in another set. This relationship is defined by a subset.

__Definition__: Assume we have two sets A and B. A is a __subset__ of A if every element of A is an element of B. In other words, A is contained in B. This is denoted as A $$ \subseteq $$ B. 
{: .notice--warning}

There are two possiblities for subsets. First, A and B could be equal or B could have more elements than A. The case where B has more elements than A is referred to as a proper subset. 

__Definition__: Assume we have two sets A and B and A not equal to B. A is a __proper subset__ of B. B is called the __superset__ of A. This is denoted as A $$ \subset $$ B.
{: .notice--warning}

This diagram shows this relationship among the two sets. 

![subset](/assets/images/exploring-spectral-graph-theory/subset.png)

There are basic operations that can be performed on a set. We could take the union and intersection of sets. 

### Union

__Definition__: Assume we have two sets A and B. The __union__ of A and B is the set of all elements that are in A or B. This written in set builder notation as $$ A \cup B = \{\,x\mid x \in A \lor x \in B\,\} $$. 
{: .notice--warning}

![set-union](/assets/images/exploring-spectral-graph-theory/set-union.png)

In this diagram, we have a universal set where $$ A \subset U $$ and $$ B \subset U $$. The area highlighted above is the set $$ A \cup B $$. 

### Intersection

__Definition__: Assume we have two sets A and B. The __intersection__ of A and B is the set of all elements that are in A and B. This written in set builder notation as $$ A \cap B = \{\,x\mid x \in A \land x \in B\,\} $$. 
{: .notice--warning}

### Ordered Pairs

Lastly, we'll define an ordered pair. 

__Definition__: An __ordered pair__ is a pair of objects denoted as (a, b). The ordered pair (a, b) is different from (b, a) unless a == b. On the other hand, an __unordered pair__ is (a, b) does not enforce any ordering.
{: .notice--warning}

We could use ordered pairs to define the cartesian product of two sets. 

### Cartesian Product

__Definition__: Suppose we have two sets A and B. Their __cartesian product__ is defined as $$ A \times B = \{\,(x,y)\mid x \in A \land y \in B \}  $$ It is the set of all ordered pairs (x, y) such that x is an element of A and y is an element of B.
{: .notice--warning}

There are many more topics in set theory. But, this is enough to define a graph and explore their properties. 

## Graphs

__Definition__: A __graph__ is an ordered pair G = (V, E). V is the set of all vertices in the graph. E is the set of all edges. $$ E \subset \{\,(x,y)\mid x \in V^2 \land x \neq y\} $$. $$ V^2 $$ is the set of all vertices that is defined as $$ V^2 = V \times V $$.
{: .notice--warning}

### Undirected Graph

As you could from this definition, we are using set theory to define a simple concept of a set. Here is an example of a graph.

![graph-example-1](/assets/images/exploring-spectral-graph-theory/graph-example-1.png)

This graph has the vertices V = {A, B, C} and edges E = {(A, B), (B, C)}. This is an example of an undirected graph. There isn't direction indicated in the connections betweens the vertices. The ordered pairs in the set of edges is unordered. 

### Directed Graph

Here is an example of a directed graph. 

![graph-example-2](/assets/images/exploring-spectral-graph-theory/graph-example-2.png)

There is directional arrow specified in the edges. This graph has the vertices V = {A, B, C} and the edges E = {(B, A), (A, C), (C, B)}. These are ordered pairs.

### Adjaceny Matrix

We could also represent a graph as a matrix, which a rectangular array of numbers. A matrix could defined with various levels of abstraction. Here is a simple definition that suffices for our dicussion.

__Definition__: A __matrix__ is a rectangular array of numbers. It is enclosed in brackets. A is an _m_ x _n_ matrix with elements at $$ a_{mn} $$. The subscripts m and n represent the column and row the element is located. Both _m_ and _n_ are positive integers.<br/><br/>A = $$ \begin{bmatrix} a_{11} & a_{12} & ... & a_{1n}\\ a_{21} & a_{22} & ... & a_{2n}\\ a_{31} & a_{32} & ... & a_{3n}\\ ... & ... & ... & ... \\ a_{m1} & a_{m2} & ... & a_{mn}\\ \end{bmatrix} $$
{: .notice--warning}

The representation of a graph is called an adjanceny matrix. Each element of the matrix is indicates whether there is an edge from one vertex to another. This graph's matrix is the following. 

![graph-example-1](/assets/images/exploring-spectral-graph-theory/graph-example-1.png){: .align left} A = $$ \begin{bmatrix} 0 & 1 & 0\\ 1 & 0 & 1\\ 0 & 1 & 0\\ \end{bmatrix} $$

__Definition__: Assume we have a graph G = (V, E). The values in the adjanceny matrix is described as follows.<br/> $$ a_{ij} = \begin{cases} 
      1  & \text{Edge between vertices}\\
      0  & \text{No edge between vertices}\\
   \end{cases} $$
{: .notice--warning}

The adjancey matrix allows us to use Linear Algebra to study the spectral properties of the graph.

### Symmetry 

An interesting feature of an undirected graph's adjaceny matrix is that it is symmetric. A matrix is symmetrix if it is equal to its transpose. 


__Definition__: Suppose we have an _m_ x _n_ matrix labeled A. The __transpose__ of A is the matrix _n_ x _m_ which is labeled $$ A^{T} $$. 
{: .notice--warning}

Example:

A = $$ \begin{bmatrix} 1 & 2\\ 3 & 4\\\end{bmatrix} $$

A<sup>T</sup> = $$ \begin{bmatrix} 1 & 3\\ 2 & 4\\\end{bmatrix} $$

__Theorem__: The adjaceny matrix for an undirected graph is symmetric. But, this is not true for a directed graph.
{: .notice--warning}

This is the adjaceny matrix of the undirect graph we looked at earlier.

A = $$ \begin{bmatrix} 0 & 1 & 0\\ 1 & 0 & 1\\ 0 & 1 & 0\\ \end{bmatrix} $$

Its transpose is the same. 

A<sup>T</sup> = $$ \begin{bmatrix} 0 & 1 & 0\\ 1 & 0 & 1\\ 0 & 1 & 0\\ \end{bmatrix} $$

### Graph Walks

__Definition__: Suppose we have a graph G = (V, E). A __walk__ from one vertex to another is a sequence of vertices. (v<sub>i</sub>, v<sub>j</sub>),(v<sub>j</sub>, v<sub>k</sub>),..., (v<sub>m</sub>, v<sub>n</sub>) is a walk from a vertex v<sub>i</sub> to v<sub>n</sub>. The length of the walk is the number of pairs in the sequence.
{: .notice--warning}

Example

![graph-example-1](/assets/images/exploring-spectral-graph-theory/graph-example-1.png){: .align left}

The sequence (A, B), (B, C) is a walk from A to C. 

__Theorem__: Assume G = (V, E) with adjancey matrix A<sub>G</sub>. If we raise A<sub>G</sub> to an n-th power, the a<sub>ij</sub> element of the matrix gives us the number of walks from v<sub>i</sub> and v<sub>j</sub> of length n. The value of n is a positive integer. 
{: .notice--warning}

Example

If we square the adjacency matrix for the undirected graph above, we get the following matrix. 

A = $$ \begin{bmatrix} 0 & 1 & 0\\ 1 & 0 & 1\\ 0 & 1 & 0\\ \end{bmatrix} $$

A<sup>2</sup> = $$ \begin{bmatrix} 1 & 0 & 1\\ 0 & 2 & 0\\ 1 & 0 & 1\\ \end{bmatrix} $$

In the matrix A<sup>2</sup>, there is a value of 1 at the location a<sub>00</sub>. This indicates that there is one walk of length 2 from the vertex A to itself. It is (A, B), (B, A). 

The value at location a<sub>11</sub> is 2. This means there are 2 walks of length 2 from B to itself. They are (B, C), (C, B) and (B, A) and (A, B).

If we were take powers of A to 3 and higher, we would get a resultant matrix which tells us the number of walk form one vertex to another vertex of length 3 or higher.  

### Complete Graph

__Definition__: A __complete graph__ is a graph  each pair of vertices is connected by an edge. It is denoted as M<sub>n</sub> where n is the number of vertices.
{: .notice--warning}

Example

M<sub>3</sub> = ![graph-example-3](/assets/images/exploring-spectral-graph-theory/graph-example-3.png){: .align left}


This complete graph has 3 vertices. Its adjacency matrix is the following. 

A = $$ \begin{bmatrix} 0 & 1 & 1\\ 1 & 0 & 1\\ 1 & 1 & 0\\ \end{bmatrix} $$

The spectrum of this graph M<sub>3</sub> is the eigenvalues of the adjacency matrix  and their multiplicities. 

### Eigenvalues & Eigenvector

__Definition__: If A is an _n_ x _n_ matrix, then a nonzero vector __x__ in R<sup>n</sup> is called an __eigenvector__ of A if Ax = λx for some scalar λ. The scalar λ is called an __eigenvalue__ of A, and x is said to be an eigenvector of A corresponding to λ. <sub>[1](https://www.wiley.com/en-us/Elementary+Linear+Algebra%2C+11th+Edition-p-9781119625698)</sub>
{: .notice--warning}

The characteristic equation det(λI – A) = 0, where I is the identity matrix, is used to find the eigenvalues. The left part of the characteristic equation det(λI – A) is called the characteristic polynomial of A.

The characteristic polynomial of M<sub>3</sub>(the adjacency matrix of M<sub>3</sub>) is the following. 


![eigenvalue-calculation](/assets/images/exploring-spectral-graph-theory/eigenvalue-calculation.png){: .align left}

Equating the characteristic polynomial to 0 and finding the roots of the polynomial gives the eigenvalues of A.

λ<sup>3</sup> - 3λ - 2 = 0<br/>
(λ - 2)(λ + 1)<sup>2</sup> = 0<br/>
(λ - 2)(λ + 1)(λ + 1) = 0<br/>

The eigenvalues are λ<sub>0</sub> = -1, λ<sub>1</sub> = -1 and λ<sub>2</sub> = 2.  The algebraic multiplicities of the roots are m(λ<sub>0</sub>) = 2 and m(λ<sub>2</sub>) = 1. The eigenvalues of A and their multiplicities form the spectrum of the complete graph M<sub>3</sub>.

### Graph spectrum

__Definition__: The __spectrum__ of a graph is the set of numbers which are eigenvalues of A, together with their multiplicities. If the distinct eigenvalues A are λ<sub>0</sub> > λ<sub>1</sub> > … > λ<sub>s-1</sub>, and their multiplicities are m(λ<sub>0</sub>), m(λ<sub>1</sub>),…,m(λ<sub>s-1</sub>), then we shall write. <br/><br/><br/>Spectrum = $$ \begin{pmatrix} λ_{0} & λ_{1} & .. & λ_{s-1}\\ m(λ_{0}) & m(λ_{1}) & .. & m(λ_{s-1}) \end{pmatrix} $$ <sub>[2](https://www.cambridge.org/core/books/algebraic-graph-theory/6C70471342F19680068C35EF174075DC)</sub>
{: .notice--warning}

Example:

M<sub>3</sub> = ![graph-example-3](/assets/images/exploring-spectral-graph-theory/graph-example-3.png){: .align left}

The spectrum of graph M<sub>3</sub> is the following matrix. 

Spectrum M<sub>3</sub> = $$ \begin{pmatrix} -1 & 2 \\ 2 & 1 \end{pmatrix} $$

### Spectrum Analysis
<br/>
If we write the characteristic polynomial of M<sub>3</sub> in the form 

λ<sup>n</sup> + c<sub>1</sub>λ<sup>n-1</sup> + c<sub>2</sub>λ<sup>n-2</sup> + c<sub>3</sub>λ<sup>n-3</sup> + … + c<sub>n</sub>

We could observe information about the sum of the eigenvalues and the trace of the adjacency matrix of M<sub>3</sub>. 

The characteristic polynomial of M<sub>3</sub> in this form is 

λ<sup>3</sup> + (-0)λ<sup>2</sup> + (-3)λ<sup>1</sup> + (-2)

* The coefficient c<sub>1</sub> is 0 which is the sum of the eigenvalues. λ<sub>0</sub> + λ<sub>1</sub> + λ<sub>2</sub> = -1 + -1 + 2 = 0. 
* The coefficient c<sub>1</sub> is also the trace of  (the adjacency matrix of M<sub>3</sub>).

This is true in general for complete graphs. The trace of the adjacency of complete graphs is c1 and sum of the eigenvalues will be the coefficient -c1.

__Theorem__: The coefficients of the characteristic polynomial of a graph G satisfy the following properties.<br/><br/>1. c1 = 0.<br/>2. –c2 is the number of edges of G.<br/>3. –c3 is twice the number of triangles in G. <sub>[2](https://www.cambridge.org/core/books/algebraic-graph-theory/6C70471342F19680068C35EF174075DC)</sub>
{: .notice--warning}

Example:

The coefficients of the characteristic polynomial of a graph M<sub>3</sub> satisfy the following.

1. c<sub>1</sub> = 0. 
2. –c<sub>2</sub> is the number of edges of G. 
3. –c<sub>3</sub> is twice the number of triangles in G.


This theorem is true for complete graphs with at least three vertices. In the characteristic polynomial equation of the adjacency matrix of M<sub>3</sub>.

λ<sup>3</sup> + (-0)λ<sup>2</sup> + (-3)λ<sup>1</sup> + (-2) 

1. c<sub>1</sub> = 0<br/>
2. -c<sub>2</sub> = -(-3) = 3 ---> The number of edges in the graph M<sub>3</sub>.<br/>
3. –c<sub>3</sub> = -(-2)= 2 ---> The number of triangles in M<sub>3</sub> is 1. The coefficient –c<sub>3</sub> = -(-2)= 2 is twice the number of triangles in M<sub>3</sub>.<br/>

### Regular graph

__Definition__: A regular graph is a graph whose vertices all have equal degrees. A m-regular graph is a   regular graph whose common degree is m.
{: .notice--warning}

Example:

![graph-example-4](/assets/images/exploring-spectral-graph-theory/graph-example-4.png){: .align left}

This is an example of a regular of degree 3. Each node has 3 connections in the graph.  There are several properties concerning the eigenvalues of regular graphs.

### Regular graph spectrum

__Definition__: If the simple graph G is m-regular, then<br/><br/>(1) m is an eigenvalue of G<br/>(2) the multiplicity of the eigenvalue m is 1, provided G is connected<br/>(3) $$ \mid λ \mid \leq m $$ for any eigenvalue of G.<sub>[2](https://www.cambridge.org/core/books/algebraic-graph-theory/6C70471342F19680068C35EF174075DC)</sub>
{: .notice--warning}

Example:

![graph-example-5](/assets/images/exploring-spectral-graph-theory/graph-example-5.png){: .align left}

This is an example of a 2-regular graph. Its graph’s adjacency matrix is the following. 

A = $$ \begin{bmatrix} 0 & 1 & 1\\ 1 & 0 & 1\\ 1 & 1 & 0\\ \end{bmatrix} $$

The characteristic polynomial of this matrix was found to be λ<sup>3</sup> - 3λ - 2. The eigenvalues are λ<sub>0</sub> = -1, λ<sub>1</sub> = -1 and λ<sub>2</sub> = 2. The multiplicieties of these eigenvalues are  m(λ<sub>0</sub>) = 2 and m(λ<sub>2</sub>) = 1. 

We could observe from the eigenvalues that k (the common degree of the graph) which is 2 is an eigenvalue and its multiplicity is 1. We could also observe that the absolute value of the eigenvalues λ<sub>0</sub>, λ<sub>1</sub>, λ<sub>2</sub> are less than or equal 2 which is the common degree of the regular graph G. We have confirmed by   example properties 1, 2 and 3 hold for a regular graph. 

I hope you found this article useful for learning algebraic graph theory. 

## References 

1. [Elementar Linear Algebra by Howard Anton](https://www.wiley.com/en-us/Elementary+Linear+Algebra%2C+11th+Edition-p-9781119625698)

2. [Algebraic Graph Theory by Norman Biggs](https://www.cambridge.org/core/books/algebraic-graph-theory/6C70471342F19680068C35EF174075DC)









