<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="tree-scroll-shell fixed right-10 z-[99999] pointer-events-auto"
      >
        <div class="terminal-tree" :class="isDark ? 'tree-theme-dark' : 'tree-theme-light'">
          <button
            v-for="(row, index) in treeRows"
            :key="index"
            class="tree-row"
            :class="{
              'tree-row-clickable': (row.toggleId || row.onClick) && !row.isTerminated,
              'tree-row-off': isTreeRowOff(row) || row.isTerminated,
              'opacity-50 pointer-events-none': row.isTerminated
            }"
            type="button"
            @click.stop="handleRowClick(row)"
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
import { useMatrixState } from '../model/matrix/useMatrixState'

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
  isTerminated?: boolean
  onClick?: () => void
}

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)
const changeTree = useMatrixChangeTree()
const state = useMatrixState()
const disabledChanges = changeTree.disabledChanges
const workspace = 'genesis-matrix'
const line = 'strategy'
const expandedParents = ref<Set<string>>(new Set())

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

function formatTreeText(text: string, maxLength: number = 35) {
  if (!text) return ''
  const flat = String(text).replace(/[\r\n]+/g, ' ')
  return flat.length > maxLength ? flat.substring(0, maxLength) + '...' : flat
}

function appendNestedSubchangeRows(rows: TreeRow[], subchanges: any[], parentIds: string[], prefix: string) {
  const parentId = parentIds[parentIds.length - 1] || ''
  const hasTooMany = subchanges.length > 3
  const isExpanded = expandedParents.value.has(parentId)

  const visibleSubs = hasTooMany && !isExpanded ? subchanges.slice(0, 3) : subchanges

  visibleSubs.forEach((subchange, index) => {
    const isLast = index === visibleSubs.length - 1 && !(hasTooMany && !isExpanded)
    const connector = isLast ? '`-' : '+-'

    const isDomainNodeChange = subchange.label === 'default' || subchange.label === 'add' || subchange.label === 'remove' || subchange.label === 'node_added' || subchange.label === 'node_removed'
    const isTerminated = !!(isDomainNodeChange && subchange.targetId && !state.nodes.value.some(n => n.id === subchange.targetId))

    const hideLabel = ['table', 'screenshot', 'drawing_panel', 'file_attachment'].includes(subchange.label);
    let displayValue = subchange.value;
    if (subchange.label === 'table') {
      displayValue = 'table change';
    } else if (subchange.label === 'screenshot') {
      displayValue = 'screenshot change';
    } else if (subchange.label === 'drawing_panel') {
      displayValue = 'drawing_panel change';
    } else if (subchange.label === 'file_attachment') {
      displayValue = 'file_attachment change';
    }

    const parts = [
      { text: '|   ' },
      { text: prefix, class: 'tree-muted' },
      { text: connector, class: 'tree-muted' },
      { text: ' ' },
    ];
    if (!hideLabel) {
      parts.push({ text: subchange.label, class: 'tree-subkey' });
      parts.push({ text: ': ' });
    }
    parts.push({ text: formatTreeText(displayValue, subchange.label === 'ITEM_TEXT' ? 10 : (subchange.label === 'text' ? 15 : 35)) + (isTerminated ? ' (terminated)' : ''), class: isTerminated ? 'tree-muted' : 'tree-subvalue' });

    rows.push({
      toggleId: subchange.id,
      parentIds,
      isTerminated,
      parts
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

  if (hasTooMany) {
    if (!isExpanded) {
      rows.push({
        parentIds,
        onClick: () => {
          expandedParents.value.add(parentId)
        },
        parts: [
          { text: '|   ' },
          { text: prefix, class: 'tree-muted' },
          { text: '`--- ', class: 'tree-muted' },
          { text: '... (expand ' + (subchanges.length - 3) + ' more changes)', class: 'tree-subkey' }
        ]
      })
    } else {
      rows.push({
        parentIds,
        onClick: () => {
          expandedParents.value.delete(parentId)
        },
        parts: [
          { text: '|   ' },
          { text: prefix, class: 'tree-muted' },
          { text: '`--- ', class: 'tree-muted' },
          { text: '... (collapse changes)', class: 'tree-subkey' }
        ]
      })
    }
  }
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
  const hasTooManyEvents = visibleEvents.length > 3
  const isMainExpanded = expandedParents.value.has('main-timeline')
  const eventsToShow = hasTooManyEvents && !isMainExpanded ? visibleEvents.slice(0, 3) : visibleEvents

  eventsToShow.forEach((event, eventIndex) => {
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

    if (!isVersionEvent) {
      const subchanges = event.subchanges
      const hasTooMany = subchanges.length > 3
      const isExpanded = expandedParents.value.has(event.id)
      const visibleSubs = hasTooMany && !isExpanded ? subchanges.slice(0, 3) : subchanges

      visibleSubs.forEach((subchange, subIndex) => {
        const isLastSub = subIndex === visibleSubs.length - 1 && !(subchange.subchanges?.length) && !(hasTooMany && !isExpanded)
        const connector = isLastSub ? '`-' : '+-'
        
        const isDomainNodeChange = subchange.label === 'default' || subchange.label === 'add' || subchange.label === 'remove' || subchange.label === 'node_added' || subchange.label === 'node_removed'
        const isTerminated = !!(isDomainNodeChange && subchange.targetId && !state.nodes.value.some(n => n.id === subchange.targetId))
        
        const hideLabel = ['table', 'screenshot', 'drawing_panel', 'file_attachment'].includes(subchange.label);
        let displayValue = subchange.value;
        if (subchange.label === 'table') {
          const index = event.subchanges.filter(s => s.label === 'table').findIndex(s => s.id === subchange.id);
          displayValue = `table change ${index + 1}`;
        } else if (subchange.label === 'screenshot') {
          displayValue = 'screenshot change';
        } else if (subchange.label === 'drawing_panel') {
          displayValue = 'drawing_panel change';
        } else if (subchange.label === 'file_attachment') {
          displayValue = 'file_attachment change';
        }

        const parts = [
          { text: '|   ' },
          { text: connector, class: 'tree-muted' },
          { text: ' ' },
        ];
        if (!hideLabel) {
          parts.push({ text: subchange.label, class: 'tree-subkey' });
          parts.push({ text: ': ' });
        }
        parts.push({ text: formatTreeText(displayValue, subchange.label === 'ITEM_TEXT' ? 10 : (subchange.label === 'text' ? 15 : 35)) + (isTerminated ? ' (terminated)' : ''), class: isTerminated ? 'tree-muted' : 'tree-subvalue' });

        rows.push({
          toggleId: subchange.id,
          parentIds: [event.id],
          isTerminated,
          parts
        })

        if (subchange.subchanges) {
          appendNestedSubchangeRows(
            rows,
            subchange.subchanges,
            [event.id, subchange.id],
            subIndex === visibleSubs.length - 1 && !(hasTooMany && !isExpanded) ? '    ' : '|   '
          )
        }
      })

      if (hasTooMany) {
        if (!isExpanded) {
          rows.push({
            parentIds: [event.id],
            onClick: () => {
              expandedParents.value.add(event.id)
            },
            parts: [
              { text: '|   ' },
              { text: '`--- ', class: 'tree-muted' },
              { text: '... (expand ' + (subchanges.length - 3) + ' more changes)', class: 'tree-subkey' }
            ]
          })
        } else {
          rows.push({
            parentIds: [event.id],
            onClick: () => {
              expandedParents.value.delete(event.id)
            },
            parts: [
              { text: '|   ' },
              { text: '`--- ', class: 'tree-muted' },
              { text: '... (collapse changes)', class: 'tree-subkey' }
            ]
          })
        }
      }
    }

    if (eventIndex < eventsToShow.length - 1 || (hasTooManyEvents && !isMainExpanded)) {
      rows.push({ parts: [{ text: '|' }] })
    }
  })

  if (hasTooManyEvents) {
    if (!isMainExpanded) {
      rows.push({
        onClick: () => {
          expandedParents.value.add('main-timeline')
        },
        parts: [
          { text: 'o ' },
          { text: '... (expand ' + (visibleEvents.length - 3) + ' older changes)', class: 'tree-subkey' }
        ]
      })
    } else {
      rows.push({
        onClick: () => {
          expandedParents.value.delete('main-timeline')
        },
        parts: [
          { text: 'o ' },
          { text: '... (collapse changes)', class: 'tree-subkey' }
        ]
      })
    }
    rows.push({ parts: [{ text: '|' }] })
  }

  rows.push({ parts: [{ text: 'o ' }, { text: `${line} timeline`, class: 'tree-current' }] })

  return rows
})

function isTreeRowOff(row: TreeRow) {
  return false
}

function handleRowClick(row: TreeRow) {
  if (row.isTerminated) return
  if (row.onClick) {
    row.onClick()
  }
}

</script>

<style scoped>
.tree-scroll-shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  top: 64px;
  bottom: 64px;
  max-height: calc(100vh - 128px);
  overflow-y: auto;
  overflow-x: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
}

.tree-scroll-shell::before,
.tree-scroll-shell::after {
  content: "";
  flex: 1 0 16px;
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
