"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { type BlockShape, getRandomShapes, getShapeSize } from "./block-shapes"
import type { GameSettings } from "@/app/page"

interface GameBoardProps {
  settings: GameSettings
  powerUps: {
    miniBomb: number
    standardBomb: number
    extraMoves: number
    eraser: number
    startBonus: number
    boardRefresh: number
  }
  onPowerUpUse: (powerUps: GameBoardProps["powerUps"]) => void
  onGameOver: (score: number) => void
  onBack: () => void
}

const BOARD_SIZE = 8
const CELL_SIZE = 40

type CellState = {
  filled: boolean
  color: string
}

export default function GameBoard({ settings, powerUps, onPowerUpUse, onGameOver, onBack }: GameBoardProps) {
  const [board, setBoard] = useState<CellState[][]>(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => ({ filled: false, color: "" })),
      ),
  )
  const [availableShapes, setAvailableShapes] = useState<(BlockShape | null)[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [draggedShape, setDraggedShape] = useState<BlockShape | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [previewCells, setPreviewCells] = useState<[number, number][]>([])
  const [isValidPlacement, setIsValidPlacement] = useState(false)
  const [clearingCells, setClearingCells] = useState<[number, number][]>([])
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const usePowerUp = (type: string) => {
    if (type === "boardRefresh" && powerUps.boardRefresh > 0) {
      setAvailableShapes(getRandomShapes(3))
      onPowerUpUse({ ...powerUps, boardRefresh: powerUps.boardRefresh - 1 })
    } else if (type === "eraser" && powerUps.eraser > 0) {
      setActivePowerUp("eraser")
    } else if (type === "miniBomb" && powerUps.miniBomb > 0) {
      setActivePowerUp("miniBomb")
    } else if (type === "standardBomb" && powerUps.standardBomb > 0) {
      setActivePowerUp("standardBomb")
    }
  }

  // Initialize game
  useEffect(() => {
    let initialScore = 0
    if (powerUps.startBonus > 0) {
      initialScore = 500
      onPowerUpUse({ ...powerUps, startBonus: powerUps.startBonus - 1 })
    }
    setScore(initialScore)
    setAvailableShapes(getRandomShapes(3))
  }, [])

  // Check if shape can be placed at position
  const canPlaceShape = useCallback(
    (shape: BlockShape, startRow: number, startCol: number, currentBoard: CellState[][]) => {
      for (const [cellRow, cellCol] of shape.cells) {
        const row = startRow + cellRow
        const col = startCol + cellCol
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false
        if (currentBoard[row][col].filled) return false
      }
      return true
    },
    [],
  )

  // Check if any shape can be placed anywhere
  const canAnyShapeBePlaced = useCallback(
    (shapes: (BlockShape | null)[], currentBoard: CellState[][]) => {
      for (const shape of shapes) {
        if (!shape) continue
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (canPlaceShape(shape, row, col, currentBoard)) return true
          }
        }
      }
      return false
    },
    [canPlaceShape],
  )

  // Play sound effect
  const playSound = useCallback(
    (type: "place" | "clear" | "gameover") => {
      if (!settings.soundEnabled) return
      // Sound implementation would go here
    },
    [settings.soundEnabled],
  )

  // Trigger vibration
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!settings.vibrationEnabled) return
      if (navigator.vibrate) {
        navigator.vibrate(pattern)
      }
    },
    [settings.vibrationEnabled],
  )

  // Clear completed rows and columns
  const clearLines = useCallback((currentBoard: CellState[][]): { newBoard: CellState[][]; cleared: number } => {
    const rowsToClear: number[] = []
    const colsToClear: number[] = []
    const cellsToClear: [number, number][] = []

    // Check rows
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (currentBoard[row].every((cell) => cell.filled)) {
        rowsToClear.push(row)
      }
    }

    // Check columns
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (currentBoard.every((row) => row[col].filled)) {
        colsToClear.push(col)
      }
    }

    // Collect cells to clear
    for (const row of rowsToClear) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        cellsToClear.push([row, col])
      }
    }
    for (const col of colsToClear) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (!rowsToClear.includes(row)) {
          cellsToClear.push([row, col])
        }
      }
    }

    if (cellsToClear.length > 0) {
      setClearingCells(cellsToClear)
      setTimeout(() => setClearingCells([]), 300)
    }

    // Create new board with cleared lines
    const newBoard = currentBoard.map((row) => [...row])
    for (const row of rowsToClear) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        newBoard[row][col] = { filled: false, color: "" }
      }
    }
    for (const col of colsToClear) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        newBoard[row][col] = { filled: false, color: "" }
      }
    }

    const linesCleared = rowsToClear.length + colsToClear.length
    return { newBoard, cleared: linesCleared }
  }, [])

  // Place shape on board
  const placeShape = useCallback(
    (shape: BlockShape, startRow: number, startCol: number) => {
      if (!canPlaceShape(shape, startRow, startCol, board)) return false

      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))

      // Place the shape
      for (const [cellRow, cellCol] of shape.cells) {
        const row = startRow + cellRow
        const col = startCol + cellCol
        newBoard[row][col] = { filled: true, color: shape.color }
      }

      // Calculate score for placing
      let newScore = score + shape.cells.length * 10

      // Clear lines and add bonus
      const { newBoard: clearedBoard, cleared } = clearLines(newBoard)
      if (cleared > 0) {
        newScore += cleared * 100
        if (cleared > 1) newScore += (cleared - 1) * 50 // Combo bonus
        playSound("clear")
        vibrate([50, 50, 50])
      } else {
        playSound("place")
        vibrate(30)
      }

      setBoard(clearedBoard)
      setScore(newScore)

      // Remove used shape
      const newShapes = [...availableShapes]
      if (draggedIndex !== null) {
        newShapes[draggedIndex] = null
      }

      // Check if we need new shapes
      if (newShapes.every((s) => s === null)) {
        setAvailableShapes(getRandomShapes(3))
      } else {
        setAvailableShapes(newShapes)
        // Check game over
        if (!canAnyShapeBePlaced(newShapes, clearedBoard)) {
          setGameOver(true)
          playSound("gameover")
          vibrate([100, 50, 100, 50, 100])
          onGameOver(newScore)
        }
      }

      return true
    },
    [
      board,
      score,
      availableShapes,
      draggedIndex,
      canPlaceShape,
      clearLines,
      canAnyShapeBePlaced,
      playSound,
      vibrate,
      onGameOver,
    ],
  )

  // Handle drag start
  const handleDragStart = (
    shape: BlockShape,
    index: number,
    clientX: number,
    clientY: number,
    element: HTMLElement,
  ) => {
    if (gameOver) return

    const rect = element.getBoundingClientRect()
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }

    setDraggedShape(shape)
    setDraggedIndex(index)
  }

  // Handle drag move
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggedShape || !boardRef.current) return

      const boardRect = boardRef.current.getBoundingClientRect()
      const { width: shapeWidth, height: shapeHeight } = getShapeSize(draggedShape)

      // Calculate position relative to board, accounting for shape size
      const relX = clientX - boardRect.left - (shapeWidth * CELL_SIZE) / 2
      const relY = clientY - boardRect.top - (shapeHeight * CELL_SIZE) / 2 - 60 // Offset up so finger doesn't cover

      const col = Math.round(relX / CELL_SIZE)
      const row = Math.round(relY / CELL_SIZE)

      // Calculate preview cells
      const newPreviewCells: [number, number][] = []
      for (const [cellRow, cellCol] of draggedShape.cells) {
        const r = row + cellRow
        const c = col + cellCol
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          newPreviewCells.push([r, c])
        }
      }

      setPreviewCells(newPreviewCells)
      setIsValidPlacement(canPlaceShape(draggedShape, row, col, board))
    },
    [draggedShape, board, canPlaceShape],
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggedShape || !boardRef.current) {
        setDraggedShape(null)
        setDraggedIndex(null)
        setPreviewCells([])
        return
      }

      const boardRect = boardRef.current.getBoundingClientRect()
      const { width: shapeWidth, height: shapeHeight } = getShapeSize(draggedShape)

      const relX = clientX - boardRect.left - (shapeWidth * CELL_SIZE) / 2
      const relY = clientY - boardRect.top - (shapeHeight * CELL_SIZE) / 2 - 60

      const col = Math.round(relX / CELL_SIZE)
      const row = Math.round(relY / CELL_SIZE)

      if (isValidPlacement) {
        placeShape(draggedShape, row, col)
      }

      setDraggedShape(null)
      setDraggedIndex(null)
      setPreviewCells([])
      setIsValidPlacement(false)
    },
    [draggedShape, isValidPlacement, placeShape],
  )

  // Mouse events
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX, e.clientY)
    },
    [handleDragMove],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleDragEnd(e.clientX, e.clientY)
    },
    [handleDragEnd],
  )

  // Touch events
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    },
    [handleDragMove],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    },
    [handleDragEnd],
  )

  const handleCellClick = (row: number, col: number) => {
    if (!activePowerUp) return

    const newBoard = board.map((r) => r.map((c) => ({ ...c })))
    const cellsToRemove: [number, number][] = []

    if (activePowerUp === "eraser") {
      if (board[row][col].filled) {
        cellsToRemove.push([row, col])
        newBoard[row][col] = { filled: false, color: "" }
        onPowerUpUse({ ...powerUps, eraser: powerUps.eraser - 1 })
      }
    } else if (activePowerUp === "miniBomb") {
      for (let r = row; r < Math.min(row + 2, BOARD_SIZE); r++) {
        for (let c = col; c < Math.min(col + 2, BOARD_SIZE); c++) {
          cellsToRemove.push([r, c])
          newBoard[r][c] = { filled: false, color: "" }
        }
      }
      onPowerUpUse({ ...powerUps, miniBomb: powerUps.miniBomb - 1 })
    } else if (activePowerUp === "standardBomb") {
      for (let r = Math.max(0, row - 1); r < Math.min(row + 2, BOARD_SIZE); r++) {
        for (let c = Math.max(0, col - 1); c < Math.min(col + 2, BOARD_SIZE); c++) {
          cellsToRemove.push([r, c])
          newBoard[r][c] = { filled: false, color: "" }
        }
      }
      onPowerUpUse({ ...powerUps, standardBomb: powerUps.standardBomb - 1 })
    }

    if (cellsToRemove.length > 0) {
      setClearingCells(cellsToRemove)
      setTimeout(() => setClearingCells([]), 300)
      setBoard(newBoard)
      playSound("clear")
      vibrate([50, 50])
    }

    setActivePowerUp(null)
  }

  const isCellClearing = (row: number, col: number) => {
    return clearingCells.some(([r, c]) => r === row && c === col)
  }

  const isCellPreviewed = (row: number, col: number) => {
    return previewCells.some(([r, c]) => r === row && c === col)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4 select-none"
      onMouseMove={draggedShape ? handleMouseMove : undefined}
      onMouseUp={draggedShape ? handleMouseUp : undefined}
      onTouchMove={draggedShape ? handleTouchMove : undefined}
      onTouchEnd={draggedShape ? handleTouchEnd : undefined}
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
          <span className="text-white/70 text-sm">Skor</span>
          <p className="text-white font-bold text-2xl">{score.toLocaleString()}</p>
        </div>
        <button
          onClick={() => {
            setBoard(
              Array(BOARD_SIZE)
                .fill(null)
                .map(() =>
                  Array(BOARD_SIZE)
                    .fill(null)
                    .map(() => ({ filled: false, color: "" })),
                ),
            )
            setScore(0)
            setGameOver(false)
            setAvailableShapes(getRandomShapes(3))
          }}
          className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Power-ups bar */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {powerUps.miniBomb > 0 && (
          <button
            onClick={() => usePowerUp("miniBomb")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              activePowerUp === "miniBomb"
                ? "bg-red-500 text-white scale-110"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            💣 Mini ({powerUps.miniBomb})
          </button>
        )}
        {powerUps.standardBomb > 0 && (
          <button
            onClick={() => usePowerUp("standardBomb")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              activePowerUp === "standardBomb"
                ? "bg-red-500 text-white scale-110"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            💥 Bomba ({powerUps.standardBomb})
          </button>
        )}
        {powerUps.eraser > 0 && (
          <button
            onClick={() => usePowerUp("eraser")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              activePowerUp === "eraser"
                ? "bg-yellow-500 text-white scale-110"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            ✏️ Silgi ({powerUps.eraser})
          </button>
        )}
        {powerUps.boardRefresh > 0 && (
          <button
            onClick={() => usePowerUp("boardRefresh")}
            className="px-3 py-1 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            📜 Yenile ({powerUps.boardRefresh})
          </button>
        )}
      </div>

      {activePowerUp && <div className="mb-2 text-yellow-400 text-sm animate-pulse">Tahtada bir hücreye tıklayın!</div>}

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl"
        style={{ touchAction: "none" }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isPreviewed = isCellPreviewed(rowIndex, colIndex)
              const isClearing = isCellClearing(rowIndex, colIndex)

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    rounded-lg transition-all duration-150
                    ${cell.filled ? `bg-gradient-to-br ${cell.color} shadow-inner` : "bg-white/10"}
                    ${
                      isPreviewed && !cell.filled
                        ? isValidPlacement
                          ? "bg-green-500/50 ring-2 ring-green-400"
                          : "bg-red-500/50 ring-2 ring-red-400"
                        : ""
                    }
                    ${isClearing ? "animate-pulse scale-0 opacity-0" : ""}
                    ${activePowerUp && !cell.filled ? "" : activePowerUp ? "cursor-pointer hover:ring-2 hover:ring-yellow-400" : ""}
                  `}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              )
            }),
          )}
        </div>
      </div>

      {/* Available Shapes */}
      <div className="mt-6 flex gap-4 items-end justify-center">
        {availableShapes.map((shape, index) => (
          <div
            key={index}
            className={`
              p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20
              ${!shape ? "opacity-30" : draggedIndex === index ? "opacity-50 scale-95" : "cursor-grab active:cursor-grabbing hover:bg-white/20"}
              transition-all duration-150
            `}
            onMouseDown={(e) => shape && handleDragStart(shape, index, e.clientX, e.clientY, e.currentTarget)}
            onTouchStart={(e) => {
              if (shape && e.touches.length > 0) {
                handleDragStart(shape, index, e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)
              }
            }}
          >
            {shape ? (
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${getShapeSize(shape).width}, 20px)`,
                  gridTemplateRows: `repeat(${getShapeSize(shape).height}, 20px)`,
                }}
              >
                {Array(getShapeSize(shape).height)
                  .fill(null)
                  .map((_, r) =>
                    Array(getShapeSize(shape).width)
                      .fill(null)
                      .map((_, c) => {
                        const isFilled = shape.cells.some(([cr, cc]) => cr === r && cc === c)
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`
                          w-5 h-5 rounded-sm
                          ${isFilled ? `bg-gradient-to-br ${shape.color}` : "bg-transparent"}
                        `}
                          />
                        )
                      }),
                  )}
              </div>
            ) : (
              <div className="w-12 h-12" />
            )}
          </div>
        ))}
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 mx-4 text-center border border-white/20 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-2">OYUN BİTTİ!</h2>
            <p className="text-white/70 mb-4">Hamle kalmadı</p>
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <p className="text-white/70 text-sm">Skorunuz</p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBoard(
                    Array(BOARD_SIZE)
                      .fill(null)
                      .map(() =>
                        Array(BOARD_SIZE)
                          .fill(null)
                          .map(() => ({ filled: false, color: "" })),
                      ),
                  )
                  setScore(0)
                  setGameOver(false)
                  setAvailableShapes(getRandomShapes(3))
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
              >
                Tekrar Oyna
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-white/10 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
              >
                Ana Menü
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
