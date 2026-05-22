import { loadFromDisk, saveToDisk, migrateLocalStorageToDisk, removeFromDisk } from '~/shared/diskStorage'
import type { Thread } from '~/entities/thread/model/thread.types'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'

export interface BoardNote {
  id: string
  type: 'thread' | 'trade' | 'text' | 'image' | 'strategy' | 'risk_management' | 'comparison' | 'text_element' | 'chart' | 'entry_node' | 'exit_node' | 'conditions' | 'scenario'
  x: number
  y: number
  width: number
  height: number
  threadId?: string
  threadData?: Thread
  tradeData?: DiaryEntry
  text?: string
  imageUrl?: string
  strategyData?: { name: string; description: string }
  riskData?: { initialDeposit: number; riskPerTrade: number; targetRR: number }
  textElementData?: { 
    text: string; 
    style: { color: string; bold: boolean; italic: boolean; fontSize: number } 
  }
  imageData?: string
  chartData?: { symbol: string }
  conditionsData?: { id: string; text: string; description?: string; images?: string[]; imageData?: string; showImage?: boolean }[]
  conditionsName?: string
  scenarioData?: { name: string; letter: string; if: string; then: string; description?: string }
  folderId?: string
}

export interface Connection {
  id: string
  fromId: string
  toId: string
}

export interface DrawingPath {
  id: string
  color: string
  thickness: number
  points: { x: number; y: number }[]
}

export interface Folder {
  id: string
  name: string
  isOpen: boolean
}

export interface Board {
  id: string
  name: string
  notes: BoardNote[]
  connections: Connection[]
  transform: { x: number; y: number; scale: number }
  drawings: DrawingPath[]
  folders: Folder[]
}

export interface BoardMeta {
  id: string
  name: string
  transform: { x: number; y: number; scale: number }
}

const PERSISTENCE_META_KEY = 'trading_boards_meta_v3'
const PERSISTENCE_CONTENT_PREFIX = 'trading_board_content_'

function uid() {
  return Math.random().toString(36).substring(2, 11)
}

