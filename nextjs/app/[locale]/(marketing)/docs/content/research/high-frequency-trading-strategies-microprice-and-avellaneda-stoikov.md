# High-Frequency Trading Strategies: Microprice and Avellaneda-Stoikov

A comprehensive, mathematically rigorous review of the research paper *High Frequency Trading Strategies* (Stanford University MS&E 448) by Joachim Sasson, Wei Hong Ho, and Finsam Samson. This document reconstructs 100% of the mathematical formulations, empirical parameters, data manipulation techniques, and results contained in the original paper.

---

## 1. Introduction & The Market Maker's Dilemma

High-frequency market makers face the challenge of estimating the "fair value" of an asset at sub-second scales to quote bid and ask prices without accumulating excessive inventory risk.

### 1.1 Pitfalls of Standard Price Estimators

1. **Mid-Price Flaws**: The classic mid-price is defined as:
   $$M_t = \frac{1}{2}(P_a^t + P_b^t)$$
   * **Bid-Ask Bounce**: Changes in the mid-price exhibit high auto-correlation.
   * **Low Frequency**: Mid-price changes are infrequent relative to order book updates (changes in queue sizes).
   * **Volume Ignorance**: It completely ignores the depth available at the best bid ($Q_b^t$) and best ask ($Q_a^t$).

2. **Weighted Mid-Price Flaws**: To include volume, the weighted mid-price is defined as:
   $$W_t = I_t P_a^t + (1 - I_t) P_b^t$$
   where the imbalance $I_t$ is defined as:
   $$I_t = \frac{Q_b^t}{Q_a^t + Q_b^t}$$
   * **Noisy Signal**: It changes on every minor update of order sizes, creating high-frequency noise.
   * **Non-Martingale**: It has no mathematical guarantee of being a "fair" long-term price (i.e., not necessarily a martingale).
   * **Counter-Intuitive Behavior (Numerical Example from Paper)**:
     Assume:
     $$P_b = 10.00, \quad Q_b = 9, \quad P_a = 10.02, \quad Q_a = 27$$
     Here, the imbalance is $I_t = \frac{9}{9+27} = 0.25$, yielding a weighted mid-price of:
     $$W_t = 0.25(10.02) + 0.75(10.00) = 10.005$$
     If a new sell limit order of size 1 arrives inside the spread at $10.01$, the new state becomes:
     $$P_b = 10.00, \quad Q_b = 9, \quad P_a = 10.01, \quad Q_a = 1$$
     The new imbalance is $I_{t+1} = \frac{9}{9+1} = 0.90$, yielding:
     $$W_{t+1} = 0.90(10.01) + 0.10(10.00) = 10.009$$
     *Analysis*: The arrival of a new sell order inside the spread updated the weighted mid-price **upwards** (from $10.005$ to $10.009$), whereas a sell order should intuitively push the estimated price downward.

---

## 2. The Microprice Framework (Stoikov, 2017)

The Microprice addresses these flaws by defining the fair value as the expected future mid-price at the horizon where the price next changes, conditioned on the current state of the order book:

$$P_{\text{micro}}^t = \lim_{i\to\infty} \mathbb{E}[M_{\tau_i} \mid \mathcal{F}_t]$$

where $\tau_i$ represents the discrete times when the mid-price actually changes:
$$\tau_1 = \inf\{u > t \mid M_u - M_{u-} \ne 0\}$$
$$\tau_{i+1} = \inf\{u > \tau_i \mid M_u - M_{u-} \ne 0\}$$

### 2.1 Model Assumptions

1. The information in the order book is fully captured by the filtration:
   $$\mathcal{F}_t = \sigma(M_s, I_s, S_s; s \le t)$$
   where $M_s$ is the mid-price, $I_s$ is the imbalance, and $S_s$ is the bid-ask spread. This defines the order book state as a Markov chain $X_t = (M_t, I_t, S_t)$.
2. Mid-price increments are independent of the absolute price level:
   $$\mathbb{E}[M_{\tau_{i+1}} - M_{\tau_i} \mid M_t = M, I_t = I, S_t = S] = \mathbb{E}[M_{\tau_{i+1}} - M_{\tau_i} \mid I_t = I, S_t = S]$$
   This simplifies the state space of the Markov chain to $X_t = (I_t, S_t)$.

Using these assumptions, the expected $i$-th microprice is decomposed as:
$$\mathbb{E}[M_{\tau_i} \mid \mathcal{F}_t] = M_t + \sum_{k=1}^i g_k(I_t, S_t)$$
where the first-order adjustment is:
$$g_1(I, S) = \mathbb{E}[M_{\tau_1} - M_t \mid I_t = I, S_t = S]$$
and the recursive $(i+1)$-th order adjustment is:
$$g_{i+1}(I, S) = \mathbb{E}[g_i(I_{\tau_1}, S_{\tau_1}) \mid I_t = I, S_t = S]$$

