"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, RotateCcw, Zap } from "lucide-react"
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
  onGameOver: (score: number, linesCleared?: number) => void
  onBack: () => void
}

const BOARD_SIZE = 8
const FINGER_OFFSET = 100

type CellState = {
  filled: boolean
  color: string
}

function useCellSize() {
  const [cellSize, setCellSize] = useState(40)
  const [previewCellSize, setPreviewCellSize] = useState(20)

  useEffect(() => {
    const calculateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // PC icin buyuk, tablet icin orta, mobil icin kucuk
      if (width >= 1024) {
        // PC - buyuk tahta
        setCellSize(50)
        setPreviewCellSize(28)
      } else if (width >= 768) {
        // Tablet
        setCellSize(45)
        setPreviewCellSize(24)
      } else if (width >= 400) {
        // Buyuk mobil
        const maxBoardWidth = Math.min(width - 32, 360)
        const size = Math.floor(maxBoardWidth / 8.5)
        setCellSize(Math.min(size, 42))
        setPreviewCellSize(Math.min(Math.floor(size / 2), 20))
      } else {
        // Kucuk mobil
        const maxBoardWidth = width - 24
        const size = Math.floor(maxBoardWidth / 8.5)
        setCellSize(Math.min(size, 38))
        setPreviewCellSize(Math.min(Math.floor(size / 2), 18))
      }
    }

    calculateSize()
    window.addEventListener("resize", calculateSize)
    return () => window.removeEventListener("resize", calculateSize)
  }, [])

  return { cellSize, previewCellSize }
}

