export interface BlockShape {
  id: string
  name: string
  cells: [number, number][]
  color: string
  complexity: "simple" | "medium" | "complex"
}

// Base shapes with complexity ratings
const baseShapes: Omit<BlockShape, "id">[] = [
  // Simple shapes (good for beginners)
  { name: "single", cells: [[0, 0]], color: "from-red-500 to-red-600", complexity: "simple" },
  {
    name: "horizontal2",
    cells: [
      [0, 0],
      [0, 1],
    ],
    color: "from-orange-500 to-orange-600",
    complexity: "simple",
  },
  {
    name: "vertical2",
    cells: [
      [0, 0],
      [1, 0],
    ],
    color: "from-amber-500 to-amber-600",
    complexity: "simple",
  },
  {
    name: "horizontal3",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    color: "from-yellow-500 to-yellow-600",
    complexity: "simple",
  },
  {
    name: "vertical3",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    color: "from-lime-500 to-lime-600",
    complexity: "simple",
  },
  {
    name: "square2",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: "from-sky-500 to-sky-600",
    complexity: "simple",
  },
  {
    name: "corner1",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    color: "from-blue-400 to-blue-500",
    complexity: "simple",
  },
  {
    name: "corner2",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    color: "from-indigo-400 to-indigo-500",
    complexity: "simple",
  },
  {
    name: "corner3",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: "from-violet-400 to-violet-500",
    complexity: "simple",
  },
  {
    name: "corner4",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    color: "from-purple-400 to-purple-500",
    complexity: "simple",
  },

  // Medium complexity shapes
  {
    name: "horizontal4",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    color: "from-green-500 to-green-600",
    complexity: "medium",
  },
  {
    name: "vertical4",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    color: "from-emerald-500 to-emerald-600",
    complexity: "medium",
  },
  {
    name: "L1",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
    color: "from-indigo-500 to-indigo-600",
    complexity: "medium",
  },
  {
    name: "L2",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ],
    color: "from-violet-500 to-violet-600",
    complexity: "medium",
  },
  {
    name: "L3",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    color: "from-purple-500 to-purple-600",
    complexity: "medium",
  },
  {
    name: "L4",
    cells: [
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "from-fuchsia-500 to-fuchsia-600",
    complexity: "medium",
  },
  {
    name: "J1",
    cells: [
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1],
    ],
    color: "from-pink-500 to-pink-600",
    complexity: "medium",
  },
  {
    name: "J2",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "from-rose-500 to-rose-600",
    complexity: "medium",
  },
  {
    name: "J3",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
    ],
    color: "from-red-400 to-red-500",
    complexity: "medium",
  },
  {
    name: "J4",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    color: "from-orange-400 to-orange-500",
    complexity: "medium",
  },
  {
    name: "T1",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
    color: "from-amber-400 to-amber-500",
    complexity: "medium",
  },
  {
    name: "T2",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
    color: "from-yellow-400 to-yellow-500",
    complexity: "medium",
  },
  {
    name: "T3",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "from-lime-400 to-lime-500",
    complexity: "medium",
  },
  {
    name: "T4",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    color: "from-green-400 to-green-500",
    complexity: "medium",
  },
  {
    name: "S1",
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
    color: "from-emerald-400 to-emerald-500",
    complexity: "medium",
  },
  {
    name: "S2",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    color: "from-teal-400 to-teal-500",
    complexity: "medium",
  },
  {
    name: "Z1",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    color: "from-cyan-400 to-cyan-500",
    complexity: "medium",
  },
  {
    name: "Z2",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
    color: "from-sky-400 to-sky-500",
    complexity: "medium",
  },

  // Complex shapes (harder to place)
  {
    name: "horizontal5",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    color: "from-teal-500 to-teal-600",
    complexity: "complex",
  },
  {
    name: "vertical5",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ],
    color: "from-cyan-500 to-cyan-600",
    complexity: "complex",
  },
  {
    name: "square3",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    color: "from-blue-500 to-blue-600",
    complexity: "complex",
  },
  {
    name: "bigL1",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
    ],
    color: "from-indigo-600 to-purple-600",
    complexity: "complex",
  },
  {
    name: "bigL2",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
    ],
    color: "from-purple-600 to-pink-600",
    complexity: "complex",
  },
  {
    name: "plus",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
    ],
    color: "from-rose-500 to-red-600",
    complexity: "complex",
  },
]

export function getRandomShapes(count: number, score = 0): BlockShape[] {
  // Calculate complexity percentage based on score
  let complexPercent = 0.25 // Default: 25% complex

  if (score <= 2000) {
    complexPercent = 0.25 // Çok Kolay
  } else if (score <= 5000) {
    complexPercent = 0.35 // Kolay
  } else if (score <= 8000) {
    complexPercent = 0.5 // Orta
  } else if (score <= 11000) {
    complexPercent = 0.65 // Zor
  } else if (score <= 15000) {
    complexPercent = 0.85 // Çok Zor
  } else {
    complexPercent = 0.9 // Maksimum zorluk
  }

  const simpleShapes = baseShapes.filter((s) => s.complexity === "simple")
  const mediumShapes = baseShapes.filter((s) => s.complexity === "medium")
  const complexShapes = baseShapes.filter((s) => s.complexity === "complex")

  const shapes: BlockShape[] = []

  for (let i = 0; i < count; i++) {
    const rand = Math.random()
    let selectedPool: Omit<BlockShape, "id">[]

    if (rand < complexPercent * 0.4) {
      // Complex shapes
      selectedPool = complexShapes
    } else if (rand < complexPercent) {
      // Medium shapes
      selectedPool = mediumShapes
    } else {
      // Simple shapes
      selectedPool = simpleShapes
    }

    const randomIndex = Math.floor(Math.random() * selectedPool.length)
    const shape = selectedPool[randomIndex]
    shapes.push({
      ...shape,
      id: `${shape.name}-${Date.now()}-${i}`,
    })
  }

  return shapes
}

export function getShapeSize(shape: BlockShape): { width: number; height: number } {
  let maxRow = 0
  let maxCol = 0
  for (const [row, col] of shape.cells) {
    maxRow = Math.max(maxRow, row)
    maxCol = Math.max(maxCol, col)
  }
  return { width: maxCol + 1, height: maxRow + 1 }
}
