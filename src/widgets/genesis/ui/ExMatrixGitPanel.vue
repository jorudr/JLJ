<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="tree-scroll-shell fixed right-10 top-0 z-[99999] h-screen pointer-events-auto"
      >
        <div class="terminal-tree" :class="isDark ? 'tree-theme-dark' : 'tree-theme-light'">
          <button
            v-for="(row, index) in treeRows"
            :key="index"
            class="tree-row"
            :class="{
              'tree-row-clickable': row.toggleId,
              'tree-row-off': isTreeRowOff(row)
            }"
            type="button"
            @click.stop="toggleTreeRow(row.toggleId)"
          >
            <span
              v-for="(part, partIndex) in row.parts"
              :key="partIndex"
              :class="part.class"
            >{{ part.text }}</span>
            <span v-if="row.toggleId && isTreeRowOff(row)" class="tree-off-label"> [off]</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '~/features/store/useTheme'
import { useMatrixChangeTree, type MatrixChangeType } from '../model/matrix/useMatrixChangeTree'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

type TreePart = {
  text: string
  class?: string
}

type TreeRow = {
  parts: TreePart[]
  toggleId?: string
  parentIds?: string[]
}

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)
const changeTree = useMatrixChangeTree()
const disabledChanges = changeTree.disabledChanges
const workspace = 'genesis-matrix'
const line = 'strategy'

const eventTypeClasses: Record<MatrixChangeType, string> = {
  add: 'tree-add',
  delete: 'tree-delete',
  connect: 'tree-connect',
  version: 'tree-version',
  clear: 'tree-delete',
  update: 'tree-current'
}

const eventTypeMarkers: Record<MatrixChangeType, string> = {
  add: '+',
  delete: '-',
  connect: '~',
  version: 'v',
  clear: '!',
  update: '*'
}