export const useBoardStore = defineStore('board', () => {
  const boards = ref<Board[]>([
    {
      id: uid(),
      name: 'Main Board',
      notes: [],
      connections: [],
      transform: { x: 0, y: 0, scale: 1 },
      drawings: [],
      folders: []
    },
    {
      id: uid(),
      name: 'Extra Board',
      notes: [],
      connections: [],
      transform: { x: 0, y: 0, scale: 1 },
      drawings: [],
      folders: []
    }
  ])
  
  const activeBoardId = ref(boards.value[0]!.id)
  const isLoadingPersistence = ref(true)
  const isSaving = ref(false)
  let saveTimeout: any = null

  const activeBoard = computed(() => {
    return boards.value.find(b => b.id === activeBoardId.value) || boards.value[0]!
  })

  // Global access to all conditions and scenarios
  const allConditions = computed(() => {
    return boards.value.flatMap(b => b.notes).filter(n => n.type === 'conditions')
  })

  const allScenarios = computed(() => {
    return boards.value.flatMap(b => b.notes).filter(n => n.type === 'scenario')
  })

  async function saveBoardToLocal(isManual = false) {
    if (isLoadingPersistence.value) return
    
    // Trivial State Guard
    const isTrivial = boards.value.length <= 2 && 
                    boards.value.every(b => b.notes.length === 0 && b.drawings.length === 0);
    
    if (!isManual && isTrivial) {
      const existingMeta = await loadFromDisk<any>(PERSISTENCE_META_KEY);
      if (existingMeta && Array.isArray(existingMeta) && existingMeta.length > 0) {
         return;
      }
    }

    isSaving.value = true
    try {
      const meta: BoardMeta[] = boards.value.map(b => ({
        id: b.id,
        name: b.name,
        transform: b.transform
      }))
      
      await saveToDisk(PERSISTENCE_META_KEY, meta)
      await saveToDisk('trading_boards_active_id', activeBoardId.value)

      for (const board of boards.value) {
        const content = {
          notes: board.notes,
          connections: board.connections,
          drawings: board.drawings,
          folders: board.folders || []
        }
        await saveToDisk(`${PERSISTENCE_CONTENT_PREFIX}${board.id}`, content)
      }
    } finally {
      isSaving.value = false
    }
  }

  async function loadBoardFromLocal() {
    isLoadingPersistence.value = true
    try {
      let meta = await loadFromDisk<BoardMeta[]>(PERSISTENCE_META_KEY)
      let savedActiveId = await loadFromDisk<string>('trading_boards_active_id')
      
      if (!meta) {
        // Fallback checks
        const v2Meta = await loadFromDisk<BoardMeta[]>('trading_boards_meta_v2');
        const v1Meta = await loadFromDisk<BoardMeta[]>('trading_boards_meta');
        
        if (v2Meta || v1Meta) {
          meta = v2Meta || v1Meta;
        } else {
          // Migration check
          const localKeys = [
            'trading_boards_meta_v3',
            'trading_boards_meta_v2', 
            'trading_boards_meta',
            'trading_boards_v2',
            'trading_boards_active_id'
          ]
          await migrateLocalStorageToDisk(localKeys)
          meta = await loadFromDisk<BoardMeta[]>(PERSISTENCE_META_KEY) ||
                 await loadFromDisk<BoardMeta[]>('trading_boards_meta_v2') ||
                 await loadFromDisk<BoardMeta[]>('trading_boards_meta');
          savedActiveId = await loadFromDisk<string>('trading_boards_active_id')
        }
      }

      if (meta && Array.isArray(meta) && meta.length > 0) {
        const loadedBoards: Board[] = []
        for (const m of meta) {
          const savedContent = await loadFromDisk<any>(`${PERSISTENCE_CONTENT_PREFIX}${m.id}`)
          let content = { notes: [], connections: [], drawings: [], folders: [] }
          if (savedContent) content = savedContent
          
          if (content.notes && Array.isArray(content.notes)) {
            content.notes.forEach((n: any) => {
              if (n.type === 'scenario' && n.scenarioData) {
                if (n.scenarioData.description && !n.scenarioData.if && !n.scenarioData.then) {
                  n.scenarioData.if = n.scenarioData.description;
                  n.scenarioData.then = '';
                }
              }
              if (!content.folders) content.folders = [];
            });
          }
          
          loadedBoards.push({
            id: m.id,
            name: m.name,
            transform: m.transform,
            notes: content.notes || [],
            connections: content.connections || [],
            drawings: content.drawings || [],
            folders: content.folders || []
          })
        }
        boards.value = loadedBoards
        if (savedActiveId && boards.value.some(b => b.id === savedActiveId)) {
          activeBoardId.value = savedActiveId
        }
        await saveToDisk(`${PERSISTENCE_META_KEY}_SAFETY_BACKUP`, loadedBoards);
      }
    } finally {
      setTimeout(() => {
        isLoadingPersistence.value = false
        // Skip final save in load block to avoid redundant disk activity in dev
      }, 500)
    }
  }

  watch(boards, () => {
    if (isLoadingPersistence.value) return
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => saveBoardToLocal(false), 300)
  }, { deep: true })

  const findNote = (id: string) => {
    for (const board of boards.value) {
      const node = board.notes.find(n => n.id === id)
      if (node) return node
    }
    return null
  }

  const addBoard = (name: string) => {
    if (boards.value.length >= 5) return null
    const id = uid()
    boards.value.push({
      id,
      name,
      notes: [],
      connections: [],
      transform: { x: 0, y: 0, scale: 1 },
      drawings: [],
      folders: []
    })
    return id
  }

  const removeBoard = async (id: string) => {
    const idx = boards.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      boards.value.splice(idx, 1)
      if (activeBoardId.value === id) {
        activeBoardId.value = boards.value[0]?.id || ''
      }
      await removeFromDisk(`${PERSISTENCE_CONTENT_PREFIX}${id}`)
      saveBoardToLocal(false)
    }
  }

  return {
    boards,
    activeBoardId,
    activeBoard,
    allConditions,
    allScenarios,
    isLoadingPersistence,
    isSaving,
    saveBoardToLocal,
    loadBoardFromLocal,
    findNote,
    addBoard,
    removeBoard
  }
})
