# Brownian Motion in Finance Modeling the Chaos of Market Movements

Brownian Motion in Finance: Modeling the Chaos of Market Movements

Financial Market is defined by its volatility and inherent risk. In past few decades mathematicians have been trying to model this market attempting to predict the Prices of financial commodities and its “Optimal Trading Strategy”.

But due the highly stochastic nature of Market due to many random and unpredictable factors, such as news events, market sentiment, and changes in interest rates. Predicting its price is very difficult, maybe imposible. But we can still model its movement — Answer to this was Brownian Motion.

Brownian Motion is a continuous stochastic process that help us to model the movement of StockPrices(has some twists at the end). It is the building block of financial mathematics. It assumes that stock price changes are random and independent, with a normal distribution of returns over time. This model serves as the foundation for more advanced frameworks like Geometric Brownian Motion, which incorporates additional factors such as compounding and volatility. These models, while not perfect, provide a crucial tool for understanding market behaviour and formulating strategies in the face of uncertainty.

This is an graph of “Brownian Motion”
Stochastic nature of stocks.
Properties of the Brownian Motion:
Starts at “Zero”
Continious in Time
Increments are random and follows.
Independent on what happened before i.e., ℤ(S) — ℤ(U) is independent of everything before “U”. Taking any two time segments of this process have no effect on one another.
In this Article we will consider Symmetric Random Walk, Scaled Random Walk, Martingale and Wiener Process.

## Random Walk

Random Walks are used to model situations in which an object moves in a sequence of steps in randomly chosen directions. Many phenomena can be modeled as a random walk. some examples include — Brownian motion, Swimming of E. coli, Polymer Random coils and Protein search for a binding site on DNA

_Time series line of Random walk on a 1D lattice_

_Source: Princeton University, MAE 545: Lecture17_

### Symmetric Random Walk

Brownian motion follows “Symmetric Random Walk” which is also known as “Dunkard Walk” (which is either up down).

_Picture you have successive coin tosses, ⍵= ⍵1, ⍵2, ⍵3, … Where ⍵n is the outcome of the nth toss._

The increments in random walk states for any set of time steps have the following properties:

Independent Incements
Martingale(i.e., Zero-Drift) Property (Expected value of any Increment is 0)
Quadratic Variations

```python
# Parameters
M = 10 # number of simulations
t = 10 # Time
random_walk = [-1, 1]
steps = np.random.choice(random_walk, size=(M,t)).T
origin = np.zeros((1,M))
rw_paths = np.concatenate([origin, steps]).cumsum(axis=0)
plt.plot(rw_paths)
plt.xlabel("Years (t)")
plt.ylabel("Move")
plt.show()
Image Plot of Symmetric Random Walk
Symmetric Random Walk
```

### Brownian Motion as Scaled Random Walk

Now let us take our simple symmetric random walk process ℤ, and the simultaneously:

Speed up time
Scale down the size of atomic increments Yt.
For any fixed positive integer n it is defined as:

_Mathematical Equation for Scaled Random Walk_

_Source: Stanford-RLForFinanceBook: Appendix3_

Above properties of the simple random walk hold for ℤ(n) process as well. Now consider the continuous-time process ℤ defined as:

_Mathematical Equation for Scaled Random Walk, as n tends to infinity_

_Source: Stanford-RLForFinanceBook: Appendix3_

As n->∞ then this continuous-time process ℤ with ℤ0 = 0 is known as standard Brownian Motion.

```python
# Parameters
M = 10 # number of simulation
t = 10 # Time
n = 10
random_walk = [-1, 1]
steps = np.random.choice(random_walk, size=(M,t*n)).T
origin = np.zeros((1,M))
srw_path = np.concatenate([origin, steps]).cumsum(axis=0)
time = np.linspace(0, t, t*n+1)
tt = np.full(shape=(M, t*n+1), fill_value=time)
tt = tt.T
plt.plot(tt, rw_path)
plt.xlabel("Years (t)")
plt.ylabel("Move")
plt.show()
Plot for Scaled Random Walk
Scaled Random Walk
```

## Martingale

A martingale is a mathematical concept in probability theory and statistics that describes a type of stochastic process. It is defined within a filtration(Ω, F, P) where Ω represents the sample space, F is the sigma algebra (capturing the available information), and P is the probability measure. As a random experiment progress and new information becomes available, then we know that which part of the 𝝈 Algebra we already know. [F = {ɸ, Ω, A, A+} -> σ algebra]

For example :consider the conditional expectation of a fair coin toss in a symmetric random walk. The expected value of the next step, given the current position, is equal to the current position itself — making it a martingale— making it a martingale.

Martingale is an interesting concept from not only mathematical perspective but also have practical connections to gambling and finance. We will dive deeper into Martingale into future Articles.

## Wiener Process and Brownian Motion

The Wiener process is the mathematical foundation of Brownian motion. We consider a continuous time world t∈ [0,∞). Imagine that every Δt intervals, a process x(t) either goes up or down:

Δx ≡ x(t+Δt) — x(t) = {+h with prob p, -p with prob q≡1-p}

When we let Δt converge to zero, the limiting process is called a continous time random walk with(instantaneous) drift ⍺ and (instantaneous) variance σ². We generated this continuous time-stochastic process by building it up as a limit case. We could have also just defined the process direclty.

Definition: If a continuous time stochastic process, z(t), is a Wiener Process, then z(t`)-z(t) satisfies the following conditions:

z(t`)-z(t) ~ N(0, t`-t)
if t ≤ t` ≤ t`` ≤ t```,

_Wiener Process equation_

_Source: Harvard-Economics 2010c: Lecture 8 (by David Laibson)_

## Conclusion, Future Discussions and References

### Conclusion

We discussed Brownian motion, as explored with the help of symmetric random walks, scaled random walks, martingales and Wiener Process which serves as a cornerstone in understanding stochastic processes. We also saw various plots for better understanding.

### Future Discussions

As we wrap this up it is important to note that modeling financial markets — We use Geometric Brownian motion(GBM). Unlike standard Brownian motion, GBM accounts for the fact that asset prices cannot become negative, a limitation of normal Brownian motion, which can approach zero.

In my next article, I will explore Geometric Brownian Motion in detail and its applications in financial modeling.

### References

To write this article I referred Materials from Stanford(RLForFinance), Harvard(by Prof. David Laibson), MIT, Princeton(MAE 545) and IIT Kanpur(by Prof. Joydeep Dutta).