function formatChangeTime(createdAt: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

function appendNestedSubchangeRows(rows: TreeRow[], subchanges: any[], parentIds: string[], prefix: string) {
  subchanges.forEach((subchange, index) => {
    const isLast = index === subchanges.length - 1
    const connector = isLast ? '`-' : '+-'
    rows.push({
      toggleId: subchange.id,
      parentIds,
      parts: [
        { text: '|   ' },
        { text: prefix, class: 'tree-muted' },
        { text: connector, class: 'tree-muted' },
        { text: ' ' },
        { text: subchange.label, class: 'tree-subkey' },
        { text: ': ' },
        { text: subchange.value, class: 'tree-subvalue' }
      ]
    })

    if (subchange.subchanges?.length) {
      appendNestedSubchangeRows(
        rows,
        subchange.subchanges,
        [...parentIds, subchange.id],
        `${prefix}${isLast ? '    ' : '|   '}`
      )
    }
  })
}

const treeRows = computed<TreeRow[]>(() => {
  const rows: TreeRow[] = [
    {
      parts: [
        { text: `${workspace} // `, class: 'tree-muted' },
        { text: line, class: 'tree-current' }
      ]
    },
    {
      parts: [
        { text: '*', class: 'tree-head' },
        { text: ` ${line}_change_timeline` }
      ]
    }
  ]

  const visibleEvents = [...changeTree.events.value].reverse()

  visibleEvents.forEach((event, eventIndex) => {
    const eventClass = eventTypeClasses[event.type]
    const isVersionEvent = event.type === 'version'
    rows.push({
      toggleId: event.id,
      parts: isVersionEvent ? [
        { text: '|==[', class: 'tree-version-frame' },
        { text: eventTypeMarkers[event.type], class: eventClass },
        { text: '] ', class: 'tree-version-frame' },
        { text: event.title, class: eventClass },
        { text: '  ' },
        { text: event.node, class: 'tree-node tree-version-node' }
      ] : [
        { text: 'o ' },
        { text: eventTypeMarkers[event.type], class: eventClass },
        { text: ' ' },
        { text: event.title, class: eventClass },
        { text: '  ' },
        { text: event.node, class: 'tree-node' }
      ]
    })
    rows.push({
      parts: isVersionEvent ? [
        { text: '|   ', class: 'tree-muted' },
        { text: 'checkpoint ', class: 'tree-version-frame' },
        { text: formatChangeTime(event.createdAt), class: 'tree-muted' }
      ] : [
        { text: `|   ${formatChangeTime(event.createdAt)}`, class: 'tree-muted' }
      ]
    })

    if (!isVersionEvent) event.subchanges.forEach((subchange, subIndex) => {
      const isLastSub = subIndex === event.subchanges.length - 1 && !(subchange.subchanges?.length)
      const connector = isLastSub ? '`-' : '+-'
      rows.push({
        toggleId: subchange.id,
        parentIds: [event.id],
        parts: [
          { text: '|   ' },
          { text: connector, class: 'tree-muted' },
          { text: ' ' },
          { text: subchange.label, class: 'tree-subkey' },
          { text: ': ' },
          { text: subchange.value, class: 'tree-subvalue' }
        ]
      })

      if (subchange.subchanges) {
        appendNestedSubchangeRows(
          rows,
          subchange.subchanges,
          [event.id, subchange.id],
          subIndex === event.subchanges.length - 1 ? '    ' : '|   '
        )
      }
    })

    if (eventIndex < visibleEvents.length - 1) {
      rows.push({ parts: [{ text: '|' }] })
    }
  })

  rows.push({ parts: [{ text: 'o ' }, { text: `${line} timeline`, class: 'tree-current' }] })

  return rows
})

function isChangeDisabled(id?: string) {
  if (!id) return false
  if (disabledChanges.value.has(id)) return true
  return changeTree.collectLinkedChangeIds(id).some(linkedId => disabledChanges.value.has(linkedId))
}

function isTreeRowOff(row: TreeRow) {
  return !!(
    (row.toggleId && isChangeDisabled(row.toggleId)) ||
    row.parentIds?.some(parentId => isChangeDisabled(parentId))
  )
}

function commitDisabledChanges(next: Set<string>, toggledId: string, turningOn: boolean) {
  const linkedIds = changeTree.collectLinkedChangeIds(toggledId)

  if (turningOn) {
    next.delete(toggledId)
    linkedIds.forEach(linkedId => {
      if (!next.has(linkedId)) return
      next.delete(linkedId)
      changeTree.setChangeEnabled(linkedId, true)
    })
  } else {
    next.add(toggledId)
    linkedIds.forEach(linkedId => {
      if (next.has(linkedId)) return
      next.add(linkedId)
      changeTree.setChangeEnabled(linkedId, false)
    })
  }

  disabledChanges.value = next
}

function toggleTreeRow(id?: string) {
  if (!id) return

  const next = new Set(disabledChanges.value)
  const turningOn = isChangeDisabled(id)
  if (turningOn && !next.has(id)) next.add(id)

  if (turningOn) {
    // Turning ON
    for (let eventIndex = 0; eventIndex < changeTree.events.value.length; eventIndex++) {
      const event = changeTree.events.value[eventIndex]
      if (!event) continue
      
      // If we are turning on the event itself
      if (event.id === id) {
        if (event.type === 'clear') {
          // Turn OFF all events before this clear event
          for (let i = 0; i < eventIndex; i++) {
            const ev = changeTree.events.value[i]
            if (!ev) continue
            if (!next.has(ev.id)) {
              next.add(ev.id)
              changeTree.setChangeEnabled(ev.id, false)
            }
            for (const sub of ev.subchanges) {
              if (sub.id && !next.has(sub.id)) {
                next.add(sub.id)
                changeTree.setChangeEnabled(sub.id, false)
              }
              if (sub.subchanges) {
                for (const ss of sub.subchanges) {
                  if (ss.id && !next.has(ss.id)) {
                    next.add(ss.id)
                    changeTree.setChangeEnabled(ss.id, false)
                  }
                }
              }
            }
          }
          
          // Execute the clear board logic first
          next.delete(id)
          changeTree.setChangeEnabled(id, true)

          // Turn ON all events after this clear event
          for (let i = eventIndex + 1; i < changeTree.events.value.length; i++) {
            const ev = changeTree.events.value[i]
            if (!ev) continue
            if (next.has(ev.id)) {
              next.delete(ev.id)
              changeTree.setChangeEnabled(ev.id, true)
            }
            for (const sub of ev.subchanges) {
              if (sub.id && next.has(sub.id)) {
                next.delete(sub.id)
                changeTree.setChangeEnabled(sub.id, true)
              }
              if (sub.subchanges) {
                for (const ss of sub.subchanges) {
                  if (ss.id && next.has(ss.id)) {
                    next.delete(ss.id)
                    changeTree.setChangeEnabled(ss.id, true)
                  }
                }
              }
            }
          }
          
          commitDisabledChanges(next, id, turningOn)
          return
        } else if (event.type === 'delete') {
          next.delete(id)
          changeTree.setChangeEnabled(id, true)
          commitDisabledChanges(next, id, turningOn)
          if (event.targetId) {
            changeTree.disableNodeDependents(event.targetId, event.node)
          }
          return
        } else if (event.type === 'add') {
          next.delete(id)
          changeTree.setChangeEnabled(id, true)
          commitDisabledChanges(next, id, turningOn)
          if (event.targetId) {
            changeTree.enableNodeDependents(event.targetId, event.node)
          }
          return
        }
        next.delete(id)
        changeTree.setChangeEnabled(id, true)
        commitDisabledChanges(next, id, turningOn)
        return
      }

      let subIndex = -1
      let subsubIndex = -1
      for (let i = 0; i < event.subchanges.length; i++) {
        const currentSub = event.subchanges[i]
        if (!currentSub) continue
        if (currentSub.id === id) {
          subIndex = i
          break
        }
        if (currentSub.subchanges) {
          const ssIdx = currentSub.subchanges.findIndex(ss => ss.id === id)
          if (ssIdx !== -1) {
            subIndex = i
            subsubIndex = ssIdx
            break
          }
        }
      }

      if (subIndex !== -1) {
        // Turn ON this subchange and all previous ones in the same event
        for (let i = 0; i <= subIndex; i++) {
          const sub = event.subchanges[i]
          if (!sub) continue
          if (sub.id && next.has(sub.id)) {
            next.delete(sub.id)
            changeTree.setChangeEnabled(sub.id, true)
          }
          if (i === subIndex && subsubIndex !== -1 && sub.subchanges) {
            for (let j = 0; j <= subsubIndex; j++) {
              const ss = sub.subchanges[j]
              if (!ss) continue
              if (ss.id && next.has(ss.id)) {
                next.delete(ss.id)
                changeTree.setChangeEnabled(ss.id, true)
              }
            }
          } else if (sub.subchanges) {
            for (const ss of sub.subchanges) {
              if (!ss) continue
              if (ss.id && next.has(ss.id)) {
                next.delete(ss.id)
                changeTree.setChangeEnabled(ss.id, true)
              }
            }
          }
        }
        
        // Ensure the parent event is ON
        if (next.has(event.id)) {
          next.delete(event.id)
          changeTree.setChangeEnabled(event.id, true)
        }
        commitDisabledChanges(next, id, turningOn)
        return
      }
    }
    // Fallback for events
    next.delete(id)
    changeTree.setChangeEnabled(id, true)
  } else {
    // Turning OFF
    for (let eventIndex = 0; eventIndex < changeTree.events.value.length; eventIndex++) {
      const event = changeTree.events.value[eventIndex]
      if (!event) continue
      
      // If we are turning off the event itself
      if (event.id === id) {
        if (event.type === 'clear') {
          // Turn off this clear event and ALL subsequent events & subchanges
          for (let i = changeTree.events.value.length - 1; i >= eventIndex; i--) {
            const ev = changeTree.events.value[i]
            if (!ev) continue
            for (let j = ev.subchanges.length - 1; j >= 0; j--) {
              const sub = ev.subchanges[j]
              if (!sub) continue
              if (sub.subchanges) {
                for (const ss of sub.subchanges) {
                  if (ss.id && !next.has(ss.id)) {
                    next.add(ss.id)
                    changeTree.setChangeEnabled(ss.id, false)
                  }
                }
              }
              if (sub.id && !next.has(sub.id)) {
                next.add(sub.id)
                changeTree.setChangeEnabled(sub.id, false)
              }
            }
            if (!next.has(ev.id)) {
              next.add(ev.id)
              changeTree.setChangeEnabled(ev.id, false)
            }
          }
          // Turn ON all events before this clear event
          for (let i = 0; i < eventIndex; i++) {
            const ev = changeTree.events.value[i]
            if (!ev) continue
            if (next.has(ev.id)) {
              next.delete(ev.id)
              changeTree.setChangeEnabled(ev.id, true)
            }
            for (const sub of ev.subchanges) {
              if (sub.id && next.has(sub.id)) {
                next.delete(sub.id)
                changeTree.setChangeEnabled(sub.id, true)
              }
              if (sub.subchanges) {
                for (const ss of sub.subchanges) {
                  if (ss.id && next.has(ss.id)) {
                    next.delete(ss.id)
                    changeTree.setChangeEnabled(ss.id, true)
                  }
                }
              }
            }
          }
          commitDisabledChanges(next, id, turningOn)
          return
        } else if (event.type === 'add') {
          // Execute fallback to turn off the add event itself
          next.add(id)
          changeTree.setChangeEnabled(id, false)
          commitDisabledChanges(next, id, turningOn)
          
          // Then disable all its dependent changes
          if (event.targetId) {
            changeTree.disableNodeDependents(event.targetId, event.node)
          }
          return
        } else if (event.type === 'delete') {
          next.add(id)
          changeTree.setChangeEnabled(id, false)
          commitDisabledChanges(next, id, turningOn)
          if (event.targetId) {
            changeTree.enableNodeDependents(event.targetId, event.node)
          }
          return
        }
        break // Not a clear/add event, break out and use fallback
      }

      let subIndex = -1
      let subsubIndex = -1
      for (let i = 0; i < event.subchanges.length; i++) {
        const currentSub = event.subchanges[i]
        if (!currentSub) continue
        if (currentSub.id === id) {
          subIndex = i
          break
        }
        if (currentSub.subchanges) {
          const ssIdx = currentSub.subchanges.findIndex(ss => ss.id === id)
          if (ssIdx !== -1) {
            subIndex = i
            subsubIndex = ssIdx
            break
          }
        }
      }

      if (subIndex !== -1) {
        if (subsubIndex !== -1) {
          const sub = event.subchanges[subIndex]
          if (sub && sub.subchanges) {
            for (let j = subsubIndex; j >= 0; j--) {
              const ss = sub.subchanges[j]
              if (!ss) continue
              if (ss.id && !next.has(ss.id)) {
                next.add(ss.id)
                changeTree.setChangeEnabled(ss.id, false)
              }
            }
          }
        } else {
          for (let i = subIndex; i >= 0; i--) {
            const sub = event.subchanges[i]
            if (!sub) continue
            if (sub.subchanges) {
              for (let j = sub.subchanges.length - 1; j >= 0; j--) {
                const ss = sub.subchanges[j]
                if (!ss) continue
                if (ss.id && !next.has(ss.id)) {
                  next.add(ss.id)
                  changeTree.setChangeEnabled(ss.id, false)
                }
              }
            }
            if (sub.id && !next.has(sub.id)) {
              next.add(sub.id)
              changeTree.setChangeEnabled(sub.id, false)
            }
          }
        }

        commitDisabledChanges(next, id, turningOn)
        return
      }
    }
    // Fallback for events
    next.add(id)
    changeTree.setChangeEnabled(id, false)
  }
  commitDisabledChanges(next, id, turningOn)
}

</script>

<style scoped>
.tree-scroll-shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
}