### 2.2 Finite-State Space Formulation

Under a finite state space for discretized imbalance $I_t$ and spread $S_t$, we can write:

$$P_{\text{micro}}^t = M_t + \sum_{k=1}^\infty B^k G_1$$

Where:
* $B = (I - Q)^{-1} T$
* $G_1 = (I - Q)^{-1} R K$
* $Q_{xy} = \mathbb{P}(M_{t+1} - M_t = 0 \cap X_{t+1} = y \mid X_t = x)$ represents transition probabilities for transient states (where the mid-price does not move).
* $T_{xy} = \mathbb{P}(M_{t+1} - M_t \ne 0 \cap X_{t+1} = y \mid X_t = x)$ represents transition probabilities into transient states when the mid-price moves.
* $R_{xk} = \mathbb{P}(M_{t+1} - M_t = k \mid X_t = x)$ represents transition probabilities into absorbing states (where the mid-price changes by tick size $k$).
* $K$ is the vector of possible price changes (e.g., $[-0.01, -0.005, 0.005, 0.01]^T$).

### 2.3 Implementation Details & Data Manipulation

1. **State Discretization**: Imbalance $I_t$ is discretized into $n$ buckets, and spread $S_t$ is discretized.
2. **Data Symmetrization**: To double the training sample size and enforce symmetry:
   $$I'_t = n - I_t, \quad S'_t = S_t, \quad (M'_{t+1} - M'_t) = -(M_{t+1} - M_t)$$
3. **Estimation of Matrices**: Transition probability matrices $Q$, $R_1$, and $R_2$ are estimated from tick-by-tick data, where:
   $$R_{2, ik} = \mathbb{P}(M_{t+1} - M_t \ne 0 \cap I_{t+1} = k \mid I_t = i)$$
4. **Recursive Execution**: The first-order adjustment is computed as:
   $$g_1 = (I - Q)^{-1} R_1 K$$
   The higher-order adjustments are updated recursively:
   $$g_{n+1} = B g_n = (I - Q)^{-1} R_2 g_n$$
   The series converges rapidly and is fully approximated at 6 iterations:
   $$P_{\text{micro}} - M_t \approx \sum_{j=1}^6 g_j = g_1 + B g_1 + \dots + B^5 g_1$$

### 2.4 Empirical Findings (AAPL & CVX)

* **Dataset**: Trained on AAPL (highly liquid) and CVX (moderately liquid) on Jan 5, 2021, using 0.1s intervals, totaling 288,000 data points.
* **Price Curve**: AAPL shows significantly smoother adjustment curves compared to Chevron (CVX). The microprice consistently stays bounded between the bid and ask price, and tracks between the mid-price and the weighted mid-price.
* **Stationary Distributions**:
  * **1-Tick Spread**: Both stocks display an **N-shaped** distribution, meaning the order book is balanced at the top (spread is narrow) most of the time.
  * **2-Tick Spread**: AAPL shows a **U-shaped** distribution (implying a wide spread is rare in highly liquid stocks and indicates a strong imbalance/momentum shock). CVX retains its **N-shaped** distribution.
* **Trading Value**: The microprice exhibits higher-frequency fluctuations than the mid-price, yielding viable short-term signals. However, using it directly as a fair-value estimator to trade without inventory constraints does not yield significant profits due to inventory risk.

---

## 3. The Avellaneda-Stoikov Model (2008)

The Avellaneda-Stoikov model treats market making as an optimal control problem, managing inventory risk by adjusting quote offsets relative to the agent's risk aversion.

### 3.1 Model Assumptions

1. **Mid-Price Process**: The asset price follows an arithmetic Brownian motion with constant volatility $\sigma$ (the paper text contains a slight contradiction, calling it geometric but formulating it arithmetically):
   $$dS_u = \sigma dW_u$$
2. **CARA Utility Function**: The market maker maximizes utility over terminal wealth at time horizon $T$:
   $$v(x, s, q, t) = \mathbb{E}\left[-\exp(-\gamma(x + q S_T))\right]$$
   where $x$ is wealth, $s$ is mid-price, $q$ is inventory, and $\gamma$ is the risk aversion parameter.
   The value function solves to:
   $$v(x, s, q, t) = -\exp(-\gamma x) \exp(-\gamma q s) \exp\left(\frac{\gamma^2 q^2 \sigma^2 (T - t)}{2}\right)$$
3. **Poisson Order Arrival**: The probability of limit orders being filled decreases exponentially with their distance from the mid-price:
   $$\lambda^a(\delta^a) = A e^{-k \delta^a}, \quad \lambda^b(\delta^b) = A e^{-k \delta^b}$$
   where $\delta^a = p^a - s$ (ask offset), $\delta^b = s - p^b$ (bid offset), and $A, k$ are market liquidity parameters.

