# QuantTrain — Curriculum

## Source of Truth

The full curriculum content lives in **`module.md`** (3,756 lines, 41 nodes across 12 Worlds + Orientation).

**Do not edit `CURRICULUM.md` for content changes.** All content lives in `module.md`. Run `node scripts/parse-md.js` after editing `module.md` to regenerate `data/curriculum.json`.

## Curriculum Overview

### WORLD 0 — Orientation (1 node)
| Node | Title |
|---|---|
| 1 | Welcome to Quant Research |

### WORLD 1 — Foundations (7 nodes)
| Node | Title |
|---|---|
| 2 | Financial Markets Basics |
| 3 | Mathematical Foundations |
| 4 | Python Fundamentals |
| 5 | Descriptive Statistics |
| 6 | Returns & Performance Basics |
| 7 | NumPy |
| 8 | Pandas |

### WORLD 2 — Probability & Statistical Reasoning (4 nodes)
| Node | Title |
|---|---|
| 9 | Probability |
| 10 | Probability Distributions |
| 11 | Statistical Inference |
| 12 | Regression Analysis |

### WORLD 3 — Linear Algebra & Calculus (2 nodes)
| Node | Title |
|---|---|
| 13 | Linear Algebra |
| 14 | Calculus for Finance |

### WORLD 4 — Data Engineering & Market Data (4 nodes)
| Node | Title |
|---|---|
| 15 | Market Data Engineering |
| 16 | Time Series Data |
| 17 | Data Visualization |
| 18 | Software Engineering for Research |

### WORLD 5 — Financial Markets Deep Dive (2 nodes)
| Node | Title |
|---|---|
| 19 | Market Microstructure |
| 20 | Risk Fundamentals |

### WORLD 6 — Econometrics & Time Series (3 nodes)
| Node | Title |
|---|---|
| 21 | Time Series Analysis |
| 22 | Applied Econometrics (Core) |
| 23 | Research Methodology |

### WORLD 7 — Technical Indicators & Signal Logic (4 nodes)
| Node | Title |
|---|---|
| 24 | Technical Analysis Foundations |
| 25 | Trend Indicators |
| 26 | Momentum Indicators |
| 27 | Volatility & Volume Indicators |

### WORLD 8 — Strategy Design & Philosophies (4 nodes)
| Node | Title |
|---|---|
| 28 | Strategy Design |
| 29 | Mean Reversion |
| 30 | Momentum Strategies |
| 31 | Statistical Arbitrage |

### WORLD 9 — Backtesting & Robustness (3 nodes)
| Node | Title |
|---|---|
| 32 | Backtesting |
| 33 | Bias & Robustness |
| 34 | Simulation |

### WORLD 10 — Portfolio & Performance (2 nodes)
| Node | Title |
|---|---|
| 35 | Portfolio Construction |
| 36 | Performance Evaluation |

### WORLD 11 — Dashboards & Tooling (1 node)
| Node | Title |
|---|---|
| 37 | Interactive Dashboards (Streamlit) |

### WORLD 12 — Professional Quant Research (4 nodes)
| Node | Title |
|---|---|
| 38 | Scientific Visualization |
| 39 | Research Papers |
| 40 | Research Communication |
| 41 | Capstone I — Tier 1 Readiness |

## World Summary

| World | Title | Nodes | Skills Covered |
|---|---|---|---|
| 0 | Orientation | 1 | Overview of quant research workflow and roles |
| 1 | Foundations | 7 | Markets, math, Python, stats, returns, NumPy, Pandas |
| 2 | Probability & Statistics | 4 | Probability, distributions, inference, regression |
| 3 | Linear Algebra & Calculus | 2 | Vectors/matrices, derivatives, optimization |
| 4 | Data Engineering | 4 | OHLCV, time series, visualization, software engineering |
| 5 | Markets Deep Dive | 2 | Microstructure, risk fundamentals |
| 6 | Econometrics | 3 | Time series, applied econometrics, research methodology |
| 7 | Technical Indicators | 4 | Price action, trend, momentum, volatility/volume |
| 8 | Strategy Design | 4 | Entry/exit rules, mean reversion, momentum, stat arb |
| 9 | Backtesting | 3 | Backtesting engine, bias/robustness, simulation |
| 10 | Portfolio & Performance | 2 | Construction, evaluation metrics |
| 11 | Dashboards & Tooling | 1 | Streamlit dashboards |
| 12 | Professional Research | 4 | Visualization, papers, communication, capstone |

## Data Structure

Each node in `module.md` follows a consistent structure that `scripts/parse-md.js` extracts:

```
## Node N: Title
### 🎯 Hook       → hook text
### 📌 Learning Objectives → list of objectives
### ---           → section dividers
### Section Heading → text, code, mermaid, or table content
### 🔗 Free Resources → list of resource links
### 📝 Quiz       → questions with options (✅ marks correct answer)
```

## Content Rules

1. Every node has exactly one 🎯 Hook section
2. Every node has exactly one 📌 Learning Objectives section
3. Every node has exactly one 🔗 Free Resources section
4. Every node has exactly one 📝 Quiz section with at least 2 questions
5. Quiz correct answers are marked with ✅ at the end of the option text
6. Nodes are separated by `---` dividers, worlds by `--- ---`

## Validation

After editing `module.md`, verify:
- All 41 nodes are present (numbered 1-41)
- No duplicate node IDs
- Each quiz has at least one correct answer marked with ✅
- All resource URLs are valid