.tree-scroll-shell::before,
.tree-scroll-shell::after {
  content: "";
  flex: 1 0 24px;
}

.tree-scroll-shell::-webkit-scrollbar {
  display: none;
}

.terminal-tree {
  width: max-content;
  font-family: "SFMono-Regular", "Menlo", "Monaco", "Consolas", monospace;
  font-size: clamp(10px, 1.18vw, 14px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
  text-shadow: 0 0 8px rgb(0 0 0 / 0.08);
  white-space: pre;
}

.tree-theme-light {
  color: rgb(34 34 32 / 0.94) !important;
}

.tree-theme-dark {
  color: rgb(249 246 240 / 0.94) !important;
  text-shadow: 0 0 8px rgb(255 255 255 / 0.12);
}

.tree-row {
  display: block;
  width: max-content;
  max-width: 100%;
  height: 21px;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  white-space: pre;
}

.tree-row-clickable {
  cursor: pointer;
  transition: opacity 0.16s ease, filter 0.16s ease, text-shadow 0.16s ease;
}

.tree-row-clickable:hover {
  filter: brightness(1.2);
  text-shadow: 0 0 14px rgb(0 0 0 / 0.14);
}

.tree-theme-dark .tree-row-clickable:hover {
  text-shadow: 0 0 14px rgb(255 255 255 / 0.22);
}

.tree-row-off {
  opacity: 0.34;
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgb(246 76 98 / 0.72);
}

.tree-off-label {
  color: rgb(246 76 98 / 0.92) !important;
  text-decoration: none;
}

.tree-theme-light .tree-muted {
  color: rgb(34 34 32 / 0.52) !important;
}

.tree-theme-dark .tree-muted {
  color: rgb(249 246 240 / 0.56) !important;
}

.tree-theme-light .tree-head,
.tree-theme-dark .tree-head {
  color: rgb(246 76 98) !important;
}

.tree-theme-light .tree-node {
  color: rgb(34 34 32 / 0.94) !important;
}

.tree-theme-dark .tree-node {
  color: rgb(249 246 240 / 0.94) !important;
}

.tree-theme-light .tree-current,
.tree-theme-dark .tree-current {
  color: rgb(215 175 95) !important;
}

.tree-theme-light .tree-add,
.tree-theme-dark .tree-add {
  color: rgb(156 119 255) !important;
}

.tree-theme-light .tree-delete,
.tree-theme-dark .tree-delete {
  color: rgb(246 76 98) !important;
}

.tree-theme-light .tree-connect,
.tree-theme-dark .tree-connect {
  color: rgb(246 76 98) !important;
}

.tree-theme-light .tree-version {
  color: rgb(126 24 36) !important;
  text-shadow:
    -1px 0 rgb(246 250 247 / 0.82),
    0 1px rgb(246 250 247 / 0.82),
    1px 0 rgb(246 250 247 / 0.82),
    0 -1px rgb(246 250 247 / 0.82);
}

.tree-theme-dark .tree-version {
  color: rgb(170 42 55) !important;
  text-shadow:
    -1px 0 rgb(9 13 15 / 0.92),
    0 1px rgb(9 13 15 / 0.92),
    1px 0 rgb(9 13 15 / 0.92),
    0 -1px rgb(9 13 15 / 0.92),
    0 0 12px rgb(170 42 55 / 0.34);
}

.tree-theme-light .tree-version-frame {
  color: rgb(126 24 36 / 0.88) !important;
  text-shadow:
    -1px 0 rgb(246 250 247 / 0.82),
    0 1px rgb(246 250 247 / 0.82),
    1px 0 rgb(246 250 247 / 0.82),
    0 -1px rgb(246 250 247 / 0.82);
}

.tree-theme-dark .tree-version-frame {
  color: rgb(170 42 55 / 0.9) !important;
  text-shadow:
    -1px 0 rgb(9 13 15 / 0.92),
    0 1px rgb(9 13 15 / 0.92),
    1px 0 rgb(9 13 15 / 0.92),
    0 -1px rgb(9 13 15 / 0.92),
    0 0 12px rgb(170 42 55 / 0.28);
}

.tree-version-node {
  font-weight: 800;
}

.tree-theme-light .tree-subkey,
.tree-theme-dark .tree-subkey {
  color: rgb(215 175 95) !important;
}

.tree-theme-light .tree-subvalue {
  color: rgb(34 34 32 / 0.84) !important;
}

.tree-theme-dark .tree-subvalue {
  color: rgb(249 246 240 / 0.86) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
