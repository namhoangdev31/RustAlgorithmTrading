# The Hidden Rhythm of Brownian Motion

The Hidden Rhythm of Brownian Motion
Dr. Walid Soula
Dr. Walid Soula

Following
14

Predicting the unpredictable can be seen as confusing, but that’s what we are trying to do with stochastic processes to predict the final market, and at the center of the framework lies Brownian motion, also called the Wiener process, named after Norbert Wiener, an American mathematician who rigorously defined it in the early 20th century

In this article, I will cover Brownian motion, the building block of modern quantitative finance, powering models such as Black–Scholes for option pricing, Heston for stochastic volatility, and Vasicek/CIR for interest rates that I may cover in future articles

As always, if you find my articles interesting, don’t forget to clap and follow 👍🏼 These articles take time and effort to create!

Let’s start with the fundamentals by understanding Brownian Motion
Like everyday life, in finance almost everything we care about is uncertain “Will a stock go up or down tomorrow?”, “How much will interest rates move in the next month?”…

We know these variables are unpredictable, yet we also know they follow patterns of variability that can be measured, modeled, and simulated

That’s why we use Brownian motion, to understand the concept, let’s compare it with a random walk to build your intuition

From Random Walk to Brownian Motion
Imagine a simple random walk, at each step you either move up by +1 or down by -1, each with equal probability of 50%. For instance:

After 1 step: you’re at +1 or –1
After 2 steps: you could be at –2, 0, or +2
After 3 steps: possible positions are –3, –1, +1, or +3
This path is unpredictable at each step right ? but if you simulate many such random walks, a pattern emerges like “The average position stays around 0 (no drift)”

Brownian motion can be thought of as the limit of this random walk when the steps become infinitely small and infinitely frequent

Instead of discrete jumps, the path becomes continuous, the randomness is still there, but spread smoothly over time

Random Walk vs Brownian Motion. Image Source : https://www.researchgate.net/figure/Random-walk-and-Brownian-motion-a-The-random-walk-is-defined-on-the-discrete-state_fig3_339088505
How Brownian Motion Moves
Imagine we want to describe the random evolution of a stock price, but in the simplest possible way. We’ll call the process that represents this randomness Wt ​, where t stands for time

We start from zero At t = 0 and as time goes on, Wt moves randomly up and down. To better understand and formalize this motion, we look at the key properties of Brownian motion

Properties of Brownain Motion
1 — Property I : Starting point

We anchor the motion by fixing a starting point. For simplicity, we take W0​=0

Note: you can start elsewhere (say at x), and the same ideas still apply

You can start elsewhere too. Image Source : 
Dr. Walid Soula
2 — Property II: Independent Increments

To capture randomness over time, the future movement of the process shouldn’t depend on its past. This means the increments of Wt over non-overlapping intervals are independent

Example :

t1 = 0 , t2 = 1 => increment A = W1 − W0 (interval [0,1] )
t3 = 1 , t4 = 2 => increment B = W2 − W1 ​ (interval [1,2] )
Since these intervals don’t overlap (touching at t=1 is fine), A and B are independent

3 — Property III: Stationary Increments

The variability of the process depends only on the length of the interval, not its position in time

Mean: 0
Variance: t2−t1​
So, for any interval [t₁, t₂], the increment Wt2−Wt1​​ behaves the same, regardless of when the interval occurs

4 — Property IV: Continuous Path

Imagine drawing the path of Wt ​ without lifting your pencil, that’s how continuous the trajectory is (There are no jumps or sudden breaks; the motion flows smoothly over time)

Property IV : Continuous Paths. Image Source : 
Dr. Walid Soula
Ω is the sample space containing the set of all possible outcomes

An element ω ∈ Ω represents one particular outcome of randomness

Example: rolling a dice => Ω = {1,2,3,4,5,6}
For Brownian motion, ω is not a number but a whole random trajectory (a path)
Wt​(ω) is the the value of Brownian motion at time t, given the random outcome ω (path)

t => Wt(ω) is continuous (if you fix one ω (so one path), then as t changes, the function Wt(ω) has no jumps)

{ω∈ Ω: t => Wt​(ω) is continuous} meaning : the set of all outcomes ω whose Brownian trajectory is continuous

