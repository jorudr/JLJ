import { ref } from 'vue'

export const useTesseract = () => {
  // Use Float32Array for better performance
  const vertices = new Float32Array(32 * 5)
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 5; j++) {
      vertices[i * 5 + j] = (i & (1 << j)) ? 100 : -100
    }
  }

  const edges: number[][] = []
  for (let i = 0; i < 32; i++) {
    for (let j = i + 1; j < 32; j++) {
      let diff = 0
      for (let k = 0; k < 5; k++) if ((i & (1 << k)) !== (j & (1 << k))) diff++
      if (diff === 1) edges.push([i, j])
    }
  }

  const angles = new Float32Array(10).map(() => Math.random() * Math.PI * 2)
  const speeds = new Float32Array(10).map(() => (Math.random() - 0.5) * 0.01)

  // Plane definitions (fixed)
  const P1 = new Int8Array([0, 0, 0, 0, 1, 1, 1, 2, 2, 3])
  const P2 = new Int8Array([1, 2, 3, 4, 2, 3, 4, 3, 4, 4])

  // Pre-allocated vertex buffer for rotation to avoid object creation
  const rotationBuffer = new Float32Array(5)

  /**
   * Optimized 5D rotation that works in-place on a buffer
   */
  const rotate5DInPlace = (v: Float32Array, offset: number, planeIdx: number, cos: number, sin: number) => {
    const p1 = P1[planeIdx]!
    const p2 = P2[planeIdx]!
    const idx1 = offset + p1
    const idx2 = offset + p2
    const v1 = v[idx1]!, v2 = v[idx2]!
    v[idx1] = v1 * cos - v2 * sin
    v[idx2] = v1 * sin + v2 * cos
  }

  const project = (v: Float32Array, offset: number, width: number, height: number) => {
    const d = 400
    const v4 = v[offset + 4]!
    const w1 = d / (d + v4)
    
    // Inline intermediate projections to avoid array allocation
    const v0_4 = v[offset + 0]! * w1
    const v1_4 = v[offset + 1]! * w1
    const v2_4 = v[offset + 2]! * w1
    const v3_4 = v[offset + 3]! * w1
    
    const w2 = d / (d + v3_4)
    const v0_3 = v0_4 * w2
    const v1_3 = v1_4 * w2
    const v2_3 = v2_4 * w2
    
    const w3 = d / (d + v2_3)
    return { 
      x: v0_3 * w3 + width / 2, 
      y: v1_3 * w3 + height / 2,
      z: (v[offset + 2]! + v[offset + 3]! + v[offset + 4]!) / 3 
    }
  }

  return {
    vertices,
    edges,
    angles,
    speeds,
    rotate5DInPlace,
    project
  }
}
