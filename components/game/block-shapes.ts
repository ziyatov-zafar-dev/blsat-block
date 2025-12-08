export interface BlockShape {
  id: string
  name: string
  cells: [number, number][]
  color: string
}

// Base shapes
const baseShapes: Omit<BlockShape, "id">[] = [
  // Single
  { name: "single", cells: [[0, 0]], color: "from-red-500 to-red-600" },

  // 2-cell shapes
  {
    name: "horizontal2",
    cells: [
      [0, 0],
      [0, 1],
    ],
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "vertical2",
    cells: [
      [0, 0],
      [1, 0],
    ],
    color: "from-amber-500 to-amber-600",
  },

  // 3-cell line
  {
    name: "horizontal3",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    color: "from-yellow-500 to-yellow-600",
  },
  {
    name: "vertical3",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    color: "from-lime-500 to-lime-600",
  },

  // 4-cell line
  {
    name: "horizontal4",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    color: "from-green-500 to-green-600",
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
  },

  // 5-cell line
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
  },

  // 2x2 Square
  {
    name: "square2",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: "from-sky-500 to-sky-600",
  },

  // 3x3 Square
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
  },

  // L shapes (all rotations)
  {
    name: "L1",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
    color: "from-indigo-500 to-indigo-600",
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
  },

  // Reverse L shapes
  {
    name: "J1",
    cells: [
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1],
    ],
    color: "from-pink-500 to-pink-600",
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
  },

  // T shapes
  {
    name: "T1",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
    color: "from-amber-400 to-amber-500",
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
  },

  // S shapes
  {
    name: "S1",
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
    color: "from-emerald-400 to-emerald-500",
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
  },

  // Z shapes
  {
    name: "Z1",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    color: "from-cyan-400 to-cyan-500",
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
  },

  // Corner shapes (small L)
  {
    name: "corner1",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    color: "from-blue-400 to-blue-500",
  },
  {
    name: "corner2",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    color: "from-indigo-400 to-indigo-500",
  },
  {
    name: "corner3",
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: "from-violet-400 to-violet-500",
  },
  {
    name: "corner4",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    color: "from-purple-400 to-purple-500",
  },
]

export function getRandomShapes(count: number): BlockShape[] {
  const shapes: BlockShape[] = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * baseShapes.length)
    const shape = baseShapes[randomIndex]
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
