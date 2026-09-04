# Temperature Converter Website

This ia a responsive and interactive website designed to convert temperatures between **Celsius**, **Fahrenheit**, and **Kelvin** in real time. The website has dynamic color accent transitions based on the temperature state of the value entered (**Cold**, **Warm**, or **Hot**) which provides an engaging visual feedback system.

---

## Features

- **Multi-Unit Conversions:** Instantly converts any entered value across Celsius (°C), Fahrenheit (°F), and Kelvin (K).
- **Dynamic Temperature State Themes:**
  - **Cold (< 15°C):** Cool Blue & Slate Accent
  - **Warm (15°C – 32°C):** Warm Amber Accent
  - **Hot (> 32°C):** Crimson Red Accent
- **Validation & Absolute Zero Guard:** Includes input checks for valid numeric values and enforces physical limits for example it prevents temperatures below Absolute Zero / -273.15°C / 0K.

---

## Tech Stack

- **HTML5:** Semantic structural layout
- **CSS3:** Custom CSS variables, flexbox, grid, smooth transitions and responsive media queries
- **JavaScript (ES6+):** Conversion logic, DOM manipulation, input validation and dynamic class switching

---

## Project Structure

```text
OIBSIP/WebDev-L1-TemperatureConverter/
├── index.html             
├── styles.css             
└── script.js            