### 3.2 Reservation Price & Indifference Quotes

The **Reservation Bid ($r^b$)** and **Reservation Ask ($r^a$)** represent the prices at which the agent is indifferent to adding or removing one unit of stock:
$$v(x - r^b(s, q, t), s, q + 1, t) = v(x, s, q, t)$$
$$v(x + r^a(s, q, t), s, q - 1, t) = v(x, s, q, t)$$

Solving these equations analytically yields:
$$r^b(s, q, t) = s - \frac{(1 + 2q)\gamma \sigma^2 (T - t)}{2}$$
$$r^a(s, q, t) = s + \frac{(1 - 2q)\gamma \sigma^2 (T - t)}{2}$$

The **Reservation Price ($r$)** is the midpoint of the reservation bid and ask:
$$r(s, q, t) = s - q \gamma \sigma^2 (T - t)$$

* **Long Inventory ($q > 0$)**: Skews $r$ below $s$ to encourage selling and discourage buying.
* **Short Inventory ($q < 0$)**: Skews $r$ above $s$ to encourage buying and discourage selling.

### 3.3 Optimal Quotes & HJB Solutions

The optimal offsets $\delta^a$ and $\delta^b$ are solved using Hamilton-Jacobi-Bellman (HJB) equations under the approximation:

$$\delta^a(q, t) = r^a(s, q, t) - s + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) = \frac{1 - 2q}{2} \gamma \sigma^2 (T - t) + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right)$$
$$\delta^b(q, t) = s - r^b(s, q, t) + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) = \frac{1 + 2q}{2} \gamma \sigma^2 (T - t) + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right)$$

This yields the optimal bid and ask quotes around the Reservation Price:
$$p^a(s, q, t) = r^a(s, q, t) + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) = r(s, q, t) + \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) + \frac{1}{2} \gamma \sigma^2 (T - t)$$
$$p^b(s, q, t) = r^b(s, q, t) - \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) = r(s, q, t) - \frac{1}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right) - \frac{1}{2} \gamma \sigma^2 (T - t)$$

The combined optimal spread is:
$$\delta^a + \delta^b = \gamma \sigma^2 (T - t) + \frac{2}{\gamma} \ln\left(1 + \frac{\gamma}{k}\right)$$

---

## 4. Empirical Performance & Results

The Avellaneda-Stoikov (AS) strategy was simulated against a **Control Strategy** (symmetric quoting around the mid-price $M_t$ ignoring inventory). Volatility $\sigma$ was estimated from sample variance, and $k$ was calculated as the change in volume per second.

### 4.1 Low Risk Aversion ($\gamma = 0.1$)

| Strategy | Profit | Std(Profit) | Average Inventory | Std(Inventory) |
| :--- | :--- | :--- | :--- | :--- |
| **Avellaneda-Stoikov (AS)** | 65.29 | 6.45 | -0.33 | **2.99** |
| **Control (Symmetric)** | 68.93 | 14.24 | 0.53 | **8.49** |

* **Analysis**: The AS strategy achieves a slightly lower profit than the control, which is expected due to inventory-skewing limits. However, it achieves **3x lower inventory variance** and **2.2x lower standard deviation of profit**, demonstrating successful risk mitigation.

### 4.2 Moderate Risk Aversion ($\gamma = 0.5$)

| Strategy | Profit | Std(Profit) | Average Inventory | Std(Inventory) |
| :--- | :--- | :--- | :--- | :--- |
| **Avellaneda-Stoikov (AS)** | 48.95 | 5.92 | -0.06 | **2.10** |
| **Control (Symmetric)** | 59.97 | 12.27 | -0.30 | **6.75** |

* **Analysis**: Increasing $\gamma$ to $0.5$ stabilizes the average inventory very close to zero (-0.06) and reduces inventory standard deviation to 2.10. However, this aggressive shading results in an ~18% reduction in profit compared to the control strategy.

---

## 5. Model Limitations & Extensions

1. **Unit Order Size**: The model assumes quotes are placed for exactly 1 unit of stock, ignoring volume pricing curves.
2. **Constant Parameters**: Volatility $\sigma$ and fill probability parameter $k$ are assumed constant, whereas market liquidity varies dynamically throughout the trading day.
3. **Signal Integration (Hybrid Model)**: The paper identifies that a key improvement is replacing the mid-price $S_u$ in the Avellaneda-Stoikov model with the Microprice $P_{\text{micro}}^t$, combining short-term book order flow alpha with the optimal inventory-control framework.

---

## 6. References

* **[1]** Sasha Stoikov. *The micro-price: A high frequency estimator of future prices*. Cornell University, 2017.
* **[2]** Marco Avellaneda and Sasha Stoikov. *High frequency trading in a limit order book*. Quantitative Finance, Vol. 8, No. 3, 217–224, 2008.