P(⋯)=1 meaning : = with probability one (almost surely), all Brownian paths are continuous

We are done with the properties, here is a quick recap so you can keep going smoothly

Brownain Motion Properties. Image Source : 
Dr. Walid Soula
Math behind it
Now that we understand the idea of Brownian motion and its properties, we can write it mathematically. As I already said, think of Wt as a random variable at each time t whose behavior satisfies the rules I wrote above (the properties). Formally, we write it as follows:

Increment of the Brownian motion. Image Source : 
Dr. Walid Soula
t is the current time you’re interested in
s is an earlier time before t (so 0≤s<t)
Wt​−Ws​ is the increment of Brownian motion between time s and time t
Note : The change in Brownian motion from an earlier time s to a later time t is normally distributed with mean 0 and variance t−s

Example. Image Source : 
Dr. Walid Soula
The mean is always 0 (no drift by default)
The variance equals the length of the interval t−s
And increments over non-overlapping intervals are independent
Geometric Brownian Motion
We have seen how Brownian motion captures randomness in continuous time, right ? But in finance, quantities like stock prices behave a little differently

They cannot be negative
Their changes are proportional to their current value
To model this, we use Geometric Brownian Motion (GBM). Instead of modeling the stock price directly, GBM models the percentage change in the stock. Formally, we write:

Geometric Brownian Motion. Image Source : 
Dr. Walid Soula
St = stock price at time t
μ = expected return (drift)
σ = volatility (random fluctuations)
dWt = Brownian motion increment
Note :

The first term in the Geometric Brownain Motion “μSt​dt” is the drift showing the expected growth
The second term “σStdWt” introduces random fluctuations proportional to the stock price

Example. Image Source : 
Dr. Walid Soula
Let’s have a quick example of it’s use :

Imagine a stock starts at $100 (S0=100)
Drift μ=0.05 (5% per year)
Volatility σ=0.2 (20% per year)
Step 1 — Import the necessary libraries

```python
import numpy as np
import matplotlib.pyplot as plt
Step 2 — Define the simulation parameters

# Parameters
S0 = 100       # initial stock price
mu = 0.05      # drift
sigma = 0.2    # volatility
T = 1          # time in years
N = 252        # trading days
dt = T/N       # time step
Step 3— Simulate Brownian motion

# Simulate Brownian increments
dW = np.random.normal(0, np.sqrt(dt), size=N) #1 
W = np.cumsum(dW)  # Brownian path #2
With #1 inside the code, I will generate random values from a normal distribution with :

Mean = 0 (centered at 0, no bias)
Standard deviation = √dt (scales with the time step)
#2 is the cumsum of the increments giving us the Brownain motion path

Step 4 — Geometric Brownian Motion (GBM)

# Geometric Brownian Motion
t = np.linspace(0, T, N) #1 
S = S0 * np.exp((mu - 0.5 * sigma**2)*t + sigma * W)#2
#1 Creates a time grid from 0 to T with N points

# 2 is the solution of the stochastic differential equation (SDE) that we saw above “Geometric Brownian Motion”

Geometric Brownian Motion. Image Source : 
Dr. Walid Soula

Explicit solution of GBM. Image Source : 
Dr. Walid Soula
Step 5 — Plot the results

# Plot
plt.plot(t, S)
plt.title("Simulated Stock Price Path (GBM)")
plt.xlabel("Time (Years)")
plt.ylabel("Stock Price")
plt.show()

Simulated Stock Price Path (GBM). Image Source : 
Dr. Walid Soula
Why It Matters ?

Meme. Image Source : https://imgflip.com/i/slyt3
So, why did we go through all this math, random walks, and code? Because Brownian motion, and especially its extension, Geometric Brownian Motion is the backbone of modern finance

Stock price modeling to describe the random yet continous movement of stock prices (I will probably write about Black–Scholes option pricing model in another article)
By assuming asset prices follow GBM, you can derive closed-form formulas for options
Provides a framework for simulating future price scenarios (useful for Value-at-Risk (VAR))
You can also use it for forcasting stuff beyond finance like in physics, biology and economics
We did a long run, maybe next time I will write about the Black–Scholes option pricing model. If there’s a specific topic you’d like me to cover, please don’t hesitate to let me know. Your input helps shape the direction of my content and keeps it relevant and engaging😀
```