export default function GameBoard({ settings, powerUps, onPowerUpUse, onGameOver, onBack }: GameBoardProps) {
  const { cellSize, previewCellSize } = useCellSize()
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
  const [totalLinesCleared, setTotalLinesCleared] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [draggedShape, setDraggedShape] = useState<BlockShape | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [previewCells, setPreviewCells] = useState<[number, number][]>([])
  const [isValidPlacement, setIsValidPlacement] = useState(false)
  const [clearingCells, setClearingCells] = useState<[number, number][]>([])
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null)
  const [showPowerUpPanel, setShowPowerUpPanel] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  const powerUpsRef = useRef(powerUps)
  const onPowerUpUseRef = useRef(onPowerUpUse)
  const scoreRef = useRef(score)

  useEffect(() => {
    powerUpsRef.current = powerUps
    onPowerUpUseRef.current = onPowerUpUse
    scoreRef.current = score
  }, [powerUps, onPowerUpUse, score])

  const getDifficultyLevel = (currentScore: number) => {
    if (currentScore <= 2000) return { level: "Çok Kolay", color: "text-green-400" }
    if (currentScore <= 5000) return { level: "Kolay", color: "text-lime-400" }
    if (currentScore <= 8000) return { level: "Orta", color: "text-yellow-400" }
    if (currentScore <= 11000) return { level: "Zor", color: "text-orange-400" }
    if (currentScore <= 15000) return { level: "Çok Zor", color: "text-red-400" }
    return { level: "UZMAN", color: "text-purple-400" }
  }

  const activatePowerUp = (type: string) => {
    if (type === "boardRefresh" && powerUps.boardRefresh > 0) {
      setAvailableShapes(getRandomShapes(3, score))
      onPowerUpUse({ ...powerUps, boardRefresh: powerUps.boardRefresh - 1 })
      setShowPowerUpPanel(false)
    } else if (type === "eraser" && powerUps.eraser > 0) {
      setActivePowerUp("eraser")
      setShowPowerUpPanel(false)
    } else if (type === "miniBomb" && powerUps.miniBomb > 0) {
      setActivePowerUp("miniBomb")
      setShowPowerUpPanel(false)
    } else if (type === "standardBomb" && powerUps.standardBomb > 0) {
      setActivePowerUp("standardBomb")
      setShowPowerUpPanel(false)
    }
  }

  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let initialScore = 0
    if (powerUps.startBonus > 0) {
      initialScore = 500
      onPowerUpUse({ ...powerUps, startBonus: powerUps.startBonus - 1 })
    }
    setScore(initialScore)
    setAvailableShapes(getRandomShapes(3, initialScore))
  }, [])

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

  const checkAndClearLines = useCallback((currentBoard: CellState[][]) => {
    const rowsToClear: number[] = []
    const colsToClear: number[] = []

    for (let i = 0; i < BOARD_SIZE; i++) {
      if (currentBoard[i].every((cell) => cell.filled)) rowsToClear.push(i)
      if (currentBoard.every((row) => row[i].filled)) colsToClear.push(i)
    }

    if (rowsToClear.length === 0 && colsToClear.length === 0) {
      return { newBoard: currentBoard, linesCleared: 0 }
    }

    const cellsToClear: [number, number][] = []
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

    setClearingCells(cellsToClear)

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

    setTimeout(() => setClearingCells([]), 200)

    const linesCleared = rowsToClear.length + colsToClear.length
    return { newBoard, linesCleared }
  }, [])

  const placeShape = useCallback(
    (shape: BlockShape, startRow: number, startCol: number) => {
      const newBoard = board.map((row) => [...row])
      for (const [cellRow, cellCol] of shape.cells) {
        const row = startRow + cellRow
        const col = startCol + cellCol
        newBoard[row][col] = { filled: true, color: shape.color }
      }

      const { newBoard: clearedBoard, linesCleared } = checkAndClearLines(newBoard)
      setBoard(clearedBoard)

      let points = shape.cells.length * 10
      if (linesCleared > 0) {
        const lineBonus = linesCleared * 100 * linesCleared
        points += lineBonus
        setTotalLinesCleared((prev) => prev + linesCleared)
      }
      setScore((prev) => prev + points)

      if (settings.vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate(50)
      }

      return clearedBoard
    },
    [board, checkAndClearLines, settings.vibrationEnabled],
  )

  const handleDragStart = (
    shape: BlockShape,
    index: number,
    clientX: number,
    clientY: number,
    element: HTMLElement,
  ) => {
    if (activePowerUp) return
    setDraggedShape(shape)
    setDraggedIndex(index)
    setDragPosition({ x: clientX, y: clientY - FINGER_OFFSET })
  }

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggedShape || !boardRef.current) return

      setDragPosition({ x: clientX, y: clientY - FINGER_OFFSET })

      const boardRect = boardRef.current.getBoundingClientRect()
      const shapeSize = getShapeSize(draggedShape)
      const offsetX = (shapeSize.width * cellSize) / 2
      const offsetY = (shapeSize.height * cellSize) / 2

      const adjustedY = clientY - FINGER_OFFSET
      const col = Math.floor((clientX - boardRect.left - offsetX + cellSize / 2) / (cellSize + 4))
      const row = Math.floor((adjustedY - boardRect.top - offsetY + cellSize / 2) / (cellSize + 4))

      if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        const cells: [number, number][] = draggedShape.cells.map(([r, c]) => [row + r, col + c])
        const valid = canPlaceShape(draggedShape, row, col, board)
        setPreviewCells(cells)
        setIsValidPlacement(valid)
      } else {
        setPreviewCells([])
        setIsValidPlacement(false)
      }
    },
    [draggedShape, board, canPlaceShape, cellSize],
  )

  const handleDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggedShape || draggedIndex === null || !boardRef.current) {
        setDraggedShape(null)
        setDraggedIndex(null)
        setDragPosition(null)
        setPreviewCells([])
        return
      }

      const boardRect = boardRef.current.getBoundingClientRect()
      const shapeSize = getShapeSize(draggedShape)
      const offsetX = (shapeSize.width * cellSize) / 2
      const offsetY = (shapeSize.height * cellSize) / 2

      const adjustedY = clientY - FINGER_OFFSET
      const col = Math.floor((clientX - boardRect.left - offsetX + cellSize / 2) / (cellSize + 4))
      const row = Math.floor((adjustedY - boardRect.top - offsetY + cellSize / 2) / (cellSize + 4))

      if (canPlaceShape(draggedShape, row, col, board)) {
        const newBoard = placeShape(draggedShape, row, col)
        const newShapes = [...availableShapes]
        newShapes[draggedIndex] = null
        setAvailableShapes(newShapes)

        if (newShapes.every((s) => s === null)) {
          setAvailableShapes(getRandomShapes(3, score))
        }
      }

      setDraggedShape(null)
      setDraggedIndex(null)
      setDragPosition(null)
      setPreviewCells([])
    },
    [draggedShape, draggedIndex, board, canPlaceShape, placeShape, availableShapes, score, cellSize],
  )

  const handleCellClick = (row: number, col: number) => {
    if (!activePowerUp) return

    if (activePowerUp === "eraser" && board[row][col].filled) {
      const newBoard = board.map((r) => [...r])
      newBoard[row][col] = { filled: false, color: "" }
      setBoard(newBoard)
      onPowerUpUse({ ...powerUps, eraser: powerUps.eraser - 1 })
      setActivePowerUp(null)
    } else if (activePowerUp === "miniBomb") {
      const newBoard = board.map((r) => [...r])
      for (let r = row; r < Math.min(row + 2, BOARD_SIZE); r++) {
        for (let c = col; c < Math.min(col + 2, BOARD_SIZE); c++) {
          newBoard[r][c] = { filled: false, color: "" }
        }
      }
      setBoard(newBoard)
      onPowerUpUse({ ...powerUps, miniBomb: powerUps.miniBomb - 1 })
      setActivePowerUp(null)
    } else if (activePowerUp === "standardBomb") {
      const newBoard = board.map((r) => [...r])
      for (let r = Math.max(0, row - 1); r < Math.min(row + 2, BOARD_SIZE); r++) {
        for (let c = Math.max(0, col - 1); c < Math.min(col + 2, BOARD_SIZE); c++) {
          newBoard[r][c] = { filled: false, color: "" }
        }
      }
      setBoard(newBoard)
      onPowerUpUse({ ...powerUps, standardBomb: powerUps.standardBomb - 1 })
      setActivePowerUp(null)
    }
  }

  useEffect(() => {
    if (availableShapes.length === 0 || availableShapes.every((s) => s === null)) return

    const hasValidMove = availableShapes.some((shape) => {
      if (!shape) return false
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (canPlaceShape(shape, row, col, board)) return true
        }
      }
      return false
    })

    if (!hasValidMove && !gameOver) {
      setGameOver(true)
      onGameOver(score, totalLinesCleared)
    }
  }, [availableShapes, board, canPlaceShape, gameOver, onGameOver, score, totalLinesCleared])

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (draggedShape && e.touches.length > 0) {
        e.preventDefault()
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (draggedShape && e.changedTouches.length > 0) {
        handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (draggedShape) {
        handleDragMove(e.clientX, e.clientY)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (draggedShape) {
        handleDragEnd(e.clientX, e.clientY)
      }
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggedShape, handleDragMove, handleDragEnd])

  const isCellPreviewed = (row: number, col: number) => {
    return previewCells.some(([r, c]) => r === row && c === col)
  }

  const isCellClearing = (row: number, col: number) => {
    return clearingCells.some(([r, c]) => r === row && c === col)
  }

  const difficulty = getDifficultyLevel(score)

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-2 sm:py-4 px-2 sm:px-4 select-none">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-2 sm:mb-4">
        <button
          onClick={onBack}
          className="bg-white/10 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-white/60 text-xs sm:text-sm">SKOR</span>
          <span className="text-white font-bold text-xl sm:text-3xl">{score.toLocaleString()}</span>
          <span className={`text-xs ${difficulty.color}`}>{difficulty.level}</span>
        </div>

        <button
          onClick={() => setShowPowerUpPanel(!showPowerUpPanel)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 sm:p-3 rounded-xl shadow-lg hover:scale-105 transition-transform relative"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          {(powerUps.miniBomb > 0 || powerUps.standardBomb > 0 || powerUps.eraser > 0 || powerUps.boardRefresh > 0) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
              {powerUps.miniBomb + powerUps.standardBomb + powerUps.eraser + powerUps.boardRefresh}
            </span>
          )}
        </button>
      </div>

      {/* Active Power Up Indicator */}
      {activePowerUp && (
        <div className="mb-2 bg-yellow-500/20 border border-yellow-500 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
          <span className="text-yellow-400 text-xs sm:text-sm font-medium">
            {activePowerUp === "eraser" && "Silmek istediğiniz bloğa tıklayın"}
            {activePowerUp === "miniBomb" && "2x2 bomba için merkez seçin"}
            {activePowerUp === "standardBomb" && "3x3 bomba için merkez seçin"}
          </span>
          <button onClick={() => setActivePowerUp(null)} className="ml-2 text-white/60 hover:text-white text-xs">
            İptal
          </button>
        </div>
      )}

      {/* Power Up Panel */}
      {showPowerUpPanel && (
        <div className="mb-2 sm:mb-4 bg-black/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 w-full max-w-md">
          <h3 className="text-white font-bold text-sm sm:text-base mb-2 sm:mb-3 text-center">Güçlendirmeler</h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => activatePowerUp("miniBomb")}
              disabled={powerUps.miniBomb === 0}
              className={`flex flex-col items-center p-2 rounded-xl ${
                powerUps.miniBomb > 0 ? "bg-orange-500/30 hover:bg-orange-500/50" : "bg-white/5 opacity-50"
              }`}
            >
              <span className="text-lg sm:text-2xl">💣</span>
              <span className="text-white text-xs">2x2</span>
              <span className="text-white/60 text-xs">x{powerUps.miniBomb}</span>
            </button>

            <button
              onClick={() => activatePowerUp("standardBomb")}
              disabled={powerUps.standardBomb === 0}
              className={`flex flex-col items-center p-2 rounded-xl ${
                powerUps.standardBomb > 0 ? "bg-red-500/30 hover:bg-red-500/50" : "bg-white/5 opacity-50"
              }`}
            >
              <span className="text-lg sm:text-2xl">💥</span>
              <span className="text-white text-xs">3x3</span>
              <span className="text-white/60 text-xs">x{powerUps.standardBomb}</span>
            </button>

            <button
              onClick={() => activatePowerUp("eraser")}
              disabled={powerUps.eraser === 0}
              className={`flex flex-col items-center p-2 rounded-xl ${
                powerUps.eraser > 0 ? "bg-blue-500/30 hover:bg-blue-500/50" : "bg-white/5 opacity-50"
              }`}
            >
              <span className="text-lg sm:text-2xl">✏️</span>
              <span className="text-white text-xs">Silgi</span>
              <span className="text-white/60 text-xs">x{powerUps.eraser}</span>
            </button>

            <button
              onClick={() => activatePowerUp("boardRefresh")}
              disabled={powerUps.boardRefresh === 0}
              className={`flex flex-col items-center p-2 rounded-xl ${
                powerUps.boardRefresh > 0 ? "bg-green-500/30 hover:bg-green-500/50" : "bg-white/5 opacity-50"
              }`}
            >
              <span className="text-lg sm:text-2xl">🔄</span>
              <span className="text-white text-xs">Yenile</span>
              <span className="text-white/60 text-xs">x{powerUps.boardRefresh}</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div
        ref={boardRef}
        className="grid gap-1 bg-black/30 backdrop-blur-md p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl mx-auto"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
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
                  rounded-md sm:rounded-lg
                  ${cell.filled ? `bg-gradient-to-br ${cell.color} shadow-inner` : "bg-white/10"}
                  ${
                    isPreviewed && !cell.filled
                      ? isValidPlacement
                        ? "bg-green-500/50 ring-2 ring-green-400"
                        : "bg-red-500/50 ring-2 ring-red-400"
                      : ""
                  }
                  ${isClearing ? "animate-pulse scale-0 opacity-0 transition-all duration-200" : ""}
                  ${activePowerUp && !cell.filled ? "" : activePowerUp ? "cursor-pointer hover:ring-2 hover:ring-yellow-400" : ""}
                `}
                style={{ width: cellSize, height: cellSize }}
              />
            )
          }),
        )}
      </div>

      {/* Dragging Shape */}
      {draggedShape && dragPosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x - (getShapeSize(draggedShape).width * cellSize) / 2,
            top: dragPosition.y - (getShapeSize(draggedShape).height * cellSize) / 2,
          }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${getShapeSize(draggedShape).width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${getShapeSize(draggedShape).height}, ${cellSize}px)`,
            }}
          >
            {Array(getShapeSize(draggedShape).height)
              .fill(null)
              .map((_, r) =>
                Array(getShapeSize(draggedShape).width)
                  .fill(null)
                  .map((_, c) => {
                    const isFilled = draggedShape.cells.some(([cr, cc]) => cr === r && cc === c)
                    return (
                      <div
                        key={`drag-${r}-${c}`}
                        className={`
                          rounded-md sm:rounded-lg shadow-lg
                          ${isFilled ? `bg-gradient-to-br ${draggedShape.color} opacity-90` : "bg-transparent"}
                        `}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    )
                  }),
              )}
          </div>
        </div>
      )}

      {/* Available Shapes */}
      <div className="flex justify-center gap-3 sm:gap-6 mt-3 sm:mt-6 w-full max-w-lg px-2">
        {availableShapes.map((shape, index) => (
          <div
            key={index}
            className={`
              bg-black/30 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-white/20
              flex items-center justify-center min-w-[60px] sm:min-w-[80px] min-h-[60px] sm:min-h-[80px]
              ${shape && !activePowerUp ? "cursor-grab active:cursor-grabbing touch-none" : ""}
              ${draggedIndex === index ? "opacity-30" : ""}
            `}
            onMouseDown={(e) => {
              if (shape) {
                handleDragStart(shape, index, e.clientX, e.clientY, e.currentTarget)
              }
            }}
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
                  gridTemplateColumns: `repeat(${getShapeSize(shape).width}, ${previewCellSize}px)`,
                  gridTemplateRows: `repeat(${getShapeSize(shape).height}, ${previewCellSize}px)`,
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
                              rounded-sm sm:rounded
                              ${isFilled ? `bg-gradient-to-br ${shape.color}` : "bg-transparent"}
                            `}
                            style={{ width: previewCellSize, height: previewCellSize }}
                          />
                        )
                      }),
                  )}
              </div>
            ) : (
              <div className="text-white/30 text-xl sm:text-2xl">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-6 sm:p-8 mx-4 text-center border border-white/20 shadow-2xl max-w-sm w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Oyun Bitti!</h2>
            <p className="text-white/70 mb-4">
              <span className={difficulty.color}>{difficulty.level}</span> seviyesine ulaştınız
            </p>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
              {score.toLocaleString()}
            </div>
            <p className="text-white/50 mb-4 sm:mb-6">{totalLinesCleared} satır temizledin</p>
            <div className="flex flex-col gap-3">
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
                  setTotalLinesCleared(0)
                  setGameOver(false)
                  setAvailableShapes(getRandomShapes(3, 0))
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 sm:py-4 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Tekrar Oyna
              </button>
              <button
                onClick={onBack}
                className="w-full bg-white/10 text-white font-bold py-3 sm:py-4 px-6 rounded-xl hover:bg-white/20 transition-colors"
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
