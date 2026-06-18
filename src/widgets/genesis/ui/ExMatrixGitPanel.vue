<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed right-10 top-1/2 z-[99999] -translate-y-1/2 pointer-events-auto"
      >
        <div class="terminal-tree">
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
  parentId?: string
}

type MatrixChangeType = 'add' | 'delete' | 'connect'

type MatrixSubchange = {
  id: string
  label: string
  value: string
}

type MatrixChangeEvent = {
  id: string
  type: MatrixChangeType
  title: string
  node: string
  time: string
  subchanges: MatrixSubchange[]
}

type MatrixChangeTree = {
  workspace: string
  line: string
  events: MatrixChangeEvent[]
}

const disabledChanges = ref(new Set<string>())

const changeTree: MatrixChangeTree = {
  workspace: 'genesis-matrix',
  line: 'main',
  events: [
    {
      id: 'chg-add-01',
      type: 'add',
      title: 'ADD_NODE',
      node: 'strategy: London Breakout Core',
      time: '24 seconds ago',
      subchanges: [
        { id: 'chg-add-01:name', label: 'name', value: 'London Breakout Core' },
        { id: 'chg-add-01:description', label: 'description', value: 'Primary strategy node for session expansion.' },
        { id: 'chg-add-01:comment', label: 'comment', value: 'Created from git panel mock tree.' }
      ]
    },
    {
      id: 'chg-connect-01',
      type: 'connect',
      title: 'CONNECT_NODES',
      node: 'strategy -> scenario',
      time: '26 seconds ago',
      subchanges: [
        { id: 'chg-connect-01:from', label: 'from', value: 'London Breakout Core.output' },
        { id: 'chg-connect-01:to', label: 'to', value: 'Volatility Expansion.input' },
        { id: 'chg-connect-01:comment', label: 'comment', value: 'Main route attached to active main line.' }
      ]
    },
    {
      id: 'chg-add-02',
      type: 'add',
      title: 'ADD_NODE',
      node: 'condition: NY Open Filter',
      time: '27 seconds ago',
      subchanges: [
        { id: 'chg-add-02:name', label: 'name', value: 'NY Open Filter' },
        { id: 'chg-add-02:description', label: 'description', value: 'Checks first impulse after liquidity sweep.' },
        { id: 'chg-add-02:comment', label: 'comment', value: 'Subchange belongs only to this condition node.' }
      ]
    },
    {
      id: 'chg-delete-01',
      type: 'delete',
      title: 'DELETE_NODE',
      node: 'label: Draft Risk Note',
      time: '31 seconds ago',
      subchanges: [
        { id: 'chg-delete-01:removed', label: 'removed', value: 'Draft Risk Note' },
        { id: 'chg-delete-01:reason', label: 'reason', value: 'Superseded by risk node description.' },
        { id: 'chg-delete-01:comment', label: 'comment', value: 'Deletion is tracked as a primary vertical event.' }
      ]
    },
    {
      id: 'chg-connect-02',
      type: 'connect',
      title: 'CONNECT_NODES',
      node: 'condition -> risk',
      time: '35 seconds ago',
      subchanges: [
        { id: 'chg-connect-02:from', label: 'from', value: 'NY Open Filter.output' },
        { id: 'chg-connect-02:to', label: 'to', value: 'Risk Gate.input' },
        { id: 'chg-connect-02:comment', label: 'comment', value: 'Creates final validation edge.' }
      ]
    }
  ]
}

const eventTypeClasses: Record<MatrixChangeType, string> = {
  add: 'tree-add',
  delete: 'tree-delete',
  connect: 'tree-connect'
}

const eventTypeMarkers: Record<MatrixChangeType, string> = {
  add: '+',
  delete: '-',
  connect: '~'
}

const treeRows = computed<TreeRow[]>(() => {
  const rows: TreeRow[] = [
    {
      parts: [
        { text: `${changeTree.workspace} // `, class: 'tree-muted' },
        { text: changeTree.line, class: 'tree-current' }
      ]
    },
    {
      parts: [
        { text: '*', class: 'tree-head' },
        { text: ` ${changeTree.line}_change_timeline` }
      ]
    }
  ]

  changeTree.events.forEach((event, eventIndex) => {
    const eventClass = eventTypeClasses[event.type]
    rows.push({
      toggleId: event.id,
      parts: [
        { text: 'o ' },
        { text: eventTypeMarkers[event.type], class: eventClass },
        { text: ' ' },
        { text: event.title, class: eventClass },
        { text: '  ' },
        { text: event.node, class: 'tree-node' }
      ]
    })
    rows.push({ parts: [{ text: `|   ${event.time}`, class: 'tree-muted' }] })

    event.subchanges.forEach((subchange, subIndex) => {
      const connector = subIndex === event.subchanges.length - 1 ? '`-' : '+-'
      rows.push({
        toggleId: subchange.id,
        parentId: event.id,
        parts: [
          { text: '|   ' },
          { text: connector, class: 'tree-muted' },
          { text: ' ' },
          { text: subchange.label, class: 'tree-subkey' },
          { text: ': ' },
          { text: subchange.value, class: 'tree-subvalue' }
        ]
      })
    })

    if (eventIndex < changeTree.events.length - 1) {
      rows.push({ parts: [{ text: '|' }] })
    }
  })

  rows.push({ parts: [{ text: 'o ' }, { text: `${changeTree.line} timeline`, class: 'tree-current' }] })
  rows.push({ parts: [{ text: '| 2 minutes ago', class: 'tree-muted' }] })

  return rows
})

function isTreeRowOff(row: TreeRow) {
  return !!((row.toggleId && disabledChanges.value.has(row.toggleId)) || (row.parentId && disabledChanges.value.has(row.parentId)))
}

function toggleTreeRow(id?: string) {
  if (!id) return

  const next = new Set(disabledChanges.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  disabledChanges.value = next
}
</script>

<style scoped>
.terminal-tree {
  width: max-content;
  color: rgb(230 230 230 / 0.94);
  font-family: "SFMono-Regular", "Menlo", "Monaco", "Consolas", monospace;
  font-size: clamp(10px, 1.18vw, 14px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
  text-shadow: 0 0 8px rgb(255 255 255 / 0.12);
  white-space: pre;
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
  text-shadow: 0 0 14px rgb(255 255 255 / 0.22);
}

.tree-row-off {
  opacity: 0.34;
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgb(246 76 98 / 0.72);
}

.tree-off-label {
  color: rgb(246 76 98 / 0.92);
  text-decoration: none;
}

.tree-muted {
  color: rgb(178 178 178 / 0.68);
}

.tree-head {
  color: rgb(246 76 98);
}

.tree-node {
  color: rgb(111 84 210);
}

.tree-current {
  color: rgb(52 170 178);
}

.tree-add {
  color: rgb(64 201 128);
}

.tree-delete {
  color: rgb(246 76 98);
}

.tree-connect {
  color: rgb(74 166 236);
}

.tree-subkey {
  color: rgb(215 175 95);
}

.tree-subvalue {
  color: rgb(215 215 215 / 0.86);
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
