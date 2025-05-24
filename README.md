# TTRPG Dice Roller 🎲

A multiplayer dice rolling application for tabletop role-playing games, built with React, TypeScript, and Three.js physics simulation.

## Features

### 🎲 **Realistic 3D Dice Physics**
- **D4 (Tetrahedron)** - Four-sided dice with inverted reading (reads from bottom face) ✅
- **D6 (Cube)** - Standard six-sided dice ✅
- **D8 (Octahedron)** - Eight-sided dice 🚧 *Coming Soon*
- **D10 (Pentagonal Trapezohedron)** - Ten-sided dice 🚧 *Coming Soon*
- **D12 (Dodecahedron)** - Twelve-sided dice 🚧 *Coming Soon*
- **D20 (Icosahedron)** - Twenty-sided dice 🚧 *Coming Soon*

### 🔧 **Physics Engine**
- **cannon-es** physics simulation for realistic dice rolling
- **ConvexPolyhedron** shapes for accurate collision detection
- **Gravity-based** value determination
- **Proper mass distribution** and damping for natural dice behavior

### 🎮 **Interactive Interface**
- **3D Canvas** with orbital controls for viewing dice
- **Dice Selection Panel** with visual dice type picker
- **One-click rolling** with physics simulation
- **Roll History** tracking recent results
- **Full-screen mode** for immersive experience

### 🌐 **Multiplayer Support**
- Real-time dice rolling with GraphQL subscriptions
- User registration and activity tracking
- Live activity feed showing all user rolls
- WebSocket-based real-time updates

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dice-roller

# Install dependencies
npm install

# Start the development server
npm run dev

# Start the backend server (in another terminal)
npm run server
```

### Usage

1. **Select Dice Type**: Choose from available dice types (D4, D6, etc.)
2. **Roll Dice**: Click the "Roll" button to throw the dice with physics
3. **View Results**: Watch the dice settle and see the result
4. **Track History**: Check recent rolls in the history panel
5. **Multiplayer**: Register a username to see other players' rolls

## Technical Implementation

### 🏗️ **Architecture**
- **Frontend**: React + TypeScript + Three.js + React Three Fiber
- **Backend**: GraphQL + WebSocket subscriptions
- **Physics**: cannon-es physics engine
- **Styling**: Tailwind CSS

### 🎲 **Dice Physics**
Each dice type has its own implementation:

```typescript
// D4 Example - Tetrahedron with inverted reading
const d4 = new DiceD4({
    size: 100,
    fontColor: '#000000',
    backColor: '#ffffff'
});

// Roll the dice
d4.throwDice(1.0); // Force multiplier

// Get result (reads from bottom face for D4)
const value = d4.getUpperValue(); // 1-4
```

### 🔧 **Key Features**
- **Inverted Reading**: D4 dice read from the bottom face (realistic behavior)
- **Physics Shapes**: ConvexPolyhedron for complex dice, Box for simple cubes
- **Value Mapping**: Accurate face-to-value relationships for each dice type
- **Error Handling**: Graceful fallbacks and validation

## Development Roadmap

### ✅ **Completed**
- ✅ Foundation Setup (Physics world, types, utilities)
- ✅ Core Physics Engine (DiceManager, DiceObject base class)
- ✅ D6 Implementation (Cube dice)
- ✅ D4 Implementation (Tetrahedron dice)
- ✅ DiceCanvas Integration (3D rendering and controls)
- ✅ Enhanced UI (Dice selection, roll history)

### 🚧 **In Progress**
- 🚧 D20 Implementation (Icosahedron)
- 🚧 D8 Implementation (Octahedron)
- 🚧 D10 & D12 Implementation

### 📋 **Upcoming**
- 📋 Advanced Features (Sound effects, animations)
- 📋 Performance Optimization
- 📋 Mobile Support
- 📋 Custom Dice Themes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **threejs-dice** - Original inspiration for dice physics implementation
- **cannon-es** - Modern physics engine
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
